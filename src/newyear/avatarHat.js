const TARGET_SELECTOR = "[data-profile-avatar], [data-profile-avatar-preview]";
const WRAPPER_CLASS = "avatar-wrapper";
const WRAPPER_ACTIVE_CLASS = "newyear-avatar-wrapper";
const HAT_CLASS = "avatar-hat";
const HAT_ACTIVE_CLASS = "newyear-avatar-hat";
const HAT_SRC = "/assets/newyear/hat.png";

export function applyAvatarHats() {
  if (typeof document === "undefined") return;
  const targets = document.querySelectorAll(TARGET_SELECTOR);
  targets.forEach((img) => {
    if (!img) return;
    const wrapper = ensureWrapper(img);
    const hat = ensureHat(wrapper);
    hat.style.display = "block";
  });
}

export function clearAvatarHats() {
  if (typeof document === "undefined") return;
  document.querySelectorAll(`.${HAT_CLASS}`).forEach((hat) => {
    hat.removeAttribute("style");
    hat.classList.add("is-hidden");
    hat.remove();
  });
  document.querySelectorAll(`.${WRAPPER_ACTIVE_CLASS}`).forEach((wrapper) => {
    wrapper.classList.remove(WRAPPER_ACTIVE_CLASS);
  });
}

function ensureWrapper(img) {
  let wrapper = img.closest(`.${WRAPPER_CLASS}`);
  if (!wrapper) {
    wrapper = document.createElement("span");
    wrapper.className = `${WRAPPER_CLASS} ${WRAPPER_ACTIVE_CLASS}`;
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
  } else {
    wrapper.classList.add(WRAPPER_ACTIVE_CLASS);
  }
  return wrapper;
}

function ensureHat(wrapper) {
  let hat = wrapper.querySelector(`.${HAT_CLASS}`);
  if (!hat) {
    hat = document.createElement("img");
    hat.src = HAT_SRC;
    hat.alt = "";
    hat.loading = "lazy";
    hat.decoding = "async";
    hat.setAttribute("aria-hidden", "true");
    hat.className = `${HAT_CLASS} ${HAT_ACTIVE_CLASS}`;
    wrapper.appendChild(hat);
  }
  hat.classList.remove("is-hidden");
  return hat;
}
