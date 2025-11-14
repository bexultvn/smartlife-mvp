import { renderLayout } from "/src/js/layout.js";
import { ICONS } from "/src/js/icons.js";
import { addTask, deleteTask, formatDisplayDate, getTasks, updateTask } from "/src/js/tasks-store.js";
import { showAlert } from "/src/js/ui-alerts.js";
import { showConfirm } from "/src/js/layout.js";
import {
  taskImagePickerTemplate,
  setupTaskImagePicker,
} from "/src/js/task-image-picker.js";
import {
  priorityChip,
  statusChip,
  setupChipSelectors,
} from "/src/js/chip-selectors.js";

const STATUS_CONFIG = [
  { key: "Not Started", label: "Not Started", short: "New", color: "#ef4444", accent: "danger"  },
  { key: "In Progress", label: "In Progress", short: "Doing", color: "#3b82f6", accent: "accent" },
  { key: "Completed", label: "Completed", short: "Done", color: "#22c55e", accent: "success" },
];

let tasksCache = [];
let searchQuery = "";

const boardSection = `
<section class="card p-4">
  <div class="flex flex-wrap items-start justify-between gap-4 px-2">
    <button id="openAdd" class="text-accent-500 text-sm whitespace-nowrap">+ Add task</button>
    <div id="statusChart" class="flex flex-wrap justify-end gap-4 text-right"></div>
  </div>

  <div class="mt-5 overflow-x-auto pb-4 -mx-4 px-4">
    <div id="kanbanBoard" class="flex gap-4 min-w-full pr-4"></div>
  </div>
</section>
`;

const content = `
<div class="space-y-6">
  ${boardSection}
</div>

<!-- Add Task Modal -->
<div id="modal" class="fixed inset-0 z-50 hidden">
  <div class="absolute inset-0 bg-black/40"></div>
  <div class="relative max-w-4xl mx-auto mt-16">
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Add New Task</h3>
        <button id="closeModal" class="underline text-sm">Go Back</button>
      </div>
      <form id="taskForm" class="grid gap-4 mt-4">
        ${taskImagePickerTemplate("", { label: "Cover Image" })}
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
        <div class="flex justify-end">
          <button class="btn-primary">Done</button>
        </div>
      </form>
    </div>
  </div>
</div>
`;

renderLayout({ active:"dashboard", content });
setupTaskImagePicker(document.querySelector("#modal [data-task-image-root]"), "");
setupChipSelectors(document.getElementById("taskForm"));
init();

async function init() {
  try {
    await refreshBoard({ forceRefresh: true });
  } catch (error) {
    console.error("Failed to load tasks", error);
  }
}

async function refreshBoard({ forceRefresh = false } = {}) {
  tasksCache = await getTasks({ forceRefresh });
  renderBoard();
  renderStatusChart();
}

// helpers
function renderBoard() {
  const board = document.getElementById("kanbanBoard");
  if (!board) return;

  const filteredTasks = getFilteredTasks();
  const columns = STATUS_CONFIG.map((status) => {
    const columnTasks = filteredTasks.filter((task) => task.status === status.key);
    return boardColumn(status, columnTasks);
  }).join("");

  board.innerHTML = columns;
}

function renderStatusChart() {
  const chart = document.getElementById("statusChart");
  if (!chart) return;

  const filteredTasks = getFilteredTasks();
  if (!filteredTasks.length) {
    chart.innerHTML = `<p class="text-[11px] text-gray-500">No tasks yet.</p>`;
    return;
  }

  const total = filteredTasks.length;
  const stats = STATUS_CONFIG.map((status) => {
    const count = filteredTasks.filter((task) => task.status === status.key).length;
    const percent = filteredTasks.length ? Math.round((count / total) * 100) : 0;
    return { ...status, count, percent };
  });

  chart.innerHTML = stats
    .map(
      (stat) => `
      <div class="flex flex-col items-end gap-1 text-right min-w-[116px]">
        ${donut(stat.percent, stat.color, 72)}
        <p class="text-xs font-semibold mt-1">${stat.label}</p>
        <p class="text-[11px] text-gray-500">${stat.count} tasks</p>
      </div>`
    )
    .join("");
    

  
}

