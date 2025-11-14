"use strict";

import { getApiBaseUrl } from "/src/js/api/config.js";
import { getAuthToken, clearSession } from "/src/js/stores/session-store.js";

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path = "") {
  const base = getApiBaseUrl();
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function mergeHeaders(base = {}, extra = {}) {
  const headers = new Headers(base);
  Object.entries(extra).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    headers.set(key, value);
  });
  return headers;
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (err) {
      return null;
    }
  }
  if (contentType.startsWith("text/")) {
    return response.text();
  }
  return response.arrayBuffer();
}

export async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    auth = true,
    skipJson = false,
    signal,
  } = options;

  const url = buildUrl(path);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const payload =
    body === undefined || body === null || isFormData || skipJson
      ? body
      : JSON.stringify(body);

  const headerEntries = {
    Accept: "application/json",
    ...headers,
  };

  if (!isFormData && !skipJson && payload !== undefined && payload !== null) {
    headerEntries["Content-Type"] = headerEntries["Content-Type"] || "application/json";
  }

  if (auth !== false) {
    const token = getAuthToken();
    if (token) {
      headerEntries.Authorization = `Bearer ${token}`;
    }
  }

  const requestOptions = {
    method,
    headers: mergeHeaders({}, headerEntries),
    body: payload,
    signal,
  };

  try {
    const response = await fetch(url, requestOptions);
    const data = await parseBody(response);
    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
      }
      const message =
        (data && (data.message || data.error || data.detail)) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, { status: response.status, data });
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw err;
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Network request failed", { status: 0, data: null });
  }
}
