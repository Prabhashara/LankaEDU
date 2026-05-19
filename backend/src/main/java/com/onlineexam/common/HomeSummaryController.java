package com.onlineexam.common;

import com.onlineexam.exams.ExamService;
import com.onlineexam.exams.PublicExam;
import com.onlineexam.questions.QuestionService;
import com.onlineexam.results.Result;
import com.onlineexam.results.ResultService;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class HomeSummaryController {
  private final ExamService examService;
  private final ResultService resultService;
  private final QuestionService questionService;

  public HomeSummaryController(ExamService examService, ResultService resultService, QuestionService questionService) {
    this.examService = examService;
    this.resultService = resultService;
    this.questionService = questionService;
  }

  @GetMapping("/home-summary")
  public Map<String, Object> homeSummary() {
    List<PublicExam> exams = examService.listAllPublic();
    List<Result> results = resultService.listAll();
    Instant now = Instant.now();

    long activeExams = exams.stream().filter(exam -> "Active".equals(exam.status())).count();
    long liveExams = exams.stream().filter(exam -> isLive(exam, now)).count();
    long upcomingExams = exams.stream().filter(exam -> isUpcoming(exam, now)).count();
    long passed = results.stream().filter(Result::isPassed).count();
    double averageScore = results.isEmpty() ? 0 : results.stream().mapToDouble(Result::getPercentage).average().orElse(0);
    double passRate = results.isEmpty() ? 0 : passed * 100.0 / results.size();

    Map<String, Object> summary = new LinkedHashMap<>();
    summary.put("totalExams", exams.size());
    summary.put("activeExams", activeExams);
    summary.put("liveExams", liveExams);
    summary.put("upcomingExams", upcomingExams);
    summary.put("completedAttempts", results.size());
    summary.put("passRate", round2(passRate));
    summary.put("averageScore", round2(averageScore));
    summary.put("questionCount", questionService.countAll());
    summary.put("timer", timerInfo(exams, now));
    return summary;
  }

  private Map<String, Object> timerInfo(List<PublicExam> exams, Instant now) {
    Optional<PublicExam> liveExam = exams.stream()
      .filter(exam -> isLive(exam, now))
      .min(Comparator.comparing(exam -> parseInstant(exam.endAt()).orElse(Instant.MAX)));

    if (liveExam.isPresent()) {
      PublicExam exam = liveExam.get();
      return timerPayload("remaining", "Time Remaining", exam.endAt(), exam);
    }

    Optional<PublicExam> upcomingExam = exams.stream()
      .filter(exam -> isUpcoming(exam, now))
      .min(Comparator.comparing(exam -> parseInstant(exam.startAt()).orElse(Instant.MAX)));

    if (upcomingExam.isPresent()) {
      PublicExam exam = upcomingExam.get();
      return timerPayload("upcoming", "Starts In", exam.startAt(), exam);
    }

    Map<String, Object> timer = new LinkedHashMap<>();
    timer.put("status", "none");
    timer.put("label", "No Scheduled Exam");
    timer.put("targetAt", "");
    timer.put("examTitle", "");
    timer.put("subject", "");
    return timer;
  }

  private Map<String, Object> timerPayload(String status, String label, String targetAt, PublicExam exam) {
    Map<String, Object> timer = new LinkedHashMap<>();
    timer.put("status", status);
    timer.put("label", label);
    timer.put("targetAt", targetAt == null ? "" : targetAt);
    timer.put("examTitle", exam.title() == null ? "" : exam.title());
    timer.put("subject", exam.subject() == null ? "" : exam.subject());
    return timer;
  }

  private boolean isLive(PublicExam exam, Instant now) {
    if (!"Active".equals(exam.status())) {
      return false;
    }

    Optional<Instant> startAt = parseInstant(exam.startAt());
    Optional<Instant> endAt = parseInstant(exam.endAt());
    return startAt.map(start -> !start.isAfter(now)).orElse(true)
      && endAt.map(end -> end.isAfter(now)).orElse(false);
  }

  private boolean isUpcoming(PublicExam exam, Instant now) {
    if (!"Active".equals(exam.status())) {
      return false;
    }

    return parseInstant(exam.startAt()).map(start -> start.isAfter(now)).orElse(false);
  }

  private Optional<Instant> parseInstant(String value) {
    if (value == null || value.isBlank()) {
      return Optional.empty();
    }

    try {
      return Optional.of(Instant.parse(value));
    } catch (DateTimeParseException error) {
      return Optional.empty();
    }
  }

  private double round2(double value) {
    return Math.round(value * 100.0) / 100.0;
  }
}
