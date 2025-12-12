const STORAGE_KEY = "newYearMode";
const TOGGLE_SELECTOR = "[data-newyear-toggle]";
const DEFAULT_ENABLED = true;

let isActive = null;
let modulePromise = null;
let moduleApi = null;
let listenersBound = false;

export function getNewYearMode() {
  if (typeof window === "undefined") return false;
  if (typeof isActive === "boolean") return isActive;
  return readStoredMode();
}

export function newYearToggleMarkup(enabled = getNewYearMode()) {
  const aria = enabled ? "Disable New Year mode" : "Enable New Year mode";
  return `
    <button type="button"
      class="pill bg-white border text-sm shadow-sm"
      data-newyear-toggle
      aria-pressed="${enabled}"
      aria-label="${aria}">
      <span aria-hidden="true">🎄</span>
      <span class="hidden sm:inline">New Year Mode</span>
    </button>
  `;
}

export function initNewYearMode() {
  if (typeof document === "undefined") return;
  bindToggleButtons();
  const initial = getNewYearMode();
  void applyNewYearMode(initial, { persist: false });

  if (listenersBound) return;
  listenersBound = true;
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange);
  }
}

export function toggleNewYearMode(nextValue) {
  const next = typeof nextValue === "boolean" ? nextValue : !getNewYearMode();
  return applyNewYearMode(next);
}

export async function applyNewYearMode(enabled, { persist = true } = {}) {
  if (typeof document === "undefined") return false;
  const next = Boolean(enabled);
  isActive = next;
  updateToggleButtons();

  if (next) {
    const api = await ensureModule();
    if (!isActive) return isActive;
    api?.enableNewYear?.({ theme: resolveBaseTheme() });
  } else if (moduleApi) {
    moduleApi.disableNewYear?.();
  }

  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch (error) {
      console.warn("Failed to store New Year mode", error);
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("sl:newyear", { detail: { enabled: next } }));
    } catch (error) {
      console.warn("Failed to dispatch New Year event", error);
    }
  }

  return next;
}

export function syncNewYearTheme(theme) {
  if (!getNewYearMode() || !moduleApi?.updateNewYearTheme) return;
  moduleApi.updateNewYearTheme(theme);
}

export function setSnowVisibility(show = true) {
  if (!moduleApi?.setSnowVisibility) return;
  moduleApi.setSnowVisibility(show);
}

function bindToggleButtons() {
  const buttons = document.querySelectorAll(TOGGLE_SELECTOR);
  buttons.forEach((btn) => {
    if (btn.dataset.nyBound) return;
    btn.dataset.nyBound = "true";
    btn.addEventListener("click", () => toggleNewYearMode());
  });
  updateToggleButtons();
}

function updateToggleButtons() {
  const enabled = getNewYearMode();
  document.querySelectorAll(TOGGLE_SELECTOR).forEach((btn) => {
    btn.setAttribute("aria-pressed", String(enabled));
    btn.setAttribute("aria-label", enabled ? "Disable New Year mode" : "Enable New Year mode");
  });
}

function readStoredMode() {
  if (typeof window === "undefined") return DEFAULT_ENABLED;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "on") return true;
    if (value === "off") return false;
  } catch (error) {
    console.warn("Unable to read New Year mode", error);
  }
  return DEFAULT_ENABLED;
}

function handleStorageChange(event) {
  if (event.key !== STORAGE_KEY) return;
  const next = event.newValue === "on";
  applyNewYearMode(next, { persist: false });
}

async function ensureModule() {
  if (moduleApi) return moduleApi;
  if (!modulePromise) {
    modulePromise = import("/src/newyear/index.js").catch((error) => {
      console.error("Failed to load New Year bundle", error);
      modulePromise = null;
      return null;
    });
  }
  moduleApi = await modulePromise;
  return moduleApi;
}

function resolveBaseTheme() {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme") || root.dataset.theme;
  return theme === "dark" ? "dark" : "light";
}
