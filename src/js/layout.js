import { ICONS } from "/src/js/icons.js";
import { DEFAULT_AVATAR, DEFAULT_PROFILE, getProfile, saveProfile } from "/src/js/profile-store.js";
import {
  advancePomodoroCycle,
  formatSeconds as formatPomodoroSeconds,
  getModeConfig as getPomodoroConfig,
  getPomodoroState,
  pausePomodoroCountdown,
  resetPomodoroCountdown,
  startPomodoroCountdown,
  setPomodoroMode,
} from "/src/js/pomodoro-store.js";
import { playPomodoroAlarm } from "/src/js/pomodoro-alarm.js";
import { initNewYearMode, newYearToggleMarkup, syncNewYearTheme } from "/src/js/new-year-mode.js";
const STORAGE_RESET_KEY = "sl_storage_reset_version";
const STORAGE_RESET_VERSION = "1";
const POMODORO_OVERLAY_POSITION_KEY = "sl_pomodoro_overlay_position";
const POMODORO_OVERLAY_STATE_KEY = "sl_pomodoro_overlay_state";
const THEME_STORAGE_KEY = "sl_theme_preference";
const DEFAULT_THEME = "light";
const THEME_OPTIONS = ["light", "dark"];
let currentTheme = null;

const tweakIconSize = (icon, sizeClass = "h-5 w-5") =>
  icon.replace('class="h-5 w-5"', `class="${sizeClass}"`);

const GLOBAL_SEARCH_KEY = "sl_global_search";
const GLOBAL_SEARCH_FOCUS_KEY = "sl_search_focus";

const iconInfo = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
    <circle cx="12" cy="12" r="9.2" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v4" />
    <circle cx="12" cy="8" r="0.75" fill="currentColor" />
  </svg>`;

const iconShield = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 5.2 6 7.4v5.6c0 3.4 2.7 6.7 6 8 3.3-1.3 6-4.6 6-8V7.4l-6-2.2Z" />
    <path stroke-linecap="round" stroke-linejoin="round" d="m9.6 12.2 1.8 1.9 3.2-3.4" />
  </svg>`;

ensureStorageReset();
ensureTheme();
if (typeof window !== "undefined") {
  window.addEventListener("storage", handleThemeStorageChange);
}

export function renderLayout({ active = "", title = "SmartLife", content = "", toolbar = "" } = {}) {
  const profile = getProfile();
  const theme = ensureTheme();
  const sunIcon = tweakIconSize(ICONS.sun, "h-4 w-4");
  const moonIcon = tweakIconSize(ICONS.moon, "h-4 w-4");
  const themeLabel = theme === "dark" ? "Dark" : "Light";
  const toggleAriaLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const lightIconClass = theme === "light" ? "" : "hidden";
  const darkIconClass = theme === "dark" ? "" : "hidden";

  if (typeof document !== "undefined" && document.body) {
    document.body.classList.add("min-h-dvh", "sl-app-body");
  }

  if (typeof document !== "undefined" && document.body) {
    document.body.innerHTML = `
  <div class="sl-shell min-h-dvh grid md:grid-cols-[280px_1fr]">
    <!-- Sidebar -->
    <aside class="hidden md:flex flex-col sl-sidebar p-6 gap-6">
      <button type="button" class="flex items-center gap-3 text-left focus:ring-2 focus:ring-white/40 rounded-xl"
        data-open-profile-settings>
        <img alt="avatar" class="h-12 w-12 rounded-full object-cover bg-white/20"
             src="${profile.avatar || DEFAULT_AVATAR}" data-profile-avatar />
        <div>
          <div class="font-semibold" data-profile-username>${profile.username || DEFAULT_PROFILE.username}</div>
          <div class="text-xs text-white/80" data-profile-email>${profile.email}</div>
        </div>
      </button>
      <nav class="flex-1 space-y-2">
        ${navItem("/pages/dashboard.html","Dashboard",ICONS.dashboard, active==="dashboard")}
        ${navItem("/pages/my-tasks.html","My Tasks",ICONS.tasks, active==="my-tasks")}
        ${navItem("/pages/pomodoro.html","Pomodoro",ICONS.clock, active==="pomodoro")}
        ${navItem("/pages/conspectus.html","Conspectus",ICONS.conspectus, active==="conspectus")}
      </nav>
      <a href="/pages/login.html" class="mt-auto inline-flex items-center gap-2 text-white/90 hover:text-white">
        ${tweakIconSize(ICONS.logout,"h-4 w-4")}<span>Logout</span>
      </a>
    </aside>

    <!-- Main -->
    <div class="flex flex-col min-h-dvh">
      <!-- Top toolbar -->
      <header class="bg-white/80 backdrop-blur border-b relative" data-main-header>
        <div class="container max-w-7xl py-4 flex items-center justify-between gap-4">
          <h1 class="text-2xl font-semibold sl-brand" data-brand><span class="text-accent-500">Smart</span>Life</h1>
          <div class="flex-1 mx-6 hidden md:block">
            <label class="relative block">
              <input id="globalSearch" type="search" placeholder="Search your task here..." class="w-full field pl-10" />
              <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">${tweakIconSize(ICONS.search,"h-4 w-4")}</span>
            </label>
          </div>
          <div class="flex items-center gap-2 text-sm flex-wrap justify-end">
            ${newYearToggleMarkup()}
            <button type="button" class="pill bg-white border" data-theme-toggle aria-label="${toggleAriaLabel}">
              <span data-theme-icon="light" class="${lightIconClass}">${sunIcon}</span>
              <span data-theme-icon="dark" class="${darkIconClass}">${moonIcon}</span>
              <span class="hidden lg:inline" data-theme-label>${themeLabel}</span>
            </button>
            <button type="button" class="pill bg-white border" data-open-calendar>
              ${tweakIconSize(ICONS.calendar,"h-4 w-4")}<span>Calendar</span>
            </button>
            <div class="text-right">
              <div class="text-gray-600">${new Date().toLocaleDateString("en-US", { weekday: "long" })}</div>
              <div class="text-accent-500 text-xs">${new Date().toLocaleDateString("en-GB")}</div>
            </div>
          </div>
        </div>
      </header>

      <main class="container max-w-7xl flex-1 py-8">
        ${toolbar || ""}
        <div class="mt-2">${content}</div>
      </main>
    </div>
  </div>
  ${profileSettingsPanel(profile)}
  ${calendarModal()}
  `;
  }

  initProfileSettings();
  initCalendarModal();
  initPomodoroOverlay(active);
  initGlobalSearch();
  initThemeToggle();
  initNewYearMode();
}


