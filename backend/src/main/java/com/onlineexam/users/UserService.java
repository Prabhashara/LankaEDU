package com.onlineexam.users;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.common.JsonFileStore;
import com.onlineexam.common.ApiException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class UserService {
  private final JsonFileStore<User> store;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public UserService(ObjectMapper objectMapper) {
    this.store = new JsonFileStore<>("users.json", objectMapper, new TypeReference<>() {
    });
    seedDemoUsersIfMissing();
  }

  public List<PublicUser> listUsers() {
    return store.readAll().stream().map(PublicUser::from).toList();
  }

  public Optional<User> findRawById(String id) {
    return store.readAll().stream().filter(user -> id.equals(user.getId())).findFirst();
  }

  public Optional<User> findRawByEmail(String email) {
    return store.readAll().stream()
        .filter(user -> user.getEmail() != null && user.getEmail().equalsIgnoreCase(email))
        .findFirst();
  }

  public Optional<User> findRawByStudentId(String studentId) {
    return store.readAll().stream()
        .filter(user -> user.getStudentId() != null && user.getStudentId().equalsIgnoreCase(studentId))
        .findFirst();
  }

  public User addUser(String name, String studentId, String email, String password, String role) {
    List<User> users = new ArrayList<>(store.readAll());
    String normalizedEmail = normalizeEmail(email);
    String normalizedRole = UserRole.normalize(role);
    String normalizedStudentId = normalizeNullable(studentId);

    if (!UserRole.isValid(normalizedRole)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role");
    }

    if (normalizedEmail.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Email is required");
    }

    if (users.stream().anyMatch(user -> user.getEmail() != null && user.getEmail().equalsIgnoreCase(normalizedEmail))) {
      throw new ApiException(HttpStatus.CONFLICT, "Email already exists",
          java.util.Map.of("email", "Email already exists"));
    }

    if (!normalizedStudentId.isBlank() && users.stream()
        .anyMatch(user -> user.getStudentId() != null && user.getStudentId().equalsIgnoreCase(normalizedStudentId))) {
      throw new ApiException(HttpStatus.CONFLICT, "Student ID already exists",
          java.util.Map.of("studentId", "Student ID already exists"));
    }

    User user = new User();
    user.setId(UUID.randomUUID().toString());
    user.setName(normalizeNullable(name));
    user.setStudentId(normalizedStudentId.isBlank() ? null : normalizedStudentId);
    user.setEmail(normalizedEmail);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(normalizedRole);
    user.setActive(true);
    user.setCreatedAt(Instant.now().toString());
    users.add(user);
    store.writeAll(users);
    return user;
  }

  public boolean passwordMatches(User user, String password) {
    return passwordEncoder.matches(password, user.getPasswordHash());
  }

  public long countActiveAdmins() {
    return store.readAll().stream()
        .filter(user -> UserRole.ADMIN.equals(user.getRole()) && user.isActive())
        .count();
  }

  public PublicUser updateStatus(String id, boolean active) {
    List<User> users = new ArrayList<>(store.readAll());
    for (User user : users) {
      if (id.equals(user.getId())) {
        user.setActive(active);
        store.writeAll(users);
        return PublicUser.from(user);
      }
    }
    return null;
  }

  public PublicUser deleteUser(String id) {
    List<User> users = new ArrayList<>(store.readAll());
    User found = null;

    for (User user : users) {
      if (id.equals(user.getId())) {
        found = user;
        break;
      }
    }

    if (found == null) {
      return null;
    }

    users.remove(found);
    store.writeAll(users);
    return PublicUser.from(found);
  }

  public PublicUser updateProfile(String id, String name, String email) {
    List<User> users = new ArrayList<>(store.readAll());
    String normalizedEmail = normalizeEmail(email);

    if (normalizedEmail.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Email is required");
    }

    for (User user : users) {
      if (id.equals(user.getId())) {
        // Check if new email is already taken by another user
        if (!normalizedEmail.equals(user.getEmail().toLowerCase()) &&
            users.stream().anyMatch(
                u -> !id.equals(u.getId()) && u.getEmail() != null && u.getEmail().equalsIgnoreCase(normalizedEmail))) {
          throw new ApiException(HttpStatus.CONFLICT, "Email already exists",
              java.util.Map.of("email", "Email already exists"));
        }

        user.setName(normalizeNullable(name));
        user.setEmail(normalizedEmail);
        store.writeAll(users);
        return PublicUser.from(user);
      }
    }

    throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
  }

  public PublicUser changePassword(String id, String currentPassword, String newPassword) {
    List<User> users = new ArrayList<>(store.readAll());

    for (User user : users) {
      if (id.equals(user.getId())) {
        if (!passwordMatches(user, currentPassword)) {
          throw new ApiException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        store.writeAll(users);
        return PublicUser.from(user);
      }
    }

    throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
  }

  private String normalizeEmail(String email) {
    return normalizeNullable(email).toLowerCase();
  }

  private String normalizeNullable(String value) {
    return value == null ? "" : value.trim();
  }

  private void seedDemoUsersIfMissing() {
    if (!store.readAll().isEmpty()) {
      return;
    }

    addDemoUser("System Admin", null, "admin@example.com", "admin");
    addDemoUser("Demo Lecturer", null, "lecturer@example.com", "lecturer");
    addDemoUser("Demo Student", "STU-DEMO-001", "student@example.com", "student");
  }

  private void addDemoUser(String name, String studentId, String email, String role) {
    List<User> users = new ArrayList<>(store.readAll());
    User user = new User();
    user.setId(UUID.randomUUID().toString());
    user.setName(name);
    user.setStudentId(studentId);
    user.setEmail(email);
    user.setRole(role);
    user.setActive(true);
    user.setPasswordHash(passwordEncoder.encode("password123"));
    user.setCreatedAt(Instant.now().toString());
    users.add(user);
    store.writeAll(users);
  }
}
