import { renderLayout, showConfirm } from "/src/js/layout.js";
import { ICONS } from "/src/js/icons.js";
import {
  addTask,
  deleteTask,
  formatDisplayDate,
  getTasks,
  toggleTaskStatus,
  updateTask,
} from "/src/js/tasks-store.js";
import { showAlert } from "/src/js/ui-alerts.js";
import {
  taskImagePickerTemplate,
  setupTaskImagePicker,
} from "/src/js/task-image-picker.js";
import {
  priorityChip,
  statusChip,
  setupChipSelectors,
} from "/src/js/chip-selectors.js";

const modalId = "taskManagerModal";

const content = `
<div class="grid lg:grid-cols-[360px_minmax(0,1fr)] gap-6">
  <section class="card p-5 space-y-3 max-h-[80vh] overflow-y-auto">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-semibold text-lg">My Tasks</h3>
      <button class="text-accent-500 text-sm" data-action="open-task-modal">+ Add task</button>
    </div>
    <div id="myTaskList" class="space-y-3"></div>
  </section>

  <section class="card p-6 min-h-[80vh]" id="taskDetails"></section>
</div>

${taskModalTemplate(modalId)}
`;

renderLayout({ active: "my-tasks", content });

setupTaskImagePicker(document.querySelector(`#${modalId} [data-task-image-root]`), "");
setupChipSelectors(document.getElementById("manageTaskForm"));

let tasks = [];
let selectedTaskId = null;
let searchQuery = "";

init();

document.addEventListener("click", async (event) => {
  const selectEl = event.target.closest("[data-task-select]");
  if (selectEl) {
    selectedTaskId = selectEl.dataset.taskSelect;
    renderTaskList();
    renderTaskDetails();
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  switch (actionEl.dataset.action) {
    case "open-task-modal":
      openTaskModal("add");
      break;
    case "close-task-modal":
      closeTaskModal();
      break;
    case "delete-task":
      await handleDeleteTask();
      break;
    case "toggle-task":
      await handleToggleTask();
      break;
    default:
      break;
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "manageTaskForm") {
    event.preventDefault();
    const formEl = event.target;
    const data = Object.fromEntries(new FormData(formEl));
    const payload = {
      title: data.title,
      desc: data.desc,
      priority: data.priority || "Moderate",
      deadline: data.deadline,
      coverImage: data.coverImage || "",
    };

    if (data.status) {
      payload.status = data.status;
    }

    try {
      if (data.taskId) {
        const updated = await updateTask(data.taskId, payload);
        if (updated) {
          selectedTaskId = updated.id;
        }
      } else {
        const created = await addTask(payload);
        selectedTaskId = created?.id || selectedTaskId;
      }

      formEl.reset();
      closeTaskModal();
      setupTaskImagePicker(
        document.querySelector(`#${modalId} [data-task-image-root]`),
        ""
      );
      setupChipSelectors(formEl);
      await refreshTasks();
      renderStats();
      renderFilters();
      renderTaskList();
      renderTaskDetails();
      showAlert({
        title: data.taskId ? "Task updated" : "Task created",
        message: data.taskId
          ? "Your changes have been saved."
          : "A new task has been added.",
        type: "success",
      });
    } catch (error) {
      showAlert({
        title: "Unable to save task",
        message: (error && error.message) || "Please try again later.",
        type: "danger",
      });
    }
    return;
  }

  if (event.target.id === "taskDetailsForm") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const payload = {
      title: data.title,
      desc: data.desc,
      priority: data.priority,
      status: data.status,
      deadline: data.deadline,
      coverImage: data.coverImage || "",
    };
    try {
      const updated = await updateTask(data.taskId, payload);
      if (updated) {
        selectedTaskId = updated.id;
      }
      await refreshTasks({ syncSelection: false, forceRefresh: false });
      renderStats();
      renderFilters();
      renderTaskList();
      renderTaskDetails();
      showAlert({
        title: "Task updated",
        message: "The task details have been updated.",
        type: "success",
      });
    } catch (error) {
      showAlert({
        title: "Update failed",
        message: (error && error.message) || "Please try again later.",
        type: "danger",
      });
    }
  }
});

window.addEventListener("sl:search", (event) => {
  searchQuery = (event.detail || "").toLowerCase();
  ensureSelectedTaskInFiltered();
  renderTaskList();
  renderTaskDetails();
});

