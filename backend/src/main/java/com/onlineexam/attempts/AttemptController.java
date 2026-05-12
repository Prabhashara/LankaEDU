package com.onlineexam.attempts;

import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import com.onlineexam.exams.ExamService;
import com.onlineexam.questions.AttemptQuestion;
import com.onlineexam.questions.Question;
import com.onlineexam.questions.QuestionService;
import com.onlineexam.results.Result;
import com.onlineexam.results.ResultAnswer;
import com.onlineexam.results.ResultService;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.Duration;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attempts")
public class AttemptController {
  private final AttemptService attemptService;
  private final ExamService examService;
  private final QuestionService questionService;
  private final ResultService resultService;

  public AttemptController(AttemptService attemptService, ExamService examService, QuestionService questionService,
      ResultService resultService) {
    this.attemptService = attemptService;
    this.examService = examService;
    this.questionService = questionService;
    this.resultService = resultService;
  }

  @PostMapping
  public ResponseEntity<Map<String, Object>> createAttempt(HttpServletRequest request,
      @RequestBody Map<String, String> body) {
    UserPrincipal user = AuthSupport.requireRole(request, "student");
    String examId = body.get("exam_id");

    if (examId == null || examId.trim().isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "exam_id is required");
    }

    var exam = examService.findPublicById(examId).orElse(null);
    if (exam == null || !"Active".equals(exam.status())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Exam not found or not available");
    }

    Instant now = Instant.now();
    Instant startAt = parseInstant(exam.startAt());
    Instant endAt = parseInstant(exam.endAt());
    if ((startAt != null && startAt.isAfter(now)) || (endAt != null && !endAt.isAfter(now))) {
      throw new ApiException(HttpStatus.CONFLICT, "Exam is not available right now");
    }

    List<AttemptQuestion> questions = new java.util.ArrayList<>(questionService.listForAttempt(examId));
    if (questions.isEmpty()) {
      throw new ApiException(HttpStatus.CONFLICT, "Exam has no questions");
    }

    Attempt attempt = attemptService.create(user.id(), examId);

    Collections.shuffle(questions);

