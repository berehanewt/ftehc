package com.ftehc.ftehc.audit;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    private String userId;

    private String action;

    private String entity;

    private String entityId;

    private Instant timestamp;

    private String path;

    private String method;

    private String ip;

    private String userAgent;

    private Map<String, Object> details;
}