if (typeof window !== "undefined") {
  const initialSearch = (window.__slSearchValue || "").trim().toLowerCase();
  if (initialSearch && initialSearch !== searchQuery) {
    searchQuery = initialSearch;
    ensureSelectedTaskInFiltered();
    renderTaskList();
    renderTaskDetails();
  }
}

async function init() {
  await refreshTasks({ syncSelection: false });
  ensureSelectedTaskInFiltered();
  renderTaskList();
  renderTaskDetails();
}

async function refreshTasks({ syncSelection = true, forceRefresh } = {}) {
  const shouldForce = forceRefresh ?? syncSelection;
  tasks = await getTasks({ forceRefresh: shouldForce });
  if (syncSelection) {
    const exists = tasks.some((task) => task.id === selectedTaskId);
    if (!exists) {
      selectedTaskId = tasks[0]?.id || null;
    }
  }
  if (!selectedTaskId && tasks.length) {
    selectedTaskId = tasks[0].id;
  }
  ensureSelectedTaskInFiltered();
}

function renderTaskList() {
  const listEl = document.getElementById("myTaskList");
  if (!listEl) return;

  const filtered = getFilteredTasks();
  if (!tasks.length) {
    listEl.innerHTML = emptyState("No tasks");
    return;
  }

  if (!filtered.length) {
    listEl.innerHTML = emptyState("No tasks match your search.");
    return;
  }

  listEl.innerHTML = filtered
    .map((task) => taskListItem(task, task.id === selectedTaskId))
    .join("");
}

function renderTaskDetails() {
  const detailEl = document.getElementById("taskDetails");
  if (!detailEl) return;

  const task = getSelectedTask();
  if (!task) {
    const message = searchQuery ? "No tasks match your search." : "Select a task to see details.";
    detailEl.innerHTML = emptyState(message);
    return;
  }

  const deadlineValue = toInputDateTime(task.deadline);
  const priorityValue = task.priority || "Moderate";
  const statusValue = task.status || "Not Started";
  detailEl.innerHTML = `
    <form id="taskDetailsForm" class="grid gap-4">
      <input type="hidden" name="taskId" value="${task.id}" />
      ${taskImagePickerTemplate(task.coverImage || "", {
        label: "Cover Image",
      })}
      <label class="grid gap-1">
        <span class="text-sm font-medium">Title</span>
        <input name="title" class="field" value="${escapeHtml(task.title)}" required />
      </label>
      <label class="grid gap-1">
        <span class="text-sm font-medium">Deadline</span>
        <input type="datetime-local" name="deadline" class="field" value="${deadlineValue}" />
      </label>
      <div class="grid gap-2" data-chip-group="priority">
        <span class="text-sm font-medium">Priority</span>
        <input type="hidden" name="priority" value="${escapeHtml(priorityValue)}" data-chip-input="priority" />
        <div class="flex items-center gap-3 text-sm flex-wrap" data-chip-options="priority">
          ${priorityChip("Extreme", priorityValue === "Extreme")}
          ${priorityChip("Moderate", priorityValue === "Moderate")}
          ${priorityChip("Low", priorityValue === "Low")}
        </div>
      </div>
      <div class="grid gap-2" data-chip-group="status">
        <span class="text-sm font-medium">Status</span>
        <input type="hidden" name="status" value="${escapeHtml(statusValue)}" data-chip-input="status" />
        <div class="flex items-center gap-3 text-sm flex-wrap" data-chip-options="status">
          ${statusChip("Not Started", statusValue === "Not Started")}
          ${statusChip("In Progress", statusValue === "In Progress")}
          ${statusChip("Completed", statusValue === "Completed")}
        </div>
      </div>
      <label class="grid gap-1">
        <span class="text-sm font-medium">Description</span>
        <textarea name="desc" rows="6" class="field" placeholder="Add description...">${escapeHtml(
          task.desc || ""
        )}</textarea>
      </label>
      <div class="flex flex-wrap items-center gap-3 pt-3">
        <button class="btn btn-primary">Save changes</button>
        <button type="button" class="btn btn-outline text-danger-500 border-danger-200 gap-2" data-action="delete-task">
          ${ICONS.trash}
          <span>Delete</span>
        </button>
      </div>
    </form>
  `;

  setupTaskImagePicker(detailEl.querySelector("[data-task-image-root]"), task.coverImage || "");
  setupChipSelectors(detailEl.querySelector("#taskDetailsForm"));
}

