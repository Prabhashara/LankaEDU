package com.onlineexam.results;

import com.fasterxml.jackson.annotation.JsonProperty;


public class ResultAnswer {

  /**
   * Unique ID of the question.
   */
  @JsonProperty("question_id")
  private String questionId;

  /**
   * ID of the option selected by the student.
   */
  @JsonProperty("selected_option_id")
  private String selectedOptionId;

  /**
   * Indicates whether the selected answer is correct.
   */
  @JsonProperty("is_correct")
  private boolean correct;

  /**
   * Marks awarded for this answer.
   */
  @JsonProperty("marks_awarded")
  private double marksAwarded;

  /**
   * Returns the question ID.
   *
   
   */
  public String getQuestionId() {
    return questionId;
  }

  /**
   * Sets the question ID.
   *
   * @param questionId question ID
   */
  public void setQuestionId(String questionId) {
    this.questionId = questionId;
  }

  /**
   * Returns the selected option ID.
   *
   * @return selected option ID
   */
  public String getSelectedOptionId() {
    return selectedOptionId;
  }

  /**
   * Sets the selected option ID.
   *
   * @param selectedOptionId selected option ID
   */
  public void setSelectedOptionId(String selectedOptionId) {
    this.selectedOptionId = selectedOptionId;
  }

  /**
   * Checks whether the answer is correct.
   *
   * @return true if correct, otherwise false
   */
  public boolean isCorrect() {
    return correct;
  }

  /**
   * Sets the correctness status.
   *
   * @param correct true if correct
   */
  public void setCorrect(boolean correct) {
    this.correct = correct;
  }

  /**
   * Returns the marks awarded for this answer.
   *
   * @return awarded marks
   */
  public double getMarksAwarded() {
    return marksAwarded;
  }

  /**
   * Sets the awarded marks.
   *
   * @param marksAwarded marks awarded
   */
  public void setMarksAwarded(double marksAwarded) {
    this.marksAwarded = marksAwarded;
  }
}
