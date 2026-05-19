package com.onlineexam.common;

public class MissingDatabaseConfigurationException extends IllegalStateException {
  public MissingDatabaseConfigurationException(String message) {
    super(message);
  }
}
