package com.onlineexam.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

public class JsonFileStore<T> {
  private static final Map<String, Object> LOCKS = new ConcurrentHashMap<>();
  private final Path path;
  private final ObjectMapper objectMapper;
  private final TypeReference<List<T>> typeReference;

  public JsonFileStore(Path path, ObjectMapper objectMapper, TypeReference<List<T>> typeReference) {
    this.path = path;
    this.objectMapper = objectMapper;
    this.typeReference = typeReference;
  }

  public synchronized List<T> readAll() {
    String databaseUrl = databaseUrl();
    if (!databaseUrl.isBlank()) {
      return readAllFromDatabase(databaseUrl);
    }

    try {
      if (!Files.exists(path)) {
        return new ArrayList<>();
      }
      return objectMapper.readValue(path.toFile(), typeReference);
    } catch (IOException error) {
      throw new IllegalStateException("Unable to read " + path, error);
    }
  }

  public synchronized void writeAll(List<T> items) {
    String databaseUrl = databaseUrl();
    if (!databaseUrl.isBlank()) {
      writeAllToDatabase(databaseUrl, items);
      return;
    }

    try {
      Files.createDirectories(path.getParent());
      objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), items);
    } catch (IOException error) {
      throw new IllegalStateException("Unable to write " + path, error);
    }
  }

  private List<T> readAllFromDatabase(String databaseUrl) {
    synchronized (lock()) {
      ensureTable(databaseUrl);
      String key = storeKey();

      try (
        Connection connection = connection(databaseUrl);
        PreparedStatement statement = connection.prepareStatement("select data from app_json_store where store_key = ?")
      ) {
        statement.setString(1, key);
        try (ResultSet resultSet = statement.executeQuery()) {
          if (!resultSet.next()) {
            List<T> initialItems = readInitialItemsFromFile();
            writeAllToDatabase(databaseUrl, initialItems);
            return initialItems;
          }
          return objectMapper.readValue(resultSet.getString("data"), typeReference);
        }
      } catch (IOException | SQLException error) {
        throw new IllegalStateException("Unable to read " + key + " from database", error);
      }
    }
  }

  private void writeAllToDatabase(String databaseUrl, List<T> items) {
    synchronized (lock()) {
      ensureTable(databaseUrl);
      String key = storeKey();

      try (
        Connection connection = connection(databaseUrl);
        PreparedStatement statement = connection.prepareStatement(
          """
          insert into app_json_store (store_key, data, updated_at)
          values (?, ?::jsonb, now())
          on conflict (store_key)
          do update set data = excluded.data, updated_at = now()
          """
        )
      ) {
        statement.setString(1, key);
        statement.setString(2, objectMapper.writeValueAsString(items));
        statement.executeUpdate();
      } catch (IOException | SQLException error) {
        throw new IllegalStateException("Unable to write " + key + " to database", error);
      }
    }
  }

  private List<T> readInitialItemsFromFile() {
    try {
      if (!Files.exists(path)) {
        return new ArrayList<>();
      }
      return objectMapper.readValue(path.toFile(), typeReference);
    } catch (IOException error) {
      throw new IllegalStateException("Unable to read initial data from " + path, error);
    }
  }

  private void ensureTable(String databaseUrl) {
    try (
      Connection connection = connection(databaseUrl);
      PreparedStatement statement = connection.prepareStatement(
        """
        create table if not exists app_json_store (
          store_key text primary key,
          data jsonb not null default '[]'::jsonb,
          updated_at timestamptz not null default now()
        )
        """
      )
    ) {
      statement.executeUpdate();
    } catch (SQLException error) {
      throw new IllegalStateException("Unable to initialize database JSON store", error);
    }
  }

  private Object lock() {
    return LOCKS.computeIfAbsent(storeKey(), _key -> new Object());
  }

  private String storeKey() {
    return path.getFileName().toString();
  }

  private String databaseUrl() {
    String value = System.getProperty("DATABASE_URL");
    if (value == null || value.isBlank()) {
      value = System.getenv("DATABASE_URL");
    }
    return value == null ? "" : value.trim();
  }

  private Connection connection(String databaseUrl) throws SQLException {
    if (databaseUrl.startsWith("jdbc:")) {
      return DriverManager.getConnection(databaseUrl);
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

      return DriverManager.getConnection(jdbcUrl(uri), properties);
    } catch (URISyntaxException error) {
      throw new SQLException("Invalid DATABASE_URL", error);
    }
  }

  private String jdbcUrl(URI uri) {
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

  private String urlDecode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }
}
