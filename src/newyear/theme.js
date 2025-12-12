const STYLESHEET_ID = "sl-newyear-style";
const STYLESHEET_HREF = "/styles/newyear.css";
const ROOT_CLASS = "newyear-mode";
const DATA_ATTR = "data-newyear-theme";

export function applyNewYearTheme(theme = "light") {
  if (typeof document === "undefined") return;
  ensureStylesheet();
  const root = document.documentElement;
  const body = document.body;
  const safeTheme = theme === "dark" ? "dark" : "light";
  root.classList.add(ROOT_CLASS);
  root.setAttribute(DATA_ATTR, safeTheme);
  body?.classList.add(ROOT_CLASS);
}

export function updateThemeToken(theme = "light") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const safeTheme = theme === "dark" ? "dark" : "light";
  root.setAttribute(DATA_ATTR, safeTheme);
}

export function resetNewYearTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove(ROOT_CLASS);
  root.removeAttribute(DATA_ATTR);
  body?.classList.remove(ROOT_CLASS);
  removeStylesheet();
}

export function ensureStylesheet() {
  if (typeof document === "undefined") return null;
  const existing = document.getElementById(STYLESHEET_ID);
  if (existing) return existing;
  const link = document.createElement("link");
  link.id = STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = STYLESHEET_HREF;
  link.media = "all";
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
  return link;
}

export function removeStylesheet() {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(STYLESHEET_ID);
  if (existing?.parentElement) {
    existing.parentElement.removeChild(existing);
  }
}

export function getSnowColor() {
  if (typeof document === "undefined") return "rgba(214, 236, 255, 0.8)";
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  const color = computed.getPropertyValue("--ny-snow-color")?.trim();
  if (color) return color;
  const theme = root.getAttribute("data-theme");
  return theme === "dark" ? "rgba(227, 246, 255, 0.85)" : "rgba(214, 236, 255, 0.85)";
}
