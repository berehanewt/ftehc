package com.ftehc.ftehc.documents;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DocumentRepository extends MongoRepository<PortalDocument, String> {
    List<PortalDocument> findByOwnerTypeAndOwnerId(OwnerType ownerType, String ownerId);
    List<PortalDocument> findByOwnerType(OwnerType ownerType);
}

