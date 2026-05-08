package com.onlineexam.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class JsonFileStore<T> {
  private final Path path;
  private final ObjectMapper objectMapper;
  private final TypeReference<List<T>> typeReference;

  public JsonFileStore(Path path, ObjectMapper objectMapper, TypeReference<List<T>> typeReference) {
    this.path = path;
    this.objectMapper = objectMapper;
    this.typeReference = typeReference;
  }

  public synchronized List<T> readAll() {
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
    try {
      Files.createDirectories(path.getParent());
      objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), items);
    } catch (IOException error) {
      throw new IllegalStateException("Unable to write " + path, error);
    }
  }
}
