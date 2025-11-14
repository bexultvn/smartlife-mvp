import { login } from "/src/js/api/auth.js";
import { ApiError } from "/src/js/api/http-client.js";

const form = document.getElementById("loginForm");
const err = document.getElementById("loginError");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitter = e.submitter;

  err?.classList.add("hidden");
  if (err) {
    err.textContent = "Invalid username or password.";
  }

  const data = Object.fromEntries(new FormData(form));

  if (submitter) {
    submitter.disabled = true;
    submitter.dataset.loading = "true";
    submitter.classList.add("opacity-70", "cursor-not-allowed");
  }

  try {
    await login({
      username: data.username,
      password: data.password,
    });

    if (data.remember === "on") {
      localStorage.setItem("sl_remember", "1");
    } else {
      localStorage.removeItem("sl_remember");
    }

    window.location.href = "/pages/dashboard.html";
  } catch (error) {
    let message = "Unable to sign in. Please try again.";
    if (error instanceof ApiError && error.status !== 0) {
      message = error.message || message;
    }
    if (err) {
      err.textContent = message;
      err.classList.remove("hidden");
    }
  } finally {
    if (submitter) {
      submitter.disabled = false;
      delete submitter.dataset.loading;
      submitter.classList.remove("opacity-70", "cursor-not-allowed");
    }
  }
});
