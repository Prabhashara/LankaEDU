import api from "./api";

export async function getQuestions(examId) {
  const response = await api.get("/questions", { params: { examId } });
  return Array.isArray(response.data?.questions) ? response.data.questions : [];
}

export async function getQuestionBank() {
  const response = await api.get("/questions/bank");
  return Array.isArray(response.data?.questions) ? response.data.questions : [];
}

export async function getQuestion(questionId) {
  const response = await api.get(`/questions/${questionId}`);
  return response.data.question;
}

export async function createQuestion(questionData) {
  const response = await api.post("/questions", questionData);
  return response.data.question;
}

export async function updateQuestion(questionId, questionData) {
  const response = await api.patch(`/questions/${questionId}`, questionData);
  return response.data.question;
}

export async function deleteQuestion(questionId) {
  const response = await api.delete(`/questions/${questionId}`);
  return response.data.question;
}

export async function reorderQuestions(examId, questionIds) {
  const response = await api.patch("/questions/reorder", {
    exam_id: examId,
    questionIds
  });
  return response.data.questions;
}

export async function addQuestionToExam(examId, questionId) {
  const response = await api.post(`/exams/${examId}/questions/${questionId}`);
  return response.data.question;
}
