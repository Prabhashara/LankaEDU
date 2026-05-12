package com.onlineexam.attempts;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashMap;
import java.util.Map;

public class Attempt {
  private String id;
  private String status;

  @JsonProperty("exam_id")
  private String examId;

  @JsonProperty("student_id")
  private String studentId;

  @JsonProperty("created_at")
  private String createdAt;

  @JsonProperty("submitted_at")
  private String submittedAt;

  @JsonProperty("result_id")
  private String resultId;

  @JsonProperty("answers")
  private Map<String, String> answers = new HashMap<>();

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getExamId() {
    return examId;
  }

  public void setExamId(String examId) {
    this.examId = examId;
  }

  public String getStudentId() {
    return studentId;
  }

  public void setStudentId(String studentId) {
    this.studentId = studentId;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String createdAt) {
    this.createdAt = createdAt;
  }

  public String getSubmittedAt() {
    return submittedAt;
  }

  public void setSubmittedAt(String submittedAt) {
    this.submittedAt = submittedAt;
  }

  public String getResultId() {
    return resultId;
  }

  public void setResultId(String resultId) {
    this.resultId = resultId;
  }

  public Map<String, String> getAnswers() {
    return answers;
  }

  public void setAnswers(Map<String, String> answers) {
    this.answers = answers;
  }
}
