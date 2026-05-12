package com.onlineexam.results;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ResultAnswer {
  @JsonProperty("question_id")
  private String questionId;

  @JsonProperty("selected_option_id")
  private String selectedOptionId;

  @JsonProperty("is_correct")
  private boolean correct;

  @JsonProperty("marks_awarded")
  private double marksAwarded;

  public String getQuestionId() {
    return questionId;
  }

  public void setQuestionId(String questionId) {
    this.questionId = questionId;
  }

  public String getSelectedOptionId() {
    return selectedOptionId;
  }

  public void setSelectedOptionId(String selectedOptionId) {
    this.selectedOptionId = selectedOptionId;
  }

  public boolean isCorrect() {
    return correct;
  }

  public void setCorrect(boolean correct) {
    this.correct = correct;
  }

  public double getMarksAwarded() {
    return marksAwarded;
  }

  public void setMarksAwarded(double marksAwarded) {
    this.marksAwarded = marksAwarded;
  }
}
