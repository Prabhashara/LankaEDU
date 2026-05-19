package com.onlineexam.exams;

import com.onlineexam.audit.AuditService;
import com.onlineexam.attempts.AttemptService;
import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import com.onlineexam.common.RequestBodySupport;
import com.onlineexam.questions.PublicQuestion;
import com.onlineexam.questions.Question;
import com.onlineexam.questions.QuestionService;
import com.onlineexam.results.Result;
import com.onlineexam.results.ResultService;
import com.onlineexam.users.User;
import com.onlineexam.users.UserService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
  private final QuestionService questionService;
  private final AttemptService attemptService;
  private final ResultService resultService;
  private final UserService userService;
  private final AuditService auditService;

  public ExamController(
    ExamService examService,
    QuestionService questionService,
    AttemptService attemptService,
    ResultService resultService,
    UserService userService,
    AuditService auditService
  ) {
    this.examService = examService;
    this.questionService = questionService;
    this.attemptService = attemptService;
    this.resultService = resultService;
    this.userService = userService;
    this.auditService = auditService;
  }

  @GetMapping
  public Map<String, Object> list(HttpServletRequest request, @RequestParam(value = "status", required = false) String status) {
    UserPrincipal user = AuthSupport.currentUser(request);
    if ("student".equals(user.role())) {
      List<AvailableExam> exams = examService.listActive().stream()
        .map(exam -> AvailableExam.from(exam, questionService.countForExam(exam.id()), attemptService.findByStudentAndExam(user.id(), exam.id()).orElse(null)))
        .toList();
      return Map.of("exams", exams);
    }

    List<PublicExam> exams = examService.listForLecturer(user.id());
    if (!trim(status).isBlank()) {
      exams = exams.stream().filter(exam -> trim(status).equals(exam.status())).toList();
    }
    return Map.of("exams", exams);
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> create(HttpServletRequest request, @RequestBody Map<String, Object> body) {
    body = RequestBodySupport.emptyIfNull(body);
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    ExamValues values = validateExam(body);
    PublicExam exam = examService.create(user.id(), values);
    auditService.record(user, "EXAM_CREATED", "exam", exam.id(), "Exam created", Map.of("title", exam.title(), "subject", exam.subject()));
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

  @GetMapping("/{id}/results")
  public Map<String, Object> results(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicExam exam = findOwnedExam(id, user);

    if (!canViewResults(exam)) {
      throw new ApiException(HttpStatus.CONFLICT, "Results are available after the exam ends.");
    }

    List<Map<String, Object>> rows = resultService.listByExam(id).stream()
      .map(this::resultRow)
      .toList();

    return Map.of(
      "exam", exam,
      "results", rows,
      "summary", summary(rows)
    );
  }

  @PostMapping("/{id}/questions/{questionId}")
  public ResponseEntity<Map<String, Object>> linkQuestion(
    HttpServletRequest request,
    @PathVariable String id,
    @PathVariable String questionId
  ) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicExam exam = findOwnedExam(id, user);

    if (!"Draft".equals(exam.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "Questions can only be added before publishing");
    }

    Question sourceQuestion = questionService.findRawById(questionId).orElse(null);
    if (sourceQuestion == null || !sourceQuestion.getCreatedBy().equals(user.id())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Question not found");
    }

    findOwnedExam(sourceQuestion.getExamId(), user);

    if (questionService.isDuplicateOnExam(exam.id(), sourceQuestion)) {
      throw new ApiException(HttpStatus.CONFLICT, "Question already exists on this exam");
    }

    PublicQuestion question = questionService.linkToExam(exam.id(), sourceQuestion, user.id());
    auditService.record(user, "QUESTION_REUSED", "question", question.id(), "Question reused from bank", Map.of("examId", exam.id()));
    return ResponseEntity.status(201).body(Map.of("message", "Question added to exam", "question", question));
  }

  @PatchMapping("/{id}")
  public Map<String, Object> patch(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> body) {
    body = RequestBodySupport.emptyIfNull(body);
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

      if (questionService.countForExam(id) == 0) {
        throw new ApiException(HttpStatus.CONFLICT, "Add at least one question before publishing");
      }

      ScheduleValues schedule = validateSchedule(body);
      PublicExam updatedExam = examService.updateStatus(id, "Active", schedule.startAt(), schedule.endAt());
      auditService.record(user, "EXAM_PUBLISHED", "exam", id, "Exam published", Map.of("startAt", schedule.startAt(), "endAt", schedule.endAt()));
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
      auditService.record(user, "EXAM_ARCHIVED", "exam", id, "Exam archived");
      return Map.of("message", "Exam archived", "exam", updatedExam);
    }

    if (!"Draft".equals(exam.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "Only draft exams can be edited");
    }

    ExamValues values = validateExam(body);
    PublicExam updatedExam = examService.updateSettings(id, values);
    auditService.record(user, "EXAM_UPDATED", "exam", id, "Exam settings updated", Map.of("title", updatedExam.title(), "subject", updatedExam.subject()));
    return Map.of("message", "Exam updated", "exam", updatedExam);
  }

  @DeleteMapping("/{id}")
  public Map<String, Object> delete(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicExam exam = findOwnedExam(id, user);

    if (!"Draft".equals(exam.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "Only draft exams can be deleted");
    }

    if (attemptService.hasForExam(id) || !resultService.listByExam(id).isEmpty()) {
      throw new ApiException(HttpStatus.CONFLICT, "Exam cannot be deleted because it already has student activity");
    }

    int questionCount = questionService.deleteForExam(id);
    PublicExam deletedExam = examService.delete(id);
    auditService.record(
      user,
      "EXAM_DELETED",
      "exam",
      id,
      "Exam deleted",
      Map.of("title", exam.title(), "questionCount", questionCount)
    );
    return Map.of("message", "Exam deleted", "exam", deletedExam);
  }

  private PublicExam findOwnedExam(String id, UserPrincipal user) {
    PublicExam exam = examService.findPublicById(id).orElse(null);
    if (exam == null || !exam.createdBy().equals(user.id())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Exam not found");
    }
    return exam;
  }

  private boolean canViewResults(PublicExam exam) {
    if ("Archived".equals(exam.status())) {
      return true;
    }

    Instant end = parseInstant(exam.endAt());
    return end != null && !end.isAfter(Instant.now());
  }

  private Map<String, Object> resultRow(Result result) {
    User student = userService.findRawById(result.getStudentId()).orElse(null);
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("resultId", result.getId());
    row.put("attemptId", result.getAttemptId());
    row.put("studentId", result.getStudentId());
    row.put("studentName", student == null ? "Unknown student" : student.getName());
    row.put("studentNumber", student == null || student.getStudentId() == null ? "" : student.getStudentId());
    row.put("score", result.getTotalScore());
    row.put("maxScore", result.getMaxScore());
    row.put("percentage", result.getPercentage());
    row.put("grade", result.getGrade());
    row.put("passed", result.isPassed());
    row.put("submittedAt", result.getPublishedAt());
    return row;
  }

  private Map<String, Object> summary(List<Map<String, Object>> rows) {
    int count = rows.size();
    double average = count == 0 ? 0 : rows.stream().mapToDouble(row -> numberValue(row.get("percentage"))).average().orElse(0);
    double passRate = count == 0 ? 0 : rows.stream().filter(row -> Boolean.TRUE.equals(row.get("passed"))).count() * 100.0 / count;
    double highestScore = rows.stream().mapToDouble(row -> numberValue(row.get("score"))).max().orElse(0);
    double lowestScore = rows.stream().mapToDouble(row -> numberValue(row.get("score"))).min().orElse(0);

    return Map.of(
      "attemptCount", count,
      "classAverage", round2(average),
      "passRate", round2(passRate),
      "highestScore", round2(highestScore),
      "lowestScore", round2(lowestScore)
    );
  }

  private double numberValue(Object value) {
    return value instanceof Number number ? number.doubleValue() : 0;
  }

  private double round2(double value) {
    return Math.round(value * 100.0) / 100.0;
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
