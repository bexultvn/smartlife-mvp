import { applyNewYearTheme, getSnowColor, resetNewYearTheme, updateThemeToken } from "./theme.js";
import { applyAvatarHats, clearAvatarHats } from "./avatarHat.js";
import { clearGarlands, hideGarlands, mountGarlands, showGarlands } from "./garlands.js";
import { destroySnow, hideSnow, mountSnow, setSnowColor, showSnow } from "./snow.js";

let enabled = false;

export function enableNewYear({ theme = "light" } = {}) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  applyNewYearTheme(resolvedTheme);
  applyAvatarHats();
  mountGarlands();
  mountSnow({ color: getSnowColor() });
  showGarlands();
  showSnow();
  enabled = true;
}

export function disableNewYear() {
  hideSnow();
  destroySnow();
  hideGarlands();
  clearGarlands();
  clearAvatarHats();
  resetNewYearTheme();
  enabled = false;
}

export function setSnowVisibility(show = true) {
  if (!enabled) return;
  if (show) {
    showSnow();
  } else {
    hideSnow();
  }
}

export function updateNewYearTheme(theme = "light") {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  updateThemeToken(resolvedTheme);
  setSnowColor(getSnowColor());
}
