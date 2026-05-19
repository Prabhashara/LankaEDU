package com.onlineexam.questions;

import java.util.List;

public record QuestionValues(
  //add examid
  String examId,
  String questionText,
  String type,
  double marks,
  List<QuestionOption> options
) {
}
