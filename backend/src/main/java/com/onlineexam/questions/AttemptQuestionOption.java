package com.onlineexam.questions;

public record AttemptQuestionOption(String id, String optionText) {
  public static AttemptQuestionOption from(QuestionOption option) {
    return new AttemptQuestionOption(option.getId(), option.getOptionText());
  }
}
