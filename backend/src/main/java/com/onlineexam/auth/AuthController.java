package com.onlineexam.auth;

import com.onlineexam.common.ApiException;
import com.onlineexam.users.User;
import com.onlineexam.users.UserService;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private static final String GENERIC_LOGIN_ERROR = "Invalid email or password";

  private final UserService userService;
  private final JwtService jwtService;

  public AuthController(UserService userService, JwtService jwtService) {
    this.userService = userService;
    this.jwtService = jwtService;
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> body) {
    Map<String, String> errors = new LinkedHashMap<>();
    String fullName = trim(body.get("fullName"));
    String studentId = trim(body.get("studentId"));
    String email = trim(body.get("email")).toLowerCase();
    String password = string(body.get("password"));
    String confirmPassword = string(body.get("confirmPassword"));

    if (fullName.isBlank()) errors.put("fullName", "Full name is required");
    if (studentId.isBlank()) errors.put("studentId", "Student ID is required");
    if (email.isBlank()) errors.put("email", "Email is required");
    else if (!EMAIL_PATTERN.matcher(email).matches()) errors.put("email", "Enter a valid email address");
    if (password.isBlank()) errors.put("password", "Password is required");
    else if (password.length() < 8) errors.put("password", "Password must be at least 8 characters");
    if (confirmPassword.isBlank()) errors.put("confirmPassword", "Confirm your password");
    else if (!password.equals(confirmPassword)) errors.put("confirmPassword", "Passwords do not match");

    if (!errors.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    if (userService.findRawByStudentId(studentId).isPresent()) {
      throw new ApiException(HttpStatus.CONFLICT, "Student ID already exists", Map.of("studentId", "Student ID already exists"));
    }

    if (userService.findRawByEmail(email).isPresent()) {
      throw new ApiException(HttpStatus.CONFLICT, "Email already exists", Map.of("email", "Email already exists"));
    }

    User user = userService.addUser(fullName, studentId, email, password, "student");
    Map<String, Object> publicUser = new LinkedHashMap<>();
    publicUser.put("id", user.getId());
    publicUser.put("name", user.getName());
    publicUser.put("studentId", user.getStudentId());
    publicUser.put("email", user.getEmail());
    publicUser.put("role", user.getRole());

    return ResponseEntity.status(201).body(Map.of(
      "message", "Registration successful, please log in",
      "user", publicUser
    ));
  }

  @PostMapping("/login")
  public Map<String, Object> login(@RequestBody Map<String, Object> body) {
    String email = trim(body.get("email")).toLowerCase();
    String password = string(body.get("password"));

    if (email.isBlank() || password.isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, GENERIC_LOGIN_ERROR);
    }

    User user = userService.findRawByEmail(email).orElse(null);
    if (user == null || !user.isActive() || !userService.passwordMatches(user, password)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, GENERIC_LOGIN_ERROR);
    }

    Map<String, Object> publicUser = new LinkedHashMap<>();
    publicUser.put("id", user.getId());
    publicUser.put("name", user.getName());
    publicUser.put("email", user.getEmail());
    publicUser.put("role", user.getRole());

    return Map.of(
      "token", jwtService.sign(user.getId(), user.getRole(), user.getEmail()),
      "role", user.getRole(),
      "user", publicUser
    );
  }

  private String trim(Object value) {
    return string(value).trim();
  }

  private String string(Object value) {
    return value == null ? "" : String.valueOf(value);
  }
}
