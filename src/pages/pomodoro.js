import { renderLayout } from "/src/js/layout.js";
import {
  advancePomodoroCycle,
  formatSeconds,
  getModeConfig,
  getPomodoroState,
  markPomodoroEnded,
  pausePomodoroCountdown,
  resetPomodoroCountdown,
  setPomodoroMode,
  startPomodoroCountdown,
} from "/src/js/pomodoro-store.js";
import { playPomodoroAlarm } from "/src/js/pomodoro-alarm.js";



const content = `
<section class="card p-10 flex flex-col items-center text-center space-y-6">
  <div class="flex gap-3 justify-center">
    ${modeButton("focus", "Focus")}
    ${modeButton("short", "Short Break")}
    ${modeButton("long", "Long Break")}
  </div>

  <div class="relative">
    <svg id="circle" width="260" height="260">
      <circle cx="130" cy="130" r="120" stroke="#e5e7eb" stroke-width="14" fill="none"/>
      <circle id="progress" cx="130" cy="130" r="120"
        stroke="#3b82f6" stroke-width="14" stroke-linecap="round"
        fill="none" stroke-dasharray="753.6" stroke-dashoffset="0"
        style="transition: stroke-dashoffset 1s linear"/>
    </svg>
    <div class="absolute inset-0 grid place-items-center">
      <div>
        <div id="timer" class="text-6xl font-bold tabular-nums">25:00</div>
        <p id="status" class="text-gray-500 mt-2 text-sm">Focus Time</p>
      </div>
    </div>
  </div>

  <div class="flex gap-3">
    <button id="start" class="btn-primary">Start</button>
    <button id="pause" class="btn-outline">Pause</button>
    <button id="reset" class="btn-outline">Reset</button>
  </div>

  <div id="cycles" class="text-sm text-gray-500">Pomodoro: <span id="count">0</span>/4</div>
</section>
`;

renderLayout({ active: "pomodoro", content });

/* ---------- TIMER LOGIC ---------- */
const $ = (s) => document.querySelector(s);
const circle = $("#progress");
const circumference = 2 * Math.PI * 120;
const NEXT_START_DELAY_MS = 1000;

let timerInterval = null;
let completionTimeout = null;
let state = getPomodoroState();

applyState(state);
if (state.status === "running") {
  startTicking();
}

/* ---------- BUTTON EVENTS ---------- */
$("#start").addEventListener("click", () => {
  clearTimeout(completionTimeout);
  completionTimeout = null;
  const current = getPomodoroState();
  const next =
    current.status === "ended"
      ? advancePomodoroCycle({ autoStart: true })
      : startPomodoroCountdown();
  applyState(next);
  if (next.status === "running") {
    startTicking();
  }
});

$("#pause").addEventListener("click", () => {
  clearTimeout(completionTimeout);
  completionTimeout = null;
  const next = pausePomodoroCountdown();
  applyState(next);
  stopTicking();
});

$("#reset").addEventListener("click", () => {
  clearTimeout(completionTimeout);
  completionTimeout = null;
  const next = resetPomodoroCountdown();
  applyState(next);
  stopTicking();
});

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    clearTimeout(completionTimeout);
    completionTimeout = null;
    const next = setPomodoroMode(event.currentTarget.dataset.mode);
    applyState(next);
    stopTicking();
  });
});

window.addEventListener("sl:pomodoro", () => {
  const snapshot = getPomodoroState();
  applyState(snapshot);
  if (snapshot.status === "running") {
    startTicking();
  } else if (snapshot.status !== "ended") {
    stopTicking();
  }
});

/* ---------- HELPERS ---------- */
function applyState(next) {
  state = { ...next };
  const config = getModeConfig(state.mode);
  updateModeButtons(state.mode);
  updateCircleColor(config.color);
  updateTimerDisplay();
  updateStatusLabel(config.label);
  updatePomodoroCount(state.pomodoros || 0);
  updateControlLabels();
}

function updateTimerDisplay() {
  $("#timer").textContent = formatSeconds(state.remaining);
  const safeDuration = state.duration > 0 ? state.duration : 1;
  const percent = 1 - state.remaining / safeDuration;
  const offset = circumference * Math.min(Math.max(percent, 0), 1);
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
}

function updateStatusLabel(defaultLabel) {
  if (state.status === "ended") {
    $("#status").textContent = "Time’s up!";
    return;
  }
  if (state.status === "paused") {
    $("#status").textContent = `${defaultLabel} (paused)`;
    return;
  }
  $("#status").textContent = defaultLabel;
}

function updatePomodoroCount(count) {
  $("#count").textContent = count;
}

function updateCircleColor(color) {
  circle.style.stroke = color;
}

function updateModeButtons(activeMode) {
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    const isActive = btn.dataset.mode === activeMode;
    btn.classList.toggle("btn-primary", isActive);
    btn.classList.toggle("btn-outline", !isActive);
  });
}

function updateControlLabels() {
  const startBtn = $("#start");
  const pauseBtn = $("#pause");
  if (!startBtn || !pauseBtn) return;
  if (state.status === "paused") {
    startBtn.textContent = "Resume";
  } else if (state.status === "ended") {
    startBtn.textContent = "Start Next";
  } else {
    startBtn.textContent = "Start";
  }
  pauseBtn.disabled = state.status !== "running";
  pauseBtn.classList.toggle("opacity-60", pauseBtn.disabled);
}

function startTicking() {
  stopTicking();
  timerInterval = setInterval(handleTick, 1000);
}

function stopTicking() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleTick() {
  const snapshot = getPomodoroState();
  if (snapshot.status === "ended") {
    const ended = markPomodoroEnded();
    applyState(ended);
    handleCompletion();
    return;
  }

  applyState(snapshot);

  if (snapshot.status !== "running") {
    stopTicking();
  }
}

function handleCompletion() {
  stopTicking();
  clearTimeout(completionTimeout);
  playEndAnimation();
  playPomodoroAlarm();
  completionTimeout = setTimeout(() => {
    const next = advancePomodoroCycle({ autoStart: true });
    completionTimeout = null;
    applyState(next);
    if (next.status === "running") {
      startTicking();
    }
  }, NEXT_START_DELAY_MS);
}

function modeButton(id, label) {
  return `<button data-mode="${id}" class="btn btn-outline text-sm" id="${id}-btn">${label}</button>`;
}

/* ---------- SIMPLE END ANIMATION ---------- */
function playEndAnimation() {
  const svg = $("#circle");
  svg.animate(
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(1.1)", opacity: 0.8 },
      { transform: "scale(1)", opacity: 1 },
    ],
    { duration: 1200, iterations: 3 }
  );
}