    return ResponseEntity.status(201).body(
        Map.of(
            "message", "Attempt created",
            "attempt_id", attempt.getId(),
            "duration_minutes", exam.durationMinutes(),
            "questions", questions));
  }

  @GetMapping("/{id}")
  public Map<String, Object> getAttempt(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.requireRole(request, "student");
    Attempt attempt = attemptService.findById(id).orElse(null);

    if (attempt == null || !attempt.getStudentId().equals(user.id())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Attempt not found");
    }

    return Map.of("attempt", attempt);
  }

  @PatchMapping("/{id}")
  public ResponseEntity<Map<String, Object>> updateAttempt(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody Map<String, Object> body) {
    UserPrincipal user = AuthSupport.requireRole(request, "student");
    Attempt attempt = attemptService.findById(id).orElse(null);

    if (attempt == null || !attempt.getStudentId().equals(user.id())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Attempt not found");
    }

    if ("submitted".equals(attempt.getStatus())) {
      throw new ApiException(HttpStatus.CONFLICT, "Submitted attempts cannot be changed");
    }

    if (body.containsKey("answers")) {
      Map<String, String> answers = normalizeAnswers(body.get("answers"));
      attempt = attemptService.saveAnswers(id, answers);
    }

    if (body.containsKey("submit") && (boolean) body.get("submit")) {
      return submitAttempt(request, id, body);
    }

    return ResponseEntity.ok(Map.of("message", "Attempt updated", "attempt", attempt));
  }

  @PostMapping("/{id}/submit")
  public ResponseEntity<Map<String, Object>> submitAttempt(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody Map<String, Object> body) {
    UserPrincipal user = AuthSupport.requireRole(request, "student");
    Attempt attempt = attemptService.findById(id).orElse(null);

    if (attempt == null || !attempt.getStudentId().equals(user.id())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Attempt not found");
    }

    if ("submitted".equals(attempt.getStatus())) {
      Result existingResult = resultService.findByAttemptId(id).orElse(null);
      if (existingResult == null) {
        return ResponseEntity.ok(Map.of("message", "Attempt already submitted", "attempt", attempt));
      }
      return ResponseEntity.ok(Map.of("message", "Attempt already submitted", "attempt", attempt, "result", existingResult));
    }

    Map<String, String> answers = normalizeAnswers(body.get("answers"));
    var exam = examService.findPublicById(attempt.getExamId()).orElse(null);
    if (exam == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Exam not found");
    }

    String submittedAt = Instant.now().toString();
    Result result = gradeAttempt(attempt, answers, exam.passMark(), submittedAt);
    resultService.save(result);
    attempt = attemptService.submit(id, answers, result.getId(), submittedAt);

    long timeTakenSeconds = timeTakenSeconds(attempt.getCreatedAt(), submittedAt);
    return ResponseEntity.ok(Map.of(
      "message", "Exam submitted successfully",
      "attempt", attempt,
      "result", result,
      "time_taken_seconds", timeTakenSeconds
    ));
  }

  private Result gradeAttempt(Attempt attempt, Map<String, String> answers, double passMark, String submittedAt) {
    List<Question> questions = questionService.listRawForExam(attempt.getExamId());
    List<ResultAnswer> resultAnswers = new ArrayList<>();
    double totalScore = 0;
    double maxScore = 0;

    for (Question question : questions) {
      if (!isAutoGradable(question)) {
        continue;
      }

      maxScore += question.getMarks();
      String selectedOptionId = answers.get(question.getId());
      boolean correct = question.getOptions().stream()
        .anyMatch(option -> option.getId().equals(selectedOptionId) && option.isCorrect());
      double marksAwarded = correct ? question.getMarks() : 0;
      totalScore += marksAwarded;

      ResultAnswer resultAnswer = new ResultAnswer();
      resultAnswer.setQuestionId(question.getId());
      resultAnswer.setSelectedOptionId(selectedOptionId);
      resultAnswer.setCorrect(correct);
      resultAnswer.setMarksAwarded(marksAwarded);
      resultAnswers.add(resultAnswer);
    }

    double percentage = percentage(totalScore, maxScore);
    Result result = new Result();
    result.setId(UUID.randomUUID().toString());
    result.setAttemptId(attempt.getId());
    result.setStudentId(attempt.getStudentId());
    result.setExamId(attempt.getExamId());
    result.setTotalScore(totalScore);
    result.setMaxScore(maxScore);
    result.setPercentage(percentage);
    result.setGrade(gradeFor(percentage));
    result.setPassed(percentage >= passMark);
    result.setPublishedAt(submittedAt);
    result.setAnswers(resultAnswers);
    return result;
  }

  private boolean isAutoGradable(Question question) {
    String type = question.getType() == null ? "" : question.getType().toUpperCase(Locale.ROOT);
    return "MCQ".equals(type) || "TRUE_FALSE".equals(type);
  }

  private double percentage(double totalScore, double maxScore) {
    if (maxScore == 0) {
      return 0;
    }
    return BigDecimal.valueOf(totalScore)
      .multiply(BigDecimal.valueOf(100))
      .divide(BigDecimal.valueOf(maxScore), 2, RoundingMode.HALF_UP)
      .doubleValue();
  }

  private String gradeFor(double percentage) {
    if (percentage >= 85) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 55) return "C";
    if (percentage >= 40) return "D";
    return "F";
  }

  private Map<String, String> normalizeAnswers(Object value) {
    Map<String, String> answers = new LinkedHashMap<>();

    if (value instanceof Map<?, ?> answerMap) {
      for (Map.Entry<?, ?> entry : answerMap.entrySet()) {
        if (entry.getKey() != null && entry.getValue() != null) {
          answers.put(String.valueOf(entry.getKey()), String.valueOf(entry.getValue()));
        }
      }
      return answers;
    }

    if (value instanceof List<?> answerList) {
      for (Object item : answerList) {
        if (item instanceof Map<?, ?> answer) {
          String questionId = first(answer, "question_id", "questionId");
          String optionId = first(answer, "selected_option_id", "selectedOptionId", "option_id", "optionId");
          if (!questionId.isBlank() && !optionId.isBlank()) {
            answers.put(questionId, optionId);
          }
        }
      }
    }

    return answers;
  }

  private String first(Map<?, ?> body, String... keys) {
    for (String key : keys) {
      Object value = body.get(key);
      if (value != null && !String.valueOf(value).isBlank()) {
        return String.valueOf(value);
      }
    }
    return "";
  }

  private long timeTakenSeconds(String startedAt, String submittedAt) {
    try {
      return Math.max(0, Duration.between(Instant.parse(startedAt), Instant.parse(submittedAt)).getSeconds());
    } catch (DateTimeParseException error) {
      return 0;
    }
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
}
