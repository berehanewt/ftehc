# Code Pack — Backend Submissions APIs + File Upload (Student) + Admin Overview (PrimeNG)

This pack includes:

1) **Spring Boot backend APIs for submissions** (student submit w/ files, teacher view, teacher grade/feedback, student list)
2) **File upload support** added to the **Student submit homework page** (PrimeNG) + download buttons
3) **Admin dashboard Overview page** (PrimeNG cards + quick links) + optional backend stats endpoint

Use this with Copilot in IntelliJ: save under `docs/` and keep it open while generating code file-by-file.

## Assumptions / Notes

- Backend: Spring Boot 3, MongoDB, JWT security already set up.
- You already have `Homework` and `Submission` collections (or will create them).
- Files are stored in **local disk** for dev in `./uploads/submissions/` and referenced by `fileKey`.
- For production, replace local storage with S3/MinIO/Azure using the same `FileStorageService` interface.

## Backend Endpoints Provided

### Student
- `POST /api/student/submissions` (multipart) — submit homework with optional files
- `GET /api/student/submissions` — list my submissions
- `GET /api/student/submissions/{id}` — get my submission details

### Teacher
- `GET /api/teacher/submissions?homeworkId=...` — list submissions for homework
- `GET /api/teacher/submissions/{id}` — get submission details
- `PATCH /api/teacher/submissions/{id}` — update feedback/grade/status

### Files
- `GET /api/files/{fileKey}` — download a submitted file (authorized)


## PART A — Backend (Spring Boot) — Submissions APIs + File Storage

### A1) Models (MongoDB)

```java
// src/main/java/com/schoolportal/homework/model/Submission.java
package com.schoolportal.homework.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Document("submissions")
public class Submission {

  @Id
  private String id;

  private String homeworkId;

  /** Student identity: store studentUserId (user account id) for simple ownership checks */
  private String studentUserId;

  private String text;

  private List<SubmissionFile> files;

  private Instant submittedAt;

  private SubmissionStatus status;

  private Integer grade;      // 0-100 optional
  private String feedback;    // optional

  @Getter @Setter
  @NoArgsConstructor @AllArgsConstructor
  @Builder
  public static class SubmissionFile {
    private String fileKey;       // storage key
    private String fileName;
    private String contentType;
    private long size;
  }
}
```

```java
// src/main/java/com/schoolportal/homework/model/SubmissionStatus.java
package com.schoolportal.homework.model;

public enum SubmissionStatus {
  DRAFT,
  SUBMITTED,
  LATE,
  GRADED,
  RETURNED
}
```

### A2) Repositories

```java
// src/main/java/com/schoolportal/homework/repo/SubmissionRepository.java
package com.schoolportal.homework.repo;

import com.schoolportal.homework.model.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends MongoRepository<Submission, String> {

  List<Submission> findByHomeworkIdOrderBySubmittedAtDesc(String homeworkId);

  List<Submission> findByStudentUserIdOrderBySubmittedAtDesc(String studentUserId);

  Optional<Submission> findByIdAndStudentUserId(String id, String studentUserId);

  Optional<Submission> findByHomeworkIdAndStudentUserId(String homeworkId, String studentUserId);
}
```

### A3) File storage abstraction (Local dev implementation)

```java
// src/main/java/com/schoolportal/documents/storage/FileStorageService.java
package com.schoolportal.documents.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
  /** Save and return a generated fileKey */
  String save(String folder, MultipartFile file);

  /** Load resource by fileKey */
  Resource load(String folder, String fileKey);
}
```

```java
// src/main/java/com/schoolportal/documents/storage/LocalFileStorageService.java
package com.schoolportal.documents.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

  private final Path baseDir;

  public LocalFileStorageService(@Value("${app.files.localDir:./uploads}") String localDir) {
    this.baseDir = Paths.get(localDir).toAbsolutePath().normalize();
  }

  @Override
  public String save(String folder, MultipartFile file) {
    try {
      String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
      String ext = "";
      int dot = original.lastIndexOf('.');
      if (dot > 0 && dot < original.length() - 1) {
        ext = original.substring(dot);
      }

      String fileKey = UUID.randomUUID() + ext;
      Path targetDir = baseDir.resolve(folder).normalize();
      Files.createDirectories(targetDir);

      Path target = targetDir.resolve(fileKey);
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
      return fileKey;
    } catch (IOException e) {
      throw new IllegalStateException("Failed to store file", e);
    }
  }

  @Override
  public Resource load(String folder, String fileKey) {
    try {
      Path filePath = baseDir.resolve(folder).resolve(fileKey).normalize();
      Resource resource = new UrlResource(filePath.toUri());
      if (resource.exists() && resource.isReadable()) {
        return resource;
      }
      throw new IllegalArgumentException("File not found");
    } catch (MalformedURLException e) {
      throw new IllegalArgumentException("File not found", e);
    }
  }
}
```

