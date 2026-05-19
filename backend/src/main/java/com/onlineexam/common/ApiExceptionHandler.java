package com.onlineexam.common;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingPathVariableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {
  private static final Logger LOGGER = Logger.getLogger(ApiExceptionHandler.class.getName());

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, Object>> handleApiException(ApiException error, HttpServletRequest request) {
    return ResponseEntity
      .status(error.getStatus())
      .body(ApiErrorResponse.body(error.getStatus(), error.getMessage(), request, error.getErrors()));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, Object>> handleUnreadableBody(
    HttpMessageNotReadableException error,
    HttpServletRequest request
  ) {
    return badRequest("Request body is missing or malformed.", request);
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<Map<String, Object>> handleMissingParameter(
    MissingServletRequestParameterException error,
    HttpServletRequest request
  ) {
    return badRequest("Required request parameter is missing: " + error.getParameterName(), request);
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<Map<String, Object>> handleTypeMismatch(
    MethodArgumentTypeMismatchException error,
    HttpServletRequest request
  ) {
    return badRequest("Invalid value for request parameter: " + error.getName(), request);
  }

  @ExceptionHandler(MissingPathVariableException.class)
  public ResponseEntity<Map<String, Object>> handleMissingPathVariable(
    MissingPathVariableException error,
    HttpServletRequest request
  ) {
    return badRequest("Required path value is missing: " + error.getVariableName(), request);
  }

  @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
  public ResponseEntity<Map<String, Object>> handleNotFound(Exception error, HttpServletRequest request) {
    return ResponseEntity
      .status(HttpStatus.NOT_FOUND)
      .body(ApiErrorResponse.body(HttpStatus.NOT_FOUND, "Endpoint not found.", request));
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<Map<String, Object>> handleMethodNotSupported(
    HttpRequestMethodNotSupportedException error,
    HttpServletRequest request
  ) {
    return ResponseEntity
      .status(HttpStatus.METHOD_NOT_ALLOWED)
      .body(ApiErrorResponse.body(HttpStatus.METHOD_NOT_ALLOWED, "HTTP method is not supported for this endpoint.", request));
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<Map<String, Object>> handleMediaTypeNotSupported(
    HttpMediaTypeNotSupportedException error,
    HttpServletRequest request
  ) {
    return ResponseEntity
      .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
      .body(ApiErrorResponse.body(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Content type is not supported.", request));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(
    IllegalArgumentException error,
    HttpServletRequest request
  ) {
    return badRequest(error.getMessage(), request);
  }

  @ExceptionHandler(MissingDatabaseConfigurationException.class)
  public ResponseEntity<Map<String, Object>> handleMissingDatabaseConfiguration(
    MissingDatabaseConfigurationException error,
    HttpServletRequest request
  ) {
    LOGGER.warning(error.getMessage());
    return ResponseEntity
      .status(HttpStatus.SERVICE_UNAVAILABLE)
      .body(ApiErrorResponse.body(HttpStatus.SERVICE_UNAVAILABLE, error.getMessage(), request));
  }

  @ExceptionHandler(DatabaseConnectionException.class)
  public ResponseEntity<Map<String, Object>> handleDatabaseConnection(
    DatabaseConnectionException error,
    HttpServletRequest request
  ) {
    LOGGER.log(Level.SEVERE, "Database connection error", error);
    return ResponseEntity
      .status(HttpStatus.SERVICE_UNAVAILABLE)
      .body(ApiErrorResponse.body(HttpStatus.SERVICE_UNAVAILABLE, error.getMessage(), request));
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalState(
    IllegalStateException error,
    HttpServletRequest request
  ) {
    LOGGER.log(Level.SEVERE, "Application state error", error);
    return ResponseEntity
      .status(HttpStatus.SERVICE_UNAVAILABLE)
      .body(ApiErrorResponse.body(HttpStatus.SERVICE_UNAVAILABLE, "Service is temporarily unavailable.", request));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleException(Exception error, HttpServletRequest request) {
    LOGGER.log(Level.SEVERE, "Unhandled API error", error);
    return ResponseEntity
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .body(ApiErrorResponse.body(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong.", request));
  }

  private ResponseEntity<Map<String, Object>> badRequest(String message, HttpServletRequest request) {
    return ResponseEntity
      .status(HttpStatus.BAD_REQUEST)
      .body(ApiErrorResponse.body(HttpStatus.BAD_REQUEST, message, request));
  }
}
