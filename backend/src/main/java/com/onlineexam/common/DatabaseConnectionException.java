package com.onlineexam.common;

public class DatabaseConnectionException extends IllegalStateException {
  public DatabaseConnectionException(String message, Throwable cause) {
    super(message, cause);
  }
}
