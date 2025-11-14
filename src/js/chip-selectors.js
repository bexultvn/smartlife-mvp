const PRIORITY_COLORS = {
  Extreme: "#ef4444",
  Moderate: "#3b82f6",
  Low: "#22c55e",
};

const STATUS_COLORS = {
  "Not Started": "#ef4444",
  "In Progress": "#3b82f6",
  Completed: "#22c55e",
};

const DEFAULT_COLOR = "#3b82f6";

export function priorityChip(value, selected = false) {
  const color = PRIORITY_COLORS[value] || DEFAULT_COLOR;
  return chipMarkup(value, color, selected);
}

export function statusChip(value, selected = false) {
  const color = STATUS_COLORS[value] || DEFAULT_COLOR;
  return chipMarkup(value, color, selected);
}

function chipMarkup(label, color, selected) {
  const style = selected
    ? ` style="border-color:${color};background:${color};color:#ffffff;"`
    : ` style="border-color:${color};color:${color};"`;
  return `<button type="button" class="inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm font-medium transition" data-chip-value="${label}" data-chip-color="${color}"${style}>${label}</button>`;
}

export function setupChipSelectors(root) {
  if (!root) return;
  const groups = root.querySelectorAll("[data-chip-group]");
  groups.forEach((group) => {
    const optionsEl = group.querySelector("[data-chip-options]");
    const hiddenInput = group.querySelector("[data-chip-input]");
    if (!optionsEl || !hiddenInput) return;

    const fallback =
      hiddenInput.defaultValue ||
      hiddenInput.value ||
      optionsEl.querySelector("[data-chip-value]")?.dataset.chipValue ||
      "";

    const applySelection = (value) => {
      const buttons = optionsEl.querySelectorAll("[data-chip-value]");
      let targetValue = value || fallback;
      if (!Array.from(buttons).some((btn) => btn.dataset.chipValue === targetValue)) {
        targetValue = fallback;
      }

      buttons.forEach((button) => {
        const color = button.dataset.chipColor || DEFAULT_COLOR;
        const isActive = button.dataset.chipValue === targetValue;
        button.style.borderColor = color;
        if (isActive) {
          button.style.backgroundColor = color;
          button.style.color = "#ffffff";
          button.classList.add("chip-active");
        } else {
          button.style.backgroundColor = "transparent";
          button.style.color = color;
          button.classList.remove("chip-active");
        }
      });

      hiddenInput.value = targetValue;
    };

    if (group.__applySelection) {
      group.__applySelection(hiddenInput.value || fallback);
      return;
    }

    group.__applySelection = applySelection;

    optionsEl.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-chip-value]");
      if (!trigger) return;
      event.preventDefault();
      const value = trigger.dataset.chipValue || fallback;
      group.__applySelection(value);
      hiddenInput.dispatchEvent(new Event("change", { bubbles: false }));
    });

    hiddenInput.addEventListener("change", () => {
      group.__applySelection(hiddenInput.value || fallback);
    });

    const form = group.closest("form");
    if (form) {
      form.addEventListener("reset", () => {
        requestAnimationFrame(() => {
          group.__applySelection(hiddenInput.defaultValue || fallback);
        });
      });
    }

    group.__applySelection(hiddenInput.value || fallback);
  });
}