function boardColumn(status, items) {
  const content = items.length
    ? items.map((task) => kanbanCard(task)).join("")
    : `<div class="rounded-xl border border-dashed p-4 text-center text-xs text-gray-500 bg-white/70">No tasks.</div>`;

  return `
  <div class="min-w-[260px] lg:min-w-[300px] flex-1 shrink-0" data-status-column="${status.key}">
    <div class="rounded-3xl border-2 bg-white/80 shadow-lg shadow-black/5 backdrop-blur-sm h-full flex flex-col overflow-hidden transition ring-offset-2"
      style="border-color:${status.color};">
      <div class="flex items-center justify-between px-4 py-2 text-white text-sm font-semibold"
        style="background:${status.color}">
        <span class="flex items-center gap-2">${status.icon ?? ""}<span>${status.label}</span></span>
        <span class="bg-white/20 px-2 py-0.5 rounded-full text-xs">${items.length}</span>
      </div>
      <div class="p-3 flex-1 flex flex-col gap-3 bg-gray-50/40 min-h-[260px] max-h-[540px] overflow-y-auto">${content}</div>
    </div>
  </div>`;
}

function kanbanCard(task) {
  const statusColor = getStatusColor(task.status);
  const deadlineLabel = task.deadline ? formatDisplayDate(task.deadline) : "No deadline";
  const hasImage = Boolean(task.coverImage);
  const backgroundStyle = hasImage
    ? `style="background-image:url('${escapeHtml(task.coverImage)}');background-size:cover;background-position:center;"`
    : "";
  const baseClasses = [
    "relative rounded-2xl border border-gray-100 bg-white shadow-soft cursor-grab active:cursor-grabbing overflow-hidden",
  ];
  if (hasImage) {
    baseClasses.push("text-white");
  }
  const contentClasses = [
    "relative flex flex-col gap-3 p-4 pl-8",
    hasImage ? "text-white" : "text-gray-900",
  ];

  return `
  <article class="${baseClasses.join(" ")}" draggable="true" data-task-card="${task.id}" ${backgroundStyle}>
    ${hasImage ? '<span class="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/55 to-slate-900/30"></span>' : ""}
    <span class="absolute inset-y-3 left-3 w-1 rounded-full" style="background:${statusColor}"></span>
    <div class="${contentClasses.join(" ")}">
      <div class="flex items-center justify-between gap-2">
        <h4 class="font-semibold text-sm truncate ${hasImage ? "text-white" : ""}">${escapeHtml(task.title || "Untitled")}</h4>
        <span class="text-[11px] ${hasImage ? "text-white/80" : "text-gray-400"} whitespace-nowrap">${escapeHtml(deadlineLabel)}</span>
      </div>
      <p class="text-sm ${hasImage ? "text-white/85" : "text-gray-600"} min-h-[48px] overflow-hidden">${escapeHtml(task.desc || "No description yet.")}</p>
      <div class="flex items-center justify-between text-xs ${hasImage ? "text-white/85" : "text-gray-500"} gap-3 flex-wrap">
        ${priorityBadge(task.priority, hasImage)}
        <button type="button"
          class="inline-flex items-center gap-1 ${hasImage ? "text-white" : "text-danger-500"} hover:text-danger-600 transition text-[11px] font-medium"
          data-task-delete="${task.id}">
          ${ICONS.trash}
          <span>Delete</span>
        </button>
      </div>
    </div>
  </article>`;
}

function donut(val, color, size = 84){
  const safeSize = Math.max(56, size);
  const deg = Math.round((360 * val) / 100);
  const innerOffset = Math.round(safeSize * 0.26);
  return `<div class="relative grid place-items-center" style="width:${safeSize}px;height:${safeSize}px;">
    <div class="ring-progress" style="--val:${deg}deg;--color:${color};--ring-size:${safeSize}px;--ring-inner-offset:${innerOffset}px;"></div>
    <div class="ring-center">${val}%</div>
  </div>`;
}

// modal
const modal = document.getElementById("modal");
const taskForm = document.getElementById("taskForm");
document.getElementById("openAdd")?.addEventListener("click", () => {
  taskForm?.reset();
  setupTaskImagePicker(document.querySelector("#modal [data-task-image-root]"), "");
  setupChipSelectors(taskForm);
  modal?.classList.remove("hidden");
});
document.getElementById("closeModal")?.addEventListener("click", () => modal?.classList.add("hidden"));
document.addEventListener("submit", async (e) => {
  if (e.target.id === "taskForm") {
    e.preventDefault();
    const formEl = e.target;
    const submitter = e.submitter;
    const data = Object.fromEntries(new FormData(formEl));
    if (submitter) {
      submitter.disabled = true;
      submitter.dataset.loading = "true";
    }
    try {
      await addTask({
        title: data.title,
        desc: data.desc,
        priority: data.priority,
        status: data.status || "Not Started",
        deadline: data.deadline,
        coverImage: data.coverImage || "",
      });
      formEl.reset();
      modal.classList.add("hidden");
      setupTaskImagePicker(document.querySelector("#modal [data-task-image-root]"), "");
      setupChipSelectors(formEl);
      await refreshBoard();
      showAlert({
        title: "Task created",
        message: "A new task has been added to your board.",
        type: "success",
      });
    } catch (error) {
      showAlert({
        title: "Unable to create task",
        message: (error && error.message) || "Please try again later.",
        type: "danger",
      });
    } finally {
      if (submitter) {
        submitter.disabled = false;
        delete submitter.dataset.loading;
      }
    }
  }
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-task-delete]");
  if (!trigger) return;
  event.preventDefault();
  const taskId = trigger.dataset.taskDelete;
  if (taskId) {
    handleBoardTaskDelete(taskId);
  }
});

