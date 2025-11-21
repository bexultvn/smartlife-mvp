import { showAlert } from "/src/js/ui-alerts.js";

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

export function taskImagePickerTemplate(value = "", options = {}) {
  const {
    inputName = "coverImage",
    label = "Cover Image",
    hint = "Use a landscape image for best results.",
    previewClass = "task-cover-size-default",
    buttonLabel = "Choose Image",
  } = options;

  const safeValue = escapeHtml(value || "");
  const hasImage = Boolean(safeValue);
  const sizeClass = escapeHtml(previewClass);
  const removeIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" class="h-4 w-4">
      <path stroke-linecap="round" stroke-linejoin="round" d="m6 6 8 8M14 6l-8 8" />
    </svg>`;

  return `
    <div class="grid gap-2" data-task-image-root>
      <span class="text-sm font-medium" data-task-image-label>${escapeHtml(label)}</span>
      <div class="relative ${sizeClass}">
        <button type="button"
          class="group relative block h-full w-full overflow-hidden rounded-2xl ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition"
          data-task-image-trigger>
          <div class="task-cover-preview ${hasImage ? "has-image" : ""}" data-task-image-preview style="${
    hasImage ? `background-image:url('${safeValue}')` : ""
  }">
            ${
              hasImage
                ? ""
                : '<span class="text-xs text-gray-500" data-task-image-empty>No image selected</span>'
            }
          </div>
          <span class="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs uppercase tracking-wide opacity-0 transition group-hover:opacity-100">
            Change
          </span>
        </button>
        <button type="button"
          class="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75 ${
            hasImage ? "" : "hidden"
          }"
          data-task-image-clear aria-label="Remove image">
          ${removeIcon}
        </button>
      </div>
      <input type="file" accept="image/*" class="sr-only" data-task-image-input />
      <input type="hidden" name="${escapeHtml(inputName)}" value="${safeValue}" data-task-image-value />
    </div>
  `;
}

export function setupTaskImagePicker(root, initialValue = "") {
  if (!root) return;
  const fileInput = root.querySelector("[data-task-image-input]");
  const valueInput = root.querySelector("[data-task-image-value]");
  const preview = root.querySelector("[data-task-image-preview]");
  const trigger = root.querySelector("[data-task-image-trigger]");
  const clearBtn = root.querySelector("[data-task-image-clear]");

  const labels = root.querySelectorAll("[data-task-image-label]");
  if (labels.length > 1) {
    labels.forEach((label, index) => {
      if (index > 0) {
        label.remove();
      }
    });
  }

  if (!fileInput || !valueInput || !preview) return;

  const renderPreview = (src = "") => {
    const safeValue = src || "";
    valueInput.value = safeValue;
    valueInput.defaultValue = safeValue;
    valueInput.setAttribute("value", safeValue);
    if (safeValue) {
      preview.style.backgroundImage = `url('${safeValue}')`;
      preview.classList.add("has-image");
      preview.innerHTML = "";
      clearBtn?.classList.remove("hidden");
    } else {
      preview.style.backgroundImage = "";
      preview.classList.remove("has-image");
      preview.innerHTML =
        '<span class="text-xs text-gray-500" data-task-image-empty>No image selected</span>';
      clearBtn?.classList.add("hidden");
    }
  };

  if (!root.dataset.imagePickerInit) {
    root.dataset.imagePickerInit = "1";

    trigger?.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showAlert({
          title: "Unsupported file",
          message: "Please choose an image file.",
          type: "danger",
        });
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          renderPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });

    clearBtn?.addEventListener("click", () => {
      fileInput.value = "";
      renderPreview("");
    });
  }

  fileInput.value = "";
  renderPreview(initialValue);
}
