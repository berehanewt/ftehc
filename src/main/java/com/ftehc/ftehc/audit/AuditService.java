package com.ftehc.ftehc.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String userId, String action, String entity, String entityId,
                    String path, String method, String ip, String userAgent,
                    Map<String, Object> details) {
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .action(action)
                .entity(entity)
                .entityId(entityId)
                .timestamp(Instant.now())
                .path(path)
                .method(method)
                .ip(ip)
                .userAgent(userAgent)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }
}

