import api from "./api";

export async function getHomeSummary() {
  const response = await api.get("/public/home-summary");
  return response.data;
}
