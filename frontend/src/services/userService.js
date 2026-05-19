import api from "./api";

export async function getUsers() {
  const response = await api.get("/users");
  const users = Array.isArray(response.data?.users) ? response.data.users : Array.isArray(response.data) ? response.data : [];
  return users.map(normalizeUser).filter(user => user.id);
}

export async function createStaffUser(payload) {
  const response = await api.post("/users", payload);
  return normalizeUser(response.data?.user);
}

export async function updateUserStatus(userId, isActive) {
  const response = await api.patch(`/users/${userId}/status`, { isActive });
  return normalizeUser(response.data?.user);
}

export async function deleteUser(userId) {
  const response = await api.delete(`/users/${userId}`);
  return normalizeUser(response.data?.user);
}

export async function updateProfile(name, email) {
  const response = await api.patch("/auth/profile", { name, email });
  return response.data;
}

export async function changePassword(currentPassword, newPassword, confirmPassword) {
  const response = await api.patch("/auth/profile/password", {
    currentPassword,
    newPassword,
    confirmPassword
  });
  return response.data;
}

function normalizeUser(user = {}) {
  const status = text(user.status).toLowerCase();
  const isActive = typeof user.isActive === "boolean"
    ? user.isActive
    : typeof user.is_active === "boolean"
      ? user.is_active
      : status ? status === "active" : true;

  return {
    id: text(user.id),
    name: text(user.name) || "Unnamed user",
    email: text(user.email).toLowerCase(),
    role: text(user.role).toLowerCase(),
    status: isActive ? "Active" : "Inactive",
    isActive
  };
}

function text(value) {
  return value == null ? "" : String(value).trim();
}
