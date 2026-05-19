package com.onlineexam.results;
//create com.onlineexam package 

import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import com.onlineexam.exams.ExamService;
import com.onlineexam.exams.PublicExam;
import com.onlineexam.questions.Question;
import com.onlineexam.questions.QuestionOption;
import com.onlineexam.questions.QuestionService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/results")
public class ResultController {
  private final ResultService resultService;
  private final ExamService examService;
  private final QuestionService questionService;

  public ResultController(ResultService resultService, ExamService examService, QuestionService questionService) {
    this.resultService = resultService;
    this.examService = examService;
    this.questionService = questionService;
  }

  @GetMapping("/{id}")
  public Map<String, Object> detail(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.currentUser(request);
    Result result = resultService.findById(id)
      .or(() -> resultService.findByAttemptId(id))
      .orElse(null);
    return resultDetail(user, result);
  }

  @GetMapping("/attempt/{attemptId}")
  public Map<String, Object> detailByAttempt(HttpServletRequest request, @PathVariable String attemptId) {
    UserPrincipal user = AuthSupport.currentUser(request);
    Result result = resultService.findByAttemptId(attemptId).orElse(null);
    return resultDetail(user, result);
  }

  private Map<String, Object> resultDetail(UserPrincipal user, Result result) {
    if (result == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Result not found");
    }

    PublicExam exam = examService.findPublicById(result.getExamId()).orElse(null);
    if (exam == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Exam not found");
    }

    boolean ownsResult = result.getStudentId().equals(user.id());
    boolean ownsExam = exam.createdBy().equals(user.id());
    boolean isAdmin = "admin".equals(user.role());
    if (!ownsResult && !ownsExam && !isAdmin) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Result not found");
    }

    List<Map<String, Object>> questions = reviewedQuestions(result);

    return Map.of(
      "result", result,
      "exam", exam,
      "questions", questions
    );
  }

  private List<Map<String, Object>> reviewedQuestions(Result result) {
    Map<String, ResultAnswer> answersByQuestionId = result.getAnswers().stream()
      .collect(Collectors.toMap(ResultAnswer::getQuestionId, Function.identity(), (first, _second) -> first));

    return questionService.listRawForExam(result.getExamId()).stream()
      .sorted(Comparator.comparingInt(question -> question.getOrderNo() > 0 ? question.getOrderNo() : Integer.MAX_VALUE))
      .map(question -> reviewedQuestion(question, answersByQuestionId.get(question.getId())))
      .toList();
  }

  private Map<String, Object> reviewedQuestion(Question question, ResultAnswer answer) {
    String selectedOptionId = answer == null ? null : answer.getSelectedOptionId();
    Optional<QuestionOption> selectedOption = question.getOptions().stream()
      .filter(option -> option.getId().equals(selectedOptionId))
      .findFirst();
    Optional<QuestionOption> correctOption = question.getOptions().stream()
      .filter(QuestionOption::isCorrect)
      .findFirst();

    Map<String, Object> review = new LinkedHashMap<>();
    review.put("id", question.getId());
    review.put("questionText", question.getQuestionText());
    review.put("type", question.getType());
    review.put("marks", question.getMarks());
    review.put("orderNo", question.getOrderNo());
    review.put("selectedOptionId", selectedOptionId == null ? "" : selectedOptionId);
    review.put("selectedAnswer", selectedOption.map(QuestionOption::getOptionText).orElse("Not answered"));
    review.put("correctOptionId", correctOption.map(QuestionOption::getId).orElse(""));
    review.put("correctAnswer", correctOption.map(QuestionOption::getOptionText).orElse(""));
    review.put("isCorrect", answer != null && answer.isCorrect());
    review.put("marksAwarded", answer == null ? 0 : answer.getMarksAwarded());
    return review;
  }
}
