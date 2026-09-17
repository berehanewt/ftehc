package com.ftehc.ftehc.guardians;

import com.ftehc.ftehc.announcements.Announcement;
import com.ftehc.ftehc.announcements.AnnouncementService;
import com.ftehc.ftehc.classes.SchoolClass;
import com.ftehc.ftehc.classes.SchoolClassRepository;
import com.ftehc.ftehc.documents.DocumentService;
import com.ftehc.ftehc.documents.PortalDocument;
import com.ftehc.ftehc.homework.Homework;
import com.ftehc.ftehc.homework.HomeworkService;
import com.ftehc.ftehc.students.Student;
import com.ftehc.ftehc.students.StudentRepository;
import com.ftehc.ftehc.submissions.Submission;
import com.ftehc.ftehc.submissions.SubmissionRepository;
import com.ftehc.ftehc.submissions.SubmissionService;
import com.ftehc.ftehc.teachers.Teacher;
import com.ftehc.ftehc.teachers.TeacherRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/guardian")
@PreAuthorize("hasRole('GUARDIAN')")
@RequiredArgsConstructor
public class GuardianController {

    private final GuardianRepository guardianRepository;
    private final StudentRepository studentRepository;
    private final HomeworkService homeworkService;
    private final SubmissionService submissionService;
    private final SubmissionRepository submissionRepository;
    private final AnnouncementService announcementService;
    private final DocumentService documentService;
    private final SchoolClassRepository classRepository;
    private final TeacherRepository teacherRepository;

    @Data
    static class StudentDto {
        private String id;
        private String email;
        private String name;
    }

    private Guardian resolveGuardian(String userId) {
        return guardianRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Guardian profile not found"));
    }

    private void verifyStudentAccess(Guardian guardian, String studentId) {
        if (!guardian.getStudentIds().contains(studentId)) {
            throw new RuntimeException("Access denied: student not linked to this guardian");
        }
    }

    @GetMapping("/students")
    public List<StudentDto> getLinkedStudents(@AuthenticationPrincipal String userId) {
        Guardian guardian = resolveGuardian(userId);
        return studentRepository.findByIdIn(guardian.getStudentIds()).stream()
                .map(student -> {
                    StudentDto dto = new StudentDto();
                    dto.setId(student.getId());
                    String name = ((student.getFirstName() != null ? student.getFirstName() : "") + " "
                            + (student.getLastName() != null ? student.getLastName() : "")).trim();
                    dto.setName(name.isEmpty() ? null : name);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/homework")
    public List<GuardianHomeworkItemDto> getHomework(@RequestParam String studentId,
                                                     @AuthenticationPrincipal String userId) {
        Guardian guardian = resolveGuardian(userId);
        verifyStudentAccess(guardian, studentId);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Homework> homeworkList = homeworkService.getByClassIds(student.getClassIds());
        if (homeworkList.isEmpty()) {
            return Collections.emptyList();
        }

        // Bulk load classes
        List<String> classIds = homeworkList.stream()
                .map(Homework::getClassId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<String, SchoolClass> classMap = classRepository.findByIdIn(classIds).stream()
                .collect(Collectors.toMap(SchoolClass::getId, c -> c));

        // Bulk load teachers
        List<String> teacherUserIds = classMap.values().stream()
                .map(SchoolClass::getTeacherId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<String, String> teacherNameByUserId = teacherRepository.findByUserIdIn(teacherUserIds).stream()
                .collect(Collectors.toMap(Teacher::getUserId, t -> t.getName() != null ? t.getName() : ""));

        // Bulk load submissions for this student
        List<String> homeworkIds = homeworkList.stream().map(Homework::getId).collect(Collectors.toList());
        Map<String, Submission> submissionByHomeworkId = submissionRepository.findByStudentId(studentId).stream()
                .filter(s -> homeworkIds.contains(s.getHomeworkId()))
                .collect(Collectors.toMap(Submission::getHomeworkId, s -> s, (a, b) -> a));

        Instant now = Instant.now();

        return homeworkList.stream().map(hw -> {
            SchoolClass sc = hw.getClassId() != null ? classMap.get(hw.getClassId()) : null;
            String className = sc != null ? sc.getName() : null;
            String teacherName = (sc != null && sc.getTeacherId() != null)
                    ? teacherNameByUserId.get(sc.getTeacherId())
                    : null;

            Submission sub = submissionByHomeworkId.get(hw.getId());
            String status;
            String submittedAt = null;
            Integer grade = null;

            if (sub == null) {
                status = (hw.getDueDate() != null && hw.getDueDate().isBefore(now))
                        ? "LATE" : "NOT_SUBMITTED";
            } else {
                submittedAt = sub.getSubmittedAt() != null ? sub.getSubmittedAt().toString() : null;
                if ("GRADED".equalsIgnoreCase(sub.getStatus())) {
                    status = "GRADED";
                    if (sub.getGrade() != null) {
                        try { grade = Integer.parseInt(sub.getGrade()); } catch (NumberFormatException ignored) {}
                    }
                } else {
                    // SUBMITTED or LATE
                    boolean lateSubmission = hw.getDueDate() != null
                            && sub.getSubmittedAt() != null
                            && sub.getSubmittedAt().isAfter(hw.getDueDate());
                    status = lateSubmission ? "LATE" : "SUBMITTED";
                }
            }

            return GuardianHomeworkItemDto.builder()
                    .homeworkId(hw.getId())
                    .title(hw.getTitle())
                    .dueDate(hw.getDueDate() != null ? hw.getDueDate().toString() : null)
                    .classId(hw.getClassId())
                    .className(className)
                    .teacherName(teacherName)
                    .status(status)
                    .submittedAt(submittedAt)
                    .grade(grade)
                    .build();
        }).collect(Collectors.toList());
    }

    @GetMapping("/submissions")
    public List<Submission> getSubmissions(@RequestParam String studentId,
                                           @AuthenticationPrincipal String userId) {
        Guardian guardian = resolveGuardian(userId);
        verifyStudentAccess(guardian, studentId);
        return submissionService.getByStudent(studentId);
    }

    @GetMapping("/documents")
    public List<PortalDocument> getDocuments(@RequestParam String studentId,
                                              @AuthenticationPrincipal String userId) {
        Guardian guardian = resolveGuardian(userId);
        verifyStudentAccess(guardian, studentId);
        return documentService.getStudentDocuments(studentId);
    }

    @GetMapping("/announcements")
    public List<Announcement> getAnnouncements(@AuthenticationPrincipal String userId) {
        Guardian guardian = resolveGuardian(userId);
        List<String> classIds = studentRepository.findByIdIn(guardian.getStudentIds())
                .stream()
                .flatMap(s -> s.getClassIds().stream())
                .distinct()
                .collect(Collectors.toList());
        return announcementService.getForStudent(classIds);
    }
}
