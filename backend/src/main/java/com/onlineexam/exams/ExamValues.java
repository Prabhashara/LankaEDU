package com.onlineexam.exams;

public record ExamValues(
  String title,
  String subject,
  double durationMinutes,
  double passMark,
  String description
) {
}
