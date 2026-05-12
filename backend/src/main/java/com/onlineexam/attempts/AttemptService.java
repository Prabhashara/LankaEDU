package com.onlineexam.attempts;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.common.JsonFileStore;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AttemptService {
  private final JsonFileStore<Attempt> store;

  public AttemptService(ObjectMapper objectMapper) {
    this.store = new JsonFileStore<>(Path.of("src/data/attempts.json"), objectMapper, new TypeReference<>() {
    });
  }

  public boolean hasAttempted(String studentId, String examId) {
    return findByStudentAndExam(studentId, examId).isPresent();
  }

  public Optional<Attempt> findByStudentAndExam(String studentId, String examId) {
    return store.readAll().stream()
        .filter(attempt -> studentId.equals(attempt.getStudentId()) && examId.equals(attempt.getExamId()))
        .findFirst();
  }

  public Attempt create(String studentId, String examId) {
    List<Attempt> attempts = new ArrayList<>(store.readAll());
    Attempt attempt = new Attempt();
    attempt.setId(UUID.randomUUID().toString());
    attempt.setStudentId(studentId);
    attempt.setExamId(examId);
    attempt.setStatus("in_progress");
    attempt.setCreatedAt(Instant.now().toString());

    attempts.add(attempt);
    store.writeAll(attempts);
    return attempt;
  }

  public Optional<Attempt> findById(String id) {
    return store.readAll().stream().filter(attempt -> id.equals(attempt.getId())).findFirst();
  }

  public Attempt saveAnswers(String attemptId, java.util.Map<String, String> answers) {
    List<Attempt> attempts = new ArrayList<>(store.readAll());
    for (Attempt attempt : attempts) {
      if (attemptId.equals(attempt.getId())) {
        if ("submitted".equals(attempt.getStatus())) {
          return null;
        }
        attempt.setAnswers(answers);
        store.writeAll(attempts);
        return attempt;
      }
    }
    return null;
  }

  public Attempt submit(String attemptId, Map<String, String> answers, String resultId, String submittedAt) {
    List<Attempt> attempts = new ArrayList<>(store.readAll());
    for (Attempt attempt : attempts) {
      if (attemptId.equals(attempt.getId())) {
        if ("submitted".equals(attempt.getStatus())) {
          return attempt;
        }
        attempt.setAnswers(answers);
        attempt.setStatus("submitted");
        attempt.setSubmittedAt(submittedAt == null ? Instant.now().toString() : submittedAt);
        attempt.setResultId(resultId);
        store.writeAll(attempts);
        return attempt;
      }
    }
    return null;
  }
}
