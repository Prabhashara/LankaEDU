package com.onlineexam.audit;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.LinkedHashMap;
import java.util.Map;

public class AuditEvent {
  private String id;
  private String action;
  private String actorId;
  private String actorRole;
  private String actorEmail;
  private String entityType;
  private String entityId;
  private String message;

  @JsonProperty("created_at")
  private String createdAt;

  private Map<String, Object> metadata = new LinkedHashMap<>();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getAction() { return action; }
  public void setAction(String action) { this.action = action; }
  public String getActorId() { return actorId; }
  public void setActorId(String actorId) { this.actorId = actorId; }
  public String getActorRole() { return actorRole; }
  public void setActorRole(String actorRole) { this.actorRole = actorRole; }
  public String getActorEmail() { return actorEmail; }
  public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
  public String getEntityType() { return entityType; }
  public void setEntityType(String entityType) { this.entityType = entityType; }
  public String getEntityId() { return entityId; }
  public void setEntityId(String entityId) { this.entityId = entityId; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public String getCreatedAt() { return createdAt; }
  public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
  public Map<String, Object> getMetadata() { return metadata; }
  public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata == null ? new LinkedHashMap<>() : metadata; }
}
