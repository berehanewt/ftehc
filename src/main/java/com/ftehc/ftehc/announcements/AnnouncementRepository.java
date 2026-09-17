package com.ftehc.ftehc.announcements;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AnnouncementRepository extends MongoRepository<Announcement, String> {
    List<Announcement> findByScope(AnnouncementScope scope);
    List<Announcement> findByScopeAndScopeId(AnnouncementScope scope, String scopeId);
    List<Announcement> findByScopeInOrScopeIdIn(List<AnnouncementScope> scopes, List<String> scopeIds);
}

