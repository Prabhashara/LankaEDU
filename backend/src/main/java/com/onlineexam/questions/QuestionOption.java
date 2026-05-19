package com.onlineexam.questions;
// questionOption

import com.fasterxml.jackson.annotation.JsonProperty;

public class QuestionOption {
  private String id;

  @JsonProperty("option_text")
  private String optionText;

  @JsonProperty("is_correct")
  private boolean correct;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getOptionText() {
    return optionText;
  }
  // setters

  public void setOptionText(String optionText) {
    this.optionText = optionText;
  }

  public boolean isCorrect() {
    return correct;
  }

  public void setCorrect(boolean correct) {
    this.correct = correct;
  }
}
