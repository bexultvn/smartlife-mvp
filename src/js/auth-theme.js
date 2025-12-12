import { syncNewYearTheme } from "/src/js/new-year-mode.js";

const THEME_STORAGE_KEY = "sl_theme_preference";
const DEFAULT_THEME = "light";
const THEME_OPTIONS = ["light", "dark"];

const isValidTheme = (value) => typeof value === "string" && THEME_OPTIONS.includes(value);

const detectSystemTheme = () => {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch (error) {
    console.warn("Failed to detect system theme", error);
  }
  return DEFAULT_THEME;
};

const readStoredTheme = () => {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidTheme(value)) {
      return value;
    }
  } catch (error) {
    console.warn("Failed to read stored theme", error);
  }
  return null;
};

const getTheme = () => {
  const current = document.documentElement.getAttribute("data-theme");
  return isValidTheme(current) ? current : DEFAULT_THEME;
};

const setTheme = (theme, { persist = true } = {}) => {
  const next = isValidTheme(theme) ? theme : DEFAULT_THEME;
  const root = document.documentElement;
  root.setAttribute("data-theme", next);
  root.style.colorScheme = next === "dark" ? "dark" : "light";
  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      console.warn("Failed to persist theme", error);
    }
  }
  updateToggleButtons(next);
  syncNewYearTheme(next);
  return next;
};

const updateToggleButtons = (theme = getTheme()) => {
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
};

const handleThemeToggleClick = (event) => {
  event.preventDefault();
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
};

const handleThemeStorageChange = (event) => {
  if (event.key !== THEME_STORAGE_KEY) return;
  const next = isValidTheme(event.newValue) ? event.newValue : DEFAULT_THEME;
  setTheme(next, { persist: false });
};

export function applyStoredTheme() {
  const stored = readStoredTheme();
  const fallback = detectSystemTheme();
  setTheme(stored ?? fallback, { persist: false });
}

export function initAuthThemeToggle() {
  applyStoredTheme();
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", handleThemeToggleClick);
  });
  window.addEventListener("storage", handleThemeStorageChange);
  updateToggleButtons();
}