### A4) DTOs (requests/responses)

```java
// src/main/java/com/schoolportal/homework/dto/SubmitHomeworkRequest.java
package com.schoolportal.homework.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SubmitHomeworkRequest {
  @NotBlank
  private String homeworkId;

  private String text; // optional
}
```

```java
// src/main/java/com/schoolportal/homework/dto/UpdateSubmissionRequest.java
package com.schoolportal.homework.dto;

import com.schoolportal.homework.model.SubmissionStatus;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateSubmissionRequest {
  private SubmissionStatus status;
  private Integer grade;
  private String feedback;
}
```

### A5) Service layer (ownership checks + save files)

```java
// src/main/java/com/schoolportal/homework/service/SubmissionService.java
package com.schoolportal.homework.service;

import com.schoolportal.documents.storage.FileStorageService;
import com.schoolportal.homework.dto.SubmitHomeworkRequest;
import com.schoolportal.homework.dto.UpdateSubmissionRequest;
import com.schoolportal.homework.model.Submission;
import com.schoolportal.homework.model.SubmissionStatus;
import com.schoolportal.homework.repo.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class SubmissionService {

  public static final String SUBMISSION_FOLDER = "submissions";

  private final SubmissionRepository repo;
  private final FileStorageService storage;

  public SubmissionService(SubmissionRepository repo, FileStorageService storage) {
    this.repo = repo;
    this.storage = storage;
  }

  /** Student submits (create or replace) */
  public Submission submit(String studentUserId, SubmitHomeworkRequest req, List<MultipartFile> files) {
    Submission sub = repo.findByHomeworkIdAndStudentUserId(req.getHomeworkId(), studentUserId)
        .orElse(Submission.builder()
            .homeworkId(req.getHomeworkId())
            .studentUserId(studentUserId)
            .build());

    sub.setText(req.getText());
    sub.setSubmittedAt(Instant.now());
    sub.setStatus(SubmissionStatus.SUBMITTED);

    if (files != null && !files.isEmpty()) {
      List<Submission.SubmissionFile> stored = new ArrayList<>();
      for (MultipartFile f : files) {
        if (f == null || f.isEmpty()) continue;
        String key = storage.save(SUBMISSION_FOLDER, f);
        stored.add(Submission.SubmissionFile.builder()
            .fileKey(key)
            .fileName(f.getOriginalFilename())
            .contentType(f.getContentType())
            .size(f.getSize())
            .build());
      }
      sub.setFiles(stored);
    }

    return repo.save(sub);
  }

  public List<Submission> listForTeacher(String homeworkId) {
    return repo.findByHomeworkIdOrderBySubmittedAtDesc(homeworkId);
  }

  public Submission getForTeacher(String id) {
    return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Submission not found"));
  }

  public Submission updateForTeacher(String id, UpdateSubmissionRequest req) {
    Submission sub = getForTeacher(id);
    if (req.getStatus() != null) sub.setStatus(req.getStatus());
    if (req.getGrade() != null) sub.setGrade(req.getGrade());
    if (req.getFeedback() != null) sub.setFeedback(req.getFeedback());
    return repo.save(sub);
  }

  public List<Submission> listForStudent(String studentUserId) {
    return repo.findByStudentUserIdOrderBySubmittedAtDesc(studentUserId);
  }

  public Submission getForStudent(String id, String studentUserId) {
    return repo.findByIdAndStudentUserId(id, studentUserId)
        .orElseThrow(() -> new IllegalArgumentException("Submission not found"));
  }
}
```

### A6) Controllers

