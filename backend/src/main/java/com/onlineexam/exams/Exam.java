package com.onlineexam.exams;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Exam {
  private String id;
  private String title;
  private String subject;
  private String description;
  private String status;

  @JsonProperty("created_by")
  private String createdBy;

  @JsonProperty("duration_mins")
  private double durationMinutes;

  @JsonProperty("pass_mark")
  private double passMark;

  @JsonProperty("start_at")
  private String startAt;

  @JsonProperty("end_at")
  private String endAt;

  @JsonProperty("created_at")
  private String createdAt;

  @JsonProperty("updated_at")
  private String updatedAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getSubject() {
    return subject;
  }

  public void setSubject(String subject) {
    this.subject = subject;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
  }

  public double getDurationMinutes() {
    return durationMinutes;
  }

  public void setDurationMinutes(double durationMinutes) {
    this.durationMinutes = durationMinutes;
  }

  public double getPassMark() {
    return passMark;
  }

  public void setPassMark(double passMark) {
    this.passMark = passMark;
  }

  public String getStartAt() {
    return startAt;
  }

  public void setStartAt(String startAt) {
    this.startAt = startAt;
  }

  public String getEndAt() {
    return endAt;
  }

  public void setEndAt(String endAt) {
    this.endAt = endAt;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String createdAt) {
    this.createdAt = createdAt;
  }

  public String getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(String updatedAt) {
    this.updatedAt = updatedAt;
  }
}
