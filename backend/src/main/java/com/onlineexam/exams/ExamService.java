package com.onlineexam.exams;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.common.JsonFileStore;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ExamService {
  private final JsonFileStore<Exam> store;

  public ExamService(ObjectMapper objectMapper) {
    this.store = new JsonFileStore<>("exams.json", objectMapper, new TypeReference<>() {});
  }

  public List<PublicExam> listForLecturer(String lecturerId) {
    return store.readAll().stream()
      .filter(exam -> lecturerId.equals(exam.getCreatedBy()))
      .map(PublicExam::from)
      .toList();
  }

  public List<PublicExam> listAllPublic() {
    return store.readAll().stream()
      .map(PublicExam::from)
      .toList();
  }

  public List<PublicExam> listActive() {
    return store.readAll().stream()
      .filter(exam -> "Active".equals(exam.getStatus()))
      .map(PublicExam::from)
      .toList();
  }

  public Optional<PublicExam> findPublicById(String id) {
    return findRawById(id).map(PublicExam::from);
  }

  public Optional<Exam> findRawById(String id) {
    return store.readAll().stream().filter(exam -> id.equals(exam.getId())).findFirst();
  }

  public PublicExam create(String lecturerId, ExamValues values) {
    List<Exam> exams = new ArrayList<>(store.readAll());
    String now = Instant.now().toString();

    Exam exam = new Exam();
    exam.setId(UUID.randomUUID().toString());
    exam.setCreatedBy(lecturerId);
    exam.setTitle(values.title());
    exam.setSubject(values.subject());
    exam.setDurationMinutes(values.durationMinutes());
    exam.setPassMark(values.passMark());
    exam.setDescription(values.description());
    exam.setStatus("Draft");
    exam.setCreatedAt(now);
    exam.setUpdatedAt(now);

    exams.add(exam);
    store.writeAll(exams);
    return PublicExam.from(exam);
  }

  public PublicExam updateSettings(String id, ExamValues values) {
    List<Exam> exams = new ArrayList<>(store.readAll());
    for (Exam exam : exams) {
      if (id.equals(exam.getId())) {
        exam.setTitle(values.title());
        exam.setSubject(values.subject());
        exam.setDurationMinutes(values.durationMinutes());
        exam.setPassMark(values.passMark());
        exam.setDescription(values.description());
        exam.setUpdatedAt(Instant.now().toString());
        store.writeAll(exams);
        return PublicExam.from(exam);
      }
    }
    return null;
  }

  public PublicExam updateStatus(String id, String status, String startAt, String endAt) {
    List<Exam> exams = new ArrayList<>(store.readAll());
    for (Exam exam : exams) {
      if (id.equals(exam.getId())) {
        exam.setStatus(status);
        if (startAt != null) {
          exam.setStartAt(startAt);
        }
        if (endAt != null) {
          exam.setEndAt(endAt);
        }
        exam.setUpdatedAt(Instant.now().toString());
        store.writeAll(exams);
        return PublicExam.from(exam);
      }
    }
    return null;
  }

  public PublicExam delete(String id) {
    List<Exam> exams = new ArrayList<>(store.readAll());
    Exam found = null;

    for (Exam exam : exams) {
      if (id.equals(exam.getId())) {
        found = exam;
        break;
      }
    }

    if (found == null) {
      return null;
    }

    exams.remove(found);
    store.writeAll(exams);
    return PublicExam.from(found);
  }
}
