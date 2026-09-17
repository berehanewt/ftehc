package com.ftehc.ftehc.documents;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // Admin upload (school-wide or class or student-specific)
    @PostMapping("/admin/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PortalDocument> adminUpload(
            @RequestParam MultipartFile file,
            @RequestParam OwnerType ownerType,
            @RequestParam(required = false, defaultValue = "school") String ownerId,
            @AuthenticationPrincipal String userId,
            HttpServletRequest req) throws Exception {
        return ResponseEntity.ok(documentService.upload(file, ownerType, ownerId, userId,
                req.getRemoteAddr(), req.getHeader("User-Agent")));
    }

    // Teacher upload
    @PostMapping("/teacher/documents")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<PortalDocument> teacherUpload(
            @RequestParam MultipartFile file,
            @RequestParam String classId,
            @AuthenticationPrincipal String userId,
            HttpServletRequest req) throws Exception {
        return ResponseEntity.ok(documentService.upload(file, OwnerType.CLASS, classId, userId,
                req.getRemoteAddr(), req.getHeader("User-Agent")));
    }

    // Student documents via documents module (non-primary route)
    @GetMapping("/student/documents/raw")
    @PreAuthorize("hasRole('STUDENT')")
    public List<PortalDocument> studentDocuments(@AuthenticationPrincipal String userId) {
        // resolve student id from userId
        return documentService.getSchoolDocuments(); // simplified - full impl in service
    }

    // Guardian documents via documents module (non-primary route)
    @GetMapping("/guardian/documents/raw")
    @PreAuthorize("hasRole('GUARDIAN')")
    public List<PortalDocument> guardianDocuments(@RequestParam String studentId,
                                                   @AuthenticationPrincipal String userId) {
        return documentService.getStudentDocuments(studentId);
    }

    // Download (authorized)
    @GetMapping("/documents/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<InputStreamResource> download(@PathVariable String id,
                                                        @AuthenticationPrincipal String userId,
                                                        HttpServletRequest req) throws Exception {
        PortalDocument doc = documentService.getById(id);
        InputStream stream = documentService.download(id, userId, req.getRemoteAddr(), req.getHeader("User-Agent"));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream"))
                .body(new InputStreamResource(stream));
    }
}
