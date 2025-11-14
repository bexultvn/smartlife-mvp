const AUTH_STORAGE_KEY = "sl_auth";
const SESSION_VERSION = 2;

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function normalizeLegacySession(payload) {
  if (!payload) return null;
  if (typeof payload.username === "string") {
    return {
      version: SESSION_VERSION,
      savedAt: Date.now(),
      accessToken: payload.accessToken || null,
      refreshToken: payload.refreshToken || null,
      user: {
        username: payload.username,
        firstName: payload.firstName || "",
        lastName: payload.lastName || "",
        email: payload.email || "",
        avatar: payload.avatar || "",
      },
    };
  }
  return null;
}

function normalizeSession(payload) {
  if (!payload || typeof payload !== "object") return null;

  if (!payload.version || payload.version < SESSION_VERSION) {
    const legacy = normalizeLegacySession(payload);
    if (legacy) return legacy;
  }

  if (!payload.user || typeof payload.user.username !== "string") {
    return null;
  }

  return {
    version: SESSION_VERSION,
    savedAt: Date.now(),
    accessToken: payload.accessToken || null,
    refreshToken: payload.refreshToken || null,
    user: {
      username: payload.user.username,
      firstName: payload.user.firstName || "",
      lastName: payload.user.lastName || "",
      email: payload.user.email || "",
      avatar: payload.user.avatar || "",
      id: payload.user.id,
    },
  };
}

export function getSession() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = normalizeSession(parsed);
    if (session && session !== parsed) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
    return session;
  } catch (err) {
    console.warn("Failed to read auth session", err);
    return null;
  }
}

export function setSession(session) {
  if (typeof localStorage === "undefined") return;
  const normalized = normalizeSession(session);
  if (!normalized) {
    throw new Error("Invalid session payload");
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function updateSessionUser(updates = {}) {
  const existing = getSession();
  if (!existing) return null;
  const next = clone(existing);
  next.user = { ...next.user, ...clone(updates) };
  return setSession(next);
}

export function clearSession() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthToken() {
  return getSession()?.accessToken || null;
}

export function getActiveUser() {
  return clone(getSession()?.user || null);
}
