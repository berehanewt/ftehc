package com.ftehc.ftehc.guardians;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GuardianRepository extends MongoRepository<Guardian, String> {
    Optional<Guardian> findByUserId(String userId);
}

