package com.onlineexam.common;

import java.util.Map;
import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
  private final HttpStatus status;
  private final Map<String, String> errors;

  public ApiException(HttpStatus status, String message) {
    this(status, message, null);
  }

  public ApiException(HttpStatus status, String message, Map<String, String> errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public Map<String, String> getErrors() {
    return errors;
  }
}
