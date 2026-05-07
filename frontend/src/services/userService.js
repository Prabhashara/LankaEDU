import api from "./api";

export async function getUsers() {
  const response = await api.get("/users");
  return response.data.users;
}

export async function updateUserStatus(userId, isActive) {
  const response = await api.patch(`/users/${userId}/status`, { isActive });
  return response.data.user;
}

export async function deleteUser(userId) {
  const response = await api.delete(`/users/${userId}`);
  return response.data.user;
}
