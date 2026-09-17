package com.ftehc.ftehc.quizzes;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {
    private String id;
    private String text;
    @Builder.Default
    private List<String> options = new ArrayList<>();
    private int correctOptionIndex;
    private int points;
}