function navItem(href, label, icon, active){
  const iconMarkup = tweakIconSize(icon, "h-5 w-5");
  const baseClasses = "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors";
  const activeClasses = "bg-white text-accent-500 shadow-soft";
  const inactiveClasses = "text-white/90 hover:text-white hover:bg-white/10";
  const iconClasses = active ? "text-accent-500" : "text-white/75";
  const labelClasses = active ? "font-semibold text-accent-500" : "font-medium text-inherit";
  return `<a href="${href}" class="${baseClasses} ${active ? activeClasses : inactiveClasses}">
    <span class="shrink-0 ${iconClasses}">${iconMarkup}</span>
    <span class="${labelClasses}">${escapeHtml(label)}</span>
  </a>`;
}

export function showConfirm({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
} = {}) {
  const toneStyles =
    tone === "danger"
      ? {
          badge: "bg-danger-500/10 text-danger-500",
          button: "bg-danger-500",
          icon: iconShield,
        }
      : {
          badge: "bg-accent-500/10 text-accent-500",
          button: "bg-accent-500",
          icon: iconInfo,
        };

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[9000] grid place-items-center bg-black/40 backdrop-blur-sm p-4 opacity-0 transition-opacity duration-150";

    requestAnimationFrame(() => {
      overlay.classList.add("opacity-100");
    });

    const card = document.createElement("div");
    card.className = "w-full max-w-md rounded-3xl bg-white shadow-card border overflow-hidden transform transition duration-200 ease-out scale-95";
    card.innerHTML = `
      <div class="p-6">
        <div class="flex items-start gap-3">
          <span class="rounded-2xl ${toneStyles.badge} p-2">
            ${toneStyles.icon}
          </span>
          <div class="min-w-0">
            <h3 class="text-lg font-semibold text-gray-900">${escapeHtml(title)}</h3>
            <p class="text-sm text-gray-500 mt-1">${escapeHtml(message)}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3 text-sm">
          <button type="button" class="btn btn-outline" data-confirm-cancel>${escapeHtml(cancelLabel)}</button>
          <button type="button" class="btn ${toneStyles.button} text-white px-4 py-2 rounded-xl" data-confirm-ok>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.body.classList.add("overflow-hidden");

    requestAnimationFrame(() => {
      card.classList.remove("scale-95");
      card.classList.add("scale-100");
    });

    const cleanup = () => {
      overlay.classList.remove("opacity-100");
      overlay.classList.add("opacity-0");
      card.classList.remove("scale-100");
      card.classList.add("scale-95");
      setTimeout(() => {
        overlay.remove();
        document.body.classList.remove("overflow-hidden");
      }, 160);
    };

    const resolveWith = (value) => {
      cleanup();
      resolve(value);
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        resolveWith(false);
      }
    });

    card.querySelector("[data-confirm-cancel]")?.addEventListener("click", () => resolveWith(false));
    card.querySelector("[data-confirm-ok]")?.addEventListener("click", () => resolveWith(true));
    document.addEventListener(
      "keydown",
      function handler(event) {
        if (event.key === "Escape") {
          document.removeEventListener("keydown", handler);
          resolveWith(false);
        }
      },
      { once: true }
    );
  });
}

function profileSettingsPanel(profile){
  return `
  <div id="profileSettingsPanel" class="fixed inset-0 z-50 hidden">
    <div class="absolute inset-0 bg-black/40" data-close-settings></div>
    <div class="relative mx-auto mt-16 max-w-3xl px-4">
      <section class="card p-6 bg-white">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm uppercase tracking-wide text-gray-400">Account settings</p>
            <h3 class="text-2xl font-semibold mt-1">Personal Info</h3>
          </div>
          <button type="button" class="text-sm text-gray-500 hover:text-gray-900" data-close-settings>Close</button>
        </div>
        <form id="profileSettingsForm" class="grid gap-4 mt-6">
          <div class="flex items-center gap-4">
            <div class="flex flex-col items-start gap-2">
              <button type="button" class="relative group rounded-full ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                data-avatar-trigger>
                <img src="${profile.avatar || DEFAULT_AVATAR}" alt="avatar" class="h-16 w-16 rounded-full object-cover border transition group-hover:brightness-110"
                  data-profile-avatar data-profile-avatar-preview />
                <span class="absolute inset-0 rounded-full bg-black/40 text-white text-xs uppercase tracking-wide flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  Change
                </span>
              </button>
              <input type="file" accept="image/*" class="hidden" data-avatar-upload data-skip-fill />
              <p class="text-xs text-danger-500 hidden" data-avatar-error></p>
            </div>
            <div>
              <div class="font-semibold" data-profile-name>${profile.firstName} ${profile.lastName}</div>
              <div class="text-sm text-gray-500" data-profile-email>${profile.email}</div>
            </div>
          </div>
          <input type="hidden" name="avatar" value="${escapeHtml(profile.avatar || "")}" />
          ${profileInput("firstName","First Name", profile.firstName)}
          ${profileInput("lastName","Last Name", profile.lastName)}
          ${profileInput("username","Username", profile.username)}
          ${profileInput("email","Email", profile.email, "email")}
          <div class="flex justify-end gap-3 pt-2">
            <button type="submit" class="btn-primary" id="profileSaveBtn">Save changes</button>
          </div>
        </form>
      </section>
    </div>
  </div>`;
}

function calendarModal(){
  return `
  <div id="calendarModal" class="fixed inset-0 z-40 hidden">
    <div class="absolute inset-0 bg-black/40" data-close-calendar></div>
    <div class="relative w-full h-full flex items-center justify-center px-4">
      <section class="card p-4 bg-white overflow-hidden w-full max-w-full sm:max-w-[600px]">
        <div class="flex items-center justify-between mb-4 px-2">
          <h3 class="text-lg font-semibold">Google Calendar</h3>
          <button type="button" class="text-sm text-gray-500 hover:text-gray-900" data-close-calendar>Close</button>
        </div>
        <div class="rounded-2xl border overflow-hidden w-full max-w-full" style="height: min(80vh, 560px);">
          <iframe
            title="Google Calendar"
            src="https://calendar.google.com/calendar/embed?showTitle=0&showTabs=0&showCalendars=0"
            class="w-full h-full"
            style="border:0"
            frameborder="0"
            scrolling="no"
            allowfullscreen
          ></iframe>
        </div>
      </section>
    </div>
  </div>`;
}

function profileInput(name, label, value = "", type = "text", required = true) {
  return `
    <label class="grid gap-1">
      <span class="text-sm">${label}</span>
      <input name="${name}" type="${type}" class="field" value="${escapeHtml(value || "")}" ${required ? "required" : ""} />
    </label>`;
}

function initProfileSettings() {
  const panel = document.getElementById("profileSettingsPanel");
  const form = document.getElementById("profileSettingsForm");
  if (!panel || !form) return;

  const openers = document.querySelectorAll("[data-open-profile-settings]");
  const closers = panel.querySelectorAll("[data-close-settings]");
  const avatarInput = form.querySelector('input[name="avatar"]');
  const uploadInput = form.querySelector("[data-avatar-upload]");
  const errorEl = form.querySelector("[data-avatar-error]");
  const avatarTrigger = panel.querySelector("[data-avatar-trigger]");
  const previewImgs = panel.querySelectorAll("[data-profile-avatar-preview]");

  const showPreview = (src) => {
    const nextSrc = src || DEFAULT_AVATAR;
    previewImgs.forEach((img) => img.setAttribute("src", nextSrc));
  };

  const showError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  };

  const clearError = () => {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  };

  avatarTrigger?.addEventListener("click", (event) => {
    event.preventDefault();
    uploadInput?.click();
  });

  uploadInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearError();
      return;
    }
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file.");
      event.target.value = "";
      return;
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      showError("Image must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (avatarInput) {
          avatarInput.value = reader.result;
        }
        showPreview(reader.result);
        clearError();
      }
    };
    reader.readAsDataURL(file);
  });

  const open = () => {
    fillFormWithProfile();
    panel.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  };

  const close = () => {
    panel.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  };

  openers.forEach((btn) => btn.addEventListener("click", open));
  closers.forEach((btn) => btn.addEventListener("click", close));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (avatarInput) {
      data.avatar = (data.avatar || "").trim() || DEFAULT_AVATAR;
    }
    const merged = { ...getProfile(), ...data };
    saveProfile(merged);
    updateProfileViews(merged);
    pulse("#profileSaveBtn");
    close();
  });

}

function initCalendarModal(){
  const modal = document.getElementById("calendarModal");
  const openers = document.querySelectorAll("[data-open-calendar]");
  const closers = modal?.querySelectorAll("[data-close-calendar]");
  if(!modal) return;

  const open = () => {
    modal.classList.remove("hidden");
  };
  const close = () => modal.classList.add("hidden");

  openers.forEach(btn => btn.addEventListener("click", open));
  closers?.forEach(btn => btn.addEventListener("click", close));
}

function initGlobalSearch(){
  if (typeof window === "undefined") return;
  const input = document.getElementById("globalSearch");
  if (!input) return;

  const isTasksPage = window.location.pathname.endsWith("/pages/my-tasks.html");

  let lastValue = "";
  try {
    lastValue = window.sessionStorage.getItem(GLOBAL_SEARCH_KEY) ?? "";
  } catch (error) {
    console.warn("Failed to read global search value", error);
  }

  if (!isTasksPage && lastValue) {
    lastValue = "";
    try {
      window.sessionStorage.removeItem(GLOBAL_SEARCH_KEY);
    } catch (error) {
      console.warn("Failed to clear global search for non task page", error);
    }
  }

  if (!isTasksPage) {
    try {
      window.sessionStorage.removeItem(GLOBAL_SEARCH_FOCUS_KEY);
    } catch (error) {
      console.warn("Failed to clear search focus intent for non task page", error);
    }
  }

  window.__slSearchValue = lastValue;
  input.value = lastValue;
  const dispatch = (value) => {
    window.dispatchEvent(new CustomEvent("sl:search", { detail: value }));
  };

  input.addEventListener("focus", () => {
    if (isTasksPage) return;
    try {
      window.sessionStorage.setItem(GLOBAL_SEARCH_FOCUS_KEY, "1");
    } catch (error) {
      console.warn("Failed to persist search focus intent", error);
    }
    window.location.href = "/pages/my-tasks.html";
  });

  input.addEventListener("input", (event) => {
    const value = event.target.value ?? "";
    window.__slSearchValue = value;
    try {
      window.sessionStorage.setItem(GLOBAL_SEARCH_KEY, value);
    } catch (error) {
      console.warn("Failed to persist global search value", error);
    }
    const trimmed = value.trim();
    if (trimmed && !isTasksPage) {
      window.location.href = "/pages/my-tasks.html";
      return;
    }
    dispatch(trimmed);
  });

  try {
    window.sessionStorage.setItem(GLOBAL_SEARCH_KEY, lastValue);
  } catch (error) {
    console.warn("Failed to persist global search value", error);
  }

  const initial = lastValue.trim();
  if (isTasksPage || !initial) {
    dispatch(initial);
  }

  if (isTasksPage) {
    let shouldFocus = false;
    try {
      shouldFocus = window.sessionStorage.getItem(GLOBAL_SEARCH_FOCUS_KEY) === "1";
    } catch (error) {
      console.warn("Failed to read search focus intent", error);
    }
    if (shouldFocus) {
      try {
        window.sessionStorage.removeItem(GLOBAL_SEARCH_FOCUS_KEY);
      } catch (error) {
        console.warn("Failed to clear search focus intent", error);
      }
      requestAnimationFrame(() => {
        input.focus();
        const valueLength = input.value.length;
        try {
          input.setSelectionRange(valueLength, valueLength);
        } catch {
          /* ignore */
        }
      });
    }
  }
}

function initThemeToggle() {
  if (typeof document === "undefined") return;
  const buttons = document.querySelectorAll("[data-theme-toggle]");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", handleThemeToggleClick);
  });

  updateThemeToggleButtons();
}

function handleThemeToggleClick(event) {
  event.preventDefault();
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
}

function updateThemeToggleButtons() {
  if (typeof document === "undefined") return;
  const theme = getTheme();
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const lightIcon = button.querySelector('[data-theme-icon="light"]');
    const darkIcon = button.querySelector('[data-theme-icon="dark"]');
    const label = button.querySelector("[data-theme-label]");
    if (lightIcon) {
      lightIcon.classList.toggle("hidden", theme !== "light");
    }
    if (darkIcon) {
      darkIcon.classList.toggle("hidden", theme !== "dark");
    }
    if (label) {
      label.textContent = theme === "dark" ? "Dark" : "Light";
    }
    button.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  });
}

function getTheme() {
  return currentTheme ?? ensureTheme();
}

function setTheme(theme, { persist = true } = {}) {
  const next = isValidTheme(theme) ? theme : DEFAULT_THEME;
  currentTheme = next;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next === "dark" ? "dark" : "light";
  }
  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      console.warn("Failed to persist theme", error);
    }
  }
  updateThemeToggleButtons();
  syncNewYearTheme(next);
  return next;
}

function ensureTheme() {
  if (currentTheme && isValidTheme(currentTheme)) {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", currentTheme);
      document.documentElement.style.colorScheme = currentTheme === "dark" ? "dark" : "light";
    }
    return currentTheme;
  }
  let resolved = DEFAULT_THEME;
  const stored = readStoredTheme();
  if (stored) {
    resolved = stored;
  } else if (detectSystemTheme() === "dark") {
    resolved = "dark";
  }
  return setTheme(resolved, { persist: false });
}

function readStoredTheme() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidTheme(raw)) {
      return raw;
    }
  } catch (error) {
    console.warn("Failed to read theme from storage", error);
  }
  return null;
}

function detectSystemTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch (error) {
    console.warn("Failed to detect system theme", error);
  }
  return DEFAULT_THEME;
}

function ensureStorageReset() {
  if (typeof localStorage === "undefined") return;
  try {
    const currentVersion = localStorage.getItem(STORAGE_RESET_KEY);
    if (currentVersion === STORAGE_RESET_VERSION) return;
    localStorage.clear();
    localStorage.setItem(STORAGE_RESET_KEY, STORAGE_RESET_VERSION);
  } catch (error) {
    console.warn("Failed to clear local storage", error);
  }
}

function isValidTheme(value) {
  return typeof value === "string" && THEME_OPTIONS.includes(value);
}

function handleThemeStorageChange(event) {
  if (event.key !== THEME_STORAGE_KEY) return;
  const next = isValidTheme(event.newValue) ? event.newValue : DEFAULT_THEME;
  setTheme(next, { persist: false });
}

function initPomodoroOverlay(activeSection = "") {
  if (activeSection === "pomodoro") return;
  if (typeof window === "undefined") return;

  const existing = document.getElementById("pomodoroMini");
  existing?.remove();

  const iconClose = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path stroke-linecap="round" stroke-linejoin="round" d="m9 9 6 6m0-6-6 6" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>`;

  const iconOpenPage = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 7h5v5" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>`;
  const iconOpenOverlay = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 9v4l2.5 2.5" />
    </svg>`;

  const container = document.createElement("div");
  container.id = "pomodoroMini";
  container.className = "fixed z-[9998] hidden cursor-grab select-none";
  container.style.left = "auto";
  container.style.top = "auto";
  container.style.right = "16px";
  container.style.bottom = "16px";
  container.style.touchAction = "none";
  container.innerHTML = `
    <div data-mini-card class="relative flex h-full flex-col rounded-2xl border border-gray-200/60 bg-white p-3 shadow-soft backdrop-blur w-[240px]">
      <div class="flex items-center justify-end gap-1 text-gray-400">
          <button type="button" class="rounded-full p-1 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent-500/50" data-mini-close title="Hide overlay">
            ${iconClose}
          </button>
          <button type="button" class="rounded-full p-1 hover:text-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/40" data-mini-open-page title="Open Pomodoro page">
            ${iconOpenPage}
          </button>
      </div>
      <div class="mt-2 flex flex-1 flex-col gap-3" data-mini-body>
        <div class="flex flex-wrap items-center justify-center gap-2 text-[11px]" data-mini-modes>
          <button type="button" class="btn-outline px-3 py-1.5 text-xs font-semibold" data-mini-mode="focus">Focus</button>
          <button type="button" class="btn-outline px-3 py-1.5 text-xs font-semibold" data-mini-mode="short">Short</button>
          <button type="button" class="btn-outline px-3 py-1.5 text-xs font-semibold" data-mini-mode="long">Long</button>
        </div>
        <div class="grid place-items-center py-1">
          <div class="relative h-36 w-36">
            <svg data-mini-circle width="144" height="144">
              <circle cx="72" cy="72" r="62" stroke="#e5e7eb" stroke-width="9" fill="none"></circle>
              <circle data-mini-progress cx="72" cy="72" r="62" stroke="#3b82f6" stroke-width="9" stroke-linecap="round" fill="none" stroke-dasharray="389.56" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle>
            </svg>
            <div class="absolute inset-0 grid place-items-center">
              <div class="text-center space-y-1">
                <div class="text-2xl font-semibold tabular-nums" data-mini-time>25:00</div>
                <div class="text-[10px] text-gray-400" data-mini-status>Focus Time</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-center gap-2 text-xs">
          <button type="button" class="btn-primary px-3 py-2" data-mini-start>Start</button>
          <button type="button" class="btn-outline px-3 py-2" data-mini-pause>Pause</button>
          <button type="button" class="btn-outline px-3 py-2" data-mini-reset>Reset</button>
        </div>
        <p class="text-[11px] text-gray-400 text-center">
          Pomodoros: <span data-mini-cycle>0</span>/4
        </p>
      </div>
    </div>
`;
  document.body.appendChild(container);

  const loadOverlayPrefs = () => {
    try {
      const raw = window.localStorage.getItem(POMODORO_OVERLAY_STATE_KEY);
      if (!raw) {
        return { hidden: false };
      }
      const parsed = JSON.parse(raw);
      return {
        hidden: Boolean(parsed?.hidden),
      };
    } catch (error) {
      console.warn("Failed to load pomodoro overlay state", error);
      return { hidden: false };
    }
  };

  let overlayPrefs = loadOverlayPrefs();

  const persistOverlayPrefs = (updates = {}) => {
    overlayPrefs = { ...overlayPrefs, ...updates };
    try {
      window.localStorage.setItem(POMODORO_OVERLAY_STATE_KEY, JSON.stringify(overlayPrefs));
    } catch (error) {
      console.warn("Failed to save pomodoro overlay state", error);
    }
  };

  const openPageBtn = container.querySelector("[data-mini-open-page]");
  const closeBtn = container.querySelector("[data-mini-close]");

  let reopenBtn = document.getElementById("pomodoroMiniOpen");
  if (!reopenBtn) {
    reopenBtn = document.createElement("button");
    reopenBtn.id = "pomodoroMiniOpen";
    reopenBtn.type = "button";
    reopenBtn.className =
      "fixed z-[9999] bottom-6 right-6 hidden rounded-full bg-accent-500 text-white shadow-soft hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 p-3";
    reopenBtn.innerHTML = iconOpenOverlay;
    document.body.appendChild(reopenBtn);
  }

  const modeButtons = Array.from(container.querySelectorAll("[data-mini-mode]") || []);
  const MINI_RADIUS = 78;
  const MINI_CIRCUMFERENCE = 2 * Math.PI * MINI_RADIUS;

  const syncVisibility = () => {
    if (overlayPrefs.hidden) {
      container.classList.add("hidden");
      reopenBtn?.classList.remove("hidden");
    } else {
      container.classList.remove("hidden");
      reopenBtn?.classList.add("hidden");
      requestAnimationFrame(() => ensureWithinViewport());
    }
  };

  const applyHiddenState = () => {
    syncVisibility();
  };

  const EDGE_PADDING = 12;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const loadOverlayPosition = () => {
    try {
      const raw = window.localStorage.getItem(POMODORO_OVERLAY_POSITION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.left === "number" && typeof parsed?.top === "number") {
        return parsed;
      }
    } catch (error) {
      console.warn("Failed to load pomodoro overlay position", error);
    }
    return null;
  };

  const saveOverlayPosition = (left, top) => {
    try {
      window.localStorage.setItem(
        POMODORO_OVERLAY_POSITION_KEY,
        JSON.stringify({ left, top })
      );
    } catch (error) {
      console.warn("Failed to save pomodoro overlay position", error);
    }
  };

  const ensureWithinViewport = () => {
    const left = Number.parseFloat(container.style.left);
    const top = Number.parseFloat(container.style.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const maxLeft = Math.max(EDGE_PADDING, window.innerWidth - rect.width - EDGE_PADDING);
    const maxTop = Math.max(EDGE_PADDING, window.innerHeight - rect.height - EDGE_PADDING);
    const nextLeft = clamp(left, EDGE_PADDING, maxLeft);
    const nextTop = clamp(top, EDGE_PADDING, maxTop);
    if (nextLeft !== left || nextTop !== top) {
      container.style.left = `${nextLeft}px`;
      container.style.top = `${nextTop}px`;
      saveOverlayPosition(nextLeft, nextTop);
    }
  };

  const applySavedPosition = () => {
    const saved = loadOverlayPosition();
    if (!saved) return false;
    container.style.left = `${saved.left}px`;
    container.style.top = `${saved.top}px`;
    container.style.right = "auto";
    container.style.bottom = "auto";
    return true;
  };

  const hasCustomPosition = applySavedPosition();
  if (hasCustomPosition) {
    requestAnimationFrame(ensureWithinViewport);
  }

  const headerTimerEl = container.querySelector("[data-mini-timer]");
  const labelEl = container.querySelector("[data-mini-label]");
  const timerEl = container.querySelector("[data-mini-time]");
  const statusEl = container.querySelector("[data-mini-status]");
  const countEl = container.querySelector("[data-mini-count]");
  const cycleEl = container.querySelector("[data-mini-cycle]");
  const startBtn = container.querySelector("[data-mini-start]");
  const pauseBtn = container.querySelector("[data-mini-pause]");
  const resetBtn = container.querySelector("[data-mini-reset]");
  const progressCircle = container.querySelector("[data-mini-progress]");
  applyHiddenState();

  let dragState = null;
  let completionTimeout = null;
  const NEXT_START_DELAY_MS = 1000;

  function startDrag(event) {
    if (event.button && event.button !== 0) return;
    if (event.target.closest("button, a, input, textarea, select")) return;
    const rect = container.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      hasMoved: false,
    };
    container.classList.add("cursor-grabbing");
    container.classList.remove("cursor-grab");
    container.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", handleDrag);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    event.preventDefault();
  }

  function handleDrag(event) {
    if (!dragState || (event.pointerId !== undefined && event.pointerId !== dragState.pointerId)) {
      return;
    }
    if (!dragState.hasMoved) {
      container.style.right = "auto";
      container.style.bottom = "auto";
      dragState.hasMoved = true;
    }
    const maxLeft = Math.max(EDGE_PADDING, window.innerWidth - dragState.width - EDGE_PADDING);
    const maxTop = Math.max(EDGE_PADDING, window.innerHeight - dragState.height - EDGE_PADDING);
    const nextLeft = clamp(event.clientX - dragState.offsetX, EDGE_PADDING, maxLeft);
    const nextTop = clamp(event.clientY - dragState.offsetY, EDGE_PADDING, maxTop);
    container.style.left = `${nextLeft}px`;
    container.style.top = `${nextTop}px`;
  }

  function stopDrag(event) {
    if (!dragState || (event.pointerId !== undefined && event.pointerId !== dragState.pointerId)) {
      return;
    }
    window.removeEventListener("pointermove", handleDrag);
    window.removeEventListener("pointerup", stopDrag);
    window.removeEventListener("pointercancel", stopDrag);
    container.classList.remove("cursor-grabbing");
    container.classList.add("cursor-grab");
    if (dragState.pointerId != null) {
      container.releasePointerCapture?.(dragState.pointerId);
    }
    if (dragState.hasMoved) {
      const left = Number.parseFloat(container.style.left);
      const top = Number.parseFloat(container.style.top);
      if (Number.isFinite(left) && Number.isFinite(top)) {
        saveOverlayPosition(left, top);
        ensureWithinViewport();
      }
    }
    dragState = null;
  }

  closeBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    persistOverlayPrefs({ hidden: true });
    applyHiddenState();
  });

  openPageBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.location.href = "/pages/pomodoro.html";
  });

  reopenBtn?.addEventListener("click", () => {
    persistOverlayPrefs({ hidden: false });
    applyHiddenState();
  });

  container.addEventListener("pointerdown", startDrag);

  const showState = (snapshot) => {
    const config = getPomodoroConfig(snapshot.mode);
    syncVisibility();

    const remaining =
      snapshot.status === "running" && snapshot.endTime
        ? Math.max(0, Math.round((snapshot.endTime - Date.now()) / 1000))
        : snapshot.remaining;

    const formattedTime = formatPomodoroSeconds(remaining);
    if (timerEl) {
      timerEl.textContent = formattedTime;
    }
    if (headerTimerEl) {
      headerTimerEl.textContent = formattedTime;
    }
    if (labelEl) {
      labelEl.textContent = config.label;
    }
    if (countEl) {
      countEl.textContent = snapshot.pomodoros || 0;
    }
    if (cycleEl) {
      cycleEl.textContent = snapshot.pomodoros || 0;
    }

    const safeDuration = snapshot.duration > 0 ? snapshot.duration : config.duration;
    const percent = 1 - remaining / safeDuration;
    const offset = MINI_CIRCUMFERENCE * Math.min(Math.max(percent, 0), 1);
    if (progressCircle) {
      progressCircle.style.strokeDasharray = MINI_CIRCUMFERENCE;
      progressCircle.style.strokeDashoffset = offset;
      progressCircle.style.stroke = config.color;
    }

    const statusLabel =
      snapshot.status === "ended"
        ? "Time’s up!"
        : snapshot.status === "paused"
          ? `${config.label} (paused)`
          : config.label;
    if (statusEl) {
      statusEl.textContent = statusLabel;
    }

    modeButtons.forEach((btn) => {
      const isActive = btn.dataset.miniMode === snapshot.mode;
      btn.classList.toggle("btn-primary", isActive);
      btn.classList.toggle("btn-outline", !isActive);
    });

    if (startBtn) {
      if (snapshot.status === "paused") {
        startBtn.textContent = "Resume";
      } else if (snapshot.status === "ended") {
        startBtn.textContent = "Start Next";
      } else {
        startBtn.textContent = "Start";
      }
    }

    if (pauseBtn) {
      pauseBtn.disabled = snapshot.status !== "running";
      pauseBtn.classList.toggle("opacity-60", pauseBtn.disabled);
    }

    const shouldDisableReset =
      snapshot.status === "idle" &&
      snapshot.remaining === config.duration &&
      !snapshot.pomodoros;
    if (resetBtn) {
      resetBtn.disabled = shouldDisableReset;
      resetBtn.classList.toggle("opacity-60", resetBtn.disabled);
    }
  };

  const scheduleAdvance = () => {
    if (completionTimeout) return;
    completionTimeout = setTimeout(() => {
      const latest = getPomodoroState();
      if (latest.status === "ended") {
        advancePomodoroCycle({ autoStart: true });
      }
      completionTimeout = null;
      sync();
    }, NEXT_START_DELAY_MS);
  };

  const sync = () => {
    const snapshot = getPomodoroState();
    if (snapshot.status === "ended") {
      if (!completionTimeout) {
        playPomodoroAlarm();
        scheduleAdvance();
      }
      showState(snapshot);
      return;
    }
    showState(snapshot);
  };

  startBtn?.addEventListener("click", () => {
    clearTimeout(completionTimeout);
    completionTimeout = null;
    syncVisibility();
    const snapshot = getPomodoroState();
    if (snapshot.status === "ended") {
      advancePomodoroCycle({ autoStart: true });
    } else {
      startPomodoroCountdown();
    }
    sync();
  });

  pauseBtn?.addEventListener("click", () => {
    clearTimeout(completionTimeout);
    completionTimeout = null;
    syncVisibility();
    pausePomodoroCountdown();
    sync();
  });

  resetBtn?.addEventListener("click", () => {
    clearTimeout(completionTimeout);
    completionTimeout = null;
    syncVisibility();
    resetPomodoroCountdown();
    sync();
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.miniMode;
      if (!mode) return;
      clearTimeout(completionTimeout);
      completionTimeout = null;
      syncVisibility();
      setPomodoroMode(mode);
      sync();
    });
  });

  window.addEventListener("resize", ensureWithinViewport);

  const interval = window.setInterval(sync, 1000);
  const storageHandler = () => sync();
  window.addEventListener("sl:pomodoro", storageHandler);
  window.addEventListener("beforeunload", () => {
    clearInterval(interval);
    clearTimeout(completionTimeout);
    window.removeEventListener("sl:pomodoro", storageHandler);
    window.removeEventListener("resize", ensureWithinViewport);
  });

  sync();
}

function fillFormWithProfile() {
  const profile = getProfile();
  const form = document.getElementById("profileSettingsForm");
  if (!form) return;
  form.querySelectorAll("input[name]").forEach((input) => {
    if (input.dataset.skipFill !== undefined) return;
    const name = input.name;
    input.value = profile[name] ?? "";
  });
  const panel = document.getElementById("profileSettingsPanel");
  const avatarSrc = profile.avatar || DEFAULT_AVATAR;
  panel
    ?.querySelectorAll("[data-profile-avatar-preview]")
    .forEach((img) => img.setAttribute("src", avatarSrc));
  const errorEl = form.querySelector("[data-avatar-error]");
  if (errorEl) {
    errorEl.classList.add("hidden");
    errorEl.textContent = "";
  }
  const fileInput = form.querySelector("[data-avatar-upload]");
  if (fileInput) {
    fileInput.value = "";
  }
}

function updateProfileViews(profile) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || `${DEFAULT_PROFILE.firstName} ${DEFAULT_PROFILE.lastName}`;
  const username = profile.username?.trim() || DEFAULT_PROFILE.username;
  const email = profile.email?.trim() || DEFAULT_PROFILE.email;
  const avatarSrc = profile.avatar || DEFAULT_AVATAR;

  document
    .querySelectorAll("[data-profile-name]")
    .forEach((el) => (el.textContent = displayName));
  document
    .querySelectorAll("[data-profile-username]")
    .forEach((el) => (el.textContent = username));
  document
    .querySelectorAll("[data-profile-email]")
    .forEach((el) => (el.textContent = email));
  document
    .querySelectorAll("img[data-profile-avatar]")
    .forEach((img) => img.setAttribute("src", avatarSrc));
}

function pulse(sel) {
  const el = document.querySelector(sel);
  el?.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.05)" },
      { transform: "scale(1)" },
    ],
    { duration: 400 }
  );
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
