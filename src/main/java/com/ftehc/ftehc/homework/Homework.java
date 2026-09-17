package com.ftehc.ftehc.homework;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "homeworks")
public class Homework {

    @Id
    private String id;

    private String classId;

    private String title;

    private String description;

    private Instant dueDate;

    @Builder.Default
    private List<String> attachments = new ArrayList<>();

    private String createdByUserId;

    private Instant createdAt;
}

