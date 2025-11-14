import { apiFetch } from "/src/js/api/http-client.js";

export async function listTasks() {
  return apiFetch("/tasks", { method: "GET", auth: true });
}

export async function createTask(payload) {
  return apiFetch("/tasks", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function updateTask(id, payload) {
  return apiFetch(`/tasks/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function deleteTask(id) {
  return apiFetch(`/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}
