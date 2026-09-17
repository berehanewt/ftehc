package com.ftehc.ftehc.email.events;

import com.ftehc.ftehc.announcements.Announcement;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.List;

@Getter
public class AnnouncementCreatedEvent extends ApplicationEvent {

    private final Announcement announcement;
    private final List<String> recipientEmails;

    public AnnouncementCreatedEvent(Object source, Announcement announcement, List<String> recipientEmails) {
        super(source);
        this.announcement = announcement;
        this.recipientEmails = recipientEmails;
    }
}

