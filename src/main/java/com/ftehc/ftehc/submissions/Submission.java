package com.ftehc.ftehc.submissions;

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
@Document(collection = "submissions")
public class Submission {

    @Id
    private String id;

    private String homeworkId;

    private String studentId;

    private String text;

    @Builder.Default
    private List<String> files = new ArrayList<>();

    private Instant submittedAt;

    private String status; // SUBMITTED, GRADED

    private String feedback;

    private String grade;
}