function getStatusColor(statusKey) {
  return STATUS_CONFIG.find((item) => item.key === statusKey)?.color || "#94a3b8";
}

function priorityBadge(priority = "Moderate", invert = false) {
  const map = {
    Extreme: { color: "#ef4444", icon: ICONS.alert, label: "Extreme" },
    Moderate: { color: "#3b82f6", icon: ICONS.cog, label: "Moderate" },
    Low: { color: "#22c55e", icon: ICONS.leaf, label: "Low" },
  };
  const styles = map[priority] || map.Moderate;
  if (invert) {
    return `<span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-white/40 text-white">
      <span>${styles.icon}</span>${styles.label}
    </span>`;
  }
  return `<span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border"
    style="border-color:${styles.color}; color:${styles.color}; background:${styles.color}10">
      <span>${styles.icon}</span>${styles.label}
    </span>`;
}

let draggedTaskId = null;
let draggedEl = null;

document.addEventListener("dragstart", (e) => {
  const card = e.target.closest("[data-task-card]");
  if (!card) return;
  draggedTaskId = card.dataset.taskCard;
  draggedEl = card;
  card.classList.add("opacity-60");
  e.dataTransfer?.setData("text/plain", draggedTaskId);
  e.dataTransfer?.setDragImage(card, 20, 20);
});

document.addEventListener("dragend", () => {
  if (draggedEl) draggedEl.classList.remove("opacity-60");
  draggedTaskId = null;
  draggedEl = null;
  clearColumnHighlights();
});

document.addEventListener("dragover", (e) => {
  const column = e.target.closest("[data-status-column]");
  if (!column || !draggedTaskId) return;
  e.preventDefault();
  setColumnHighlight(column, true);
});

document.addEventListener("dragleave", (e) => {
  const column = e.target.closest("[data-status-column]");
  if (!column || !draggedTaskId) return;
  if (!column.contains(e.relatedTarget)) {
    setColumnHighlight(column, false);
  }
});

document.addEventListener("drop", async (e) => {
  const column = e.target.closest("[data-status-column]");
  if (!column || !draggedTaskId) return;
  e.preventDefault();
  const status = column.dataset.statusColumn;
  clearColumnHighlights();
  if (status) {
    try {
      await updateTask(draggedTaskId, { status });
      await refreshBoard({ forceRefresh: false });
    } catch (error) {
      showAlert({
        title: "Update failed",
        message: (error && error.message) || "Please try again later.",
        type: "danger",
      });
    }
  }
});

function setColumnHighlight(column, isActive) {
  column
    .querySelector(".rounded-3xl")
    ?.classList.toggle("ring-2", Boolean(isActive));
}

function clearColumnHighlights() {
  document
    .querySelectorAll("[data-status-column] .rounded-3xl")
    .forEach((el) => el.classList.remove("ring-2"));
}

function getFilteredTasks() {
  if (!searchQuery) return [...tasksCache];
  return tasksCache.filter(matchesSearch);
}

function matchesSearch(task) {
  if (!searchQuery) return true;
  const title = (task.title || "").toLowerCase();
  return title.startsWith(searchQuery);
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

async function handleBoardTaskDelete(taskId) {
  const task = tasksCache.find((item) => item.id === taskId);
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
      message: "The task remains on your board.",
      type: "info",
    });
    return;
  }

  try {
    await deleteTask(taskId);
    await refreshBoard();
    showAlert({
      title: "Task deleted",
      message: `"${task.title}" has been removed from the board.`,
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

window.addEventListener("sl:search", (event) => {
  searchQuery = (event.detail || "").toLowerCase();
  renderBoard();
  renderStatusChart();
});

if (typeof window !== "undefined") {
  const initialSearch = (window.__slSearchValue || "").trim().toLowerCase();
  if (initialSearch && initialSearch !== searchQuery) {
    searchQuery = initialSearch;
    renderBoard();
    renderStatusChart();
  }
}
