import { getActiveUsername } from "/src/js/profile-store.js";

const POMODORO_STORAGE_PREFIX = "sl_pomodoro";

export const POMODORO_MODES = {
  focus: { id: "focus", label: "Focus Time", duration: 25 * 60, color: "#3b82f6" },
  short: { id: "short", label: "Short Break", duration: 5 * 60, color: "#22c55e" },
  long: { id: "long", label: "Long Break", duration: 15 * 60, color: "#a855f7" },
};

const DEFAULT_STATE = {
  status: "idle",
  mode: "focus",
  duration: POMODORO_MODES.focus.duration,
  remaining: POMODORO_MODES.focus.duration,
  endTime: null,
  pomodoros: 0,
  lastUpdated: Date.now(),
};

const EMIT_EVENT = "sl:pomodoro";

function emit(state) {
  try {
    window.dispatchEvent(new CustomEvent(EMIT_EVENT, { detail: state }));
  } catch (err) {
    // ignore if dispatch fails (e.g. SSR)
  }
}

export function getModeConfig(mode) {
  return POMODORO_MODES[mode] || POMODORO_MODES.focus;
}

function resolveStorageKey() {
  const username = (getActiveUsername() || "").trim();
  return username ? `${POMODORO_STORAGE_PREFIX}_${username}` : POMODORO_STORAGE_PREFIX;
}

export function getPomodoroState() {
  let state = { ...DEFAULT_STATE };
  const key = resolveStorageKey();

  try {
    let raw = localStorage.getItem(key);
    if (!raw && key !== POMODORO_STORAGE_PREFIX) {
      raw = localStorage.getItem(POMODORO_STORAGE_PREFIX);
      if (raw) {
        localStorage.setItem(key, raw);
        localStorage.removeItem(POMODORO_STORAGE_PREFIX);
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    }
  } catch (err) {
    console.warn("Failed to parse pomodoro state", err);
  }

  const config = getModeConfig(state.mode);
  if (!state.duration || state.duration <= 0) {
    state.duration = config.duration;
  }
  if (typeof state.remaining !== "number" || state.remaining < 0) {
    state.remaining = config.duration;
  }

  if (state.status === "running" && state.endTime) {
    const remaining = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
    state.remaining = remaining;
    if (remaining <= 0) {
      state.status = "ended";
      state.remaining = 0;
      state.endTime = null;
    }
  }

  return state;
}

export function savePomodoroState(state) {
  const next = { ...state, lastUpdated: Date.now() };
  const key = resolveStorageKey();
  localStorage.setItem(key, JSON.stringify(next));
  if (key !== POMODORO_STORAGE_PREFIX) {
    localStorage.removeItem(POMODORO_STORAGE_PREFIX);
  }
  emit(next);
  return next;
}

export function updatePomodoroState(updater) {
  const current = getPomodoroState();
  const next = updater(current);
  if (!next) return current;
  return savePomodoroState(next);
}

export function setPomodoroMode(mode) {
  const config = getModeConfig(mode);
  return updatePomodoroState((prev) => ({
    ...prev,
    mode,
    duration: config.duration,
    remaining: config.duration,
    status: "idle",
    endTime: null,
  }));
}

export function startPomodoroCountdown() {
  return updatePomodoroState((prev) => {
    const config = getModeConfig(prev.mode);
    const remaining = prev.remaining > 0 ? prev.remaining : config.duration;
    const now = Date.now();
    return {
      ...prev,
      duration: config.duration,
      remaining,
      status: "running",
      endTime: now + remaining * 1000,
    };
  });
}

export function pausePomodoroCountdown() {
  return updatePomodoroState((prev) => {
    if (prev.status !== "running" || !prev.endTime) return prev;
    const remaining = Math.max(0, Math.round((prev.endTime - Date.now()) / 1000));
    return {
      ...prev,
      status: "paused",
      remaining,
      endTime: null,
    };
  });
}

export function resetPomodoroCountdown() {
  return updatePomodoroState((prev) => {
    const config = getModeConfig(prev.mode);
    return {
      ...prev,
      status: "idle",
      duration: config.duration,
      remaining: config.duration,
      endTime: null,
    };
  });
}

export function markPomodoroEnded() {
  return updatePomodoroState((prev) => {
    if (prev.status !== "running") return prev;
    return {
      ...prev,
      status: "ended",
      remaining: 0,
      endTime: null,
    };
  });
}

export function advancePomodoroCycle({ autoStart = false } = {}) {
  return updatePomodoroState((prev) => {
    if (prev.status !== "ended") return prev;
    let pomodoros = prev.pomodoros || 0;
    let nextMode = prev.mode;

    if (prev.mode === "focus") {
      pomodoros += 1;
      nextMode = pomodoros % 4 === 0 ? "long" : "short";
    } else {
      nextMode = "focus";
    }

    const config = getModeConfig(nextMode);
    const base = {
      ...prev,
      mode: nextMode,
      pomodoros,
      duration: config.duration,
      remaining: config.duration,
      endTime: null,
      status: "idle",
    };

    if (autoStart) {
      const now = Date.now();
      base.status = "running";
      base.endTime = now + config.duration * 1000;
    }

    return base;
  });
}

export function clearPomodoroState() {
  const key = resolveStorageKey();
  localStorage.removeItem(key);
  if (key !== POMODORO_STORAGE_PREFIX) {
    localStorage.removeItem(POMODORO_STORAGE_PREFIX);
  }
  emit({ ...DEFAULT_STATE });
}

export function formatSeconds(totalSeconds = 0) {
  const value = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const seconds = String(value % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
