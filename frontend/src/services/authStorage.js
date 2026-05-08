const tokenKey = "onlineExam.jwt";
const roleKey = "onlineExam.role";
const userIdKey = "onlineExam.userId";

export function saveAuthSession({ token, role, userId }) {
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(roleKey, role);
  localStorage.setItem(userIdKey, userId);
}

export function clearAuthSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(roleKey);
  localStorage.removeItem(userIdKey);
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
