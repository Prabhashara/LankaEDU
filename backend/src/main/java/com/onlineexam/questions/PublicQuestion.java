package com.onlineexam.questions;

import java.util.List;

public record PublicQuestion(
  //variable
  String id,
  String examId,
  String questionText,
  String sourceQuestionId,
  String type,
  double marks,
  int orderNo,
  List<PublicQuestionOption> options,
  String createdBy,
  String createdAt
) {
  public static PublicQuestion from(Question question) {
    return new PublicQuestion(
      question.getId(),
      question.getExamId(),
      question.getQuestionText(),
      question.getSourceQuestionId(),
      question.getType(),
      question.getMarks(),
      question.getOrderNo(),
      question.getOptions().stream().map(PublicQuestionOption::from).toList(),
      question.getCreatedBy(),
      question.getCreatedAt()
    );
  }
}
