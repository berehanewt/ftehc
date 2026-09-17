package com.ftehc.ftehc.students;

import com.ftehc.ftehc.announcements.Announcement;
import com.ftehc.ftehc.announcements.AnnouncementService;
import com.ftehc.ftehc.audit.AuditService;
import com.ftehc.ftehc.documents.DocumentService;
import com.ftehc.ftehc.documents.PortalDocument;
import com.ftehc.ftehc.homework.Homework;
import com.ftehc.ftehc.homework.HomeworkService;
import com.ftehc.ftehc.quizzes.*;
import com.ftehc.ftehc.submissions.Submission;
import com.ftehc.ftehc.submissions.SubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class StudentController {

    private final StudentRepository studentRepository;
    private final HomeworkService homeworkService;
    private final SubmissionService submissionService;
    private final AnnouncementService announcementService;
    private final DocumentService documentService;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AuditService auditService;

    private Student resolveStudent(String userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
    }

    @GetMapping("/homework")
    public List<Homework> getHomework(@AuthenticationPrincipal String userId) {
        Student student = resolveStudent(userId);
        return homeworkService.getByClassIds(student.getClassIds());
    }

    @Data
    static class SubmitRequest {
        @NotBlank
        private String homeworkId;
        private String text;
        private List<String> files;
    }

    @PostMapping("/submissions")
    public ResponseEntity<Submission> submit(@Valid @RequestBody SubmitRequest req,
                                             @AuthenticationPrincipal String userId,
                                             HttpServletRequest httpRequest) {
        Student student = resolveStudent(userId);
        return ResponseEntity.ok(submissionService.submit(
                req.getHomeworkId(), student.getId(), req.getText(), req.getFiles(),
                userId, httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent")));
    }

    @GetMapping("/announcements")
    public List<Announcement> getAnnouncements(@AuthenticationPrincipal String userId) {
        Student student = resolveStudent(userId);
        return announcementService.getForStudent(student.getClassIds());
    }

    @GetMapping("/documents")
    public List<PortalDocument> getDocuments(@AuthenticationPrincipal String userId) {
        Student student = resolveStudent(userId);
        return documentService.getStudentDocuments(student.getId());
    }

    @Data
    static class QuizAttemptRequest {
        @NotBlank
        private String quizId;
        private List<Integer> answers;
    }

    @PostMapping("/quiz-attempts")
    public ResponseEntity<QuizAttempt> submitQuizAttempt(@Valid @RequestBody QuizAttemptRequest req,
                                                          @AuthenticationPrincipal String userId,
                                                          HttpServletRequest httpRequest) {
        Student student = resolveStudent(userId);
        Quiz quiz = quizRepository.findById(req.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        // Calculate score
        List<Integer> answers = req.getAnswers() != null ? req.getAnswers() : new ArrayList<>();
        int score = 0;
        for (int i = 0; i < Math.min(answers.size(), quiz.getQuestions().size()); i++) {
            if (answers.get(i) == quiz.getQuestions().get(i).getCorrectOptionIndex()) {
                score += quiz.getQuestions().get(i).getPoints();
            }
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .quizId(req.getQuizId())
                .studentId(student.getId())
                .answers(answers)
                .score(score)
                .startedAt(Instant.now())
                .submittedAt(Instant.now())
                .build();
        QuizAttempt saved = quizAttemptRepository.save(attempt);

        auditService.log(userId, "QUIZ_ATTEMPT", "QuizAttempt", saved.getId(),
                null, null, httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"),
                Map.of("quizId", req.getQuizId(), "score", score));

        return ResponseEntity.ok(saved);
    }
}

