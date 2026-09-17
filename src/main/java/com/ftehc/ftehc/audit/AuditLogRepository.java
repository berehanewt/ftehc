package com.ftehc.ftehc.audit;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByUserId(String userId);
    List<AuditLog> findByAction(String action);
    List<AuditLog> findByTimestampBetween(Instant from, Instant to);
    List<AuditLog> findByUserIdAndTimestampBetween(String userId, Instant from, Instant to);
}

