package com.onlineexam.common;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, Object>> handleApiException(ApiException error) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("message", error.getMessage());
    if (error.getErrors() != null && !error.getErrors().isEmpty()) {
      body.put("errors", error.getErrors());
    }
    return ResponseEntity.status(error.getStatus()).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleException(Exception error) {
    error.printStackTrace();
    return ResponseEntity.status(500).body(Map.of("message", "Something went wrong"));
  }
}
