package com.onlineexam.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsResponseFilter extends OncePerRequestFilter {
  @Value("${app.allowed-origin:}")
  private String allowedOriginValue;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    applyCorsHeaders(request, response);

    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
      response.setStatus(HttpStatus.NO_CONTENT.value());
      return;
    }

    filterChain.doFilter(request, response);
  }

  private void applyCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
    String origin = request.getHeader("Origin");
    String allowedOrigin = resolveAllowedOrigin(origin);

    if (allowedOrigin != null) {
      response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      response.setHeader("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
    }

    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type,Accept,Origin,X-Requested-With");
    response.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    response.setHeader("Access-Control-Max-Age", "3600");
  }

  private String resolveAllowedOrigin(String origin) {
    if (origin == null || origin.isBlank()) {
      return null;
    }

    if (isLocalDevelopmentOrigin(origin)) {
      return origin;
    }

    List<String> configuredOrigins = Arrays.stream(allowedOriginValue.split(","))
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .toList();

    if (configuredOrigins.contains("*")) {
      return "*";
    }

    return configuredOrigins.contains(origin) ? origin : null;
  }

  private boolean isLocalDevelopmentOrigin(String origin) {
    return origin.matches("^http://localhost:\\d+$") || origin.matches("^http://127\\.0\\.0\\.1:\\d+$");
  }
}
