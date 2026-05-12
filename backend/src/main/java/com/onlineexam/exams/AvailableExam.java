package com.onlineexam.exams;

import com.onlineexam.attempts.Attempt;

public record AvailableExam(
  String id,
  String title,
  String subject,
  double durationMinutes,
  double passMark,
  String description,
  String status,
  String startAt,
  String endAt,
  String createdBy,
  String createdAt,
  String updatedAt,
  int questionCount,
  boolean attempted,
  String attemptId,
  String resultId
) {
  public static AvailableExam from(PublicExam exam, int questionCount, Attempt attempt) {
    boolean attempted = attempt != null;
    return new AvailableExam(
      exam.id(),
      exam.title(),
      exam.subject(),
      exam.durationMinutes(),
      exam.passMark(),
      exam.description(),
      exam.status(),
      exam.startAt(),
      exam.endAt(),
      exam.createdBy(),
      exam.createdAt(),
      exam.updatedAt(),
      questionCount,
      attempted,
      attempted ? attempt.getId() : "",
      attempted && attempt.getResultId() != null ? attempt.getResultId() : ""
    );
  }
}
