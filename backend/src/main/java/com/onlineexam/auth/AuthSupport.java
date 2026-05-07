package com.onlineexam.auth;

import com.onlineexam.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

public final class AuthSupport {
  private AuthSupport() {
  }

  public static UserPrincipal currentUser(HttpServletRequest request) {
    Object user = request.getAttribute(AuthFilter.USER_ATTRIBUTE);
    if (user instanceof UserPrincipal principal) {
      return principal;
    }
    throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
  }

  public static UserPrincipal requireRole(HttpServletRequest request, String role) {
    UserPrincipal user = currentUser(request);
    if (!role.equals(user.role())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden");
    }
    return user;
  }
}
