package com.onlineexam.results;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
// Result class represents the final result of a student's exam attempt

public class Result {
 // Unique identifier for the result
  
  private String id;
 
  // Grade received by the student
  private String grade;

  @JsonProperty("attempt_id")
  private String attemptId;

  @JsonProperty("student_id")
  private String studentId;

  @JsonProperty("exam_id")
  private String examId;

  @JsonProperty("total_score")
  private double totalScore;

  @JsonProperty("max_score")
  private double maxScore;

  private double percentage;

  @JsonProperty("is_passed")
  private boolean passed;

  @JsonProperty("published_at")
  private String publishedAt;
 
//List of answers submitted by the student for this result
  private List<ResultAnswer> answers = new ArrayList<>();
   // Returns the result ID

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getAttemptId() {
    return attemptId;
  }

  public void setAttemptId(String attemptId) {
    this.attemptId = attemptId;
  }

  public String getStudentId() {
    return studentId;
  }

  public void setStudentId(String studentId) {
    this.studentId = studentId;
  }

  public String getExamId() {
    return examId;
  }

  public void setExamId(String examId) {
    this.examId = examId;
  }

  public double getTotalScore() {
    return totalScore;
  }

  public void setTotalScore(double totalScore) {
    this.totalScore = totalScore;
  }

  public double getMaxScore() {
    return maxScore;
  }

  public void setMaxScore(double maxScore) {
    this.maxScore = maxScore;
  }

  public double getPercentage() {
    return percentage;
  }

  public void setPercentage(double percentage) {
    this.percentage = percentage;
  }

  public String getGrade() {
    return grade;
  }

  public void setGrade(String grade) {
    this.grade = grade;
  }

  public boolean isPassed() {
    return passed;
  }

  public void setPassed(boolean passed) {
    this.passed = passed;
  }

  public String getPublishedAt() {
    return publishedAt;
  }

  public void setPublishedAt(String publishedAt) {
    this.publishedAt = publishedAt;
  }

  public List<ResultAnswer> getAnswers() {
    return answers;
  }

  public void setAnswers(List<ResultAnswer> answers) {
    this.answers = answers;
  }
}
