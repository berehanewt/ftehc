package com.ftehc.ftehc.homework;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class HomeworkRequest {
    @NotBlank
    private String classId;
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private Instant dueDate;
    private List<String> attachments;
}

