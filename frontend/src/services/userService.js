import api from "./api";

export async function getUsers() {
  const response = await api.get("/users");
  return response.data.users;
}

export async function createStaffUser(payload) {
  const response = await api.post("/users", payload);
  return response.data.user;
}

export async function updateUserStatus(userId, isActive) {
  const response = await api.patch(`/users/${userId}/status`, { isActive });
  return response.data.user;
}

export async function deleteUser(userId) {
  const response = await api.delete(`/users/${userId}`);
  return response.data.user;
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
