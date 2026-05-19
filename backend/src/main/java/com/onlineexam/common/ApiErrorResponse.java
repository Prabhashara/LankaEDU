package com.onlineexam.common;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;

public final class ApiErrorResponse {
  private ApiErrorResponse() {
  }

  public static Map<String, Object> body(HttpStatus status, String message, HttpServletRequest request) {
    return body(status, message, request, null);
  }

  public static Map<String, Object> body(
    HttpStatus status,
    String message,
    HttpServletRequest request,
    Map<String, String> errors
  ) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("timestamp", Instant.now().toString());
    body.put("status", status.value());
    body.put("error", status.getReasonPhrase());
    body.put("message", message == null || message.isBlank() ? status.getReasonPhrase() : message);
    body.put("path", request == null ? "" : request.getRequestURI());
    body.put("requestId", UUID.randomUUID().toString());
    if (errors != null && !errors.isEmpty()) {
      body.put("errors", errors);
    }
    return body;
  }
}
