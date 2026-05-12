package com.onlineexam.questions;

import java.util.List;

public record AttemptQuestion(
  String id,
  String examId,
  String questionText,
  String type,
  double marks,
  int orderNo,
  List<AttemptQuestionOption> options
) {
  public static AttemptQuestion from(Question question) {
    return new AttemptQuestion(
      question.getId(),
      question.getExamId(),
      question.getQuestionText(),
      question.getType(),
      question.getMarks(),
      question.getOrderNo(),
      question.getOptions().stream().map(AttemptQuestionOption::from).toList()
    );
  }
}
