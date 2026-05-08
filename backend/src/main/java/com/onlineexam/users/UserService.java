package com.onlineexam.users;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.common.JsonFileStore;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
  private final JsonFileStore<User> store;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public UserService(ObjectMapper objectMapper) {
    this.store = new JsonFileStore<>(Path.of("src/data/users.json"), objectMapper, new TypeReference<>() {});
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
    User user = new User();
    user.setId(UUID.randomUUID().toString());
    user.setName(name);
    user.setStudentId(studentId);
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(role);
    user.setActive(true);
    user.setCreatedAt(Instant.now().toString());
    users.add(user);
    store.writeAll(users);
    return user;
  }

  public boolean passwordMatches(User user, String password) {
    return passwordEncoder.matches(password, user.getPasswordHash());
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
