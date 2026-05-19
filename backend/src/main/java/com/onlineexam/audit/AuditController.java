package com.onlineexam.audit;

import com.onlineexam.auth.AuthSupport;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
public class AuditController {
  private final AuditService auditService;

  public AuditController(AuditService auditService) {
    this.auditService = auditService;
  }

  @GetMapping
  public Map<String, Object> list(HttpServletRequest request, @RequestParam(value = "limit", required = false) Integer limit) {
    AuthSupport.requireRole(request, "admin");
    return Map.of("events", auditService.listRecent(limit == null ? 100 : limit));
  }
}
