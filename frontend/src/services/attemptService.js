import api from "./api";

export async function createAttempt(examId) {
  const response = await api.post("/attempts", { exam_id: examId });
  return response.data;
}

export async function getAttempt(attemptId) {
  const response = await api.get(`/attempts/${attemptId}`);
  return response.data.attempt;
}

export async function saveAnswers(attemptId, answers) {
  const response = await api.patch(`/attempts/${attemptId}`, { answers });
  return response.data.attempt;
}

export async function submitAttempt(attemptId, answers) {
  const answersArray = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
    questionId,
    selectedOptionId
  }));
  const response = await api.post(`/attempts/${attemptId}/submit`, {
    answers: answersArray
  });
  return response.data;
}
