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
@Document(collection = "quizAttempts")
public class QuizAttempt {

    @Id
    private String id;

    private String quizId;

    private String studentId;

    @Builder.Default
    private List<Integer> answers = new ArrayList<>(); // selected option index per question

    private int score;

    private Instant startedAt;

    private Instant submittedAt;
}

