package com.onlineexam.users;

import com.onlineexam.audit.AuditService;
import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import com.onlineexam.common.RequestBodySupport;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private static final Logger LOGGER = Logger.getLogger(UserController.class.getName());
  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

  private final UserService userService;
  private final AuditService auditService;

  public UserController(UserService userService, AuditService auditService) {
    this.userService = userService;
    this.auditService = auditService;
  }

  @GetMapping
  public Map<String, Object> list(HttpServletRequest request) {
    AuthSupport.requireRole(request, UserRole.ADMIN);
    return Map.of("users", userService.listUsers());
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> createStaffUser(HttpServletRequest request, @RequestBody Map<String, Object> body) {
    body = RequestBodySupport.emptyIfNull(body);
    UserPrincipal currentUser = AuthSupport.requireRole(request, UserRole.ADMIN);
    StaffUserInput input = validateStaffUser(body);

    User user = userService.addUser(input.fullName(), null, input.email(), input.password(), input.role());
    PublicUser publicUser = PublicUser.from(user);

    try {
      auditService.record(
        currentUser,
        "USER_CREATED",
        "user",
        user.getId(),
        "Admin created a staff account",
        Map.of("targetEmail", user.getEmail(), "targetRole", user.getRole())
      );
    } catch (RuntimeException error) {
      LOGGER.log(Level.WARNING, "Staff account was created but audit logging failed", error);
    }

    return ResponseEntity.status(201).body(Map.of(
      "message", "Staff account created",
      "user", publicUser
    ));
  }

  @PatchMapping("/{id}/status")
  public Map<String, Object> updateStatus(
    HttpServletRequest request,
    @PathVariable String id,
    @RequestBody Map<String, Object> body
  ) {
    body = RequestBodySupport.emptyIfNull(body);
    UserPrincipal currentUser = AuthSupport.requireRole(request, UserRole.ADMIN);
    Object isActive = body.get("isActive");
    if (!(isActive instanceof Boolean active)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "isActive must be true or false");
    }

    User targetUser = userService.findRawById(id).orElse(null);
    if (targetUser == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
    }

    if (id.equals(currentUser.id()) && !active) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Admins cannot deactivate their own account");
    }

    if (UserRole.ADMIN.equals(targetUser.getRole()) && targetUser.isActive() && !active && userService.countActiveAdmins() <= 1) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "At least one active admin must remain");
    }

    PublicUser user = userService.updateStatus(id, active);
    auditService.record(currentUser, active ? "USER_ACTIVATED" : "USER_DEACTIVATED", "user", id, active ? "User account activated" : "User account deactivated", Map.of("targetEmail", user.email()));
    return Map.of("user", user);
  }

  @DeleteMapping("/{id}")
  public Map<String, Object> delete(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal currentUser = AuthSupport.requireRole(request, UserRole.ADMIN);
    User targetUser = userService.findRawById(id).orElse(null);
    if (targetUser == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
    }

    if (id.equals(currentUser.id())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Admins cannot delete their own account");
    }

    if (UserRole.ADMIN.equals(targetUser.getRole()) && targetUser.isActive() && userService.countActiveAdmins() <= 1) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "At least one active admin must remain");
    }

    PublicUser user = userService.deleteUser(id);
    auditService.record(currentUser, "USER_DELETED", "user", id, "User account deleted", Map.of("targetEmail", user.email(), "targetRole", user.role()));
    return Map.of("message", "User deleted", "user", user);
  }

  private StaffUserInput validateStaffUser(Map<String, Object> body) {
    Map<String, String> errors = new LinkedHashMap<>();
    String fullName = first(body, "fullName", "name");
    String email = first(body, "email").toLowerCase();
    String role = UserRole.normalize(first(body, "role"));
    String password = string(body.get("password"));
    String confirmPassword = string(body.get("confirmPassword"));

    if (fullName.isBlank()) errors.put("fullName", "Full name is required");
    if (email.isBlank()) errors.put("email", "Email is required");
    else if (!EMAIL_PATTERN.matcher(email).matches()) errors.put("email", "Enter a valid email address");

    if (role.isBlank()) errors.put("role", "Role is required");
    else if (!UserRole.isStaffRole(role)) errors.put("role", "Only lecturer or admin accounts can be created here");

    validatePassword(password, errors, "password");
    if (confirmPassword.isBlank()) errors.put("confirmPassword", "Confirm the password");
    else if (!password.equals(confirmPassword)) errors.put("confirmPassword", "Passwords do not match");

    if (!errors.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    return new StaffUserInput(fullName, email, role, password);
  }

  private void validatePassword(String password, Map<String, String> errors, String field) {
    if (password.isBlank()) {
      errors.put(field, "Password is required");
      return;
    }

    if (password.length() < 8) {
      errors.put(field, "Password must be at least 8 characters");
      return;
    }

    boolean hasLetter = password.chars().anyMatch(Character::isLetter);
    boolean hasDigit = password.chars().anyMatch(Character::isDigit);
    if (!hasLetter || !hasDigit) {
      errors.put(field, "Password must include at least one letter and one number");
    }
  }

  private String first(Map<String, Object> body, String... keys) {
    for (String key : keys) {
      String value = string(body.get(key)).trim();
      if (!value.isBlank()) {
        return value;
      }
    }
    return "";
  }

  private String string(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private record StaffUserInput(String fullName, String email, String role, String password) {}
}
