package com.ftehc.ftehc.teachers;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "teachers")
public class Teacher {

    @Id
    private String id;

    private String userId;

    private String name;

    private String subject;

    @Builder.Default
    private List<String> classIds = new ArrayList<>();
}

