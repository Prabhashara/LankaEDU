package com.onlineexam.exams;

import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exams")
public class ExamController {
  private final ExamService examService;

  public ExamController(ExamService examService) {
    this.examService = examService;
  }

  @GetMapping
  public Map<String, Object> list(HttpServletRequest request) {
    UserPrincipal user = AuthSupport.currentUser(request);
    if ("student".equals(user.role())) {
      return Map.of("exams", examService.listActive());
    }
    return Map.of("exams", examService.listForLecturer(user.id()));
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> create(HttpServletRequest request, @RequestBody Map<String, Object> body) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    ExamValues values = validateExam(body);
    PublicExam exam = examService.create(user.id(), values);
    return ResponseEntity.status(201).body(Map.of("message", "Exam created", "exam", exam));
  }

  @GetMapping("/{id}")
  public Map<String, Object> detail(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.currentUser(request);
    PublicExam exam = examService.findPublicById(id).orElse(null);
    boolean canView = exam != null && (exam.createdBy().equals(user.id()) || ("student".equals(user.role()) && "Active".equals(exam.status())));

    if (!canView) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Exam not found");
    }

    return Map.of("exam", exam);
  }

  @PatchMapping("/{id}")
  public Map<String, Object> patch(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> body) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicExam exam = examService.findPublicById(id).orElse(null);

    if (exam == null || !exam.createdBy().equals(user.id())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Exam not found");
    }

    String status = trim(body.get("status"));
    if ("Active".equals(status)) {
      if (!"Draft".equals(exam.status())) {
        throw new ApiException(HttpStatus.CONFLICT, "Only draft exams can be published");
      }

      ScheduleValues schedule = validateSchedule(body);
      PublicExam updatedExam = examService.updateStatus(id, "Active", schedule.startAt(), schedule.endAt());
      return Map.of("message", "Exam published", "exam", updatedExam);
    }

    if ("Archived".equals(status)) {
      if (!"Active".equals(exam.status())) {
        throw new ApiException(HttpStatus.CONFLICT, "Only active exams can be archived");
      }

      Instant end = parseInstant(exam.endAt());
      if (end == null || end.isAfter(Instant.now())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Exam can only be archived after it ends");
      }

      PublicExam updatedExam = examService.updateStatus(id, "Archived", null, null);
      return Map.of("message", "Exam archived", "exam", updatedExam);
    }

    if (!"Draft".equals(exam.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "Only draft exams can be edited");
    }

    ExamValues values = validateExam(body);
    PublicExam updatedExam = examService.updateSettings(id, values);
    return Map.of("message", "Exam updated", "exam", updatedExam);
  }

  private ExamValues validateExam(Map<String, Object> body) {
    Map<String, String> errors = new LinkedHashMap<>();
    String title = trim(body.get("title"));
    String subject = trim(body.get("subject"));
    Double durationMinutes = number(body.get("durationMinutes"));
    if (durationMinutes == null) {
      durationMinutes = number(body.get("duration"));
    }
    Double passMark = number(body.get("passMark"));
    String description = trim(body.get("description"));

    if (title.isBlank()) errors.put("title", "Title is required");
    if (subject.isBlank()) errors.put("subject", "Subject is required");
    if (durationMinutes == null || durationMinutes <= 0) {
      errors.put("durationMinutes", "Duration must be a positive number in minutes");
    }
    if (passMark == null || passMark < 1 || passMark > 100) {
      errors.put("passMark", "Pass mark must be between 1 and 100");
    }

    if (!errors.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    return new ExamValues(title, subject, durationMinutes, passMark, description);
  }

  private ScheduleValues validateSchedule(Map<String, Object> body) {
    Map<String, String> errors = new LinkedHashMap<>();
    String startValue = first(body, "start_at", "startAt");
    String endValue = first(body, "end_at", "endAt");
    Instant start = parseInstant(startValue);
    Instant end = parseInstant(endValue);
    Instant now = Instant.now();

    if (startValue.isBlank()) {
      errors.put("startAt", "Start datetime is required");
    } else if (start == null) {
      errors.put("startAt", "Enter a valid start datetime");
    } else if (!start.isAfter(now)) {
      errors.put("startAt", "Start datetime must be in the future");
    }

    if (endValue.isBlank()) {
      errors.put("endAt", "End datetime is required");
    } else if (end == null) {
      errors.put("endAt", "Enter a valid end datetime");
    } else if (start != null && !end.isAfter(start)) {
      errors.put("endAt", "End datetime must be after start datetime");
    }

    if (!errors.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    return new ScheduleValues(start.toString(), end.toString());
  }

  private String first(Map<String, Object> body, String firstKey, String secondKey) {
    String first = trim(body.get(firstKey));
    return first.isBlank() ? trim(body.get(secondKey)) : first;
  }

  private Instant parseInstant(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return Instant.parse(value);
    } catch (DateTimeParseException error) {
      return null;
    }
  }

  private Double number(Object value) {
    if (value instanceof Number number) {
      return number.doubleValue();
    }
    if (value == null || String.valueOf(value).isBlank()) {
      return null;
    }
    try {
      return Double.parseDouble(String.valueOf(value));
    } catch (NumberFormatException error) {
      return null;
    }
  }

  private String trim(Object value) {
    return value == null ? "" : String.valueOf(value).trim();
  }
}
