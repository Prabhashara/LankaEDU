package com.onlineexam.questions;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlineexam.common.JsonFileStore;
import com.onlineexam.exams.PublicExam;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class QuestionService {
  private final JsonFileStore<Question> store;

  public QuestionService(ObjectMapper objectMapper) {
    this.store = new JsonFileStore<>(Path.of("src/data/questions.json"), objectMapper, new TypeReference<>() {});
  }

  public List<PublicQuestion> listForExam(String examId) {
    return store.readAll().stream()
      .filter(question -> examId.equals(question.getExamId()))
      .sorted(Comparator.comparingInt(this::effectiveOrderNo))
      .map(PublicQuestion::from)
      .toList();
  }

  public List<BankQuestion> listForLecturer(List<PublicExam> exams) {
    Map<String, PublicExam> examsById = exams.stream().collect(Collectors.toMap(PublicExam::id, Function.identity()));

    return store.readAll().stream()
      .filter(question -> examsById.containsKey(question.getExamId()))
      .sorted(Comparator.comparing(Question::getCreatedAt, Comparator.nullsLast(String::compareTo)).reversed())
      .map(question -> BankQuestion.from(question, examsById.get(question.getExamId())))
      .toList();
  }

  public Optional<PublicQuestion> findPublicById(String id) {
    return findRawById(id).map(PublicQuestion::from);
  }

  public Optional<Question> findRawById(String id) {
    return store.readAll().stream().filter(question -> id.equals(question.getId())).findFirst();
  }
// create exam
  public PublicQuestion create(String lecturerId, QuestionValues values) {
    List<Question> questions = new ArrayList<>(store.readAll());
    Question question = new Question();
    question.setId(UUID.randomUUID().toString());
    question.setExamId(values.examId());
    question.setQuestionText(values.questionText());
    question.setType(values.type());
    question.setMarks(values.marks());
    question.setOrderNo(nextOrderNo(questions, values.examId()));
    question.setCreatedBy(lecturerId);
    question.setCreatedAt(Instant.now().toString());

    List<QuestionOption> options = new ArrayList<>();
    for (QuestionOption valueOption : values.options()) {
      QuestionOption option = new QuestionOption();
      option.setId(UUID.randomUUID().toString());
      option.setOptionText(valueOption.getOptionText());
      option.setCorrect(valueOption.isCorrect());
      options.add(option);
    }
    question.setOptions(options);

    questions.add(question);
    store.writeAll(questions);
    return PublicQuestion.from(question);
  }

  public boolean isDuplicateOnExam(String examId, Question sourceQuestion) {
    String sourceKey = sourceKey(sourceQuestion);
    return store.readAll().stream()
      .filter(question -> examId.equals(question.getExamId()))
      .anyMatch(question -> sourceKey.equals(sourceKey(question)));
  }

  public PublicQuestion linkToExam(String examId, Question sourceQuestion, String lecturerId) {
    List<Question> questions = new ArrayList<>(store.readAll());
    Question question = new Question();
    question.setId(UUID.randomUUID().toString());
    question.setExamId(examId);
    question.setQuestionText(sourceQuestion.getQuestionText());
    question.setSourceQuestionId(sourceKey(sourceQuestion));
    question.setType(sourceQuestion.getType());
    question.setMarks(sourceQuestion.getMarks());
    question.setOrderNo(nextOrderNo(questions, examId));
    question.setOptions(buildOptions(sourceQuestion.getOptions()));
    question.setCreatedBy(lecturerId);
    question.setCreatedAt(Instant.now().toString());

    questions.add(question);
    store.writeAll(questions);
    return PublicQuestion.from(question);
  }

  public PublicQuestion update(String id, QuestionValues values) {
    List<Question> questions = new ArrayList<>(store.readAll());

    for (Question question : questions) {
      if (id.equals(question.getId())) {
        question.setQuestionText(values.questionText());
        question.setType(values.type());
        question.setMarks(values.marks());
        question.setOptions(buildOptions(values.options()));
        store.writeAll(questions);
        return PublicQuestion.from(question);
      }
    }

    return null;
  }

  public PublicQuestion delete(String id) {
    List<Question> questions = new ArrayList<>(store.readAll());
    Question found = null;

    for (Question question : questions) {
      if (id.equals(question.getId())) {
        found = question;
        break;
      }
    }

    if (found == null) {
      return null;
    }

    questions.remove(found);
    renumberExamQuestions(questions, found.getExamId());
    store.writeAll(questions);
    return PublicQuestion.from(found);
  }

  public List<PublicQuestion> reorder(String examId, List<String> questionIds) {
    List<Question> questions = new ArrayList<>(store.readAll());
    List<Question> examQuestions = questions.stream()
      .filter(question -> examId.equals(question.getExamId()))
      .toList();

    if (questionIds.size() != examQuestions.size()) {
      return null;
    }

    for (Question question : examQuestions) {
      if (!questionIds.contains(question.getId())) {
        return null;
      }
    }

    for (int index = 0; index < questionIds.size(); index++) {
      String questionId = questionIds.get(index);
      for (Question question : questions) {
        if (questionId.equals(question.getId()) && examId.equals(question.getExamId())) {
          question.setOrderNo(index + 1);
        }
      }
    }

    store.writeAll(questions);
    return listForExam(examId);
  }

  private List<QuestionOption> buildOptions(List<QuestionOption> valueOptions) {
    List<QuestionOption> options = new ArrayList<>();
    for (QuestionOption valueOption : valueOptions) {
      QuestionOption option = new QuestionOption();
      option.setId(UUID.randomUUID().toString());
      option.setOptionText(valueOption.getOptionText());
      option.setCorrect(valueOption.isCorrect());
      options.add(option);
    }
    return options;
  }

  private String sourceKey(Question question) {
    return question.getSourceQuestionId() == null || question.getSourceQuestionId().isBlank()
      ? question.getId()
      : question.getSourceQuestionId();
  }

  private int nextOrderNo(List<Question> questions, String examId) {
    return questions.stream()
      .filter(question -> examId.equals(question.getExamId()))
      .mapToInt(this::effectiveOrderNo)
      .max()
      .orElse(0) + 1;
  }

  private int effectiveOrderNo(Question question) {
    return question.getOrderNo() > 0 ? question.getOrderNo() : Integer.MAX_VALUE;
  }

  private void renumberExamQuestions(List<Question> questions, String examId) {
    List<Question> examQuestions = questions.stream()
      .filter(question -> examId.equals(question.getExamId()))
      .sorted(Comparator.comparingInt(this::effectiveOrderNo))
      .toList();

    for (int index = 0; index < examQuestions.size(); index++) {
      examQuestions.get(index).setOrderNo(index + 1);
    }
  }
}
