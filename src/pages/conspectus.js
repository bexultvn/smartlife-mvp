import { renderLayout, showConfirm } from "/src/js/layout.js";

/* ---------- localStorage demo ---------- */
const LS_DOCS = "sl_conspects";
const LS_FOLDERS = "sl_conspect_folders";
const LS_EDITOR_ZOOM = "sl_conspectus_zoom";
const ZOOM_DEFAULT = 1;
const ZOOM_MIN = 0.85;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
const uid = () => Math.random().toString(36).slice(2, 9);

function seedIfEmpty() {
  if (!localStorage.getItem(LS_DOCS)) {
    const demo = `Frontend development is about creating the visual part of websites and web apps — everything users see and interact with.
The three main technologies are HTML, CSS, and JavaScript.
HTML gives the page its structure — headings, paragraphs, buttons, images.
CSS adds colors, spacing, and design to make pages look professional.
JavaScript brings interactivity — animations, popups, form validation, and more.

To start learning, focus on:
• Understanding HTML and semantic structure
• Mastering CSS with Flexbox and Grid
• Learning JavaScript basics: variables, loops, and DOM`;
    const docs = [
      { id: uid(), title: "Consp 1", content: demo },
      { id: uid(), title: "Consp 2", content: "Your second conspectus…" },
      { id: uid(), title: "Consp 3", content: "Your third conspectus…" },
    ];
    localStorage.setItem(LS_DOCS, JSON.stringify(docs));
  }
  if (!localStorage.getItem(LS_FOLDERS)) {
    localStorage.setItem(
      LS_FOLDERS,
      JSON.stringify([
        { id: uid(), name: "Folder 1" },
        { id: uid(), name: "Folder 2" },
      ])
    );
  }
}
seedIfEmpty();

let docs = JSON.parse(localStorage.getItem(LS_DOCS) || "[]");
let folders = JSON.parse(localStorage.getItem(LS_FOLDERS) || "[]");
let activeId = docs[0]?.id || null;
let draggedDocId = null;
const uiState = {
  selectedFolderId: null,
  saveFolderId: folders[0]?.id || "",
  showFolderForm: folders.length === 0,
  isNew: docs.length === 0,
  saveFolderError: "",
  isFullscreen: false,
  editorDraft: null,
  editorZoom: loadEditorZoom(),
};

function clampZoom(value) {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return ZOOM_DEFAULT;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, numeric));
}

function loadEditorZoom() {
  if (typeof window === "undefined") return ZOOM_DEFAULT;
  try {
    const raw = window.localStorage.getItem(LS_EDITOR_ZOOM);
    if (!raw) return ZOOM_DEFAULT;
    return clampZoom(raw);
  } catch (error) {
    console.warn("Failed to read editor zoom", error);
    return ZOOM_DEFAULT;
  }
}

function saveEditorZoom(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_EDITOR_ZOOM, String(clampZoom(value)));
  } catch (error) {
    console.warn("Failed to save editor zoom", error);
  }
}

const iconTrash = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5h6m-7 4h8l-.7 9.1a2 2 0 0 1-2 1.9h-2.6a2 2 0 0 1-2-1.9L8 9Zm1-4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V5H9Z" />
</svg>`;

const iconMenu = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h8M8 12h8M10 18h4" />
</svg>`;

const iconUnlink = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.5 8.5 12 12m0 0-3.5 3.5M14 6h3a3 3 0 0 1 0 6h-1M10 18H7a3 3 0 0 1 0-6h1" />
</svg>`;

const iconFullscreenEnter = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9H5V5M19 5v4h-4M5 19h4v-4M15 15h4v4" />
</svg>`;

