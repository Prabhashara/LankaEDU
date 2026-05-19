package com.onlineexam.common;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.SQLNonTransientConnectionException;
import java.util.Properties;

public final class DatabaseSupport {
  private static final String DEFAULT_CONNECT_TIMEOUT_SECONDS = "10";
  private static final String DEFAULT_SOCKET_TIMEOUT_SECONDS = "30";
  private static volatile String configuredDatabaseUrl = "";

  private DatabaseSupport() {
  }

  public static void configureDatabaseUrl(String databaseUrl) {
    configuredDatabaseUrl = databaseUrl == null ? "" : databaseUrl.trim();
  }

  public static String databaseUrl() {
    String value = System.getProperty("DATABASE_URL");
    if (value == null || value.isBlank()) {
      value = System.getProperty("app.database-url");
    }
    if (value == null || value.isBlank()) {
      value = configuredDatabaseUrl;
    }
    if (value == null || value.isBlank()) {
      value = System.getenv("DATABASE_URL");
    }
    value = value == null ? "" : value.trim();
    if (value.isBlank() || isPlaceholder(value)) {
      throw new MissingDatabaseConfigurationException(
        "Database is not configured. Set a real DATABASE_URL in backend/.env and restart the backend."
      );
    }
    return value;
  }

  private static boolean isPlaceholder(String value) {
    String normalized = value.toLowerCase();
    return normalized.contains("user:password@host")
      || normalized.contains("username:password@localhost")
      || normalized.contains("replace_this")
      || normalized.contains("<")
      || normalized.contains(">");
  }

  public static Connection connection(String databaseUrl) throws SQLException {
    if (databaseUrl.startsWith("jdbc:")) {
      return DriverManager.getConnection(withDefaultJdbcParameters(databaseUrl));
    }

    try {
      URI uri = new URI(databaseUrl);
      Properties properties = new Properties();
      String userInfo = uri.getRawUserInfo();

      if (userInfo != null && !userInfo.isBlank()) {
        String[] credentials = userInfo.split(":", 2);
        properties.setProperty("user", urlDecode(credentials[0]));
        if (credentials.length > 1) {
          properties.setProperty("password", urlDecode(credentials[1]));
        }
      }

      applyDefaultProperties(uri, properties);
      return DriverManager.getConnection(jdbcUrl(uri), properties);
    } catch (URISyntaxException error) {
      throw new SQLException("Invalid DATABASE_URL", error);
    }
  }

  private static String jdbcUrl(URI uri) {
    StringBuilder url = new StringBuilder("jdbc:postgresql://");
    url.append(uri.getHost());

    if (uri.getPort() > 0) {
      url.append(":").append(uri.getPort());
    }

    String pathValue = uri.getPath();
    url.append(pathValue == null || pathValue.isBlank() ? "/postgres" : pathValue);

    String query = uri.getRawQuery();
    if (query != null && !query.isBlank()) {
      url.append("?").append(query);
    }

    return url.toString();
  }

  private static String withDefaultJdbcParameters(String databaseUrl) {
    String updatedUrl = databaseUrl;
    updatedUrl = appendJdbcParameterIfMissing(updatedUrl, "connectTimeout", DEFAULT_CONNECT_TIMEOUT_SECONDS);
    updatedUrl = appendJdbcParameterIfMissing(updatedUrl, "socketTimeout", DEFAULT_SOCKET_TIMEOUT_SECONDS);
    if (looksLikeSupabaseHost(updatedUrl)) {
      updatedUrl = appendJdbcParameterIfMissing(updatedUrl, "sslmode", "require");
    }
    return updatedUrl;
  }

  private static String appendJdbcParameterIfMissing(String databaseUrl, String key, String value) {
    String lowerUrl = databaseUrl.toLowerCase();
    if (lowerUrl.contains("?" + key.toLowerCase() + "=") || lowerUrl.contains("&" + key.toLowerCase() + "=")) {
      return databaseUrl;
    }

    String separator = databaseUrl.contains("?") ? "&" : "?";
    return databaseUrl + separator + key + "=" + value;
  }

  private static void applyDefaultProperties(URI uri, Properties properties) {
    if (looksLikeSupabaseHost(uri.getHost())) {
      properties.putIfAbsent("sslmode", "require");
    }
    properties.putIfAbsent("connectTimeout", DEFAULT_CONNECT_TIMEOUT_SECONDS);
    properties.putIfAbsent("socketTimeout", DEFAULT_SOCKET_TIMEOUT_SECONDS);
  }

  public static boolean isConnectivityError(Throwable error) {
    Throwable current = error;
    while (current != null) {
      if (current instanceof SQLNonTransientConnectionException) {
        return true;
      }
      if (current instanceof java.net.SocketTimeoutException || current instanceof java.net.ConnectException) {
        return true;
      }
      String message = current.getMessage();
      if (message != null) {
        String normalized = message.toLowerCase();
        if (normalized.contains("connection attempt failed")
          || normalized.contains("connect timed out")
          || normalized.contains("timeout while waiting for message")
          || normalized.contains("eauthtimeout")) {
          return true;
        }
      }
      current = current.getCause();
    }
    return false;
  }

  private static boolean looksLikeSupabaseHost(String value) {
    return value != null && value.toLowerCase().contains("supabase.");
  }

  private static String urlDecode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }
}
