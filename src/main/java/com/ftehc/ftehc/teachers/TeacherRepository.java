package com.ftehc.ftehc.teachers;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;
import java.util.Optional;

public interface TeacherRepository extends MongoRepository<Teacher, String> {
    Optional<Teacher> findByUserId(String userId);
    List<Teacher> findByUserIdIn(List<String> userIds);
}

