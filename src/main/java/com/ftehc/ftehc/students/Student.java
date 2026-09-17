package com.ftehc.ftehc.students;

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
@Document(collection = "students")
public class Student {

    @Id
    private String id;

    private String userId;

    private String firstName;

    private String middleName;

    private String lastName;

    private String grade;

    // Extended enrollment fields
    private Integer age;

    private String gender;

    @Builder.Default
    private List<String> classIds = new ArrayList<>();

    @Builder.Default
    private List<String> guardianIds = new ArrayList<>();
}

