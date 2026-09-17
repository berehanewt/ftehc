package com.ftehc.ftehc.students;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends MongoRepository<Student, String> {
    Optional<Student> findByUserId(String userId);
    List<Student> findByClassIdsContaining(String classId);
    List<Student> findByIdIn(List<String> ids);
}

