package com.ftehc.ftehc.quizzes;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface QuizRepository extends MongoRepository<Quiz, String> {
    List<Quiz> findByClassId(String classId);
    List<Quiz> findByClassIdIn(List<String> classIds);
}

