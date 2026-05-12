import api from "./api";

export async function getResult(resultId) {
  const response = await api.get(`/results/${resultId}`);
  return response.data.result;
}

export async function getResultDetail(resultOrAttemptId) {
  const response = await api.get(`/results/${resultOrAttemptId}`);
  return response.data;
}

export async function getResultByAttempt(attemptId) {
  const response = await api.get(`/results/attempt/${attemptId}`);
  return response.data.result;
}
