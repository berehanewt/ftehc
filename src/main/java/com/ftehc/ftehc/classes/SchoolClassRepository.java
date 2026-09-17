package com.ftehc.ftehc.classes;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SchoolClassRepository extends MongoRepository<SchoolClass, String> {
    List<SchoolClass> findByTeacherId(String teacherId);
    List<SchoolClass> findByStudentIdsContaining(String studentId);
    List<SchoolClass> findByIdIn(List<String> ids);
}

