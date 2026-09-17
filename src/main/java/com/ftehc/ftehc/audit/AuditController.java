package com.ftehc.ftehc.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public List<AuditLog> query(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false, defaultValue = "200") int limit) {

        Stream<AuditLog> stream = auditLogRepository.findAll().stream();

        if (userId != null && !userId.isBlank()) {
            stream = stream.filter(log -> userId.equals(log.getUserId()));
        }

        if (action != null && !action.isBlank()) {
            stream = stream.filter(log -> action.equalsIgnoreCase(log.getAction()));
        }

        if (from != null) {
            stream = stream.filter(log -> log.getTimestamp() != null && !log.getTimestamp().isBefore(from));
        }

        if (to != null) {
            stream = stream.filter(log -> log.getTimestamp() != null && !log.getTimestamp().isAfter(to));
        }

        int safeLimit = Math.max(1, Math.min(limit, 1000));

        return stream
                .sorted(Comparator.comparing(AuditLog::getTimestamp,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(safeLimit)
                .toList();
    }
}
