package com.onlineexam.reports;

import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import com.onlineexam.exams.ExamService;
import com.onlineexam.exams.PublicExam;
import com.onlineexam.questions.Question;
import com.onlineexam.questions.QuestionOption;
import com.onlineexam.questions.QuestionService;
import com.onlineexam.results.Result;
import com.onlineexam.results.ResultAnswer;
import com.onlineexam.results.ResultService;
import com.onlineexam.users.User;
import com.onlineexam.users.UserService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
// [OOP: SRP=(Single Responsibility] - Me class eken karanne reporting saha analytics weda vitharai
/* [RELATIONSHIP: DEPENDENCY] - ExamReportController class eka weda karanna 
ExamService, ResultService, QuestionService, UserService kiyana dependencies kiyana ewa one */
public class ExamReportController {
  private static final List<String> BUCKET_LABELS = List.of("0-20%", "20-40%", "40-60%", "60-80%", "80-100%");

 // [OOP: ENCAPSULATION] - Private final fields dapu nisa me services direct pita ayaata modify karanna baha.
  private final ExamService examService;
  private final ResultService resultService;
  private final QuestionService questionService;
  private final UserService userService;

  public ExamReportController(
         ExamService examService,
         ResultService resultService,
         QuestionService questionService,
         UserService userService
  ) {
    this.examService = examService;
    this.resultService = resultService;
    this.questionService = questionService;
    this.userService = userService;
  }
  // [CRUD: READ] - GET request ekak. Web browser / frontend eken exam report data
  // kiyawala (READ) ganna use karanawa.
  @GetMapping("/exam/{id}")
  public Map<String, Object> examReport(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.requireRole(request, "lecturer");
    PublicExam exam = examService.findPublicById(id).orElse(null);
    // [CRUD: READ] - Exam details JSON/database eken kiyawala gannawa.
    // [RELATIONSHIP: ASSOCIATION / 1-TO-MANY] - Exam object eka laba gannawa. Eka
    // exam ekakata questions saha results godak thiyenna puluwan.
    if (exam == null || !exam.createdBy().equals(user.id())) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Exam not found");
    }

    List<Result> results = resultService.listByExam(id);
    List<Question> questions = questionService.listRawForExam(id);

