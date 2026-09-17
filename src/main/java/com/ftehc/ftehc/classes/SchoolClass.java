package com.ftehc.ftehc.classes;

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
@Document(collection = "classes")
public class SchoolClass {

    @Id
    private String id;

    private String name;

    private String grade;

    private String teacherId;

    @Builder.Default
    private List<String> studentIds = new ArrayList<>();
}

