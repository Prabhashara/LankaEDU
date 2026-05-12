package com.onlineexam.exams;

public record PublicExam(
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
  String updatedAt
) {
  public static PublicExam from(Exam exam) {
    return new PublicExam(
      exam.getId(),
      exam.getTitle(),
      exam.getSubject(),
      exam.getDurationMinutes(),
      exam.getPassMark(),
      exam.getDescription(),
      exam.getStatus(),
      exam.getStartAt(),
      exam.getEndAt(),
      exam.getCreatedBy(),
      exam.getCreatedAt(),
      exam.getUpdatedAt()
    );
  }
}
