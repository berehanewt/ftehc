package com.ftehc.ftehc.submissions;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends MongoRepository<Submission, String> {
    List<Submission> findByHomeworkId(String homeworkId);
    Optional<Submission> findByHomeworkIdAndStudentId(String homeworkId, String studentId);
    List<Submission> findByStudentId(String studentId);
}

