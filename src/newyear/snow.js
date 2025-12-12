const SNOW_ID = "snow";
const CONFIG = { minFlakes: 80, maxFlakes: 150, minSize: 2, maxSize: 5 };

let canvas = null;
let ctx = null;
let flakes = [];
let frameId = null;
let snowColor = "rgba(214, 236, 255, 0.8)";
let viewWidth = 0;
let viewHeight = 0;

export function mountSnow({ color } = {}) {
  if (typeof document === "undefined") return;
  if (canvas?.isConnected) {
    snowColor = color || snowColor;
    showSnow();
    return;
  }
  snowColor = color || snowColor;
  canvas = document.createElement("canvas");
  canvas.id = SNOW_ID;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "1",
  });
  ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);
  handleResize();
  initFlakes();
  start();
  window.addEventListener("resize", handleResize);
}

export function showSnow() {
  if (canvas) {
    canvas.style.display = "block";
  }
}

export function hideSnow() {
  if (canvas) {
    canvas.style.display = "none";
  }
}

export function destroySnow() {
  stop();
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleResize);
  }
  if (canvas?.parentElement) {
    canvas.parentElement.removeChild(canvas);
  }
  canvas = null;
  ctx = null;
  flakes = [];
}

export function setSnowColor(color) {
  if (color) {
    snowColor = color;
  }
}

function start() {
  stop();
  frameId = window.requestAnimationFrame(renderFrame);
}

function stop() {
  if (frameId) {
    window.cancelAnimationFrame(frameId);
    frameId = null;
  }
}

function renderFrame() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, viewWidth, viewHeight);
  ctx.fillStyle = snowColor;
  flakes.forEach((flake) => {
    flake.y += flake.speedY;
    flake.x += Math.sin(flake.angle) * flake.sway;
    flake.angle += flake.swaySpeed;

    if (flake.y - flake.radius > viewHeight) {
      flake.y = -flake.radius;
      flake.x = Math.random() * viewWidth;
    }
    if (flake.x - flake.radius > viewWidth) flake.x = -flake.radius;
    if (flake.x + flake.radius < 0) flake.x = viewWidth + flake.radius;

    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  frameId = window.requestAnimationFrame(renderFrame);
}

function initFlakes() {
  const target = resolveFlakeCount();
  if (flakes.length > target) {
    flakes = flakes.slice(0, target);
  }
  while (flakes.length < target) {
    flakes.push(createFlake());
  }
}

function createFlake() {
  const radius = randomBetween(CONFIG.minSize, CONFIG.maxSize);
  const speedY = 0.35 + Math.random() * 0.9 + radius * 0.02;
  const sway = 0.6 + Math.random() * 1.6;
  const swaySpeed = 0.004 + Math.random() * 0.01;
  return {
    x: Math.random() * viewWidth,
    y: Math.random() * viewHeight,
    radius,
    speedY,
    sway,
    swaySpeed,
    angle: Math.random() * Math.PI * 2,
  };
}

function handleResize() {
  if (!canvas || !ctx || typeof window === "undefined") return;
  const dpr = window.devicePixelRatio || 1;
  viewWidth = window.innerWidth;
  viewHeight = window.innerHeight;
  canvas.width = Math.round(viewWidth * dpr);
  canvas.height = Math.round(viewHeight * dpr);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  initFlakes();
}

function resolveFlakeCount() {
  if (typeof window === "undefined") return CONFIG.minFlakes;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const base = 80 + Math.min(70, Math.round(viewWidth / 14));
  const count = reduceMotion ? CONFIG.minFlakes : base;
  return clamp(count, CONFIG.minFlakes, CONFIG.maxFlakes);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
