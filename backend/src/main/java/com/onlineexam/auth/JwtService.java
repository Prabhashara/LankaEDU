package com.onlineexam.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final ObjectMapper objectMapper;
  private final String secret;
  private final long expiresInSeconds;

  public JwtService(
    ObjectMapper objectMapper,
    @Value("${app.jwt-secret}") String secret,
    @Value("${app.jwt-expires-in}") String expiresIn
  ) {
    this.objectMapper = objectMapper;
    this.secret = secret;
    this.expiresInSeconds = parseExpiry(expiresIn);
  }

  public String sign(String userId, String role, String email) {
    try {
      Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("sub", userId);
      payload.put("role", role);
      payload.put("email", email);
      payload.put("exp", Instant.now().getEpochSecond() + expiresInSeconds);

      String encodedHeader = encodeJson(header);
      String encodedPayload = encodeJson(payload);
      String signature = sign(encodedHeader + "." + encodedPayload);
      return encodedHeader + "." + encodedPayload + "." + signature;
    } catch (Exception error) {
      throw new IllegalStateException("Unable to sign JWT", error);
    }
  }

  public UserPrincipal verify(String token) {
    try {
      String[] parts = token.split("\\.");
      if (parts.length != 3) {
        return null;
      }

      String expectedSignature = sign(parts[0] + "." + parts[1]);
      if (!constantTimeEquals(expectedSignature, parts[2])) {
        return null;
      }

      byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
      Map<String, Object> payload = objectMapper.readValue(payloadBytes, new TypeReference<>() {});
      Number exp = (Number) payload.get("exp");
      if (exp == null || exp.longValue() <= Instant.now().getEpochSecond()) {
        return null;
      }

      return new UserPrincipal(
        String.valueOf(payload.get("sub")),
        String.valueOf(payload.get("role")),
        String.valueOf(payload.get("email"))
      );
    } catch (Exception error) {
      return null;
    }
  }

  private String encodeJson(Map<String, Object> value) throws Exception {
    return Base64.getUrlEncoder()
      .withoutPadding()
      .encodeToString(objectMapper.writeValueAsBytes(value));
  }

  private String sign(String value) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    return Base64.getUrlEncoder()
      .withoutPadding()
      .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
  }

  private boolean constantTimeEquals(String left, String right) {
    return MessageDigestSupport.equals(left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
  }

  private long parseExpiry(String value) {
    if (value == null || value.isBlank()) {
      return 7L * 24 * 60 * 60;
    }

    String trimmed = value.trim().toLowerCase();
    long multiplier = 1;
    if (trimmed.endsWith("d")) {
      multiplier = 24 * 60 * 60;
      trimmed = trimmed.substring(0, trimmed.length() - 1);
    } else if (trimmed.endsWith("h")) {
      multiplier = 60 * 60;
      trimmed = trimmed.substring(0, trimmed.length() - 1);
    } else if (trimmed.endsWith("m")) {
      multiplier = 60;
      trimmed = trimmed.substring(0, trimmed.length() - 1);
    } else if (trimmed.endsWith("s")) {
      trimmed = trimmed.substring(0, trimmed.length() - 1);
    }

    return Long.parseLong(trimmed) * multiplier;
  }
}
