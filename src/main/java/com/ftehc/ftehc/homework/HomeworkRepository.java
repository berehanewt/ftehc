package com.ftehc.ftehc.homework;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface HomeworkRepository extends MongoRepository<Homework, String> {
    List<Homework> findByClassId(String classId);
    List<Homework> findByClassIdIn(List<String> classIds);
    List<Homework> findByDueDateBetweenAndClassIdIn(Instant from, Instant to, List<String> classIds);
}

