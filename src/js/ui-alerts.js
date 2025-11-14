let container = null;
let queue = [];
let activeCount = 0;
const MAX_ACTIVE = 3;
const DISPLAY_DURATION = 2600;
const EXIT_DURATION = 240;

export function showAlert({
  title = "Notice",
  message = "",
  type = "info",
  dismissible = true,
} = {}) {
  ensureContainer();
  const alert = document.createElement("div");
  alert.className =
    "pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border shadow-card bg-white will-change-transform transition transform translate-y-4 opacity-0";
  alert.dataset.alertType = type;

  const tone = getTone(type);

  alert.innerHTML = `
    <div class="p-4">
      <div class="flex items-start gap-3">
        <div class="mt-1 text-${tone.color}">${tone.icon}</div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-sm text-gray-900">${escapeHtml(title)}</h4>
          ${
            message
              ? `<p class="text-xs text-gray-500 mt-1 leading-relaxed">${escapeHtml(message)}</p>`
              : ""
          }
        </div>
        ${
          dismissible
            ? `<button class="text-gray-400 hover:text-gray-600 transition" data-close-alert aria-label="Dismiss">
                ${tone.close}
              </button>`
            : ""
        }
      </div>
    </div>
  `;

  alert.querySelector("[data-close-alert]")?.addEventListener("click", () => {
    scheduleRemove(alert);
  });

  queue.push(alert);
  processQueue();
}

function processQueue() {
  if (!container) return;

  while (activeCount < MAX_ACTIVE && queue.length) {
    const alert = queue.shift();
    container.appendChild(alert);
    requestAnimationFrame(() => {
      activeCount += 1;
      alert.style.transition = "transform 220ms ease, opacity 220ms ease";
      alert.style.opacity = "1";
      alert.style.transform = "translateY(0)";
    });

    setTimeout(() => scheduleRemove(alert), DISPLAY_DURATION);
  }
}

function scheduleRemove(alert) {
  alert.style.opacity = "0";
  alert.style.transform = "translateY(12px)";
  setTimeout(() => removeAlert(alert), EXIT_DURATION);
}

function removeAlert(alert) {
  if (!container?.contains(alert)) return;
  container.removeChild(alert);
  activeCount = Math.max(0, activeCount - 1);
  processQueue();
}

function ensureContainer() {
  if (container) return;
  container = document.createElement("div");
  container.id = "slAlerts";
  container.className =
    "pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4";
  document.body.appendChild(container);
}

function getTone(type) {
  switch (type) {
    case "success":
      return {
        color: "success-500",
        icon: iconSuccess,
        close: iconClose,
      };
    case "danger":
      return {
        color: "danger-500",
        icon: iconDanger,
        close: iconClose,
      };
    default:
      return {
        color: "accent-500",
        icon: iconInfo,
        close: iconClose,
      };
  }
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

const iconInfo = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
    <circle cx="12" cy="12" r="9.2" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M11.9 11.6v4.2"/>
    <circle cx="12" cy="8.5" r="0.6" fill="currentColor"/>
  </svg>`;

const iconSuccess = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
    <circle cx="12" cy="12" r="9.2" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.5l2.4 2.4 4.6-4.8"/>
  </svg>`;

const iconDanger = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4l7.1 12.3a1 1 0 0 1-.3 1.3 1.1 1.1 0 0 1-.6.2H5.8a1.1 1.1 0 0 1-1.1-1.1 1 1 0 0 1 .1-.4L12 4z" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9.5v3.2"/>
    <circle cx="12" cy="15.5" r="0.65" fill="currentColor"/>
  </svg>`;

const iconClose = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
    <path stroke-linecap="round" stroke-linejoin="round" d="M16 8L8 16m0-8 8 8"/>
  </svg>`;
