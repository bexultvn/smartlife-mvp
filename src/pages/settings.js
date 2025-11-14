import { renderLayout } from "/src/js/layout.js";
import { getProfile, saveProfile } from "/src/js/profile-store.js";

const profile = getProfile();
const toolbar = `<h2 class="text-3xl font-semibold">Settings</h2>`;

const content = `
<section class="card p-6">
  <div class="flex items-center justify-between">
    <h3 class="text-xl font-semibold">Account Information</h3>
    <a href="/pages/dashboard.html" class="text-sm underline">Go Back</a>
  </div>

  <div class="rounded-xl border p-4 mt-5 flex items-center gap-4">
    <img src="${profile.avatar}" alt="avatar" class="h-16 w-16 rounded-full object-cover border" />
    <div>
      <div class="font-medium">${profile.firstName} ${profile.lastName}</div>
      <div class="text-sm text-gray-600">${profile.email}</div>
    </div>
  </div>

  <form id="settingsForm" class="rounded-xl border p-6 mt-6 grid gap-4 max-w-2xl">
    <label class="grid gap-1">
      <span class="text-sm">First Name</span>
      <input name="firstName" class="field" value="${profile.firstName}" required />
    </label>
    <label class="grid gap-1">
      <span class="text-sm">Last Name</span>
      <input name="lastName" class="field" value="${profile.lastName}" required />
    </label>
    <label class="grid gap-1">
      <span class="text-sm">Username</span>
      <input name="username" class="field" value="${profile.username}" required />
    </label>
    <label class="grid gap-1">
      <span class="text-sm">Email Address</span>
      <input name="email" type="email" class="field" value="${profile.email}" required />
    </label>

    <div class="pt-2">
      <button class="btn-primary" id="updateBtn" type="submit">Update Info</button>
    </div>
  </form>
</section>
`;

renderLayout({ active: "settings", toolbar, content });

const form = document.getElementById("settingsForm");
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const updated = { ...getProfile(), ...data };
  saveProfile(updated);

  document.querySelector("section img[alt='avatar']")?.setAttribute("src", updated.avatar || profile.avatar);
  document.querySelector("section .font-medium").textContent = `${updated.firstName} ${updated.lastName}`;
  document.querySelector("section .text-gray-600").textContent = updated.email;

  pulse("#updateBtn");
});

function pulse(selector) {
  const el = document.querySelector(selector);
  el?.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }],
    { duration: 400 }
  );
}
