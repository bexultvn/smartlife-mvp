const GARLAND_SRC = "/assets/newyear/garland.png";
const ORNAMENTS_SRC = "/assets/newyear/ornaments.png";
let garlands = [];

export function mountGarlands() {
  if (typeof document === "undefined" || !document.body) return;
  if (garlands.length) {
    showGarlands();
    return;
  }
  const header = document.querySelector("[data-main-header]") || document.querySelector("header");
  if (header) {
    const top = createGarlandStrip(GARLAND_SRC, "newyear-garland newyear-garland-top newyear-garland-anchored");
    header.prepend(top);
    garlands.push(top);
  }
  const footer = createGarlandStrip(ORNAMENTS_SRC, "newyear-garland newyear-garland-footer newyear-garland-fixed");
  document.body.appendChild(footer);
  garlands.push(footer);
}

export function showGarlands() {
  garlands.forEach((node) => {
    node.style.display = "flex";
  });
}

export function hideGarlands() {
  garlands.forEach((node) => {
    node.style.display = "none";
  });
}

export function clearGarlands() {
  garlands.forEach((node) => node.remove());
  garlands = [];
}

function createGarlandStrip(src, className) {
  const el = document.createElement("div");
  el.className = className;
  el.setAttribute("aria-hidden", "true");
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";
  el.appendChild(img);
  return el;
}
