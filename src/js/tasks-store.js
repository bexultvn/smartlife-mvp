import {
  createTask as apiCreateTask,
  deleteTask as apiDeleteTask,
  listTasks as apiListTasks,
  updateTask as apiUpdateTask,
} from "/src/js/api/tasks.js";
import { ApiError } from "/src/js/api/http-client.js";

const TASKS_KEY = "tasks";

let tasksCache = null;
let backendOffline = false;

const OFFLINE_STATUSES = new Set([0]);

export async function getTasks(options = {}) {
  const { forceRefresh = false } = options;
  if (!forceRefresh && Array.isArray(tasksCache)) {
    return tasksCache;
  }

  if (!backendOffline) {
    try {
      const response = await apiListTasks();
      const normalized = normalizeFromApi(response);
      tasksCache = normalized;
      writeTasks(tasksCache);
      return tasksCache;
    } catch (err) {
      if (!shouldFallback(err)) {
        throw err;
      }
      markBackendOffline(err);
    }
  }

  const stored = normalize(readTasks());
  tasksCache = stored;
  return tasksCache;
}

export async function addTask(payload) {
  if (!backendOffline) {
    try {
      const response = await apiCreateTask(payload);
      const created = normalizeApiTask(response) || buildTask(payload);
      await ensureCacheInitialized();
      tasksCache.push(created);
      writeTasks(tasksCache);
      return created;
    } catch (err) {
      if (!shouldFallback(err)) {
        throw err;
      }
      markBackendOffline(err);
    }
  }

  await ensureCacheInitialized(true);
  const created = buildTask(payload);
  tasksCache.push(created);
  writeTasks(tasksCache);
  return created;
}

export async function updateTask(id, changes) {
  if (!id) return null;
  if (!backendOffline) {
    try {
      const response = await apiUpdateTask(id, changes);
      const updated = normalizeApiTask(response) || applyCompletionStatus({ ...(await findTask(id)), ...changes });
      await ensureCacheInitialized();
      tasksCache = tasksCache.map((task) =>
        task.id === updated.id ? updated : task
      );
      writeTasks(tasksCache);
      return updated;
    } catch (err) {
      if (!shouldFallback(err)) {
        throw err;
      }
      markBackendOffline(err);
    }
  }

  await ensureCacheInitialized(true);
  let updatedTask = null;
  tasksCache = tasksCache.map((task) => {
    if (task.id !== id) return task;
    updatedTask = applyCompletionStatus({ ...task, ...changes });
    return updatedTask;
  });
  if (updatedTask) {
    writeTasks(tasksCache);
  }
  return updatedTask;
}

export async function deleteTask(id) {
  if (!id) return false;

  if (!backendOffline) {
    try {
      await apiDeleteTask(id);
      await ensureCacheInitialized();
      const initialLength = tasksCache.length;
      tasksCache = tasksCache.filter((task) => task.id !== id);
      const changed = tasksCache.length !== initialLength;
      if (changed) {
        writeTasks(tasksCache);
      }
      return changed;
    } catch (err) {
      if (!shouldFallback(err)) {
        throw err;
      }
      markBackendOffline(err);
    }
  }

  await ensureCacheInitialized(true);
  const initialLength = tasksCache.length;
  tasksCache = tasksCache.filter((task) => task.id !== id);
  const changed = tasksCache.length !== initialLength;
  if (changed) {
    writeTasks(tasksCache);
  }
  return changed;
}

export async function toggleTaskStatus(id) {
  await ensureCacheInitialized();
  const current = tasksCache.find((task) => task.id === id);
  if (!current) return null;

  const nextStatus = current.status === "Completed" ? "Not Started" : "Completed";
  const payload = {
    status: nextStatus,
    completedAt:
      nextStatus === "Completed" ? new Date().toISOString() : undefined,
  };

  const updated = await updateTask(id, payload);
  return updated;
}

export async function findTask(id) {
  await ensureCacheInitialized();
  return tasksCache.find((task) => task.id === id) || null;
}

export function formatDisplayDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return value;
}

export function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function shouldFallback(err) {
  if (!err) return true;
  if (!(err instanceof ApiError)) return true;
  if (OFFLINE_STATUSES.has(err.status)) return true;
  if (err.status >= 500) return true;
  return false;
}

async function ensureCacheInitialized(forceLocal = false) {
  if (Array.isArray(tasksCache)) return;
  if (forceLocal || backendOffline) {
    tasksCache = normalize(readTasks());
    return;
  }
  try {
    await getTasks();
  } catch (err) {
    tasksCache = normalize(readTasks());
    if (shouldFallback(err)) {
      markBackendOffline(err);
    } else {
      throw err;
    }
  }
}

function markBackendOffline(err) {
  if (!backendOffline) {
    console.warn("Tasks API unavailable. Falling back to local storage.", err);
  }
  backendOffline = true;
}

function buildTask(data = {}) {
  return applyCompletionStatus({
    id: createId(),
    title: data.title?.trim() || "Untitled task",
    desc: data.desc?.trim() || data.description?.trim?.() || "",
    priority: data.priority || "Moderate",
    status: data.status || "Not Started",
    deadline: normalizeDeadline(data.deadline || data.date || data.dueDate),
    accent: data.accent,
    completedAt: data.completedAt,
    coverImage: data.coverImage?.trim?.() || data.coverImage || data.imageUrl || "",
  });
}

function normalizeFromApi(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeApiTask(item)).filter(Boolean);
}

function normalizeApiTask(task) {
  if (!task || typeof task !== "object") return null;
  const mapped = {
    id:
      task.id ||
      task.taskId ||
      task.uuid ||
      task.externalId ||
      task._id ||
      createId(),
    title: task.title || task.name || "",
    desc: task.desc ?? task.description ?? "",
    priority: task.priority,
    status: task.status,
    deadline: task.deadline ?? task.dueDate ?? task.deadlineAt,
    accent: task.accent,
    completedAt: task.completedAt,
    coverImage: task.coverImage ?? task.imageUrl ?? "",
  };
  return applyCompletionStatus(mapped);
}

function readTasks() {
  try {
    const raw = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    console.warn("Failed to parse tasks from storage", err);
    return [];
  }
}

function writeTasks(list) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(list));
}

function normalize(tasks) {
  let mutated = false;
  const normalized = tasks.map((task) => {
    const next = applyCompletionStatus(task);
    if (next !== task) mutated = true;
    return next;
  });
  if (mutated) {
    writeTasks(normalized);
  }
  return normalized;
}

function normalizeTask(task, forceClone = false) {
  if (!task) return null;
  const next = forceClone ? { ...task } : task;
  if (!next.id) next.id = createId();
  if (!next.title) next.title = "Untitled task";
  if (!next.priority) next.priority = "Moderate";
  if (!next.status) next.status = "Not Started";
  if (!next.deadline && next.created) {
    next.deadline = next.created;
  }
  if (!next.deadline && next.date) {
    next.deadline = next.date;
  }
  if ("created" in next) {
    delete next.created;
  }
  if ("date" in next) {
    delete next.date;
  }
  if (next.deadline) {
    next.deadline = normalizeDeadline(next.deadline);
  }
  return next;
}

function applyCompletionStatus(task) {
  const normalized = normalizeTask(task, true);
  if (normalized.status === "Completed") {
    normalized.completedAt =
      task.completedAt || normalized.completedAt || new Date().toISOString();
  } else if ("completedAt" in normalized) {
    delete normalized.completedAt;
  }
  return normalized;
}

export { TASKS_KEY };

function normalizeDeadline(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}
