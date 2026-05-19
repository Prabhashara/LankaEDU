package com.onlineexam.questions;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class Question {
  private String id;
  private String type;
  private double marks;
  private List<QuestionOption> options = new ArrayList<>();

  @JsonProperty("order_no")
  private int orderNo;

  @JsonProperty("exam_id")
  private String examId;

  @JsonProperty("question_text")
  private String questionText;
// jason property
  @JsonProperty("source_question_id")
  private String sourceQuestionId;

  @JsonProperty("created_by")
  private String createdBy;

  @JsonProperty("created_at")
  private String createdAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }
// getters
  public String getExamId() {
    return examId;
  }

  public void setExamId(String examId) {
    this.examId = examId;
  }

  public String getQuestionText() {
    return questionText;
  }

  public void setQuestionText(String questionText) {
    this.questionText = questionText;
  }

  public String getSourceQuestionId() {
    return sourceQuestionId;
  }
// setter
  public void setSourceQuestionId(String sourceQuestionId) {
    this.sourceQuestionId = sourceQuestionId;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public double getMarks() {
    return marks;
  }

  public void setMarks(double marks) {
    this.marks = marks;
  }

  public int getOrderNo() {
    return orderNo;
  }

  public void setOrderNo(int orderNo) {
    this.orderNo = orderNo;
  }

  public List<QuestionOption> getOptions() {
    return options;
  }

  public void setOptions(List<QuestionOption> options) {
    this.options = options;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String createdAt) {
    this.createdAt = createdAt;
  }
}
