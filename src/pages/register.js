import { register } from "/src/js/api/auth.js";
import { ApiError } from "/src/js/api/http-client.js";
import { DEFAULT_AVATAR } from "/src/js/profile-store.js";

const form = document.getElementById("registerForm");
const err = document.getElementById("regError");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  err.textContent = "";
  err.classList.add("hidden");

  const data = Object.fromEntries(new FormData(form));
  const username = (data.username || "").trim();
  const password = (data.password || "").trim();
  const confirm = (data.confirm || "").trim();

  if (!username) {
    err.textContent = "Username is required.";
    err.classList.remove("hidden");
    return;
  }

  if (!password) {
    err.textContent = "Password is required.";
    err.classList.remove("hidden");
    return;
  }

  if (password !== confirm) {
    err.textContent = "Passwords do not match.";
    err.classList.remove("hidden");
    return;
  }

  const submitter = e.submitter;
  if (submitter) {
    submitter.disabled = true;
    submitter.dataset.loading = "true";
    submitter.classList.add("opacity-70", "cursor-not-allowed");
  }

  try {
    await register({
      firstName: data.firstName,
      lastName: data.lastName,
      username,
      email: data.email,
      password,
      confirm: confirm,
      avatar: DEFAULT_AVATAR,
    });

    submitter?.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.05)" },
        { transform: "scale(1)" },
      ],
      { duration: 400 }
    );
    setTimeout(() => (window.location.href = "/pages/login.html"), 450);
  } catch (error) {
    let message = "Unable to complete registration. Please try again.";
    if (error instanceof ApiError) {
      message = error.message || message;
    }
    err.textContent = message;
    err.classList.remove("hidden");
  } finally {
    if (submitter) {
      submitter.disabled = false;
      delete submitter.dataset.loading;
      submitter.classList.remove("opacity-70", "cursor-not-allowed");
    }
  }
});