function taskListItem(task, isActive) {
  const statusClass =
    task.status === "Completed"
      ? "text-success-500"
      : task.status === "Not Started"
      ? "text-danger-500"
      : "text-accent-500";
  const deadline = task.deadline ? formatDisplayDate(task.deadline) : "No deadline";
  const hasImage = Boolean(task.coverImage);
  const backgroundStyle = hasImage
    ? `style="background-image:url('${escapeHtml(task.coverImage)}');background-size:cover;background-position:center;"`
    : "";
  const priorityColorMap = {
    Extreme: "text-danger-500",
    Moderate: "text-accent-500",
    Low: "text-success-500",
  };
  const priorityColorClass = priorityColorMap[task.priority] || "text-accent-500";
  const priorityValueClass = hasImage ? "text-white font-semibold" : `${priorityColorClass} font-semibold`;
  const statusDisplayClass = hasImage ? "text-white font-semibold" : statusClass;
  const descriptionClass = hasImage ? "text-sm text-white/90 truncate" : "text-sm text-gray-600 truncate";
  const metaWrapperClass = hasImage
    ? "text-xs text-white/85 mt-2 flex flex-wrap items-center gap-x-3"
    : "text-xs text-gray-500 mt-2 flex flex-wrap items-center gap-x-3";
  const baseClasses = [
    "relative overflow-hidden rounded-2xl border shadow-soft cursor-pointer transition p-0",
    isActive ? "border-accent-500 ring-1 ring-accent-100" : "hover:border-accent-300",
  ];
  baseClasses.push(hasImage ? "text-white" : "bg-white");
  const statusColorMap = {
    Completed: "#22c55e",
    "Not Started": "#ef4444",
    "In Progress": "#3b82f6",
  };
  const statusColor = statusColorMap[task.status] || "#3b82f6";
  const titleClass = hasImage ? "font-semibold text-white" : "font-semibold";
  const overlayShade = hasImage
    ? "bg-gradient-to-br from-slate-900/75 via-slate-900/55 to-slate-900/35"
    : "";

  return `
  <article data-task-select="${task.id}"
    class="${baseClasses.join(" ")}"
    ${backgroundStyle}>
    ${hasImage ? `<span class="absolute inset-0 ${overlayShade}"></span>` : ""}
    <span class="absolute inset-y-3 left-3 w-1 rounded-full" style="background:${statusColor};"></span>
    <div class="relative p-4 pl-8 space-y-3">
      <h4 class="${titleClass} truncate">${escapeHtml(task.title)}</h4>
      <p class="${descriptionClass}">${escapeHtml(task.desc || "No description yet.")}</p>
      <div class="${metaWrapperClass}">
        <span>Priority: <span class="${priorityValueClass}">${escapeHtml(task.priority)}</span></span>
        <span>Status: <span class="${statusDisplayClass}">${escapeHtml(task.status)}</span></span>
        <span class="ml-auto whitespace-nowrap">Deadline: ${escapeHtml(deadline)}</span>
      </div>
    </div>
  </article>`;
}

function getFilteredTasks() {
  if (!searchQuery) return [...tasks];
  return tasks.filter(matchesSearch);
}

function ensureSelectedTaskInFiltered() {
  const filtered = getFilteredTasks();
  if (!filtered.length) {
    selectedTaskId = null;
    return;
  }
  if (!selectedTaskId || !filtered.some((task) => task.id === selectedTaskId)) {
    selectedTaskId = filtered[0].id;
  }
}

function matchesSearch(task) {
  if (!searchQuery) return true;
  const title = (task.title || "").toLowerCase();
  return title.startsWith(searchQuery);
}

function taskModalTemplate(id) {
  return `
  <div id="${id}" class="fixed inset-0 z-40 hidden">
    <div class="absolute inset-0 bg-black/40" data-action="close-task-modal"></div>
    <div class="relative max-w-3xl mx-auto mt-16">
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold" id="taskModalTitle">Add Task</h3>
          <button class="text-sm underline" data-action="close-task-modal">Close</button>
        </div>
        <form id="manageTaskForm" class="grid gap-4 mt-4">
          ${taskImagePickerTemplate("", {
            label: "Cover Image",
          })}
          <label class="grid gap-1">
            <span class="text-sm">Title</span>
            <input name="title" class="field" required />
          </label>
          <label class="grid gap-1">
            <span class="text-sm">Deadline</span>
            <input type="datetime-local" name="deadline" class="field" />
          </label>
          <div class="grid gap-2" data-chip-group="priority">
            <span class="text-sm">Priority</span>
            <input type="hidden" name="priority" value="Moderate" data-chip-input="priority" />
            <div class="flex items-center gap-3 text-sm flex-wrap" data-chip-options="priority">
              ${priorityChip("Extreme")}
              ${priorityChip("Moderate", true)}
              ${priorityChip("Low")}
            </div>
          </div>
          <div class="grid gap-2" data-chip-group="status">
            <span class="text-sm">Status</span>
            <input type="hidden" name="status" value="Not Started" data-chip-input="status" />
            <div class="flex items-center gap-3 text-sm flex-wrap" data-chip-options="status">
              ${statusChip("Not Started", true)}
              ${statusChip("In Progress")}
              ${statusChip("Completed")}
            </div>
          </div>
          <label class="grid gap-1">
            <span class="text-sm">Task Description</span>
            <textarea name="desc" rows="6" class="field" placeholder="Start writing here....."></textarea>
          </label>
          <div class="flex justify-end pt-2">
            <button class="btn-primary px-6">Done</button>
          </div>
          <input type="hidden" name="taskId" />
        </form>
      </div>
    </div>
  </div>`;
}