    return Map.of(
      "exam", exam,
      "attemptCount", results.size(),
      "scoreDistribution", scoreDistribution(results),
      "passFail", passFail(results),
      "questionAccuracy", questionAccuracy(questions, results)
    );
  }

  @GetMapping("/student/{id}")
  public Map<String, Object> studentReport(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.requireRole(request, "student");

    if (!user.id().equals(id)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Report card not found");
    }

    List<Map<String, Object>> rows = resultService.listByStudent(id).stream()
      .map(this::studentResultRow)
      .sorted((left, right) -> String.valueOf(left.get("submittedAt")).compareTo(String.valueOf(right.get("submittedAt"))))
      .toList();

    return Map.of(
      "studentId", id,
      "summary", studentSummary(rows),
      "results", rows
    );
  }

  @GetMapping("/pdf/{attemptId}")
  public ResponseEntity<byte[]> resultPdf(HttpServletRequest request, @PathVariable String attemptId) {
    UserPrincipal user = AuthSupport.currentUser(request);
    Result result = resultService.findByAttemptId(attemptId).orElse(null);

    if (result == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Result not found");
    }

    PublicExam exam = examService.findPublicById(result.getExamId()).orElse(null);
    User student = userService.findRawById(result.getStudentId()).orElse(null);
    boolean canDownload = "student".equals(user.role()) && user.id().equals(result.getStudentId());
    canDownload = canDownload || ("lecturer".equals(user.role()) && exam != null && exam.createdBy().equals(user.id()));

    if (!canDownload) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Result not found");
    }

    byte[] pdf = buildResultPdf(result, exam, student);
    String fileName = filename(exam == null ? "exam-result" : exam.title(), student == null ? "student" : student.getName());

    return ResponseEntity.ok()
      .contentType(MediaType.APPLICATION_PDF)
      .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
      .body(pdf);
  }

  private List<Map<String, Object>> scoreDistribution(List<Result> results) {
    int[] counts = new int[BUCKET_LABELS.size()];

    for (Result result : results) {
      double percentage = Math.max(0, Math.min(100, result.getPercentage()));
      int index = percentage >= 100 ? 4 : (int) Math.floor(percentage / 20);
      counts[index]++;
    }

    return java.util.stream.IntStream.range(0, BUCKET_LABELS.size())
      .mapToObj(index -> {
        Map<String, Object> bucket = new LinkedHashMap<>();
        bucket.put("label", BUCKET_LABELS.get(index));
        bucket.put("count", counts[index]);
        bucket.put("percentage", results.isEmpty() ? 0 : round2(counts[index] * 100.0 / results.size()));
        return bucket;
      })
      .toList();
  }

  private Map<String, Object> passFail(List<Result> results) {
    long passed = results.stream().filter(Result::isPassed).count();
    long failed = results.size() - passed;

    return Map.of(
      "passed", passed,
      "failed", failed,
      "passPercentage", results.isEmpty() ? 0 : round2(passed * 100.0 / results.size()),
      "failPercentage", results.isEmpty() ? 0 : round2(failed * 100.0 / results.size())
    );
  }

  private Map<String, Object> studentResultRow(Result result) {
    PublicExam exam = examService.findPublicById(result.getExamId()).orElse(null);
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("resultId", result.getId());
    row.put("attemptId", result.getAttemptId());
    row.put("examId", result.getExamId());
    row.put("examTitle", exam == null ? "Unknown exam" : exam.title());
    row.put("subject", exam == null ? "" : exam.subject());
    row.put("submittedAt", result.getPublishedAt());
    row.put("score", result.getTotalScore());
    row.put("maxScore", result.getMaxScore());
    row.put("percentage", result.getPercentage());
    row.put("grade", result.getGrade());
    row.put("passed", result.isPassed());
    return row;
  }

  private Map<String, Object> studentSummary(List<Map<String, Object>> rows) {
    int total = rows.size();
    double average = total == 0 ? 0 : rows.stream().mapToDouble(row -> numberValue(row.get("percentage"))).average().orElse(0);
    double passRate = total == 0 ? 0 : rows.stream().filter(row -> Boolean.TRUE.equals(row.get("passed"))).count() * 100.0 / total;

    return Map.of(
      "totalExamsTaken", total,
      "averageScore", round2(average),
      "bestGrade", bestGrade(rows),
      "passRate", round2(passRate)
    );
  }

  private String bestGrade(List<Map<String, Object>> rows) {
    List<String> gradeOrder = List.of("A", "B", "C", "D", "F");
    return rows.stream()
      .map(row -> String.valueOf(row.getOrDefault("grade", "F")))
      .min((left, right) -> Integer.compare(gradeOrder.indexOf(left), gradeOrder.indexOf(right)))
      .orElse("-");
  }

  private List<Map<String, Object>> questionAccuracy(List<Question> questions, List<Result> results) {
    return questions.stream()
      .map(question -> questionAccuracyRow(question, results))
      .toList();
  }

  private Map<String, Object> questionAccuracyRow(Question question, List<Result> results) {
    int totalAnswers = results.size();
    int correctAnswers = 0;

    for (Result result : results) {
      Map<String, ResultAnswer> answersByQuestion = result.getAnswers().stream()
        .collect(Collectors.toMap(ResultAnswer::getQuestionId, Function.identity(), (first, _second) -> first));
      ResultAnswer answer = answersByQuestion.get(question.getId());
      if (answer != null && answer.isCorrect()) {
        correctAnswers++;
      }
    }

    Map<String, Object> row = new LinkedHashMap<>();
    row.put("questionId", question.getId());
    row.put("orderNo", question.getOrderNo());
    row.put("questionText", question.getQuestionText());
    row.put("type", question.getType());
    row.put("correctCount", correctAnswers);
    row.put("attemptCount", totalAnswers);
    row.put("accuracyPercentage", totalAnswers == 0 ? 0 : round2(correctAnswers * 100.0 / totalAnswers));
    return row;
  }

  private double round2(double value) {
    return Math.round(value * 100.0) / 100.0;
  }

  private double numberValue(Object value) {
    return value instanceof Number number ? number.doubleValue() : 0;
  }

  private byte[] buildResultPdf(Result result, PublicExam exam, User student) {
    try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      PdfWriter writer = new PdfWriter(document);
      writer.text("ONLINE EXAM PLATFORM", 18, PDType1Font.HELVETICA_BOLD);
      writer.text("Official Result Report", 11, PDType1Font.HELVETICA);
      writer.gap(10);
      writer.stamp(result.isPassed() ? "PASS" : "FAIL");
      writer.gap(10);
      writer.text(exam == null ? "Exam Result" : exam.title(), 16, PDType1Font.HELVETICA_BOLD);
      writer.gap(8);

      writer.row("Student Name", student == null ? "Unknown student" : student.getName());
      writer.row("Student ID", student == null || student.getStudentId() == null ? "Not set" : student.getStudentId());
      writer.row("Exam", exam == null ? result.getExamId() : exam.title());
      writer.row("Date", result.getPublishedAt());
      writer.row("Score", formatNumber(result.getTotalScore()) + " / " + formatNumber(result.getMaxScore()));
      writer.row("Percentage", formatNumber(result.getPercentage()) + "%");
      writer.row("Grade", result.getGrade());
      writer.gap(12);

      writer.text("Per-question Breakdown", 13, PDType1Font.HELVETICA_BOLD);
      writer.gap(6);
      writer.text("Question | Selected Answer | Correct Answer | Marks", 9, PDType1Font.HELVETICA_BOLD);
      writer.line();

      Map<String, ResultAnswer> answersByQuestion = result.getAnswers().stream()
        .collect(Collectors.toMap(ResultAnswer::getQuestionId, Function.identity(), (first, _second) -> first));

      for (Question question : questionService.listRawForExam(result.getExamId())) {
        ResultAnswer answer = answersByQuestion.get(question.getId());
        String selected = selectedAnswer(question, answer);
        String correct = correctAnswer(question);
        String marks = formatNumber(answer == null ? 0 : answer.getMarksAwarded()) + " / " + formatNumber(question.getMarks());
        writer.wrappedText(
          "#" + question.getOrderNo() + " " + question.getQuestionText() +
            " | Selected: " + selected +
            " | Correct: " + correct +
            " | Marks: " + marks,
          9,
          PDType1Font.HELVETICA
        );
        writer.gap(4);
      }

      writer.close();
      document.save(output);
      return output.toByteArray();
    } catch (IOException error) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate PDF report");
    }
  }

  private String selectedAnswer(Question question, ResultAnswer answer) {
    if (answer == null || answer.getSelectedOptionId() == null || answer.getSelectedOptionId().isBlank()) {
      return "Not answered";
    }
    return question.getOptions().stream()
      .filter(option -> answer.getSelectedOptionId().equals(option.getId()))
      .map(QuestionOption::getOptionText)
      .findFirst()
      .orElse("Not answered");
  }

  private String correctAnswer(Question question) {
    return question.getOptions().stream()
      .filter(QuestionOption::isCorrect)
      .map(QuestionOption::getOptionText)
      .findFirst()
      .orElse("No correct answer set");
  }

  private String filename(String examTitle, String studentName) {
    String value = (examTitle + "-" + studentName + "-result.pdf").toLowerCase();
    return value.replaceAll("[^a-z0-9.]+", "-").replaceAll("-+", "-");
  }

  private String formatNumber(double value) {
    return value == Math.rint(value) ? String.valueOf((long) value) : String.format(java.util.Locale.ROOT, "%.2f", value);
  }

  private static class PdfWriter {
    private static final float MARGIN = 48;
    private final PDDocument document;
    private PDPage page;
    private PDPageContentStream stream;
    private float y;

    PdfWriter(PDDocument document) throws IOException {
      this.document = document;
      addPage();
    }

    void text(String value, int size, PDType1Font font) throws IOException {
      ensureSpace(size + 8);
      stream.beginText();
      stream.setFont(font, size);
      stream.newLineAtOffset(MARGIN, y);
      stream.showText(safe(value));
      stream.endText();
      y -= size + 7;
    }

    void wrappedText(String value, int size, PDType1Font font) throws IOException {
      for (String line : wrap(safe(value), 105)) {
        text(line, size, font);
      }
    }

    void row(String label, String value) throws IOException {
      wrappedText(label + ": " + (value == null || value.isBlank() ? "-" : value), 10, PDType1Font.HELVETICA);
    }

    void stamp(String value) throws IOException {
      ensureSpace(34);
      stream.setNonStrokingColor("PASS".equals(value) ? java.awt.Color.GREEN.darker() : java.awt.Color.RED.darker());
      stream.addRect(MARGIN, y - 22, 80, 26);
      stream.fill();
      stream.setNonStrokingColor(java.awt.Color.WHITE);
      stream.beginText();
      stream.setFont(PDType1Font.HELVETICA_BOLD, 14);
      stream.newLineAtOffset(MARGIN + 20, y - 17);
      stream.showText(value);
      stream.endText();
      stream.setNonStrokingColor(java.awt.Color.BLACK);
      y -= 34;
    }

    void line() throws IOException {
      ensureSpace(10);
      stream.moveTo(MARGIN, y);
      stream.lineTo(page.getMediaBox().getWidth() - MARGIN, y);
      stream.stroke();
      y -= 10;
    }

    void gap(int value) throws IOException {
      ensureSpace(value);
      y -= value;
    }

    void close() throws IOException {
      stream.close();
    }

    private void addPage() throws IOException {
      if (stream != null) {
        stream.close();
      }
      page = new PDPage(PDRectangle.LETTER);
      document.addPage(page);
      stream = new PDPageContentStream(document, page);
      y = page.getMediaBox().getHeight() - MARGIN;
    }

    private void ensureSpace(float needed) throws IOException {
      if (y - needed < MARGIN) {
        addPage();
      }
    }

    private String safe(String value) {
      return value == null ? "" : value.replaceAll("[\\r\\n]+", " ").replaceAll("[^\\x20-\\x7E]", "");
    }

    private List<String> wrap(String value, int maxLength) {
      java.util.ArrayList<String> lines = new java.util.ArrayList<>();
      String remaining = value;
      while (remaining.length() > maxLength) {
        int breakAt = remaining.lastIndexOf(' ', maxLength);
        if (breakAt < 1) {
          breakAt = maxLength;
        }
        lines.add(remaining.substring(0, breakAt).trim());
        remaining = remaining.substring(breakAt).trim();
      }
      if (!remaining.isBlank()) {
        lines.add(remaining);
      }
      return lines;
    }
  }
}
