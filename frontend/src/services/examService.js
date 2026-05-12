import api from "./api";

export async function getExams(params = {}) {
  const response = await api.get("/exams", { params });
  return response.data.exams;
}

export async function getExam(examId) {
  const response = await api.get(`/exams/${examId}`);
  return response.data.exam;
}

export async function createExam(examData) {
  const response = await api.post("/exams", examData);
  return response.data.exam;
}

export async function updateExam(examId, examData) {
  const response = await api.patch(`/exams/${examId}`, examData);
  return response.data.exam;
}

export async function publishExam(examId, scheduleData) {
  const response = await api.patch(`/exams/${examId}`, {
    status: "Active",
    start_at: scheduleData.startAt,
    end_at: scheduleData.endAt
  });
  return response.data.exam;
}

export async function archiveExam(examId) {
  const response = await api.patch(`/exams/${examId}`, { status: "Archived" });
  return response.data.exam;
}
