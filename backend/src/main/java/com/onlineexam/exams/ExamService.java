package com.onlineexam.exams;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.common.DatabaseConnectionException;
import com.onlineexam.common.DatabaseSupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ExamService {
  private final ObjectMapper objectMapper;
  private volatile boolean ready;

  public ExamService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public List<PublicExam> listForLecturer(String lecturerId) {
    UUID lecturerUuid = uuid(lecturerId);
    if (lecturerUuid == null) {
      return List.of();
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        select *
        from public.exams
        where created_by = ?
        order by created_at desc
        """
      )
    ) {
      statement.setObject(1, lecturerUuid);
      return publicRows(statement);
    } catch (SQLException error) {
      throw storageError("Unable to list lecturer exams", error);
    }
  }

  public List<PublicExam> listAllPublic() {
    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        select *
        from public.exams
        order by created_at desc
        """
      )
    ) {
      return publicRows(statement);
    } catch (SQLException error) {
      throw storageError("Unable to list exams", error);
    }
  }

  public List<PublicExam> listActive() {
    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        select *
        from public.exams
        where status = 'Active'
        order by start_at nulls first, created_at desc
        """
      )
    ) {
      return publicRows(statement);
    } catch (SQLException error) {
      throw storageError("Unable to list active exams", error);
    }
  }

  public Optional<PublicExam> findPublicById(String id) {
    return findRawById(id).map(PublicExam::from);
  }

  public Optional<Exam> findRawById(String id) {
    UUID examUuid = uuid(id);
    if (examUuid == null) {
      return Optional.empty();
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        select *
        from public.exams
        where id = ?
        limit 1
        """
      )
    ) {
      statement.setObject(1, examUuid);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? Optional.of(rowToExam(resultSet)) : Optional.empty();
      }
    } catch (SQLException error) {
      throw storageError("Unable to find exam", error);
    }
  }

  public PublicExam create(String lecturerId, ExamValues values) {
    UUID lecturerUuid = uuid(lecturerId);
    if (lecturerUuid == null) {
      throw new IllegalStateException("Invalid lecturer ID");
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        insert into public.exams (
          id, title, subject, description, status, created_by,
          duration_mins, pass_mark, created_at, updated_at
        )
        values (?, ?, ?, ?, 'Draft', ?, ?, ?, now(), now())
        returning *
        """
      )
    ) {
      statement.setObject(1, UUID.randomUUID());
      statement.setString(2, values.title());
      statement.setString(3, values.subject());
      statement.setString(4, blankToNull(values.description()));
      statement.setObject(5, lecturerUuid);
      statement.setDouble(6, values.durationMinutes());
      statement.setDouble(7, values.passMark());

      try (ResultSet resultSet = statement.executeQuery()) {
        resultSet.next();
        return PublicExam.from(rowToExam(resultSet));
      }
    } catch (SQLException error) {
      throw storageError("Unable to create exam", error);
    }
  }

  public PublicExam updateSettings(String id, ExamValues values) {
    UUID examUuid = uuid(id);
    if (examUuid == null) {
      return null;
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        update public.exams
        set title = ?,
            subject = ?,
            duration_mins = ?,
            pass_mark = ?,
            description = ?,
            updated_at = now()
        where id = ?
        returning *
        """
      )
    ) {
      statement.setString(1, values.title());
      statement.setString(2, values.subject());
      statement.setDouble(3, values.durationMinutes());
      statement.setDouble(4, values.passMark());
      statement.setString(5, blankToNull(values.description()));
      statement.setObject(6, examUuid);

      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? PublicExam.from(rowToExam(resultSet)) : null;
      }
    } catch (SQLException error) {
      throw storageError("Unable to update exam settings", error);
    }
  }

  public PublicExam updateStatus(String id, String status, String startAt, String endAt) {
    UUID examUuid = uuid(id);
    if (examUuid == null) {
      return null;
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        update public.exams
        set status = ?,
            start_at = coalesce(?::timestamptz, start_at),
            end_at = coalesce(?::timestamptz, end_at),
            updated_at = now()
        where id = ?
        returning *
        """
      )
    ) {
      statement.setString(1, status);
      statement.setString(2, blankToNull(startAt));
      statement.setString(3, blankToNull(endAt));
      statement.setObject(4, examUuid);

      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? PublicExam.from(rowToExam(resultSet)) : null;
      }
    } catch (SQLException error) {
      throw storageError("Unable to update exam status", error);
    }
  }

  public PublicExam delete(String id) {
    UUID examUuid = uuid(id);
    if (examUuid == null) {
      return null;
    }

    ensureReady();
    try (
      Connection connection = connection();
      PreparedStatement statement = connection.prepareStatement(
        """
        delete from public.exams
        where id = ?
        returning *
        """
      )
    ) {
      statement.setObject(1, examUuid);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? PublicExam.from(rowToExam(resultSet)) : null;
      }
    } catch (SQLException error) {
      throw storageError("Unable to delete exam", error);
    }
  }

  private synchronized void ensureReady() {
    if (ready) {
      return;
    }

    try (Connection connection = connection()) {
      ensureExamsTable(connection);
      migrateLegacyJsonExams(connection);
      ready = true;
    } catch (SQLException error) {
      throw storageError("Unable to initialize exams table", error);
    }
  }

  private void ensureExamsTable(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(
      """
      create table if not exists public.exams (
        id uuid primary key default gen_random_uuid(),
        title text not null,
        subject text not null,
        description text,
        status text not null default 'Draft' check (status in ('Draft', 'Active', 'Inactive', 'Archived')),
        created_by uuid,
        duration_mins numeric not null check (duration_mins > 0),
        pass_mark numeric not null default 0 check (pass_mark >= 0),
        start_at timestamptz,
        end_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
      """
    )) {
      statement.executeUpdate();
    }
  }

  private void migrateLegacyJsonExams(Connection connection) throws SQLException {
    if (!legacyStoreExists(connection) || !usersTableExists(connection)) {
      return;
    }

    try (PreparedStatement statement = connection.prepareStatement("select data from public.app_json_store where store_key = 'exams.json'")) {
      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return;
        }

        List<Exam> legacyExams = objectMapper.readValue(resultSet.getString("data"), new TypeReference<>() {});
        for (Exam exam : legacyExams) {
          if (isMigratable(exam) && userExists(connection, uuid(exam.getCreatedBy()))) {
            insertMigratedExam(connection, exam);
          }
        }
      }
    } catch (Exception error) {
      throw new SQLException("Unable to migrate legacy exams.json store", error);
    }
  }

  private boolean legacyStoreExists(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("select to_regclass('public.app_json_store') is not null")) {
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() && resultSet.getBoolean(1);
      }
    }
  }

  private boolean usersTableExists(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("select to_regclass('public.users') is not null")) {
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() && resultSet.getBoolean(1);
      }
    }
  }

  private boolean userExists(Connection connection, UUID userId) throws SQLException {
    if (userId == null) {
      return false;
    }

    try (PreparedStatement statement = connection.prepareStatement("select exists(select 1 from public.users where id = ?)")) {
      statement.setObject(1, userId);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() && resultSet.getBoolean(1);
      }
    }
  }

  private void insertMigratedExam(Connection connection, Exam exam) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(
      """
      insert into public.exams (
        id, title, subject, description, status, created_by,
        duration_mins, pass_mark, start_at, end_at, created_at, updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?::timestamptz, ?::timestamptz, coalesce(?::timestamptz, now()), coalesce(?::timestamptz, now()))
      on conflict (id) do nothing
      """
    )) {
      statement.setObject(1, uuid(exam.getId()));
      statement.setString(2, exam.getTitle().trim());
      statement.setString(3, exam.getSubject().trim());
      statement.setString(4, blankToNull(exam.getDescription()));
      statement.setString(5, normalizeStatus(exam.getStatus()));
      statement.setObject(6, uuid(exam.getCreatedBy()));
      statement.setDouble(7, exam.getDurationMinutes());
      statement.setDouble(8, exam.getPassMark());
      statement.setString(9, instantStringOrNull(exam.getStartAt()));
      statement.setString(10, instantStringOrNull(exam.getEndAt()));
      statement.setString(11, instantStringOrNull(exam.getCreatedAt()));
      statement.setString(12, instantStringOrNull(exam.getUpdatedAt()));
      statement.executeUpdate();
    }
  }

  private boolean isMigratable(Exam exam) {
    return exam != null
      && uuid(exam.getId()) != null
      && uuid(exam.getCreatedBy()) != null
      && exam.getTitle() != null
      && !exam.getTitle().isBlank()
      && exam.getSubject() != null
      && !exam.getSubject().isBlank()
      && isValidStatus(exam.getStatus())
      && exam.getDurationMinutes() > 0
      && exam.getPassMark() >= 0;
  }

  private List<PublicExam> publicRows(PreparedStatement statement) throws SQLException {
    try (ResultSet resultSet = statement.executeQuery()) {
      java.util.ArrayList<PublicExam> exams = new java.util.ArrayList<>();
      while (resultSet.next()) {
        exams.add(PublicExam.from(rowToExam(resultSet)));
      }
      return exams;
    }
  }

  private Exam rowToExam(ResultSet resultSet) throws SQLException {
    Exam exam = new Exam();
    exam.setId(resultSet.getString("id"));
    exam.setTitle(resultSet.getString("title"));
    exam.setSubject(resultSet.getString("subject"));
    exam.setDescription(resultSet.getString("description"));
    exam.setStatus(resultSet.getString("status"));
    exam.setCreatedBy(resultSet.getString("created_by"));
    exam.setDurationMinutes(resultSet.getDouble("duration_mins"));
    exam.setPassMark(resultSet.getDouble("pass_mark"));
    exam.setStartAt(timestampToIso(resultSet.getTimestamp("start_at")));
    exam.setEndAt(timestampToIso(resultSet.getTimestamp("end_at")));
    exam.setCreatedAt(timestampToIso(resultSet.getTimestamp("created_at")));
    exam.setUpdatedAt(timestampToIso(resultSet.getTimestamp("updated_at")));
    return exam;
  }

  private Connection connection() throws SQLException {
    return DatabaseSupport.connection(DatabaseSupport.databaseUrl());
  }

  private UUID uuid(String value) {
    String trimmed = value == null ? "" : value.trim();
    if (trimmed.isBlank()) {
      return null;
    }
    try {
      return UUID.fromString(trimmed);
    } catch (IllegalArgumentException error) {
      return null;
    }
  }

  private String normalizeStatus(String value) {
    return isValidStatus(value) ? value.trim() : "Draft";
  }

  private boolean isValidStatus(String value) {
    return List.of("Draft", "Active", "Inactive", "Archived").contains(value == null ? "" : value.trim());
  }

  private String blankToNull(String value) {
    String normalized = value == null ? "" : value.trim();
    return normalized.isBlank() ? null : normalized;
  }

  private String instantStringOrNull(String value) {
    String normalized = blankToNull(value);
    if (normalized == null) {
      return null;
    }
    try {
      return Instant.parse(normalized).toString();
    } catch (DateTimeParseException error) {
      return null;
    }
  }

  private String timestampToIso(Timestamp timestamp) {
    return timestamp == null ? null : timestamp.toInstant().toString();
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
