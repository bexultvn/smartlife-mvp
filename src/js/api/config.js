const DEFAULT_API_BASE_URL = "https://smartlife-backend-production.up.railway.app";
const CONFIG_KEY = "__sl_cached_api_config";

function normalizeBaseUrl(url) {
  if (!url) return "";
  try {
    const baseOrigin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const normalized = new URL(url, baseOrigin);
    return normalized.href.replace(/\/+$/, "");
  } catch (err) {
    console.warn("Invalid API base URL provided, falling back to default.", err);
    return DEFAULT_API_BASE_URL;
  }
}

function resolveConfig() {
  if (typeof window === "undefined") {
    return {
      baseUrl: DEFAULT_API_BASE_URL,
    };
  }

  if (!window[CONFIG_KEY]) {
    const envUrl = import.meta?.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
    window[CONFIG_KEY] = {
      baseUrl: normalizeBaseUrl(envUrl),
    };
  }

  return window[CONFIG_KEY];
}

export function getApiBaseUrl() {
  return resolveConfig().baseUrl;
}

export function isApiConfigured() {
  return Boolean(getApiBaseUrl());
}
