package com.ftehc.ftehc.documents;

import com.ftehc.ftehc.audit.AuditService;
import com.ftehc.ftehc.documents.storage.StorageService;
import com.ftehc.ftehc.guardians.GuardianRepository;
import com.ftehc.ftehc.students.Student;
import com.ftehc.ftehc.students.StudentRepository;
import com.ftehc.ftehc.teachers.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final AuditService auditService;

    public PortalDocument upload(MultipartFile file, OwnerType ownerType, String ownerId,
                                 String uploadedByUserId, String ip, String userAgent) throws Exception {
        String fileKey = storageService.store(file, ownerType.name().toLowerCase() + "/" + ownerId);
        PortalDocument doc = PortalDocument.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .fileKey(fileKey)
                .fileName(file.getOriginalFilename())
                .mimeType(file.getContentType())
                .size(file.getSize())
                .uploadedByUserId(uploadedByUserId)
                .uploadedAt(Instant.now())
                .build();
        PortalDocument saved = documentRepository.save(doc);
        auditService.log(uploadedByUserId, "DOCUMENT_UPLOAD", "Document", saved.getId(),
                null, null, ip, userAgent, Map.of("fileName", file.getOriginalFilename()));
        return saved;
    }

    public InputStream download(String docId, String userId, String ip, String userAgent) throws Exception {
        PortalDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        auditService.log(userId, "DOCUMENT_DOWNLOAD", "Document", docId,
                null, null, ip, userAgent, Map.of("fileName", doc.getFileName()));
        return storageService.retrieve(doc.getFileKey());
    }

    public List<PortalDocument> getSchoolDocuments() {
        return documentRepository.findByOwnerType(OwnerType.SCHOOL);
    }

    public List<PortalDocument> getClassDocuments(String classId) {
        return documentRepository.findByOwnerTypeAndOwnerId(OwnerType.CLASS, classId);
    }

    public List<PortalDocument> getStudentDocuments(String studentId) {
        List<PortalDocument> docs = new ArrayList<>();
        docs.addAll(documentRepository.findByOwnerType(OwnerType.SCHOOL));
        docs.addAll(documentRepository.findByOwnerTypeAndOwnerId(OwnerType.STUDENT, studentId));
        // Class docs for student's classes
        studentRepository.findById(studentId).ifPresent(s ->
                s.getClassIds().forEach(cid ->
                        docs.addAll(documentRepository.findByOwnerTypeAndOwnerId(OwnerType.CLASS, cid))));
        return docs;
    }

    public PortalDocument getById(String docId) {
        return documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }
}

