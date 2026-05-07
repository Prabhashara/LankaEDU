package com.onlineexam.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {
  @Value("${app.allowed-origin:}")
  private String allowedOriginValue;

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(false);

    List<String> allowedOrigins = Arrays.stream(allowedOriginValue.split(","))
      .map(String::trim)
      .filter(origin -> !origin.isBlank())
      .toList();

    if (allowedOrigins.isEmpty()) {
      config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
    } else {
      config.setAllowedOrigins(allowedOrigins);
    }

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
