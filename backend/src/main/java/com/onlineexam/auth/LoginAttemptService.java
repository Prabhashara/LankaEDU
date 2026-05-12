package com.onlineexam.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {
  private static final int MAX_ATTEMPTS = 5;
  private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);
  private final Map<String, LoginWindow> windows = new ConcurrentHashMap<>();

  public boolean isBlocked(String email) {
    LoginWindow window = windows.get(key(email));
    if (window == null) {
      return false;
    }
    if (window.lockedUntil != null && window.lockedUntil.isAfter(Instant.now())) {
      return true;
    }
    if (window.lockedUntil != null) {
      windows.remove(key(email));
    }
    return false;
  }

  public void recordFailure(String email) {
    windows.compute(key(email), (_key, window) -> {
      LoginWindow current = window == null ? new LoginWindow() : window;
      current.failures++;
      current.lastFailureAt = Instant.now();
      if (current.failures >= MAX_ATTEMPTS) {
        current.lockedUntil = Instant.now().plus(LOCKOUT_DURATION);
      }
      return current;
    });
  }

  public void recordSuccess(String email) {
    windows.remove(key(email));
  }

  private String key(String email) {
    return email == null ? "" : email.trim().toLowerCase();
  }

  private static class LoginWindow {
    int failures;
    Instant lastFailureAt;
    Instant lockedUntil;
  }
}
