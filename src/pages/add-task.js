import { renderLayout } from "/src/js/layout.js";
import { addTask } from "/src/js/tasks-store.js";
import { showAlert } from "/src/js/ui-alerts.js";

const form = `
<div class="flex items-center justify-between mb-4">
  <a href="/pages/dashboard.html" class="text-sm text-gray-600 hover:underline">Go Back</a>
  <h2 class="text-lg font-medium">Add Task</h2>
</div>

<form id="taskForm" class="grid gap-4 rounded-2xl border p-6">
  <div class="grid md:grid-cols-2 gap-4">
    <label class="grid gap-1">
      <span class="text-sm">Title</span>
      <input name="title" required class="rounded-lg border px-3 py-2" />
    </label>
    <label class="grid gap-1">
      <span class="text-sm">Deadline</span>
      <input type="datetime-local" name="deadline" class="rounded-lg border px-3 py-2" />
    </label>
  </div>

  <label class="grid gap-1">
    <span class="text-sm">Task Description</span>
    <textarea name="desc" rows="4" class="rounded-lg border px-3 py-2"></textarea>
  </label>

  <fieldset class="grid gap-2">
    <legend class="text-sm">Priority</legend>
    <div class="flex gap-3">
      ${radio("priority","Extreme")}
      ${radio("priority","Moderate", true)}
      ${radio("priority","Low")}
    </div>
  </fieldset>

  <div class="grid gap-1">
    <span class="text-sm">Notes</span>
    <div class="rounded-lg border min-h-28 p-3 text-gray-500">Start writing here.....</div>
  </div>

  <div class="flex justify-end gap-2">
    <a href="/pages/dashboard.html" class="btn btn-outline">Cancel</a>
    <button class="btn btn-primary">Done</button>
  </div>
</form>
`;

renderLayout({ active: "add-task", title: "Add task", content: form });

function radio(name, label, checked=false){
  return `<label class="inline-flex items-center gap-2">
    <input type="radio" name="${name}" value="${label}" ${checked?'checked':''}>
    <span>${label}</span>
  </label>`;
}

document.addEventListener("submit", async (e) => {
  if (e.target.id !== "taskForm") return;
  e.preventDefault();
  const formEl = e.target;
  const submitter = e.submitter;
  const data = Object.fromEntries(new FormData(formEl));
  const payload = {
    title: data.title,
    desc: data.desc,
    priority: data.priority || "Moderate",
    deadline: data.deadline,
    status: "Not Started",
  };

  if (submitter) {
    submitter.disabled = true;
    submitter.dataset.loading = "true";
  }

  try {
    await addTask(payload);
    window.location.href = "/pages/my-tasks.html";
  } catch (error) {
    showAlert({
      title: "Unable to add task",
      message: (error && error.message) || "Please try again later.",
      type: "danger",
    });
  } finally {
    if (submitter) {
      submitter.disabled = false;
      delete submitter.dataset.loading;
    }
  }
});
