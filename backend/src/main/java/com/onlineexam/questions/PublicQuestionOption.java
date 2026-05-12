package com.onlineexam.questions;

public record PublicQuestionOption(String id, String optionText, boolean isCorrect) {
  public static PublicQuestionOption from(QuestionOption option) {
    return new PublicQuestionOption(option.getId(), option.getOptionText(), option.isCorrect());
  }
}