```java
// src/main/java/com/schoolportal/homework/controller/StudentSubmissionsController.java
package com.schoolportal.homework.controller;

import com.schoolportal.homework.dto.SubmitHomeworkRequest;
import com.schoolportal.homework.model.Submission;
import com.schoolportal.homework.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/student/submissions")
public class StudentSubmissionsController {

  private final SubmissionService service;

  public StudentSubmissionsController(SubmissionService service) {
    this.service = service;
  }

  private String currentUserId() {
    return String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
  }

  /** multipart: fields + files */
  @PreAuthorize("hasRole('STUDENT')")
  @PostMapping(consumes = {"multipart/form-data"})
  public Submission submit(
      @Valid @RequestPart("data") SubmitHomeworkRequest data,
      @RequestPart(value = "files", required = false) List<MultipartFile> files
  ) {
    return service.submit(currentUserId(), data, files);
  }

  @PreAuthorize("hasRole('STUDENT')")
  @GetMapping
  public List<Submission> listMine() {
    return service.listForStudent(currentUserId());
  }

  @PreAuthorize("hasRole('STUDENT')")
  @GetMapping("/{id}")
  public Submission getMine(@PathVariable String id) {
    return service.getForStudent(id, currentUserId());
  }
}
```

```java
// src/main/java/com/schoolportal/homework/controller/TeacherSubmissionsController.java
package com.schoolportal.homework.controller;

import com.schoolportal.homework.dto.UpdateSubmissionRequest;
import com.schoolportal.homework.model.Submission;
import com.schoolportal.homework.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/submissions")
public class TeacherSubmissionsController {

  private final SubmissionService service;

  public TeacherSubmissionsController(SubmissionService service) {
    this.service = service;
  }

  @PreAuthorize("hasRole('TEACHER')")
  @GetMapping
  public List<Submission> listByHomework(@RequestParam String homeworkId) {
    return service.listForTeacher(homeworkId);
  }

  @PreAuthorize("hasRole('TEACHER')")
  @GetMapping("/{id}")
  public Submission get(@PathVariable String id) {
    return service.getForTeacher(id);
  }

  @PreAuthorize("hasRole('TEACHER')")
  @PatchMapping("/{id}")
  public Submission update(@PathVariable String id, @Valid @RequestBody UpdateSubmissionRequest req) {
    return service.updateForTeacher(id, req);
  }
}
```

### A7) Secure file download endpoint (with minimal authorization)

```java
// src/main/java/com/schoolportal/documents/controller/FileController.java
package com.schoolportal.documents.controller;

import com.schoolportal.documents.storage.FileStorageService;
import com.schoolportal.homework.model.Submission;
import com.schoolportal.homework.repo.SubmissionRepository;
import com.schoolportal.homework.service.SubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/files")
public class FileController {

  private final FileStorageService storage;
  private final SubmissionRepository submissionRepo;

  public FileController(FileStorageService storage, SubmissionRepository submissionRepo) {
    this.storage = storage;
    this.submissionRepo = submissionRepo;
  }

  private String currentUserId() {
    return String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
  }

  /**
   * Downloads a file by fileKey.
   * Minimal authorization: user must be TEACHER or STUDENT-owner of a submission containing that fileKey.
   * You can extend this to GUARDIAN ownership later.
   */
  @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
  @GetMapping("/{fileKey}")
  public ResponseEntity<Resource> download(@PathVariable String fileKey, HttpServletRequest request) {

    // Find submission that contains this fileKey
    Submission sub = submissionRepo.findAll().stream()
        .filter(s -> s.getFiles() != null && s.getFiles().stream().anyMatch(f -> fileKey.equals(f.getFileKey())))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("File not found"));

    boolean isTeacher = request.isUserInRole("TEACHER");
    boolean isOwnerStudent = request.isUserInRole("STUDENT") && currentUserId().equals(sub.getStudentUserId());

    if (!isTeacher && !isOwnerStudent) {
      return ResponseEntity.status(403).build();
    }

    // derive filename
    String filename = sub.getFiles().stream().filter(f -> fileKey.equals(f.getFileKey())).findFirst()
        .map(Submission.SubmissionFile::getFileName).orElse(fileKey);

    Resource resource = storage.load(SubmissionService.SUBMISSION_FOLDER, fileKey);

    String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replaceAll("\+", "%20");

    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
        .body(resource);
  }
}
```

