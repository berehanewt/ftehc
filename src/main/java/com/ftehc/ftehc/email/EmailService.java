package com.ftehc.ftehc.email;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    public void send(String to, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        mailSender.send(msg);
    }

    public void sendPasswordReset(String to, String token) {
        send(to, "Password Reset Request",
                "Use this token to reset your password: " + token +
                "\nThis link expires in 1 hour.");
    }

    public void sendHomeworkNotification(String to, String homeworkTitle, String className, String dueDate) {
        send(to, "New Homework: " + homeworkTitle,
                "A new homework assignment has been posted for class " + className +
                ".\nTitle: " + homeworkTitle +
                "\nDue: " + dueDate);
    }

    public void sendHomeworkReminder(String to, String homeworkTitle, String dueDate) {
        send(to, "Homework Reminder: " + homeworkTitle,
                "Reminder: The following homework is due soon.\nTitle: " + homeworkTitle +
                "\nDue: " + dueDate);
    }

    public void sendAnnouncementNotification(String to, String title, String body) {
        send(to, "New Announcement: " + title, body);
    }
}

