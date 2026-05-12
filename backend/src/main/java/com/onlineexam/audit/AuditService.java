package com.onlineexam.audit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.JsonFileStore;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
  private static final int MAX_EVENTS_TO_KEEP = 1000;
  private final JsonFileStore<AuditEvent> store;

  public AuditService(ObjectMapper objectMapper) {
    this.store = new JsonFileStore<>(Path.of("src/data/audit.json"), objectMapper, new TypeReference<>() {});
  }

  public List<AuditEvent> listRecent(int limit) {
    int safeLimit = Math.max(1, Math.min(limit, 250));
    return store.readAll().stream()
      .sorted(Comparator.comparing(AuditEvent::getCreatedAt, Comparator.nullsLast(String::compareTo)).reversed())
      .limit(safeLimit)
      .toList();
  }

  public AuditEvent record(UserPrincipal actor, String action, String entityType, String entityId, String message) {
    return record(actor, action, entityType, entityId, message, Map.of());
  }

  public AuditEvent record(UserPrincipal actor, String action, String entityType, String entityId, String message, Map<String, Object> metadata) {
    AuditEvent event = new AuditEvent();
    event.setId(UUID.randomUUID().toString());
    event.setAction(action);
    event.setEntityType(entityType);
    event.setEntityId(entityId);
    event.setMessage(message);
    event.setCreatedAt(Instant.now().toString());
    event.setMetadata(new LinkedHashMap<>(metadata == null ? Map.of() : metadata));

    if (actor != null) {
      event.setActorId(actor.id());
      event.setActorRole(actor.role());
      event.setActorEmail(actor.email());
    }

    List<AuditEvent> events = new ArrayList<>(store.readAll());
    events.add(event);
    events = events.stream()
      .sorted(Comparator.comparing(AuditEvent::getCreatedAt, Comparator.nullsLast(String::compareTo)).reversed())
      .limit(MAX_EVENTS_TO_KEEP)
      .sorted(Comparator.comparing(AuditEvent::getCreatedAt, Comparator.nullsLast(String::compareTo)))
      .toList();
    store.writeAll(events);
    return event;
  }
}