### A8) application.yml settings (multipart + local dir)

```yml
# src/main/resources/application.yml
spring:
  servlet:
    multipart:
      max-file-size: 25MB
      max-request-size: 25MB

app:
  files:
    localDir: ./uploads
```


## PART B — Frontend (Angular + PrimeNG) — Add file upload to Student submit page

This assumes you have a Student Homework Detail/Submit page. If you don't, Copilot can create it.

### B1) Submission upload service (multipart)

```ts
// src/app/features/student/services/student-homework-submit.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StudentHomeworkSubmitService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  submit(homeworkId: string, text: string | undefined, files: File[]) {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify({ homeworkId, text })], { type: 'application/json' }));
    (files || []).forEach(f => form.append('files', f, f.name));

    return this.http.post(`${this.base}/api/student/submissions`, form);
  }
}
```

### B2) PrimeNG file upload UI (use customUpload=false; we manage FormData ourselves)

```ts
// student-homework-submit.component.ts (core additions)
import { Component, inject, signal } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { StudentHomeworkSubmitService } from '../../services/student-homework-submit.service';

@Component({
  selector: 'app-student-homework-submit',
  standalone: true,
  imports: [FileUploadModule, ButtonModule, InputTextareaModule, ToastModule],
  providers: [MessageService],
  templateUrl: './student-homework-submit.component.html'
})
export class StudentHomeworkSubmitComponent {
  private submitSvc = inject(StudentHomeworkSubmitService);
  private msg = inject(MessageService);

  homeworkId = '';
  text = '';

  selectedFiles = signal<File[]>([]);
  submitting = signal(false);

  onSelect(event: any) {
    const files: File[] = event.currentFiles || event.files || [];
    this.selectedFiles.set(files);
  }

  clearFiles(uploader: any) {
    uploader.clear();
    this.selectedFiles.set([]);
  }

  submit() {
    if (!this.homeworkId) {
      this.msg.add({ severity: 'warn', summary: 'Missing', detail: 'Homework id is required' });
      return;
    }

    this.submitting.set(true);
    this.submitSvc.submit(this.homeworkId, this.text || undefined, this.selectedFiles()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.msg.add({ severity: 'success', summary: 'Submitted', detail: 'Homework submitted successfully' });
      },
      error: (err) => {
        this.submitting.set(false);
        const m = err?.error?.message || 'Submit failed';
        this.msg.add({ severity: 'error', summary: 'Error', detail: m });
      }
    });
  }
}
```

```html
<!-- student-homework-submit.component.html -->
<p-toast></p-toast>

<div class="mb-3">
  <h2 class="m-0">Submit Homework</h2>
</div>

<div class="mb-3">
  <label class="block mb-2 font-medium">Answer / Notes</label>
  <textarea pInputTextarea class="w-full" rows="5" [(ngModel)]="text" placeholder="Write your answer here..."></textarea>
</div>

<p-fileUpload #uploader
  mode="advanced"
  [auto]="false"
  [customUpload]="false"
  [multiple]="true"
  [maxFileSize]="25000000"
  chooseLabel="Choose Files"
  (onSelect)="onSelect($event)">
</p-fileUpload>

<div class="mt-3 flex gap-2">
  <button pButton label="Submit" icon="pi pi-check" (click)="submit()" [disabled]="submitting()"></button>
  <button pButton label="Clear Files" class="p-button-secondary" icon="pi pi-times" (click)="clearFiles(uploader)"></button>
</div>
```

### B3) Show uploaded files on Student Submissions detail dialog

(Already included in your Student Submissions page code pack; it uses download buttons calling `/api/files/{fileKey}`.)


## PART C — Frontend (PrimeNG) — Admin Dashboard Overview page

Creates a PrimeNG Overview page with cards + quick links. Optional: load counts from backend.

```ts
// src/app/features/admin/pages/overview/admin-overview.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminOverviewService, AdminOverviewStats } from '../../services/admin-overview.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './admin-overview.component.html',
})
export class AdminOverviewComponent {
  private svc = inject(AdminOverviewService);
  private msg = inject(MessageService);

  loading = signal(false);
  stats = signal<AdminOverviewStats | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        const m = err?.error?.message || 'Failed to load overview stats';
        this.msg.add({ severity: 'warn', summary: 'Info', detail: m });
      }
    });
  }
}
```

