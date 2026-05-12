package com.onlineexam.results;

import com.onlineexam.auth.AuthSupport;
import com.onlineexam.auth.UserPrincipal;
import com.onlineexam.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/results")
public class ResultController {
  private final ResultService resultService;

  public ResultController(ResultService resultService) {
    this.resultService = resultService;
  }

  @GetMapping("/{id}")
  public Map<String, Object> detail(HttpServletRequest request, @PathVariable String id) {
    UserPrincipal user = AuthSupport.currentUser(request);
    Result result = resultService.findById(id).orElse(null);

    if (result == null || (!result.getStudentId().equals(user.id()) && !"admin".equals(user.role()))) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Result not found");
    }

    return Map.of("result", result);
  }

  @GetMapping("/attempt/{attemptId}")
  public Map<String, Object> detailByAttempt(HttpServletRequest request, @PathVariable String attemptId) {
    UserPrincipal user = AuthSupport.currentUser(request);
    Result result = resultService.findByAttemptId(attemptId).orElse(null);

    if (result == null || (!result.getStudentId().equals(user.id()) && !"admin".equals(user.role()))) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Result not found");
    }

    return Map.of("result", result);
  }
}
