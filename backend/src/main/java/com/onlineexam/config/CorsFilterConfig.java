package com.onlineexam.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsFilterConfig {
  @Bean
  public FilterRegistrationBean<CorsFilter> corsFilter(CorsConfigurationSource corsConfigurationSource) {
    FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(corsConfigurationSource));
    registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
    return registration;
  }
}
