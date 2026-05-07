package com.onlineexam.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.users.User;
import com.onlineexam.users.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthFilter extends OncePerRequestFilter {
  public static final String USER_ATTRIBUTE = "authUser";

  private final JwtService jwtService;
  private final UserService userService;
  private final ObjectMapper objectMapper;

  public AuthFilter(JwtService jwtService, UserService userService, ObjectMapper objectMapper) {
    this.jwtService = jwtService;
    this.userService = userService;
    this.objectMapper = objectMapper;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
    throws ServletException, IOException {
    if (isPublicPath(request.getRequestURI()) || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
      filterChain.doFilter(request, response);
      return;
    }

    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
      unauthorized(response);
      return;
    }

    UserPrincipal principal = jwtService.verify(header.substring("Bearer ".length()));
    User user = principal == null ? null : userService.findRawById(principal.id()).orElse(null);

    if (user == null || !user.isActive()) {
      unauthorized(response);
      return;
    }

    request.setAttribute(USER_ATTRIBUTE, new UserPrincipal(user.getId(), user.getRole(), user.getEmail()));
    filterChain.doFilter(request, response);
  }

  private boolean isPublicPath(String path) {
    return path.equals("/api/health") || path.equals("/api/auth/login") || path.equals("/api/auth/register");
  }

  private void unauthorized(HttpServletResponse response) throws IOException {
    response.setStatus(401);
    response.setContentType("application/json");
    objectMapper.writeValue(response.getWriter(), Map.of("message", "Authentication required"));
  }
}
