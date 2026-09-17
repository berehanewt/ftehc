package com.ftehc.ftehc.quizzes;

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
@Document(collection = "quizzes")
public class Quiz {

    @Id
    private String id;

    private String classId;

    private String title;

    private Instant startAt;

    private Instant endAt;

    private int timeLimitMinutes;

    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    private String createdByUserId;
}

