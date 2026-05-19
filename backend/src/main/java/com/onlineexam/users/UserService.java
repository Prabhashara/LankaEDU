package com.onlineexam.users;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.common.ApiException;
import com.onlineexam.common.DatabaseConnectionException;
import com.onlineexam.common.DatabaseSupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
  private final ObjectMapper objectMapper;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
  private volatile boolean ready = false;

  public UserService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public List<PublicUser> listUsers() {
    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        select id::text, name, email, role, student_id, is_active, password_hash, created_at::text
        from public.users
        order by created_at desc nulls last, name asc
        """
      );
      ResultSet resultSet = statement.executeQuery()
    ) {
      List<PublicUser> users = new ArrayList<>();
      while (resultSet.next()) {
        users.add(PublicUser.from(rowToUser(resultSet)));
      }
      return users;
    } catch (SQLException error) {
      throw storageError("Unable to list users", error);
    }
  }

  public Optional<User> findRawById(String id) {
    UUID userId = uuid(id);
    if (userId == null) {
      return Optional.empty();
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        select id::text, name, email, role, student_id, is_active, password_hash, created_at::text
        from public.users
        where id = ?
        limit 1
        """
      )
    ) {
      statement.setObject(1, userId);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? Optional.of(rowToUser(resultSet)) : Optional.empty();
      }
    } catch (SQLException error) {
      throw storageError("Unable to find user", error);
    }
  }

  public Optional<User> findRawByEmail(String email) {
    String normalizedEmail = normalizeEmail(email);
    if (normalizedEmail.isBlank()) {
      return Optional.empty();
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        select id::text, name, email, role, student_id, is_active, password_hash, created_at::text
        from public.users
        where lower(email) = lower(?)
        order by created_at desc nulls last
        limit 1
        """
      )
    ) {
      statement.setString(1, normalizedEmail);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? Optional.of(rowToUser(resultSet)) : Optional.empty();
      }
    } catch (SQLException error) {
      throw storageError("Unable to find user by email", error);
    }
  }

  public Optional<User> findRawByStudentId(String studentId) {
    String normalizedStudentId = normalizeNullable(studentId);
    if (normalizedStudentId.isBlank()) {
      return Optional.empty();
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        select id::text, name, email, role, student_id, is_active, password_hash, created_at::text
        from public.users
        where lower(student_id) = lower(?)
        order by created_at desc nulls last
        limit 1
        """
      )
    ) {
      statement.setString(1, normalizedStudentId);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? Optional.of(rowToUser(resultSet)) : Optional.empty();
      }
    } catch (SQLException error) {
      throw storageError("Unable to find user by student ID", error);
    }
  }

  public User addUser(String name, String studentId, String email, String password, String role) {
    ensureReady();
    String normalizedEmail = normalizeEmail(email);
    String normalizedRole = UserRole.normalize(role);
    String normalizedStudentId = normalizeNullable(studentId);

    if (!UserRole.isValid(normalizedRole)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid role");
    }

    if (normalizedEmail.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Email is required");
    }

    User user = new User();
    user.setId(UUID.randomUUID().toString());
    user.setName(normalizeNullable(name));
    user.setStudentId(normalizedStudentId.isBlank() ? null : normalizedStudentId);
    user.setEmail(normalizedEmail);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(normalizedRole);
    user.setActive(true);

    try (Connection connection = connection()) {
      if (emailExists(connection, normalizedEmail, null)) {
        throw new ApiException(HttpStatus.CONFLICT, "Email already exists", Map.of("email", "Email already exists"));
      }

      if (!normalizedStudentId.isBlank() && studentIdExists(connection, normalizedStudentId, null)) {
        throw new ApiException(HttpStatus.CONFLICT, "Student ID already exists", Map.of("studentId", "Student ID already exists"));
      }

      insertUser(connection, user);
      return user;
    } catch (SQLException error) {
      if ("23505".equals(error.getSQLState())) {
        throw new ApiException(HttpStatus.CONFLICT, "Email already exists", Map.of("email", "Email already exists"));
      }
      throw storageError("Unable to create user", error);
    }
  }

  public boolean passwordMatches(User user, String password) {
    try {
      return user != null
        && user.getPasswordHash() != null
        && password != null
        && passwordEncoder.matches(password, user.getPasswordHash());
    } catch (IllegalArgumentException error) {
      return false;
    }
  }

  public long countActiveAdmins() {
    ensureReady();
    try (Connection connection = connection()) {
      return countActiveAdmins(connection);
    } catch (SQLException error) {
      throw storageError("Unable to count admins", error);
    }
  }

  public PublicUser updateStatus(String id, boolean active) {
    UUID userId = requireUuid(id);
    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        update public.users
        set is_active = ?
        where id = ?
        returning id::text, name, email, role, student_id, is_active, password_hash, created_at::text
        """
      )
    ) {
      statement.setBoolean(1, active);
      statement.setObject(2, userId);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? PublicUser.from(rowToUser(resultSet)) : null;
      }
    } catch (SQLException error) {
      throw storageError("Unable to update user status", error);
    }
  }

  public PublicUser deleteUser(String id) {
    UUID userId = requireUuid(id);
    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        delete from public.users
        where id = ?
        returning id::text, name, email, role, student_id, is_active, password_hash, created_at::text
        """
      )
    ) {
      statement.setObject(1, userId);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? PublicUser.from(rowToUser(resultSet)) : null;
      }
    } catch (SQLException error) {
      throw storageError("Unable to delete user", error);
    }
  }

  public PublicUser updateProfile(String id, String name, String email) {
    UUID userId = requireUuid(id);
    ensureReady();
    String normalizedEmail = normalizeEmail(email);

    if (normalizedEmail.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Email is required");
    }

    try (Connection connection = connection()) {
      if (emailExists(connection, normalizedEmail, userId)) {
        throw new ApiException(HttpStatus.CONFLICT, "Email already exists", Map.of("email", "Email already exists"));
      }

      try (PreparedStatement statement = connection.prepareStatement(
        """
        update public.users
        set name = ?, email = ?
        where id = ?
        returning id::text, name, email, role, student_id, is_active, password_hash, created_at::text
        """
      )) {
        statement.setString(1, normalizeNullable(name));
        statement.setString(2, normalizedEmail);
        statement.setObject(3, userId);
        try (ResultSet resultSet = statement.executeQuery()) {
          if (resultSet.next()) {
            return PublicUser.from(rowToUser(resultSet));
          }
        }
      }
    } catch (SQLException error) {
      throw storageError("Unable to update profile", error);
    }

    throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
  }

  public PublicUser changePassword(String id, String currentPassword, String newPassword) {
    UUID userId = requireUuid(id);
    ensureReady();
    User user = findRawById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

    if (!passwordMatches(user, currentPassword)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
    }

    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        update public.users
        set password_hash = ?
        where id = ?
        returning id::text, name, email, role, student_id, is_active, password_hash, created_at::text
        """
      )
    ) {
      statement.setString(1, passwordEncoder.encode(newPassword));
      statement.setObject(2, userId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          return PublicUser.from(rowToUser(resultSet));
        }
      }
    } catch (SQLException error) {
      throw storageError("Unable to change password", error);
    }

    throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
  }

  private synchronized void ensureReady() {
    if (ready) {
      return;
    }

    try (Connection connection = connection()) {
      ensureUsersTable(connection);
      migrateLegacyJsonUsers(connection);
      seedDemoUsersIfMissing(connection);
      upgradeLegacyDemoPasswords(connection);
      ready = true;
    } catch (SQLException error) {
      throw storageError("Unable to initialize users table", error);
    }
  }

  private void ensureUsersTable(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(
      """
      create table if not exists public.users (
        id uuid primary key,
        name text not null,
        email text not null,
        role text not null check (role in ('student', 'lecturer', 'admin')),
        student_id text,
        is_active boolean not null default true,
        password_hash text not null,
        created_at timestamptz not null default now()
      )
      """
    )) {
      statement.executeUpdate();
    }
  }

  private void migrateLegacyJsonUsers(Connection connection) throws SQLException {
    if (!legacyStoreExists(connection)) {
      return;
    }

    try (PreparedStatement statement = connection.prepareStatement("select data from public.app_json_store where store_key = 'users.json'")) {
      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return;
        }

        List<User> legacyUsers = objectMapper.readValue(resultSet.getString("data"), new TypeReference<>() {});
        for (User user : legacyUsers) {
          if (!isMigratable(user) || existsById(connection, uuid(user.getId())) || emailExists(connection, user.getEmail(), null)) {
            continue;
          }
          insertUser(connection, user);
        }
      }
    } catch (Exception error) {
      throw new SQLException("Unable to migrate legacy users.json store", error);
    }
  }

  private boolean legacyStoreExists(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("select to_regclass('public.app_json_store') is not null")) {
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() && resultSet.getBoolean(1);
      }
    }
  }

  private void seedDemoUsersIfMissing(Connection connection) throws SQLException {
    if (countUsers(connection) > 0) {
      ensureActiveAdminExists(connection);
      return;
    }

    insertUser(connection, demoUser("System Admin", null, "admin@example.com", UserRole.ADMIN, "admin123"));
    insertUser(connection, demoUser("Demo Lecturer", null, "lecturer@example.com", UserRole.LECTURER, "lecturer123"));
    insertUser(connection, demoUser("Demo Student", "STU-DEMO-001", "student@example.com", UserRole.STUDENT, "student123"));
  }

  private void upgradeLegacyDemoPasswords(Connection connection) throws SQLException {
    upgradeLegacyDemoPassword(connection, "admin@example.com", "admin123");
    upgradeLegacyDemoPassword(connection, "lecturer@example.com", "lecturer123");
    upgradeLegacyDemoPassword(connection, "student@example.com", "student123");
  }

  private void upgradeLegacyDemoPassword(Connection connection, String email, String desiredPassword) throws SQLException {
    try (PreparedStatement select = connection.prepareStatement(
      "select password_hash from public.users where lower(email) = lower(?) limit 1"
    )) {
      select.setString(1, email);
      try (ResultSet resultSet = select.executeQuery()) {
        if (!resultSet.next() || !passwordEncoder.matches("password123", resultSet.getString("password_hash"))) {
          return;
        }
      }
    }

    try (PreparedStatement update = connection.prepareStatement(
      "update public.users set password_hash = ? where lower(email) = lower(?)"
    )) {
      update.setString(1, passwordEncoder.encode(desiredPassword));
      update.setString(2, email);
      update.executeUpdate();
    }
  }

  private void ensureActiveAdminExists(Connection connection) throws SQLException {
    if (countActiveAdmins(connection) > 0) {
      return;
    }

    try (PreparedStatement statement = connection.prepareStatement(
      """
      update public.users
      set role = 'admin', is_active = true, password_hash = ?
      where lower(email) = lower('admin@example.com')
      """
    )) {
      statement.setString(1, passwordEncoder.encode("admin123"));
      if (statement.executeUpdate() > 0) {
        return;
      }
    }

    insertUser(connection, demoUser("System Admin", null, "admin@example.com", UserRole.ADMIN, "admin123"));
  }

  private User demoUser(String name, String studentId, String email, String role, String password) {
    User user = new User();
    user.setId(UUID.randomUUID().toString());
    user.setName(name);
    user.setStudentId(studentId);
    user.setEmail(email);
    user.setRole(role);
    user.setActive(true);
    user.setPasswordHash(passwordEncoder.encode(password));
    return user;
  }

  private void insertUser(Connection connection, User user) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(
      """
      insert into public.users (id, name, email, role, student_id, is_active, password_hash, created_at)
      values (?, ?, ?, ?, ?, ?, ?, coalesce(?::timestamptz, now()))
      on conflict (id) do nothing
      """
    )) {
      statement.setObject(1, requireUuid(user.getId()));
      statement.setString(2, normalizeNullable(user.getName()));
      statement.setString(3, normalizeEmail(user.getEmail()));
      statement.setString(4, UserRole.normalize(user.getRole()));
      statement.setString(5, blankToNull(user.getStudentId()));
      statement.setBoolean(6, user.isActive());
      statement.setString(7, user.getPasswordHash());
      statement.setString(8, blankToNull(user.getCreatedAt()));
      statement.executeUpdate();
    }
  }

  private long countUsers(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("select count(*) from public.users")) {
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? resultSet.getLong(1) : 0;
      }
    }
  }

  private long countActiveAdmins(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("select count(*) from public.users where role = 'admin' and is_active = true")) {
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? resultSet.getLong(1) : 0;
      }
    }
  }

  private boolean existsById(Connection connection, UUID id) throws SQLException {
    if (id == null) {
      return false;
    }

    try (PreparedStatement statement = connection.prepareStatement("select 1 from public.users where id = ? limit 1")) {
      statement.setObject(1, id);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next();
      }
    }
  }

  private boolean emailExists(Connection connection, String email, UUID excludedId) throws SQLException {
    String normalizedEmail = normalizeEmail(email);
    if (normalizedEmail.isBlank()) {
      return false;
    }

    String sql = excludedId == null
      ? "select 1 from public.users where lower(email) = lower(?) limit 1"
      : "select 1 from public.users where lower(email) = lower(?) and id <> ? limit 1";

    try (PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, normalizedEmail);
      if (excludedId != null) {
        statement.setObject(2, excludedId);
      }
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next();
      }
    }
  }

  private boolean studentIdExists(Connection connection, String studentId, UUID excludedId) throws SQLException {
    String normalizedStudentId = normalizeNullable(studentId);
    if (normalizedStudentId.isBlank()) {
      return false;
    }

    String sql = excludedId == null
      ? "select 1 from public.users where lower(student_id) = lower(?) limit 1"
      : "select 1 from public.users where lower(student_id) = lower(?) and id <> ? limit 1";

    try (PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, normalizedStudentId);
      if (excludedId != null) {
        statement.setObject(2, excludedId);
      }
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next();
      }
    }
  }

  private User rowToUser(ResultSet resultSet) throws SQLException {
    User user = new User();
    user.setId(resultSet.getString("id"));
    user.setName(resultSet.getString("name"));
    user.setEmail(resultSet.getString("email"));
    user.setRole(resultSet.getString("role"));
    user.setStudentId(resultSet.getString("student_id"));
    user.setActive(resultSet.getBoolean("is_active"));
    user.setPasswordHash(resultSet.getString("password_hash"));
    user.setCreatedAt(resultSet.getString("created_at"));
    return user;
  }

  private boolean isMigratable(User user) {
    return user != null
      && uuid(user.getId()) != null
      && !normalizeNullable(user.getName()).isBlank()
      && !normalizeEmail(user.getEmail()).isBlank()
      && UserRole.isValid(user.getRole())
      && !normalizeNullable(user.getPasswordHash()).isBlank();
  }

  private Connection connection() throws SQLException {
    return DatabaseSupport.connection(DatabaseSupport.databaseUrl());
  }

  private UUID requireUuid(String value) {
    UUID uuid = uuid(value);
    if (uuid == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid user ID");
    }
    return uuid;
  }

  private UUID uuid(String value) {
    String trimmed = normalizeNullable(value);
    if (trimmed.isBlank()) {
      return null;
    }
    try {
      return UUID.fromString(trimmed);
    } catch (IllegalArgumentException error) {
      return null;
    }
  }

  private String normalizeEmail(String email) {
    return normalizeNullable(email).toLowerCase();
  }

  private String normalizeNullable(String value) {
    return value == null ? "" : value.trim();
  }

  private String blankToNull(String value) {
    String normalized = normalizeNullable(value);
    return normalized.isBlank() ? null : normalized;
  }

  private IllegalStateException storageError(String message, Exception error) {
    if (DatabaseSupport.isConnectivityError(error)) {
      return new DatabaseConnectionException(
        "Database connection failed. Check DATABASE_URL, Supabase network access, and whether you are using the Supabase pooler connection string.",
        error
      );
    }
    return new IllegalStateException(message, error);
  }
}
