package com.ftehc.ftehc.email;

import com.ftehc.ftehc.email.events.AnnouncementCreatedEvent;
import com.ftehc.ftehc.email.events.HomeworkCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailEventListener {

    private final EmailService emailService;

    @Async
    @EventListener
    public void onHomeworkCreated(HomeworkCreatedEvent event) {
        String dueDate = event.getHomework().getDueDate() != null
                ? event.getHomework().getDueDate().toString() : "N/A";
        for (String email : event.getStudentEmails()) {
            try {
                emailService.sendHomeworkNotification(email,
                        event.getHomework().getTitle(),
                        event.getClassName(),
                        dueDate);
            } catch (Exception e) {
                log.error("Failed to send homework notification to {}: {}", email, e.getMessage());
            }
        }
    }

    @Async
    @EventListener
    public void onAnnouncementCreated(AnnouncementCreatedEvent event) {
        for (String email : event.getRecipientEmails()) {
            try {
                emailService.sendAnnouncementNotification(email,
                        event.getAnnouncement().getTitle(),
                        event.getAnnouncement().getBody());
            } catch (Exception e) {
                log.error("Failed to send announcement notification to {}: {}", email, e.getMessage());
            }
        }
    }
}

