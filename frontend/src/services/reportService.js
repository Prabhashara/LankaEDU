import api from "./api";

export async function getExamReport(examId) {
  const response = await api.get(`/reports/exam/${examId}`);
  return response.data;
}

export async function getStudentReport(studentId) {
  const response = await api.get(`/reports/student/${studentId}`);
  return response.data;
}

export async function downloadResultPdf(attemptId) {
  const response = await api.get(`/reports/pdf/${attemptId}`, {
    responseType: "blob"
  });
  const disposition = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || `exam-result-${attemptId}.pdf`;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
