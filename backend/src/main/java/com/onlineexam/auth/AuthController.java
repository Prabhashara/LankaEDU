package com.onlineexam.auth;

import com.onlineexam.audit.AuditService;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.auth.AuthSupport;
import com.onlineexam.common.ApiException;
import com.onlineexam.common.RequestBodySupport;
import com.onlineexam.users.User;
import com.onlineexam.users.UserService;
import com.onlineexam.users.UserRole;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private static final String GENERIC_LOGIN_ERROR = "Invalid email or password";

  private final UserService userService;
  private final JwtService jwtService;
  private final AuditService auditService;
  private final LoginAttemptService loginAttemptService;

  public AuthController(UserService userService, JwtService jwtService, AuditService auditService,
      LoginAttemptService loginAttemptService) {
    this.userService = userService;
    this.jwtService = jwtService;
    this.auditService = auditService;
    this.loginAttemptService = loginAttemptService;
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> body) {
    body = RequestBodySupport.emptyIfNull(body);
    Map<String, String> errors = new LinkedHashMap<>();
    String fullName = trim(body.get("fullName"));
    String studentId = trim(body.get("studentId"));
    String email = trim(body.get("email")).toLowerCase();
    String password = string(body.get("password"));
    String confirmPassword = string(body.get("confirmPassword"));

    if (fullName.isBlank())
      errors.put("fullName", "Full name is required");
    if (studentId.isBlank())
      errors.put("studentId", "Student ID is required");
    if (email.isBlank())
      errors.put("email", "Email is required");
    else if (!EMAIL_PATTERN.matcher(email).matches())
      errors.put("email", "Enter a valid email address");
    validatePassword(password, errors, "password");
    if (confirmPassword.isBlank())
      errors.put("confirmPassword", "Confirm your password");
    else if (!password.equals(confirmPassword))
      errors.put("confirmPassword", "Passwords do not match");

    if (!errors.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    if (userService.findRawByStudentId(studentId).isPresent()) {
      throw new ApiException(HttpStatus.CONFLICT, "Student ID already exists",
          Map.of("studentId", "Student ID already exists"));
    }

    if (userService.findRawByEmail(email).isPresent()) {
      throw new ApiException(HttpStatus.CONFLICT, "Email already exists", Map.of("email", "Email already exists"));
    }

    User user = userService.addUser(fullName, studentId, email, password, UserRole.STUDENT);
    auditService.record(new UserPrincipal(user.getId(), user.getRole(), user.getEmail()), "AUTH_REGISTER", "user",
        user.getId(), "Student registered", Map.of("studentId", studentId));

    Map<String, Object> publicUser = new LinkedHashMap<>();
    publicUser.put("id", user.getId());
    publicUser.put("name", user.getName());
    publicUser.put("studentId", user.getStudentId());
    publicUser.put("email", user.getEmail());
    publicUser.put("role", user.getRole());

    return ResponseEntity.status(201).body(Map.of(
        "message", "Registration successful, please log in",
        "user", publicUser));
  }

  @PostMapping("/login")
  public Map<String, Object> login(@RequestBody Map<String, Object> body) {
    body = RequestBodySupport.emptyIfNull(body);
    String email = trim(body.get("email")).toLowerCase();
    String password = string(body.get("password"));

    if (email.isBlank() || password.isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, GENERIC_LOGIN_ERROR);
    }

    if (loginAttemptService.isBlocked(email)) {
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed login attempts. Try again later.");
    }

    User user = userService.findRawByEmail(email).orElse(null);
    if (user == null || !user.isActive() || !userService.passwordMatches(user, password)) {
      loginAttemptService.recordFailure(email);
      throw new ApiException(HttpStatus.UNAUTHORIZED, GENERIC_LOGIN_ERROR);
    }
    loginAttemptService.recordSuccess(email);

    Map<String, Object> publicUser = new LinkedHashMap<>();
    publicUser.put("id", user.getId());
    publicUser.put("name", user.getName());
    publicUser.put("email", user.getEmail());
    publicUser.put("role", user.getRole());
    auditService.record(new UserPrincipal(user.getId(), user.getRole(), user.getEmail()), "AUTH_LOGIN", "user",
        user.getId(), "User signed in");

    return Map.of(
        "token", jwtService.sign(user.getId(), user.getRole(), user.getEmail()),
        "role", user.getRole(),
        "user", publicUser);
  }

  @PatchMapping("/profile")
  public Map<String, Object> updateProfile(HttpServletRequest request, @RequestBody Map<String, Object> body) {
    body = RequestBodySupport.emptyIfNull(body);
    UserPrincipal currentUser = AuthSupport.currentUser(request);
    String name = trim(body.get("name"));
    String email = trim(body.get("email")).toLowerCase();

    Map<String, String> errors = new LinkedHashMap<>();
    if (name.isBlank())
      errors.put("name", "Name is required");
    if (email.isBlank())
      errors.put("email", "Email is required");
    else if (!EMAIL_PATTERN.matcher(email).matches())
      errors.put("email", "Enter a valid email address");

    if (!errors.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    com.onlineexam.users.PublicUser updatedUser = userService.updateProfile(currentUser.id(), name, email);
    auditService.record(currentUser, "PROFILE_UPDATED", "user", currentUser.id(), "User updated their profile",
        Map.of("name", name, "email", email));

    return Map.of(
        "message", "Profile updated successfully",
        "user", updatedUser);
  }

  @PatchMapping("/profile/password")
  public Map<String, Object> changePassword(HttpServletRequest request, @RequestBody Map<String, Object> body) {
    body = RequestBodySupport.emptyIfNull(body);
    UserPrincipal currentUser = AuthSupport.currentUser(request);
    String currentPassword = string(body.get("currentPassword"));
    String newPassword = string(body.get("newPassword"));
    String confirmPassword = string(body.get("confirmPassword"));

    Map<String, String> errors = new LinkedHashMap<>();
    if (currentPassword.isBlank())
      errors.put("currentPassword", "Current password is required");
    validatePassword(newPassword, errors, "newPassword");
    if (confirmPassword.isBlank())
      errors.put("confirmPassword", "Confirm your password");
    else if (!newPassword.equals(confirmPassword))
      errors.put("confirmPassword", "Passwords do not match");

    if (!errors.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    com.onlineexam.users.PublicUser updatedUser = userService.changePassword(currentUser.id(), currentPassword,
        newPassword);
    auditService.record(currentUser, "PASSWORD_CHANGED", "user", currentUser.id(), "User changed their password");

    return Map.of(
        "message", "Password changed successfully",
        "user", updatedUser);
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

  private String trim(Object value) {
    return string(value).trim();
  }

  private String string(Object value) {
    return value == null ? "" : String.valueOf(value);
  }
}
