package com.onlineexam;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OnlineExamApplication {
  public static void main(String[] args) {
    loadDotenv();
    SpringApplication.run(OnlineExamApplication.class, args);
  }

  private static void loadDotenv() {
    Set<Path> envPaths = new LinkedHashSet<>(List.of(
      Path.of(".env"),
      Path.of("backend/.env"),
      Path.of("../backend/.env")
    ));

    for (Path envPath : envPaths) {
      if (!Files.exists(envPath)) {
        continue;
      }

      try {
        loadEnvFile(envPath);
      } catch (IOException error) {
        throw new IllegalStateException("Unable to read .env", error);
      }
    }
  }

  private static void loadEnvFile(Path envPath) throws IOException {
    for (String line : Files.readAllLines(envPath)) {
        String trimmed = line.trim();
        if (trimmed.isBlank() || trimmed.startsWith("#") || !trimmed.contains("=")) {
          continue;
        }

        if (trimmed.startsWith("export ")) {
          trimmed = trimmed.substring("export ".length()).trim();
        }

        String[] parts = trimmed.split("=", 2);
        String key = parts[0].trim();
        String value = stripQuotes(parts[1].trim());
        if (System.getenv(key) == null && System.getProperty(key) == null) {
          System.setProperty(key, value);
        }
    }
  }

  private static String stripQuotes(String value) {
    if (value.length() >= 2 && (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    )) {
      return value.substring(1, value.length() - 1);
    }
    return value;
  }
}
