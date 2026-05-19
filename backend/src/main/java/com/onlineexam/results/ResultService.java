package com.onlineexam.results;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.common.JsonFileStore;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ResultService {
  private final JsonFileStore<Result> store;

  public ResultService(ObjectMapper objectMapper) {
    this.store = new JsonFileStore<>("results.json", objectMapper, new TypeReference<>() {});
  }

  public Optional<Result> findById(String id) {
    return store.readAll().stream().filter(result -> id.equals(result.getId())).findFirst();
  }

  public Optional<Result> findByAttemptId(String attemptId) {
    return store.readAll().stream().filter(result -> attemptId.equals(result.getAttemptId())).findFirst();
  }

  public List<Result> listAll() {
    return store.readAll();
  }

  public List<Result> listByExam(String examId) {
    return store.readAll().stream()
      .filter(result -> examId.equals(result.getExamId()))
      .toList();
  }

  public List<Result> listByStudent(String studentId) {
    return store.readAll().stream()
      .filter(result -> studentId.equals(result.getStudentId()))
      .toList();
  }

  public Result save(Result result) {
    List<Result> results = new ArrayList<>(store.readAll());
    results.removeIf(existing -> existing.getId().equals(result.getId()) || existing.getAttemptId().equals(result.getAttemptId()));
    results.add(result);
    store.writeAll(results);
    return result;
  }
}
