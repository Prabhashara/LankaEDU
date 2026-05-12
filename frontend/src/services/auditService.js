import api from "./api";

export async function getAuditEvents(limit = 100) {
  const response = await api.get("/audit", { params: { limit } });
  return response.data.events;
}
