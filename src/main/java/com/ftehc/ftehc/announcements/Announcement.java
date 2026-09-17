package com.ftehc.ftehc.announcements;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "announcements")
public class Announcement {

    @Id
    private String id;

    private AnnouncementScope scope;

    private String scopeId; // classId when scope=CLASS

    private String title;

    private String body;

    private String createdByUserId;

    private Instant createdAt;
}

