package com.ftehc.ftehc.quizzes;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends MongoRepository<QuizAttempt, String> {
    List<QuizAttempt> findByQuizId(String quizId);
    List<QuizAttempt> findByStudentId(String studentId);
    Optional<QuizAttempt> findByQuizIdAndStudentId(String quizId, String studentId);
}

