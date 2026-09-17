package com.ftehc.ftehc.homework;

import com.ftehc.ftehc.audit.AuditService;
import com.ftehc.ftehc.classes.SchoolClass;
import com.ftehc.ftehc.classes.SchoolClassRepository;
import com.ftehc.ftehc.email.EmailService;
import com.ftehc.ftehc.email.events.HomeworkCreatedEvent;
import com.ftehc.ftehc.students.StudentRepository;
import com.ftehc.ftehc.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomeworkService {

    private final HomeworkRepository homeworkRepository;
    private final SchoolClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    public Homework create(HomeworkRequest req, String createdByUserId, String ip, String userAgent) {
        Homework hw = Homework.builder()
                .classId(req.getClassId())
                .title(req.getTitle())
                .description(req.getDescription())
                .dueDate(req.getDueDate())
                .attachments(req.getAttachments() != null ? req.getAttachments() : new ArrayList<>())
                .createdByUserId(createdByUserId)
                .createdAt(Instant.now())
                .build();
        Homework saved = homeworkRepository.save(hw);

        auditService.log(createdByUserId, "CREATE_HOMEWORK", "Homework", saved.getId(),
                null, null, ip, userAgent, null);

        // Publish event for email notifications
        classRepository.findById(req.getClassId()).ifPresent(sc -> {
            List<String> emails = studentRepository.findByIdIn(sc.getStudentIds()).stream()
                    .map(s -> userRepository.findById(s.getUserId()).map(u -> u.getEmail()).orElse(null))
                    .filter(e -> e != null)
                    .collect(Collectors.toList());
            eventPublisher.publishEvent(new HomeworkCreatedEvent(this, saved, emails, sc.getName()));
        });

        return saved;
    }

    public List<Homework> getByClass(String classId) {
        return homeworkRepository.findByClassId(classId);
    }

    public List<Homework> getByClassIds(List<String> classIds) {
        return homeworkRepository.findByClassIdIn(classIds);
    }

    public Homework getById(String id) {
        return homeworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Homework not found"));
    }
}