```html
<!-- src/app/features/admin/pages/overview/admin-overview.component.html -->
<p-toast></p-toast>

<div class="mb-3">
  <h2 class="m-0">Admin Dashboard</h2>
  <p class="mt-2 text-sm">Quick overview and shortcuts.</p>
</div>

<div class="grid">
  <div class="col-12 md:col-3">
    <p-card header="Users" subheader="Manage accounts">
      <div class="text-2xl font-bold mb-2">{{ stats()?.users ?? '-' }}</div>
      <button pButton label="Open" icon="pi pi-users" routerLink="../users"></button>
    </p-card>
  </div>
  <div class="col-12 md:col-3">
    <p-card header="Classes" subheader="Create and assign">
      <div class="text-2xl font-bold mb-2">{{ stats()?.classes ?? '-' }}</div>
      <button pButton label="Open" icon="pi pi-building" routerLink="../classes"></button>
    </p-card>
  </div>
  <div class="col-12 md:col-3">
    <p-card header="Homeworks" subheader="All assigned">
      <div class="text-2xl font-bold mb-2">{{ stats()?.homeworks ?? '-' }}</div>
      <button pButton label="Open" icon="pi pi-file" routerLink="../announcements"></button>
    </p-card>
  </div>
  <div class="col-12 md:col-3">
    <p-card header="Audit Logs" subheader="Security & tracking">
      <div class="text-2xl font-bold mb-2">{{ stats()?.auditLogs ?? '-' }}</div>
      <button pButton label="Open" icon="pi pi-search" routerLink="../audit-logs"></button>
    </p-card>
  </div>
</div>
```

```ts
// src/app/features/admin/services/admin-overview.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface AdminOverviewStats {
  users: number;
  classes: number;
  homeworks: number;
  submissions: number;
  auditLogs: number;
}

@Injectable({ providedIn: 'root' })
export class AdminOverviewService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getStats() {
    return this.http.get<AdminOverviewStats>(`${this.base}/api/admin/overview`);
  }
}
```

### Optional Backend endpoint for Admin Overview stats

```java
// src/main/java/com/schoolportal/admin/controller/AdminOverviewController.java
package com.schoolportal.admin.controller;

import com.schoolportal.audit.repo.AuditLogRepository;
import com.schoolportal.homework.repo.HomeworkRepository;
import com.schoolportal.homework.repo.SubmissionRepository;
import com.schoolportal.classroom.repo.ClassRoomRepository;
import com.schoolportal.user.repo.UserAccountRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/overview")
public class AdminOverviewController {

  private final UserAccountRepository users;
  private final ClassRoomRepository classes;
  private final HomeworkRepository homeworks;
  private final SubmissionRepository submissions;
  private final AuditLogRepository audit;

  public AdminOverviewController(UserAccountRepository users,
                                ClassRoomRepository classes,
                                HomeworkRepository homeworks,
                                SubmissionRepository submissions,
                                AuditLogRepository audit) {
    this.users = users;
    this.classes = classes;
    this.homeworks = homeworks;
    this.submissions = submissions;
    this.audit = audit;
  }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping
  public Map<String, Long> stats() {
    return Map.of(
        "users", users.count(),
        "classes", classes.count(),
        "homeworks", homeworks.count(),
        "submissions", submissions.count(),
        "auditLogs", audit.count()
    );
  }
}
```


## PART D — Copilot prompts (copy/paste)

```text
PROMPT 1 — Backend submissions APIs
Using docs/Code-Pack-Backend-Submissions-FileUpload-AdminOverview.md, generate Spring Boot code for Submission model, repository, SubmissionService, StudentSubmissionsController, TeacherSubmissionsController, LocalFileStorageService, and FileController. Ensure endpoints and paths match the doc.

PROMPT 2 — Student file upload
Generate StudentHomeworkSubmitComponent + StudentHomeworkSubmitService to submit multipart FormData with JSON part 'data' and files[] part 'files' to POST /api/student/submissions.

PROMPT 3 — Admin overview
Generate AdminOverviewComponent + AdminOverviewService using PrimeNG p-card layout and GET /api/admin/overview stats endpoint.
```
