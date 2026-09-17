package com.ftehc.ftehc.submissions;

import com.ftehc.ftehc.audit.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AuditService auditService;

    public Submission submit(String homeworkId, String studentId, String text,
                             List<String> files, String userId, String ip, String userAgent) {
        Submission submission = Submission.builder()
                .homeworkId(homeworkId)
                .studentId(studentId)
                .text(text)
                .files(files != null ? files : new ArrayList<>())
                .submittedAt(Instant.now())
                .status("SUBMITTED")
                .build();
        Submission saved = submissionRepository.save(submission);
        auditService.log(userId, "SUBMIT_HOMEWORK", "Submission", saved.getId(),
                null, null, ip, userAgent, Map.of("homeworkId", homeworkId));
        return saved;
    }

    public List<Submission> getByHomework(String homeworkId) {
        return submissionRepository.findByHomeworkId(homeworkId);
    }

    public List<Submission> getByStudent(String studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    public Submission getByHomeworkAndStudent(String homeworkId, String studentId) {
        return submissionRepository.findByHomeworkIdAndStudentId(homeworkId, studentId)
                .orElse(null);
    }

    public Submission grade(String submissionId, String feedback, String grade) {
        Submission sub = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        sub.setFeedback(feedback);
        sub.setGrade(grade);
        sub.setStatus("GRADED");
        return submissionRepository.save(sub);
    }
}

