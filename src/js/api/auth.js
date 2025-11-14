import { apiFetch, ApiError } from "/src/js/api/http-client.js";
import { ensureProfileForUser } from "/src/js/profile-store.js";
import {
  clearSession,
  getSession,
  setSession,
  updateSessionUser,
} from "/src/js/stores/session-store.js";

const LOCAL_USERS_KEY = "sl_users";

function readLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to read local users", err);
    return [];
  }
}

function writeLocalUsers(list) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list));
}

function mapUserToSession(user, tokens = {}) {
  const payload = {
    accessToken: tokens.accessToken || null,
    refreshToken: tokens.refreshToken || null,
    user: {
      id: user.id,
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      avatar: user.avatar || "",
    },
  };
  const session = setSession(payload);
  ensureProfileForUser(session.user);
  return session;
}

function shouldFallback(err) {
  if (!err) return true;
  if (err instanceof ApiError && err.status === 0) return true;
  return false;
}

export async function login(credentials = {}) {
  const body = {
    username: credentials.username,
    password: credentials.password,
  };

  try {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      auth: false,
      body,
    });

    if (!response || !response.user) {
      throw new ApiError("Invalid login response from server", {
        status: 500,
        data: response,
      });
    }

    return mapUserToSession(response.user, {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  } catch (err) {
    if (!shouldFallback(err)) {
      throw err;
    }

    const users = readLocalUsers();
    const user = users.find(
      (item) =>
        item.username === body.username && item.password === body.password
    );

    if (!user) {
      throw new ApiError("Invalid username or password.", { status: 401 });
    }

    return mapUserToSession(user);
  }
}

export async function register(payload = {}) {
  const body = {
    username: payload.username,
    password: payload.password,
    confirmPassword: payload.confirm,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
  };

  try {
    return await apiFetch("/auth/register", {
      method: "POST",
      auth: false,
      body,
    });
  } catch (err) {
    if (!shouldFallback(err)) {
      throw err;
    }

    const users = readLocalUsers();
    const username = (payload.username || "").trim();
    const lower = username.toLowerCase();

    if (
      username &&
      users.some((item) => (item.username || "").toLowerCase() === lower)
    ) {
      throw new ApiError("Username is already taken.", { status: 409 });
    }

    const nextUser = {
      id: crypto.randomUUID?.() || Date.now().toString(36),
      firstName: payload.firstName || "",
      lastName: payload.lastName || "",
      username,
      email: payload.email || "",
      password: payload.password,
      avatar: payload.avatar,
    };

    users.push(nextUser);
    writeLocalUsers(users);

    return { user: nextUser, source: "local" };
  }
}

export async function fetchCurrentUser() {
  const session = getSession();
  if (!session?.accessToken) {
    return session?.user || null;
  }

  try {
    const response = await apiFetch("/auth/me", {
      method: "GET",
      auth: true,
    });
    if (response && response.username) {
      updateSessionUser(response);
      ensureProfileForUser(response);
    }
    return response;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearSession();
      return null;
    }
    throw err;
  }
}

export async function logout() {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      auth: true,
    });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status > 0) {
      throw err;
    }
  } finally {
    clearSession();
  }
}
