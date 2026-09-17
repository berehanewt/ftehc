package com.ftehc.ftehc.teachers;

import com.ftehc.ftehc.announcements.Announcement;
import com.ftehc.ftehc.announcements.AnnouncementScope;
import com.ftehc.ftehc.announcements.AnnouncementService;
import com.ftehc.ftehc.homework.Homework;
import com.ftehc.ftehc.homework.HomeworkRequest;
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
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherController {

    private final HomeworkService homeworkService;
    private final SubmissionService submissionService;
    private final AnnouncementService announcementService;
    private final QuizRepository quizRepository;
    private final TeacherRepository teacherRepository;

    // ---- Homework ----

    @PostMapping("/homework")
    public ResponseEntity<Homework> createHomework(@Valid @RequestBody HomeworkRequest req,
                                                   @AuthenticationPrincipal String userId,
                                                   HttpServletRequest httpRequest) {
        return ResponseEntity.ok(homeworkService.create(req, userId,
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent")));
    }

    @GetMapping("/homework")
    public List<Homework> listHomework(@RequestParam String classId) {
        return homeworkService.getByClass(classId);
    }

    // ---- Submissions ----

    @GetMapping("/submissions")
    public List<Submission> listSubmissions(@RequestParam String homeworkId) {
        return submissionService.getByHomework(homeworkId);
    }

    @Data
    static class GradeRequest {
        private String feedback;
        private String grade;
    }

    @PutMapping("/submissions/{id}/grade")
    public ResponseEntity<Submission> gradeSubmission(@PathVariable String id,
                                                       @RequestBody GradeRequest req) {
        return ResponseEntity.ok(submissionService.grade(id, req.getFeedback(), req.getGrade()));
    }

    // ---- Quizzes ----

    @Data
    static class CreateQuizRequest {
        @NotBlank
        private String classId;
        @NotBlank
        private String title;
        private Instant startAt;
        private Instant endAt;
        private int timeLimitMinutes;
        private List<Question> questions;
    }

    @PostMapping("/quizzes")
    public ResponseEntity<Quiz> createQuiz(@Valid @RequestBody CreateQuizRequest req,
                                           @AuthenticationPrincipal String userId) {
        Quiz quiz = Quiz.builder()
                .classId(req.getClassId())
                .title(req.getTitle())
                .startAt(req.getStartAt())
                .endAt(req.getEndAt())
                .timeLimitMinutes(req.getTimeLimitMinutes())
                .questions(req.getQuestions() != null ? req.getQuestions() : List.of())
                .createdByUserId(userId)
                .build();
        return ResponseEntity.ok(quizRepository.save(quiz));
    }

    // ---- Announcements ----

    @Data
    static class ClassAnnouncementRequest {
        @NotBlank
        private String classId;
        @NotBlank
        private String title;
        @NotBlank
        private String body;
    }

    @PostMapping("/announcements")
    public ResponseEntity<Announcement> postAnnouncement(@Valid @RequestBody ClassAnnouncementRequest req,
                                                          @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(announcementService.create(
                AnnouncementScope.CLASS, req.getClassId(), req.getTitle(), req.getBody(), userId));
    }
}

