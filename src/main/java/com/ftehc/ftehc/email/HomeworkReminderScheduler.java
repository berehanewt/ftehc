package com.ftehc.ftehc.email;

import com.ftehc.ftehc.classes.SchoolClassRepository;
import com.ftehc.ftehc.homework.Homework;
import com.ftehc.ftehc.homework.HomeworkRepository;
import com.ftehc.ftehc.students.StudentRepository;
import com.ftehc.ftehc.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class HomeworkReminderScheduler {

    private final HomeworkRepository homeworkRepository;
    private final SchoolClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Run daily at 8 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDueReminders() {
        log.info("Running homework due reminder job");
        Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant dayAfterTomorrow = tomorrow.plus(1, ChronoUnit.DAYS);

        // Get all class IDs
        List<String> allClassIds = classRepository.findAll().stream()
                .map(c -> c.getId())
                .collect(Collectors.toList());

        List<Homework> dueSoon = homeworkRepository
                .findByDueDateBetweenAndClassIdIn(tomorrow, dayAfterTomorrow, allClassIds);

        for (Homework hw : dueSoon) {
            classRepository.findById(hw.getClassId()).ifPresent(sc -> {
                List<String> emails = studentRepository.findByIdIn(sc.getStudentIds())
                        .stream()
                        .map(s -> userRepository.findById(s.getUserId()).map(u -> u.getEmail()).orElse(null))
                        .filter(e -> e != null)
                        .collect(Collectors.toList());

                for (String email : emails) {
                    try {
                        emailService.sendHomeworkReminder(email, hw.getTitle(), hw.getDueDate().toString());
                    } catch (Exception e) {
                        log.error("Failed to send reminder to {}: {}", email, e.getMessage());
                    }
                }
            });
        }
    }
}

