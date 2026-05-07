package com.onlineexam.users;

import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping
  public Map<String, Object> list(HttpServletRequest request) {
    AuthSupport.requireRole(request, "admin");
    return Map.of("users", userService.listUsers());
  }

  @PatchMapping("/{id}/status")
  public Map<String, Object> updateStatus(
    HttpServletRequest request,
    @PathVariable String id,
    @RequestBody Map<String, Object> body
  ) {
    AuthSupport.requireRole(request, "admin");
    Object isActive = body.get("isActive");
    if (!(isActive instanceof Boolean active)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "isActive must be true or false");
    }

    PublicUser user = userService.updateStatus(id, active);
    if (user == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
    }

    return Map.of("user", user);
  }

  @DeleteMapping("/{id}")
  public Map<String, Object> delete(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal currentUser = AuthSupport.requireRole(request, "admin");
    if (id.equals(currentUser.id())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Admins cannot delete their own account");
    }

    PublicUser user = userService.deleteUser(id);
    if (user == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
    }

    return Map.of("message", "User deleted", "user", user);
  }
}
