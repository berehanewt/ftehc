package com.ftehc.ftehc.email.events;

import com.ftehc.ftehc.homework.Homework;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.List;

@Getter
public class HomeworkCreatedEvent extends ApplicationEvent {

    private final Homework homework;
    private final List<String> studentEmails;
    private final String className;

    public HomeworkCreatedEvent(Object source, Homework homework, List<String> studentEmails, String className) {
        super(source);
        this.homework = homework;
        this.studentEmails = studentEmails;
        this.className = className;
    }
}

