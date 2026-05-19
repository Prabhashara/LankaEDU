package com.onlineexam.questions;

import com.onlineexam.exams.PublicExam;
import java.util.List;

public record BankQuestion(
  String id,
  String examId,
  String examTitle,
  String subject,
  String questionText,
  String sourceQuestionId,
  String type,
  double marks,
  int orderNo,
  List<PublicQuestionOption> options,
  String createdBy,
  String createdAt
) {
  // final keyword
  public static BankQuestion from(Question question, PublicExam exam) {
    return new BankQuestion(
      question.getId(),
      question.getExamId(),
      exam.title(),
      exam.subject(),
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
