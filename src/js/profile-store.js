// src/js/profile-store.js
import defaultAvatarUrl from "/src/js/stores/image.png?url";
import { getActiveUser, updateSessionUser } from "/src/js/stores/session-store.js";
import { apiFetch, ApiError } from "/src/js/api/http-client.js";

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

function cacheProfileLocally(profile) {
    const username = profile.username?.trim();
    if (!username) {
        localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(profile));
    } else {
        localStorage.setItem(`${PROFILE_PREFIX}${username}`, JSON.stringify(profile));
        // Удаляем старый кэш, если username поменялся
        const oldKey = `${PROFILE_PREFIX}${getActiveUsername()}`;
        if (oldKey !== `${PROFILE_PREFIX}${username}`) {
            localStorage.removeItem(oldKey);
        }
    }
}

function readProfileFromStorage(username) {
    if (!username) {
        const legacy = localStorage.getItem(LEGACY_PROFILE_KEY);
        return legacy ? JSON.parse(legacy) : null;
    }
    const key = `${PROFILE_PREFIX}${username}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
}

// ГЛАВНОЕ ИЗМЕНЕНИЕ: больше НЕ перезаписываем username старым значением
export async function saveProfile(profile) {
    const data = { ...profile };
    // УДАЛИЛИ эту строку → data.username = getActiveUsername();

    try {
        const updatedFromServer = await apiFetch("/auth/me", {
            method: "PUT",
            body: data,
        });

        const newUsername = updatedFromServer.username?.trim();

        // Кэшируем под НОВЫМ username
        cacheProfileLocally(updatedFromServer);

        // Обновляем сессию — включая новый username!
        updateSessionUser({
            username: newUsername,
            firstName: updatedFromServer.firstName,
            lastName: updatedFromServer.lastName,
            email: updatedFromServer.email,
            avatar: normalizeAvatar(updatedFromServer.avatar),
        });

        return updatedFromServer;
    } catch (err) {
        console.error("Ошибка сохранения профиля", err);
        if (err instanceof ApiError && err.status === 0) {
            cacheProfileLocally(data); // оффлайн
        }
        throw err;
    }
}

// Чтение профиля — ищем по текущему username из сессии
export function getProfile() {
    const username = getActiveUser()?.username;
    const base = buildDefaultProfile();

    const stored = readProfileFromStorage(username) || readProfileFromStorage(null); // legacy fallback
    if (stored) {
        return { ...base, ...stored };
    }
    return base;
}

// Подтягиваем с сервера — используем актуальный username из ответа
export async function fetchProfileFromServer() {
    try {
        const serverProfile = await apiFetch("/auth/me", { method: "GET" });

        const normalized = {
            ...serverProfile,
            avatar: normalizeAvatar(serverProfile.avatar),
        };

        cacheProfileLocally(normalized);

        updateSessionUser({
            username: serverProfile.username,
            firstName: serverProfile.firstName,
            lastName: serverProfile.lastName,
            email: serverProfile.email,
            avatar: normalized.avatar,
        });

        return normalized;
    } catch (err) {
        console.warn("Не удалось загрузить профиль с сервера", err);
        return getProfile();
    }
}

// ensureProfileForUser теперь тоже не ломает username
export async function ensureProfileForUser(user = {}) {
    const serverUsername = user.username?.trim();
    if (!serverUsername) return;

    const existing = readProfileFromStorage(serverUsername) || {};
    const nextAvatar = existing.avatar && existing.avatar !== DEFAULT_AVATAR
        ? existing.avatar
        : normalizeAvatar(user.avatar) || DEFAULT_AVATAR;

    const merged = {
        ...buildDefaultProfile(),
        ...existing,
        username: serverUsername,        // берём из сервера
        firstName: user.firstName || existing.firstName,
        lastName: user.lastName || existing.lastName,
        email: user.email || existing.email,
        avatar: nextAvatar,
    };

    try {
        await saveProfile(merged);
    } catch {
        updateSessionUser({
            username: serverUsername,
            firstName: merged.firstName,
            lastName: merged.lastName,
            email: merged.email,
            avatar: merged.avatar,
        });
    }
}

// Вспомогательные
export function getActiveUsername() {
    return getActiveUser()?.username || null;
}

function buildDefaultProfile() {
    const user = getActiveUser();
    if (!user) return { ...DEFAULT_PROFILE };

    return {
        ...DEFAULT_PROFILE,
        username: user.username || DEFAULT_PROFILE.username,
        firstName: user.firstName || DEFAULT_PROFILE.firstName,
        lastName: user.lastName || DEFAULT_PROFILE.lastName,
        email: user.email || DEFAULT_PROFILE.email,
        avatar: user.avatar || DEFAULT_AVATAR,
    };
}

export function normalizeAvatar(value) {
    return typeof value === "string" ? value.trim() : "";
}