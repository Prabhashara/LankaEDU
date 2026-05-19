package com.onlineexam.common;

import java.util.Map;

public final class RequestBodySupport {
  private RequestBodySupport() {
  }

  public static <T> Map<String, T> emptyIfNull(Map<String, T> body) {
    return body == null ? Map.of() : body;
  }
}
