import { renderLayout } from "/src/js/layout.js";

const form = `
<div class="flex items-center justify-between mb-4">
  <a href="/pages/dashboard.html" class="text-sm text-gray-600 hover:underline">Go Back</a>
  <h2 class="text-lg font-medium">Edit Task</h2>
</div>

<form class="grid gap-4 rounded-2xl border p-6">
  <div class="grid md:grid-cols-2 gap-4">
    <label class="grid gap-1">
      <span class="text-sm">Title</span>
      <input value="Walk the dog" class="rounded-lg border px-3 py-2" />
    </label>
    <label class="grid gap-1">
      <span class="text-sm">Deadline</span>
      <input type="datetime-local" class="rounded-lg border px-3 py-2" />
    </label>
  </div>

  <label class="grid gap-1">
    <span class="text-sm">Task Description</span>
    <textarea rows="4" class="rounded-lg border px-3 py-2">Take the dog to the park and bring treats as well.</textarea>
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

renderLayout({ active: "add-task", title: "Edit task", content: form });

function radio(name, label, checked=false){
  return `<label class="inline-flex items-center gap-2">
    <input type="radio" name="${name}" value="${label}" ${checked?'checked':''}>
    <span>${label}</span>
  </label>`;
}
