package com.onlineexam.common;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
  @GetMapping("/api/health")
  public Map<String, Object> health() {
    Map<String, Object> health = new LinkedHashMap<>();
    health.put("status", "ok");
    health.put("service", "online-exam-backend");
    health.put("timestamp", Instant.now().toString());
    return health;
  }
}
