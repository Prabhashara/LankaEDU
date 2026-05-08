package com.onlineexam;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OnlineExamApplication {
  public static void main(String[] args) {
    loadDotenv();
    SpringApplication.run(OnlineExamApplication.class, args);
  }

  private static void loadDotenv() {
    Path envPath = Path.of(".env");
    if (!Files.exists(envPath)) {
      return;
    }

    try {
      for (String line : Files.readAllLines(envPath)) {
        String trimmed = line.trim();
        if (trimmed.isBlank() || trimmed.startsWith("#") || !trimmed.contains("=")) {
          continue;
        }

        String[] parts = trimmed.split("=", 2);
        String key = parts[0].trim();
        String value = parts[1].trim();
        if (System.getenv(key) == null && System.getProperty(key) == null) {
          System.setProperty(key, value);
        }
      }
    } catch (IOException error) {
      throw new IllegalStateException("Unable to read .env", error);
    }
  }
}