function openTaskModal(mode, task) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.dataset.mode = mode;
  modal.classList.remove("hidden");

  const form = modal.querySelector("form");
  form.reset();
  const priorityHidden = form.querySelector('[data-chip-input="priority"]');
  if (priorityHidden) {
    priorityHidden.value = priorityHidden.defaultValue || "Moderate";
  }
  const statusHidden = form.querySelector('[data-chip-input="status"]');
  if (statusHidden) {
    statusHidden.value = statusHidden.defaultValue || "Not Started";
  }
  form.taskId.value = "";

  const titleEl = document.getElementById("taskModalTitle");
  titleEl.textContent = mode === "edit" ? "Edit Task" : "Add Task";

  let coverValue = "";
  if (task && mode === "edit") {
    form.taskId.value = task.id;
    form.title.value = task.title || "";
    form.desc.value = task.desc || "";
    form.deadline.value = toInputDateTime(task.deadline);
    coverValue = task.coverImage || "";
    if (priorityHidden) {
      priorityHidden.value = task.priority || priorityHidden.defaultValue || "Moderate";
    }
    if (statusHidden) {
      statusHidden.value = task.status || statusHidden.defaultValue || "Not Started";
    }
  }

  setupTaskImagePicker(modal.querySelector("[data-task-image-root]"), coverValue);
  setupChipSelectors(form);
  priorityHidden?.dispatchEvent(new Event("change"));
  statusHidden?.dispatchEvent(new Event("change"));
}

function closeTaskModal() {
  document.getElementById(modalId)?.classList.add("hidden");
}

async function handleDeleteTask() {
  const task = getSelectedTask();
  if (!task) return;

  const confirmed = await showConfirm({
    title: "Delete task",
    message: `Are you sure you want to remove "${task.title}"? This action cannot be undone.`,
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    tone: "danger",
  });
  if (!confirmed) {
    showAlert({
      title: "Deletion cancelled",
      message: "The task is safe.",
      type: "info",
    });
    return;
  }

  try {
    await deleteTask(task.id);
    selectedTaskId = null;
    await refreshTasks();
    renderStats();
    renderFilters();
    renderTaskList();
    renderTaskDetails();
    showAlert({
      title: "Task deleted",
      message: "The task has been removed successfully.",
      type: "danger",
    });
  } catch (error) {
    showAlert({
      title: "Deletion failed",
      message: (error && error.message) || "Please try again later.",
      type: "danger",
    });
  }
}

async function handleToggleTask() {
  const task = getSelectedTask();
  if (!task) return;
  try {
    await toggleTaskStatus(task.id);
    await refreshTasks({ syncSelection: false, forceRefresh: false });
    renderStats();
    renderFilters();
    renderTaskList();
    renderTaskDetails();
  } catch (error) {
    showAlert({
      title: "Update failed",
      message: (error && error.message) || "Please try toggling again later.",
      type: "danger",
    });
  }
}

function getSelectedTask() {
  if (!selectedTaskId) return null;
  const task = tasks.find((item) => item.id === selectedTaskId) || null;
  if (!task) return null;
  return matchesSearch(task) ? task : null;
}

function emptyState(text) {
  return `<div class="rounded-2xl border border-dashed p-6 text-center text-sm text-gray-500">${escapeHtml(
    text
  )}</div>`;
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function renderStats() {
  // Reserved for future enhancements
}

function renderFilters() {
  // Reserved for future enhancements
}

function escapeHtml(str = "") {
  return String(str ?? "").replace(/[&<>"']/g, (m) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m])
  );
}