const iconFullscreenExit = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 4H5a1 1 0 0 0-1 1v4M19 5a1 1 0 0 0-1-1h-4M5 19a1 1 0 0 0 1 1h4M19 19v-4" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9 5 5m10 4 4-4M5 19l4-4m6 4 4-4" />
</svg>`;

const toolbar = `<h2 class="text-3xl font-semibold text-gray-900">Conspectus</h2>`;
render();

function render() {
  let activeDoc = activeId ? docs.find((d) => d.id === activeId) : null;

  if (!activeDoc && !uiState.isNew && docs[0]) {
    activeDoc = docs[0];
    activeId = docs[0].id;
    uiState.isNew = false;
  }

  const active = activeDoc ? { ...activeDoc } : { title: "", content: "" };
  const activeKey = activeDoc?.id ?? null;
  if (uiState.editorDraft && uiState.editorDraft.targetId === activeKey) {
    active.title = uiState.editorDraft.title;
    active.content = uiState.editorDraft.content;
  }

  if (uiState.selectedFolderId && !folders.find((f) => f.id === uiState.selectedFolderId)) {
    uiState.selectedFolderId = null;
  }

  const unassignedDocs = docs.filter((d) => !d.folderId);

  const zoom = clampZoom(uiState.editorZoom ?? ZOOM_DEFAULT);
  uiState.editorZoom = zoom;
  const zoomPercentLabel = `${Math.round(zoom * 100)}%`;
  const editorFontSize = `${(16 * zoom).toFixed(2)}px`;
  const editorLineHeight = Math.max(1.4, Math.min(2, 1.6 * zoom)).toFixed(2);

  const docList = unassignedDocs.length
    ? unassignedDocs
        .map((d) => docBtn(d, { active: d.id === activeId, inFolder: false }))
        .join("")
    : `<div class="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-gray-500 bg-white/60 text-center">
        No  conspects
      </div>`;

  const folderList = folders.length
    ? folders
        .map((folder) => folderBtn(folder, folder.id === uiState.selectedFolderId))
        .join("")
    : `<div class="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-gray-500 bg-white/60 text-center">
        No folders
      </div>`;

  if (uiState.saveFolderId && !folders.find((f) => f.id === uiState.saveFolderId)) {
    uiState.saveFolderId = folders[0]?.id || "";
  }

  const folderSelectControl = folders.length
    ? `<label class="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <span>Save into</span>
        <select id="saveFolderSelect" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          ${folders
            .map(
              (folder) =>
                `<option value="${folder.id}" ${folder.id === uiState.saveFolderId ? "selected" : ""}>
                  ${escapeHtml(folder.name)}
                </option>`
            )
            .join("")}
        </select>
      </label>`
    : `<p class="text-xs text-gray-500">Create a folder below to enable Save by.</p>`;

  const saveFolderError = uiState.saveFolderError
    ? `<p class="text-xs text-danger-500">${uiState.saveFolderError}</p>`
    : "";

  const cardClasses = uiState.isFullscreen
    ? "card flex h-full w-full flex-1 flex-col rounded-3xl p-6 md:p-8 shadow-soft border border-slate-100 bg-white"
    : "card rounded-3xl p-6 shadow-soft border border-slate-100 bg-white/90";

  const layoutClasses = uiState.isFullscreen
    ? "flex flex-1 flex-col gap-6"
    : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]";

  const editorSectionClasses = uiState.isFullscreen
    ? "rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 lg:p-7 flex flex-1 flex-col gap-4"
    : "rounded-3xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col gap-4";

  const editorTextareaClasses = uiState.isFullscreen
    ? "w-full flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-accent-500"
    : "w-full min-h-[360px] rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-accent-500";

  const fullscreenBtn = `<button type="button" id="toggleFullscreen" class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-gray-500 hover:text-accent-500 hover:border-accent-200 transition focus:outline-none focus:ring-2 focus:ring-accent-500/60 focus:ring-offset-1" title="${
    uiState.isFullscreen ? "Exit full screen" : "Full screen"
  }">
      ${uiState.isFullscreen ? iconFullscreenExit : iconFullscreenEnter}
    </button>`;

  const newDocBtn = `<button id="newDoc" type="button"
      class="inline-flex items-center gap-2 rounded-2xl bg-accent-500 px-5 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500">
      <span class="text-lg leading-none">+</span>
      <span>New Conspectus</span>
    </button>`;

  const asideMarkup = uiState.isFullscreen
    ? ""
    : `<aside class="grid gap-4">
        <section class="rounded-3xl border border-slate-200 p-4 bg-white shadow-soft">
          <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-400">Conspects</p>
            </div>
            <span class="text-sm text-gray-500">${unassignedDocs.length} items</span>
          </div>
          <div class="grid gap-3 max-h-[220px] overflow-y-auto pr-1" id="docsList" data-drop-root="true">
            ${docList}
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 p-4 bg-white shadow-soft">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-400">Folders</p>
            </div>
            <button id="toggleFolderForm" class="text-sm font-semibold text-accent-500 hover:underline">
              ${uiState.showFolderForm ? "Close" : "+ Create folder"}
            </button>
          </div>
          ${
            uiState.showFolderForm
              ? `<form id="folderForm" class="flex flex-col gap-2 mb-3">
                  <input id="folderName" class="field w-full" placeholder="Folder name" required />
                  <div class="flex gap-2">
                    <button class="btn-primary flex-1">Create</button>
                    <button type="button" id="cancelFolderForm" class="btn btn-outline flex-1">Cancel</button>
                  </div>
                </form>`
              : ""
          }
          <div class="grid gap-3 max-h-[220px] overflow-y-auto pr-1">
            ${folderList}
          </div>
        </section>
      </aside>`;

  const cardInner = `
    <section class="${cardClasses}">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div class="space-y-2">
          <input id="titleInput"
            value="${escapeHtml(active.title || "")}"
            placeholder="Conspectus name"
            class="w-full sm:w-72 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-500" />
        </div>
        <div class="flex items-center gap-3 ml-auto">
          ${fullscreenBtn}
          ${newDocBtn}
        </div>
      </div>

      <div class="${layoutClasses}">
        <section class="${editorSectionClasses}">
          <div class="flex flex-wrap items-center justify-end gap-3 mb-3 text-xs font-semibold text-gray-500">
            <button type="button" class="btn-outline h-9 w-9 rounded-full px-0 py-0 text-base" data-editor-zoom="out" title="Zoom out">-</button>
            <span data-editor-zoom-label>${zoomPercentLabel}</span>
            <button type="button" class="btn-outline h-9 w-9 rounded-full px-0 py-0 text-base" data-editor-zoom="in" title="Zoom in">+</button>
            <button type="button" class="btn-outline rounded-xl px-3 py-1.5" data-editor-zoom="reset" title="Reset zoom">Reset</button>
          </div>
          <textarea
            id="editor"
            class="${editorTextareaClasses}"
            spellcheck="false"
            style="font-size:${editorFontSize}; line-height:${editorLineHeight};"
          >${escapeHtml(active.content)}</textarea>

          <div class="flex flex-col gap-2 mt-4">
            <div class="flex flex-wrap items-center gap-3">
              <button id="save" class="btn-primary px-6">Save</button>
            </div>
          </div>
        </section>
        ${asideMarkup}
      </div>
    </section>`;

  const content = uiState.isFullscreen
    ? `
      <div class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"></div>
        <div class="relative flex h-full flex-col">
          <div class="flex-1 overflow-y-auto py-6 px-4 md:px-10 lg:px-16">
            <div class="flex h-full w-full flex-col">
              ${cardInner}
            </div>
          </div>
        </div>
      </div>`
    : cardInner;

  renderLayout({ active: "conspectus", toolbar, content });

  const titleInputEl = document.getElementById("titleInput");
  const editorEl = document.getElementById("editor");
  if (titleInputEl && editorEl) {
    const syncDraft = () => {
      uiState.editorDraft = {
        targetId: activeKey,
        title: titleInputEl.value,
        content: editorEl.value,
      };
    };
    syncDraft();
    titleInputEl.addEventListener("input", syncDraft);
    editorEl.addEventListener("input", syncDraft);

    const zoomLabelEl = document.querySelector("[data-editor-zoom-label]");
    const applyZoom = (value, { persist = false } = {}) => {
      const nextZoom = clampZoom(value);
      uiState.editorZoom = nextZoom;
      editorEl.style.fontSize = `${(16 * nextZoom).toFixed(2)}px`;
      const computedLineHeight = Math.max(1.4, Math.min(2, 1.6 * nextZoom));
      editorEl.style.lineHeight = computedLineHeight.toFixed(2);
      if (zoomLabelEl) {
        zoomLabelEl.textContent = `${Math.round(nextZoom * 100)}%`;
      }
      if (persist) {
        saveEditorZoom(nextZoom);
      }
    };

    applyZoom(uiState.editorZoom, { persist: false });

    document.querySelectorAll("[data-editor-zoom]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.editorZoom;
        let next = uiState.editorZoom ?? ZOOM_DEFAULT;
        if (action === "in") {
          next = clampZoom(next + ZOOM_STEP);
        } else if (action === "out") {
          next = clampZoom(next - ZOOM_STEP);
        } else if (action === "reset") {
          next = ZOOM_DEFAULT;
        } else {
          return;
        }
        if (Math.abs(next - uiState.editorZoom) < 0.0001) return;
        applyZoom(next, { persist: true });
      });
    });

    const handleZoomWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (Math.abs(event.deltaY) < 0.1 && Math.abs(event.deltaX) < 0.1) return;
      event.preventDefault();
      const direction = event.deltaY === 0 ? event.deltaX : event.deltaY;
      const next =
        direction < 0
          ? clampZoom((uiState.editorZoom ?? ZOOM_DEFAULT) + ZOOM_STEP)
          : clampZoom((uiState.editorZoom ?? ZOOM_DEFAULT) - ZOOM_STEP);
      if (Math.abs(next - uiState.editorZoom) < 0.0001) return;
      applyZoom(next, { persist: true });
    };

    editorEl.addEventListener("wheel", handleZoomWheel, { passive: false });
  }

  if (uiState.isFullscreen) {
    document.body.classList.add("overflow-hidden");
  } else {
    document.body.classList.remove("overflow-hidden");
  }

  // events
  document.querySelectorAll("[data-open]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      activeId = e.currentTarget.dataset.open;
      uiState.isNew = false;
      render();
    })
  );
  document.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.del;
      const doc = docs.find((d) => d.id === id);
      if (!doc) return;
      const confirmed = await showConfirm({
        title: "Delete conspectus",
        message: `Are you sure you want to remove "${doc.title || "Untitled"}"? This action cannot be undone.`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        tone: "danger",
      });
      if (!confirmed) return;
      docs = docs.filter((d) => d.id !== id);
      localStorage.setItem(LS_DOCS, JSON.stringify(docs));
      if (activeId === id) {
        if (docs.length) {
          activeId = docs[0].id;
          uiState.isNew = false;
        } else {
          resetComposer();
        }
      }
      render();
    })
  );
  document.getElementById("save")?.addEventListener("click", () => {
    const saved = saveActiveDoc();
    if (saved) {
      pulse("#save");
      uiState.isNew = false;
      uiState.editorDraft = {
        targetId: saved.id || null,
        title: saved.title,
        content: saved.content,
      };
      render();
      showToast("Conspectus saved");
    }
  });
  document.getElementById("toggleFullscreen")?.addEventListener("click", () => {
    uiState.isFullscreen = !uiState.isFullscreen;
    render();
  });
  document.getElementById("newDoc")?.addEventListener("click", () => {
    resetComposer();
    render();
  });
  document
    .querySelectorAll("[data-folder-select]")
    .forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.folderSelect;
        uiState.selectedFolderId =
          uiState.selectedFolderId === id ? null : id;
        render();
      })
    );
  document
    .querySelectorAll("[data-folder-del]")
    .forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        await deleteFolder(e.currentTarget.dataset.folderDel);
      })
    );
  document.getElementById("saveFolderSelect")?.addEventListener("change", (e) => {
    uiState.saveFolderId = e.target.value;
    uiState.saveFolderError = "";
  });
  document.getElementById("toggleFolderForm")?.addEventListener("click", () => {
    uiState.showFolderForm = !uiState.showFolderForm;
    render();
  });
  document.getElementById("cancelFolderForm")?.addEventListener("click", () => {
    uiState.showFolderForm = false;
    render();
  });
  document.getElementById("folderForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("folderName");
    if (!input?.value.trim()) return;
    const folder = createFolderRecord(input.value.trim());
    if (!folder) return;
    uiState.selectedFolderId = folder.id;
    uiState.saveFolderId = folder.id;
    uiState.showFolderForm = false;
    render();
  });

  initDragAndDrop();
}

/* ---------- helpers ---------- */
function docBtn(d, { active = false, inFolder = false } = {}) {
  const baseCls = active
    ? "bg-accent-500 text-white border-transparent shadow-soft"
    : "bg-white border-slate-200 text-gray-700 hover:border-blue-300";
  const sizeCls = inFolder ? "px-3 py-2 text-sm" : "px-4 py-3 text-sm";
  return `
    <div class="flex items-center gap-2" data-doc-row="${d.id}" draggable="true">
      <button type="button" data-open="${d.id}" class="flex-1 rounded-2xl border font-semibold text-left transition ${baseCls} ${sizeCls}">
        <span class="block truncate">${escapeHtml(d.title || "Untitled")}</span>
      </button>
      <button type="button" data-del="${d.id}" class="rounded-2xl border border-slate-200 p-2 text-gray-400 hover:text-red-500 hover:border-red-200 transition" title="Delete">
        ${iconTrash}
      </button>
    </div>`;
}

function folderBtn(f, active = false) {
  const folderDocs = docs.filter((d) => d.folderId === f.id);
  const count = folderDocs.length;
  const baseCls = active
    ? "bg-accent-500 text-white border-transparent shadow-soft"
    : "bg-white text-gray-700 hover:border-blue-300";
  const panel = active
    ? `<div class="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 space-y-2"
          data-folder-drop="${f.id}"
          data-folder-panel="${f.id}">
          ${
            folderDocs.length
              ? folderDocs
                  .map((doc) =>
                    docBtn(doc, { active: doc.id === activeId, inFolder: true })
                  )
                  .join("")
              : `<p class="text-xs text-gray-500 text-center py-4 border border-dashed border-slate-200 rounded-xl bg-white">No conspects in this folder yet.</p>`
          }
        </div>`
    : "";
  return `
    <div class="space-y-2" data-folder-row="${f.id}">
      <div class="flex items-center gap-2">
        <button type="button"
          data-folder-select="${f.id}"
          data-folder-drop="${f.id}"
          class="flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold flex items-center justify-between gap-3 transition ${baseCls}">
          <span class="truncate">${escapeHtml(f.name)}</span>
          <span class="inline-flex items-center gap-1 text-xs ${
            active ? "text-white/80" : "text-gray-400"
          }">
            ${iconMenu}
            <span>${count}</span>
          </span>
        </button>
        <button type="button" data-folder-del="${f.id}" class="rounded-2xl border border-slate-200 p-2 text-gray-400 hover:text-red-500 hover:border-red-200 transition" title="Delete folder">
          ${iconTrash}
        </button>
      </div>
      ${panel}
    </div>`;
}

function saveActiveDoc({ folderId } = {}) {
  const titleInput = document.getElementById("titleInput");
  const editor = document.getElementById("editor");
  if (!titleInput || !editor) return null;
  const requestedTitle = (titleInput.value || "").trim();
  const candidateTitle = requestedTitle || "Untitled";
  const ignoreId = activeId || null;
  const uniqueTitle = ensureUniqueDocTitle(candidateTitle, ignoreId);
  if (uniqueTitle !== candidateTitle) {
    titleInput.value = uniqueTitle;
    showToast(`Renamed to "${uniqueTitle}" to keep titles unique.`);
  }
  const content = editor.value;

  let doc = activeId ? docs.find((d) => d.id === activeId) : null;
  if (doc) {
    doc.title = uniqueTitle;
    doc.content = content;
  } else {
    doc = { id: uid(), title: uniqueTitle, content };
    docs.unshift(doc);
    activeId = doc.id;
  }

  if (folderId && !folders.find((f) => f.id === folderId)) {
    folderId = null;
  }

  if (folderId) {
    doc.folderId = folderId;
  }

  localStorage.setItem(LS_DOCS, JSON.stringify(docs));
  return doc;
}

function createFolderRecord(name) {
  const trimmed = name.trim();
  const uniqueName = ensureUniqueFolderName(trimmed);
  if (uniqueName !== trimmed) {
    showToast(`Renamed to "${uniqueName}" to keep folder names unique.`);
  }
  const folder = { id: uid(), name: uniqueName };
  folders.push(folder);
  localStorage.setItem(LS_FOLDERS, JSON.stringify(folders));
  return folder;
}

function ensureUniqueDocTitle(title, ignoreId = null) {
  const base = (title || "Untitled").trim() || "Untitled";
  const targetId = ignoreId || null;
  const seen = new Set(
    docs
      .filter((doc) => !targetId || doc.id !== targetId)
      .map((doc) => normalizeLabel(doc.title))
  );
  if (!seen.has(normalizeLabel(base))) {
    return base;
  }
  let counter = 2;
  let candidate = `${base} (${counter})`;
  while (seen.has(normalizeLabel(candidate))) {
    counter += 1;
    candidate = `${base} (${counter})`;
  }
  return candidate;
}

function ensureUniqueFolderName(name) {
  const base = (name || "Folder").trim() || "Folder";
  const seen = new Set(folders.map((folder) => normalizeLabel(folder.name)));
  if (!seen.has(normalizeLabel(base))) {
    return base;
  }
  let counter = 2;
  let candidate = `${base} (${counter})`;
  while (seen.has(normalizeLabel(candidate))) {
    counter += 1;
    candidate = `${base} (${counter})`;
  }
  return candidate;
}

function normalizeLabel(value) {
  return (value || "").trim().toLowerCase();
}

async function deleteFolder(id) {
  const folder = folders.find((f) => f.id === id);
  if (!folder) return;

  const confirmed = await showConfirm({
    title: "Delete folder",
    message: `Delete "${folder.name}" and all conspects inside? This action cannot be undone.`,
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    tone: "danger",
  });
  if (!confirmed) return;

  folders = folders.filter((f) => f.id !== id);

  
  const beforeCount = docs.length;
  docs = docs.filter((doc) => doc.folderId !== id);

 
  const deletedCount = beforeCount - docs.length;

  
  if (uiState.selectedFolderId === id) {
    uiState.selectedFolderId = null;
  }

  
  if (uiState.saveFolderId === id) {
    uiState.saveFolderId = folders[0]?.id || "";
  }

  localStorage.setItem(LS_FOLDERS, JSON.stringify(folders));
  localStorage.setItem(LS_DOCS, JSON.stringify(docs));

  
  if (!folders.length) {
    uiState.showFolderForm = true;
    uiState.saveFolderError = "";
  }

  render();
}


function assignDocToFolder(docId, folderId) {
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return;
  if (folderId && !folders.find((f) => f.id === folderId)) return;
  if (folderId) {
    doc.folderId = folderId;
  } else {
    delete doc.folderId;
  }
  localStorage.setItem(LS_DOCS, JSON.stringify(docs));
  draggedDocId = null;
  clearDropHighlights();
  render();
}

function resetComposer() {
  uiState.isNew = true;
  activeId = null;
  uiState.editorDraft = null;
}

function initDragAndDrop() {
  const docRows = document.querySelectorAll("[data-doc-row]");
  docRows.forEach((row) => {
    row.addEventListener("dragstart", (e) => {
      draggedDocId = row.dataset.docRow;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedDocId);
      row.classList.add("opacity-60");
    });
    row.addEventListener("dragend", () => {
      draggedDocId = null;
      row.classList.remove("opacity-60");
      clearDropHighlights();
    });
  });

  document.querySelectorAll("[data-folder-drop]").forEach((target) => {
    ["dragover", "dragenter"].forEach((evt) =>
      target.addEventListener(evt, (e) => {
        if (!draggedDocId) return;
        e.preventDefault();
        highlightDrop(target);
      })
    );
    target.addEventListener("dragleave", () => removeDropHighlight(target));
    target.addEventListener("drop", (e) => {
      if (!draggedDocId) return;
      e.preventDefault();
      assignDocToFolder(draggedDocId, target.dataset.folderDrop);
    });
  });

  document.querySelectorAll("[data-drop-root]").forEach((target) => {
    ["dragover", "dragenter"].forEach((evt) =>
      target.addEventListener(evt, (e) => {
        if (!draggedDocId) return;
        e.preventDefault();
        highlightDrop(target);
      })
    );
    target.addEventListener("dragleave", () => removeDropHighlight(target));
    target.addEventListener("drop", (e) => {
      if (!draggedDocId) return;
      e.preventDefault();
      assignDocToFolder(draggedDocId, null);
    });
  });
}

function highlightDrop(el) {
  el.classList.add("ring-2", "ring-accent-500", "ring-offset-2");
}

function removeDropHighlight(el) {
  el.classList.remove("ring-2", "ring-accent-500", "ring-offset-2");
}

function clearDropHighlights() {
  document
    .querySelectorAll("[data-folder-drop], [data-drop-root]")
    .forEach((el) => removeDropHighlight(el));
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

function showToast(message, { duration = 2600 } = {}) {
  const rootId = "toast-root";
  let container = document.getElementById(rootId);
  if (!container) {
    container = document.createElement("div");
    container.id = rootId;
    container.className = "fixed inset-x-0 top-4 z-[9999] flex justify-center px-4 pointer-events-none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className =
    "pointer-events-auto rounded-2xl bg-slate-900 text-white shadow-xl px-4 py-2 text-sm font-medium opacity-0 -translate-y-2 transition-all duration-150 ease-out";
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "-translate-y-2");
    toast.classList.add("opacity-100", "translate-y-0");
  });

  const timeout = setTimeout(() => {
    toast.classList.add("opacity-0", "-translate-y-2");
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.addEventListener(
      "transitionend",
      () => {
        toast.remove();
        if (!container.childElementCount) {
          container.remove();
        }
      },
      { once: true }
    );
  }, duration);

  toast.addEventListener("click", () => {
    clearTimeout(timeout);
    toast.classList.add("opacity-0", "-translate-y-2");
  });
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
