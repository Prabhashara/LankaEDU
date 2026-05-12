const tokenKey = "onlineExam.jwt";
const roleKey = "onlineExam.role";
const userIdKey = "onlineExam.userId";
const userKey = "onlineExam.user";
const profilesKey = "onlineExam.profiles";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeProfile({ user = {}, role, userId, lastUsedAt } = {}) {
  const id = text(user.id || userId);
  if (!id) return null;

  const email = text(user.email).toLowerCase();
  const normalizedRole = text(user.role || role).toLowerCase();
  const name = text(user.name || user.displayName) || (email ? email.split("@")[0] : "LankaEdu profile");

  return {
    id,
    name,
    email,
    role: normalizedRole,
    studentId: text(user.studentId || user.student_id),
    avatarColor: text(user.avatarColor),
    lastUsedAt: lastUsedAt || new Date().toISOString()
  };
}

function saveProfile(profile) {
  if (!profile?.id) return;
  const profiles = getSavedProfiles();
  const nextProfiles = [
    profile,
    ...profiles.filter((item) => item.id !== profile.id)
  ].slice(0, 8);
  writeJson(profilesKey, nextProfiles);
}

export function saveAuthSession({ token, role, userId, user }) {
  const profile = normalizeProfile({ user, role, userId });
  const existingProfile = profile ? getSavedProfiles().find((item) => item.id === profile.id) : null;
  const sessionProfile = profile && existingProfile
    ? {
        ...profile,
        name: existingProfile.name || profile.name,
        avatarColor: existingProfile.avatarColor || profile.avatarColor
      }
    : profile;
  const sessionRole = sessionProfile?.role || text(role).toLowerCase();
  const sessionUserId = sessionProfile?.id || text(userId);

  if (token) localStorage.setItem(tokenKey, token);
  if (sessionRole) localStorage.setItem(roleKey, sessionRole);
  if (sessionUserId) localStorage.setItem(userIdKey, sessionUserId);
  if (sessionProfile) {
    writeJson(userKey, sessionProfile);
    saveProfile(sessionProfile);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(roleKey);
  localStorage.removeItem(userIdKey);
  localStorage.removeItem(userKey);
}

export function getAuthToken() {
  return localStorage.getItem(tokenKey);
}

export function getStoredRole() {
  return localStorage.getItem(roleKey);
}

export function getStoredUserId() {
  return localStorage.getItem(userIdKey);
}

export function getStoredUser() {
  const savedUser = readJson(userKey, null);
  if (savedUser?.id) return savedUser;

  return normalizeProfile({
    role: getStoredRole(),
    userId: getStoredUserId()
  });
}

export function getSavedProfiles() {
  const profiles = readJson(profilesKey, []);
  if (!Array.isArray(profiles)) return [];

  return profiles
    .map((profile) => normalizeProfile({
      user: profile,
      role: profile.role,
      userId: profile.id,
      lastUsedAt: profile.lastUsedAt
    }))
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.lastUsedAt || 0) - Date.parse(a.lastUsedAt || 0));
}

export function updateStoredUserProfile(updates) {
  const currentUser = getStoredUser();
  if (!currentUser) return null;

  const nextUser = {
    ...currentUser,
    ...updates,
    id: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
    lastUsedAt: currentUser.lastUsedAt || new Date().toISOString()
  };

  writeJson(userKey, nextUser);
  saveProfile(nextUser);
  return nextUser;
}

export function forgetSavedProfile(profileId) {
  const id = text(profileId);
  const nextProfiles = getSavedProfiles().filter((profile) => profile.id !== id);
  writeJson(profilesKey, nextProfiles);
  return nextProfiles;
}
