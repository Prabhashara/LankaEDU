package com.onlineexam.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class JsonFileStore<T> {
  private static final Map<String, Object> LOCKS = new ConcurrentHashMap<>();
  private final String storeKey;
  private final ObjectMapper objectMapper;
  private final TypeReference<List<T>> typeReference;

  public JsonFileStore(String storeKey, ObjectMapper objectMapper, TypeReference<List<T>> typeReference) {
    this.storeKey = storeKey;
    this.objectMapper = objectMapper;
    this.typeReference = typeReference;
  }

  public synchronized List<T> readAll() {
    return readAllFromDatabase(DatabaseSupport.databaseUrl());
  }

  public synchronized void writeAll(List<T> items) {
    writeAllToDatabase(DatabaseSupport.databaseUrl(), items);
  }

  private List<T> readAllFromDatabase(String databaseUrl) {
    synchronized (lock()) {
      ensureTable(databaseUrl);
      String key = storeKey();

      try (
        Connection connection = DatabaseSupport.connection(databaseUrl);
        PreparedStatement statement = connection.prepareStatement("select data from app_json_store where store_key = ?")
      ) {
        statement.setString(1, key);
        try (ResultSet resultSet = statement.executeQuery()) {
          if (!resultSet.next()) {
            List<T> initialItems = new ArrayList<>();
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
        Connection connection = DatabaseSupport.connection(databaseUrl);
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

  private void ensureTable(String databaseUrl) {
    try (
      Connection connection = DatabaseSupport.connection(databaseUrl);
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
    return storeKey;
  }

}
