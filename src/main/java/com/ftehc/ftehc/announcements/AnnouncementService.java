package com.ftehc.ftehc.announcements;

import com.ftehc.ftehc.classes.SchoolClassRepository;
import com.ftehc.ftehc.email.events.AnnouncementCreatedEvent;
import com.ftehc.ftehc.students.StudentRepository;
import com.ftehc.ftehc.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final SchoolClassRepository classRepository;
    private final ApplicationEventPublisher eventPublisher;

    public Announcement create(AnnouncementScope scope, String scopeId, String title,
                               String body, String createdByUserId) {
        Announcement announcement = Announcement.builder()
                .scope(scope)
                .scopeId(scopeId)
                .title(title)
                .body(body)
                .createdByUserId(createdByUserId)
                .createdAt(Instant.now())
                .build();
        Announcement saved = announcementRepository.save(announcement);

        // Resolve recipients for email
        List<String> emails;
        if (scope == AnnouncementScope.SCHOOL) {
            emails = userRepository.findAll().stream()
                    .map(u -> u.getEmail())
                    .collect(Collectors.toList());
        } else {
            // CLASS scope
            emails = classRepository.findById(scopeId)
                    .map(sc -> studentRepository.findByIdIn(sc.getStudentIds()).stream()
                            .map(s -> userRepository.findById(s.getUserId()).map(u -> u.getEmail()).orElse(null))
                            .filter(e -> e != null)
                            .collect(Collectors.toList()))
                    .orElse(List.of());
        }
        eventPublisher.publishEvent(new AnnouncementCreatedEvent(this, saved, emails));
        return saved;
    }

    public List<Announcement> getSchoolAnnouncements() {
        return announcementRepository.findByScope(AnnouncementScope.SCHOOL);
    }

    public List<Announcement> getClassAnnouncements(String classId) {
        return announcementRepository.findByScopeAndScopeId(AnnouncementScope.CLASS, classId);
    }

    public List<Announcement> getForStudent(List<String> classIds) {
        List<Announcement> result = announcementRepository.findByScope(AnnouncementScope.SCHOOL);
        for (String cid : classIds) {
            result.addAll(announcementRepository.findByScopeAndScopeId(AnnouncementScope.CLASS, cid));
        }
        return result;
    }
}

