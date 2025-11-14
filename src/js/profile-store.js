import defaultAvatarUrl from "/src/js/stores/image.png?url";
import { getActiveUser, updateSessionUser } from "/src/js/stores/session-store.js";

const LEGACY_PROFILE_KEY = "sl_profile";
const PROFILE_PREFIX = "sl_profile_";

export const DEFAULT_AVATAR = defaultAvatarUrl;

export const DEFAULT_PROFILE = {
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
  email: "johndoe@gmail.com",
  avatar: DEFAULT_AVATAR,
};

export function getProfile(username = getActiveUsername()) {
  const base = buildDefaultProfile(username);
  if (!username) {
    const legacy = readProfileFromStorage(LEGACY_PROFILE_KEY);
    return legacy ? { ...base, ...legacy } : base;
  }

  const stored = readProfileFromStorage(profileKey(username));
  if (stored) {
    return { ...base, ...stored };
  }

  // fallback to legacy profile if it exists (migration path)
  const legacy = readProfileFromStorage(LEGACY_PROFILE_KEY);
  if (legacy) {
    const migrated = { ...base, ...legacy, username };
    saveProfile(migrated, username);
    return migrated;
  }

  return base;
}

export function saveProfile(profile, username = getActiveUsername()) {
  const data = { ...profile };
  if (username) {
    data.username = username;
    localStorage.setItem(profileKey(username), JSON.stringify(data));
    const activeUser = getActiveUser();
    if (activeUser && activeUser.username === username) {
      updateSessionUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        avatar: data.avatar,
      });
    }
  } else {
    localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(data));
  }
}

export function ensureProfileForUser(user = {}) {
  const username = (user.username || "").trim();
  if (!username) return;

  const existing = readProfileFromStorage(profileKey(username)) || {};
  const serverAvatar = normalizeAvatar(user.avatar);
  const existingAvatar = normalizeAvatar(existing.avatar);
  const hasCustomAvatar =
    existingAvatar && existingAvatar !== normalizeAvatar(DEFAULT_AVATAR);
  const nextAvatar = hasCustomAvatar
    ? existingAvatar
    : serverAvatar || DEFAULT_AVATAR;

  if (user && Object.keys(user).length) {
    updateSessionUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: nextAvatar,
    });
  }

  const merged = {
    ...buildDefaultProfile(username),
    ...existing,
    avatar: nextAvatar,
  };

  if (user.firstName) merged.firstName = user.firstName;
  if (user.lastName) merged.lastName = user.lastName;
  if (user.email) merged.email = user.email;
  merged.username = username;

  saveProfile(merged, username);
}

function readProfileFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to parse profile from localStorage", err);
    return null;
  }
}

function profileKey(username) {
  return `${PROFILE_PREFIX}${username}`;
}

export function getActiveUsername() {
  const user = getActiveUser();
  return user?.username || null;
}

function buildDefaultProfile(username) {
  const activeUser = getActiveUser();
  const targetUsername = username || activeUser?.username || DEFAULT_PROFILE.username;
  const base = {
    ...DEFAULT_PROFILE,
    username: targetUsername,
  };

  if (activeUser && activeUser.username === targetUsername) {
    return {
      ...base,
      firstName: activeUser.firstName || base.firstName,
      lastName: activeUser.lastName || base.lastName,
      email: activeUser.email || base.email,
      avatar: activeUser.avatar || base.avatar,
    };
  }

  return base;
}

function normalizeAvatar(value) {
  return typeof value === "string" ? value.trim() : "";
}
