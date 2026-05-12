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
    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
    config.setExposedHeaders(List.of("Content-Disposition"));
    config.setAllowCredentials(false);

    List<String> allowedOrigins = Arrays.stream(allowedOriginValue.split(","))
      .map(String::trim)
      .filter(origin -> !origin.isBlank())
      .toList();

    config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
    if (!allowedOrigins.isEmpty()) {
      config.setAllowedOrigins(allowedOrigins);
    }

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
