package com.ftehc.ftehc.documents;

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
@Document(collection = "documents")
public class PortalDocument {

    @Id
    private String id;

    private OwnerType ownerType;

    private String ownerId;

    private String fileKey;

    private String fileName;

    private String mimeType;

    private long size;

    private String uploadedByUserId;

    private Instant uploadedAt;
}

