package com.onlineexam.questions;

import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import com.onlineexam.exams.ExamService;
import com.onlineexam.exams.PublicExam;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {
  private final QuestionService questionService;
  private final ExamService examService;

  public QuestionController(QuestionService questionService, ExamService examService) {
    this.questionService = questionService;
    this.examService = examService;
  }

  @GetMapping
  public Map<String, Object> list(HttpServletRequest request, @RequestParam("examId") String examId) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicExam exam = findOwnedExam(examId, user);
    return Map.of("questions", questionService.listForExam(exam.id()));
  }

  @GetMapping("/bank")
  public Map<String, Object> bank(HttpServletRequest request) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    List<PublicExam> exams = examService.listForLecturer(user.id());
    return Map.of("questions", questionService.listForLecturer(exams));
  }

  @GetMapping("/{id}")
  public Map<String, Object> detail(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicQuestion question = findOwnedQuestion(id, user);
    return Map.of("question", question);
  }
// post mapping
  @PostMapping
  public ResponseEntity<Map<String, Object>> create(HttpServletRequest request, @RequestBody Map<String, Object> body) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    QuestionValues values = validateQuestion(body);
    requireDraftExam(findOwnedExam(values.examId(), user));

    PublicQuestion question = questionService.create(user.id(), values);
    return ResponseEntity.status(201).body(Map.of("message", "Question created", "question", question));
  }

  @PatchMapping("/{id}")
  public Map<String, Object> update(HttpServletRequest request, @PathVariable String id, @RequestBody Map<String, Object> body) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicQuestion existingQuestion = findOwnedQuestion(id, user);
    PublicExam exam = requireDraftExam(findOwnedExam(existingQuestion.examId(), user));
    QuestionValues values = validateQuestion(body);

    if (!exam.id().equals(values.examId())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Question cannot be moved to a different exam");
    }

    PublicQuestion question = questionService.update(id, values);
    return Map.of("message", "Question updated", "question", question);
  }
  // delete question

  @DeleteMapping("/{id}")
  public Map<String, Object> delete(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicQuestion existingQuestion = findOwnedQuestion(id, user);
    requireDraftExam(findOwnedExam(existingQuestion.examId(), user));

    PublicQuestion question = questionService.delete(id);
    return Map.of("message", "Question deleted", "question", question);
  }

  @PatchMapping("/reorder")
  public Map<String, Object> reorder(HttpServletRequest request, @RequestBody Map<String, Object> body) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    String examId = first(body, "exam_id", "examId");
    PublicExam exam = requireDraftExam(findOwnedExam(examId, user));
    List<String> questionIds = stringList(body.get("questionIds"));
    if (questionIds.isEmpty()) {
      questionIds = stringList(body.get("question_ids"));
    }

    List<PublicQuestion> questions = questionService.reorder(exam.id(), questionIds);
    if (questions == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Question order must include every question once");
    }

    return Map.of("message", "Question order updated", "questions", questions);
  }

  private PublicExam findOwnedExam(String examId, UserPrincipal user) {
    PublicExam exam = examService.findPublicById(examId).orElse(null);
    if (exam == null || !exam.createdBy().equals(user.id())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Exam not found");
    }
    return exam;
  }

  private PublicQuestion findOwnedQuestion(String questionId, UserPrincipal user) {
    PublicQuestion question = questionService.findPublicById(questionId).orElse(null);
    if (question == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Question not found");
    }
    findOwnedExam(question.examId(), user);
    return question;
  }

  private PublicExam requireDraftExam(PublicExam exam) {
    if (!"Draft".equals(exam.status())) {
      throw new ApiException(HttpStatus.CONFLICT, "Questions can only be managed before publishing");
    }
    return exam;
  }

  private QuestionValues validateQuestion(Map<String, Object> body) {
    Map<String, String> errors = new LinkedHashMap<>();
    String examId = first(body, "exam_id", "examId");
    String questionText = trim(body.get("questionText"));
    if (questionText.isBlank()) {
      questionText = trim(body.get("question_text"));
    }
    String type = normalizeType(trim(body.get("type")));
    Double marks = number(body.get("marks"));

    if (examId.isBlank()) errors.put("examId", "Exam is required");
    if (questionText.isBlank()) errors.put("questionText", "Question text is required");
    if (type.isBlank()) errors.put("type", "Question type is required");
    if (marks == null || marks <= 0) errors.put("marks", "Marks must be a positive number");

    List<QuestionOption> options = parseOptions(body.get("options"));

    if ("MCQ".equals(type)) {
      validateMcqOptions(options, errors);
    } else if ("TRUE_FALSE".equals(type)) {
      options = normalizeTrueFalseOptions(options);
      long correctCount = options.stream().filter(QuestionOption::isCorrect).count();
      if (correctCount != 1) {
        errors.put("correctOption", "Select exactly one correct answer");
      }
    } else if ("SHORT_ANSWER".equals(type)) {
      options = List.of();
    } else if (!type.isBlank()) {
      errors.put("type", "Choose a valid question type");
    }

    if (!errors.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    return new QuestionValues(examId, questionText, type, marks, options);
  }

  private void validateMcqOptions(List<QuestionOption> options, Map<String, String> errors) {
    if (options.size() != 4) {
      errors.put("options", "MCQ must have exactly 4 options");
      return;
    }

    long correctCount = options.stream().filter(QuestionOption::isCorrect).count();
    if (correctCount != 1) {
      errors.put("correctOption", "MCQ must have exactly 1 correct option");
    }

    for (int index = 0; index < options.size(); index++) {
      if (options.get(index).getOptionText().isBlank()) {
        errors.put("option" + index, "Option " + (index + 1) + " is required");
      }
    }
  }

  @SuppressWarnings("unchecked")
  private List<QuestionOption> parseOptions(Object rawOptions) {
    if (!(rawOptions instanceof List<?> optionList)) {
      return new ArrayList<>();
    }

    List<QuestionOption> options = new ArrayList<>();
    for (Object item : optionList) {
      if (!(item instanceof Map<?, ?> optionMap)) {
        continue;
      }

      QuestionOption option = new QuestionOption();
      Object optionText = optionMap.containsKey("optionText") ? optionMap.get("optionText") : optionMap.get("option_text");
      option.setOptionText(trim(optionText));
      option.setCorrect(Boolean.TRUE.equals(optionMap.get("isCorrect")) || Boolean.TRUE.equals(optionMap.get("is_correct")));
      options.add(option);
    }

    return options;
  }

  private List<QuestionOption> normalizeTrueFalseOptions(List<QuestionOption> options) {
    boolean trueCorrect = false;
    boolean falseCorrect = false;

    for (QuestionOption option : options) {
      if ("true".equalsIgnoreCase(option.getOptionText())) {
        trueCorrect = option.isCorrect();
      }
      if ("false".equalsIgnoreCase(option.getOptionText())) {
        falseCorrect = option.isCorrect();
      }
    }

    QuestionOption trueOption = new QuestionOption();
    trueOption.setOptionText("True");
    trueOption.setCorrect(trueCorrect);

    QuestionOption falseOption = new QuestionOption();
    falseOption.setOptionText("False");
    falseOption.setCorrect(falseCorrect);

    return List.of(trueOption, falseOption);
  }

  private String normalizeType(String value) {
    return switch (value.toUpperCase()) {
      case "MCQ" -> "MCQ";
      case "TRUE_FALSE", "TRUE-FALSE", "TRUE/FALSE" -> "TRUE_FALSE";
      case "SHORT_ANSWER", "SHORT ANSWER", "SHORT-ANSWER" -> "SHORT_ANSWER";
      default -> value.toUpperCase();
    };
  }

  private String first(Map<String, Object> body, String firstKey, String secondKey) {
    String first = trim(body.get(firstKey));
    return first.isBlank() ? trim(body.get(secondKey)) : first;
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

  private List<String> stringList(Object value) {
    if (!(value instanceof List<?> rawList)) {
      return List.of();
    }

    List<String> values = new ArrayList<>();
    for (Object item : rawList) {
      String stringValue = trim(item);
      if (!stringValue.isBlank()) {
        values.add(stringValue);
      }
    }
    return values;
  }

  private String trim(Object value) {
    return value == null ? "" : String.valueOf(value).trim();
  }
}
