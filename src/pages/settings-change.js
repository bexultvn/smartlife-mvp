import { renderLayout } from "/src/js/layout.js";

const content = `
<div class="rounded-2xl border p-6">
  <div class="text-sm text-gray-500 mb-2">Account Information</div>
  <div class="rounded-lg border p-4">
    <div class="font-medium">John Doe</div>
    <div class="text-sm text-gray-600">johndoe@gmail.com</div>
  </div>

  <form class="grid md:grid-cols-2 gap-4 mt-6">
    ${input("First Name")}
    ${input("Last Name")}
    ${input("Username")}
    ${input("Email address","email")}
  </form>

  <div class="mt-6 flex gap-2">
    <a href="/pages/settings.html" class="btn btn-outline">Go Back</a>
    <button class="btn btn-primary">Save Changes</button>
  </div>
</div>
`;

renderLayout({ active: "settings-change", title: "Settings change", content });

function input(label, type="text"){
  return `<label class="grid gap-1">
    <span class="text-sm">${label}</span>
    <input type="${type}" class="rounded-lg border px-3 py-2" />
  </label>`;
}
