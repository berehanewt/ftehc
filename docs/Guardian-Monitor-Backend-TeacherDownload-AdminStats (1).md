# Code Pack — Guardian Monitor Backend APIs + Teacher Submission File Download + Admin Dashboard Stats

This pack provides **copy/paste-ready code** for:

1) **Backend APIs for Guardian Homework Monitor** (Spring Boot + MongoDB + JWT)
2) **File download support in Teacher Submissions UI** (PrimeNG)
3) **Admin Dashboard with Stats** (PrimeNG cards + backend `/api/admin/overview`)

Save this file under `docs/` and keep it open in IntelliJ while using Copilot Chat.

## Assumptions

- Spring Boot 3, Spring Security (JWT) already configured.
- MongoDB collections exist for: `users`, `students`, `guardians`, `classes`, `homeworks`, `submissions`.
- `Submission.studentUserId` stores the **UserAccount.id** of the student.
- `Student.userId` stores the **UserAccount.id** for the student login.
- `Student.classIds` contains class ids the student belongs to.
- `Homework.classId` identifies the class, and `Homework.dueDate` is a `LocalDate`.
- File download endpoint exists: `GET /api/files/{fileKey}` (teacher/student authorized).

## Endpoints

### Guardian
- `GET /api/guardian/students` — list linked students for logged-in guardian
- `GET /api/guardian/homework?studentId=...` — homework monitor for selected student

### Teacher
- `GET /api/teacher/submissions?homeworkId=...` — list submissions
- `GET /api/files/{fileKey}` — download submission files

### Admin
- `GET /api/admin/overview` — counts for cards (users/classes/homeworks/submissions/auditLogs)


## PART A — Backend (Spring Boot) — Guardian Monitor APIs

### A1) Student + Guardian models (minimal fields needed)

```java
// src/main/java/com/schoolportal/student/model/Student.java
package com.schoolportal.student.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Document("students")
public class Student {
  @Id
  private String id;

  /** user account id for student login */
  private String userId;

  private String firstName;
  private String lastName;

  /** classes the student is enrolled in */
  private List<String> classIds;

  /** optional: guardians linked */
  private List<String> guardianIds;
}
```

```java
// src/main/java/com/schoolportal/guardian/model/Guardian.java
package com.schoolportal.guardian.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Document("guardians")
public class Guardian {
  @Id
  private String id;

  /** user account id for guardian login */
  private String userId;

  /** linked student ids */
  private List<String> studentIds;
}
```

### A2) Repositories

```java
// src/main/java/com/schoolportal/student/repo/StudentRepository.java
package com.schoolportal.student.repo;

import com.schoolportal.student.model.Student;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends MongoRepository<Student, String> {
  Optional<Student> findByUserId(String userId);
  List<Student> findByIdIn(List<String> ids);
}
```

```java
// src/main/java/com/schoolportal/guardian/repo/GuardianRepository.java
package com.schoolportal.guardian.repo;

import com.schoolportal.guardian.model.Guardian;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GuardianRepository extends MongoRepository<Guardian, String> {
  Optional<Guardian> findByUserId(String userId);
}
```

### A3) Homework repository (query by classIds)

```java
// src/main/java/com/schoolportal/homework/repo/HomeworkRepository.java
package com.schoolportal.homework.repo;

import com.schoolportal.homework.model.Homework;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HomeworkRepository extends MongoRepository<Homework, String> {
  List<Homework> findByClassIdInOrderByDueDateAsc(List<String> classIds);
}
```

### A4) Guardian monitor DTOs

```java
// src/main/java/com/schoolportal/guardian/dto/GuardianStudentDto.java
package com.schoolportal.guardian.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GuardianStudentDto {
  private String studentId;
  private String studentUserId;
  private String name;
  private String email;
}
```

```java
// src/main/java/com/schoolportal/guardian/dto/GuardianHomeworkItemDto.java
package com.schoolportal.guardian.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GuardianHomeworkItemDto {
  private String homeworkId;
  private String title;
  private String dueDate;     // yyyy-MM-dd
  private String classId;
  private String status;      // NOT_SUBMITTED | SUBMITTED | LATE | GRADED
  private String submittedAt; // ISO date-time or null
  private Integer grade;      // optional
}
```

### A5) GuardianMonitorService (ownership check + status computation)

```java
// src/main/java/com/schoolportal/guardian/service/GuardianMonitorService.java
package com.schoolportal.guardian.service;

import com.schoolportal.guardian.dto.GuardianHomeworkItemDto;
import com.schoolportal.guardian.dto.GuardianStudentDto;
import com.schoolportal.guardian.model.Guardian;
import com.schoolportal.guardian.repo.GuardianRepository;
import com.schoolportal.homework.model.Homework;
import com.schoolportal.homework.model.Submission;
import com.schoolportal.homework.model.SubmissionStatus;
import com.schoolportal.homework.repo.HomeworkRepository;
import com.schoolportal.homework.repo.SubmissionRepository;
import com.schoolportal.student.model.Student;
import com.schoolportal.student.repo.StudentRepository;
import com.schoolportal.user.repo.UserAccountRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class GuardianMonitorService {

  private final GuardianRepository guardianRepo;
  private final StudentRepository studentRepo;
  private final UserAccountRepository userRepo;
  private final HomeworkRepository homeworkRepo;
  private final SubmissionRepository submissionRepo;

  public GuardianMonitorService(GuardianRepository guardianRepo,
                               StudentRepository studentRepo,
                               UserAccountRepository userRepo,
                               HomeworkRepository homeworkRepo,
                               SubmissionRepository submissionRepo) {
    this.guardianRepo = guardianRepo;
    this.studentRepo = studentRepo;
    this.userRepo = userRepo;
    this.homeworkRepo = homeworkRepo;
    this.submissionRepo = submissionRepo;
  }

  public Guardian requireGuardianByUserId(String guardianUserId) {
    return guardianRepo.findByUserId(guardianUserId)
        .orElseThrow(() -> new IllegalArgumentException("Guardian profile not found"));
  }

  public List<GuardianStudentDto> listLinkedStudents(String guardianUserId) {
    Guardian g = requireGuardianByUserId(guardianUserId);
    List<String> ids = g.getStudentIds() == null ? List.of() : g.getStudentIds();
    if (ids.isEmpty()) return List.of();

    List<Student> students = studentRepo.findByIdIn(ids);
    List<GuardianStudentDto> result = new ArrayList<>();

    for (Student s : students) {
      String email = userRepo.findById(s.getUserId()).map(u -> u.getEmail()).orElse(null);
      String name = (s.getFirstName() == null ? "" : s.getFirstName()) +
          (s.getLastName() == null ? "" : (" " + s.getLastName()));
      result.add(GuardianStudentDto.builder()
          .studentId(s.getId())
          .studentUserId(s.getUserId())
          .name(name.trim().isEmpty() ? null : name.trim())
          .email(email)
          .build());
    }

    return result;
  }

  /**
   * Homework monitor for a student (guardian must be linked to that student).
   */
  public List<GuardianHomeworkItemDto> homeworkMonitor(String guardianUserId, String studentId) {
    Guardian g = requireGuardianByUserId(guardianUserId);
    if (g.getStudentIds() == null || !g.getStudentIds().contains(studentId)) {
      throw new IllegalArgumentException("Not authorized for this student");
    }

    Student student = studentRepo.findById(studentId)
        .orElseThrow(() -> new IllegalArgumentException("Student not found"));

    List<String> classIds = student.getClassIds() == null ? List.of() : student.getClassIds();
    if (classIds.isEmpty()) return List.of();

    List<Homework> homeworks = homeworkRepo.findByClassIdInOrderByDueDateAsc(classIds);

    LocalDate today = LocalDate.now();
    List<GuardianHomeworkItemDto> out = new ArrayList<>();

    for (Homework hw : homeworks) {
      Optional<Submission> subOpt = submissionRepo.findByHomeworkIdAndStudentUserId(hw.getId(), student.getUserId());

      String status;
      String submittedAt = null;
      Integer grade = null;

      if (subOpt.isPresent()) {
        Submission sub = subOpt.get();
        submittedAt = sub.getSubmittedAt() != null ? sub.getSubmittedAt().toString() : null;
        grade = sub.getGrade();

        if (sub.getStatus() == SubmissionStatus.GRADED || sub.getGrade() != null) status = "GRADED";
        else if (sub.getStatus() == SubmissionStatus.LATE) status = "LATE";
        else status = "SUBMITTED";
      } else {
        if (hw.getDueDate() != null && hw.getDueDate().isBefore(today)) status = "LATE";
        else status = "NOT_SUBMITTED";
      }

      out.add(GuardianHomeworkItemDto.builder()
          .homeworkId(hw.getId())
          .title(hw.getTitle())
          .dueDate(hw.getDueDate() != null ? hw.getDueDate().toString() : null)
          .classId(hw.getClassId())
          .status(status)
          .submittedAt(submittedAt)
          .grade(grade)
          .build());
    }

    return out;
  }
}
```

### A6) GuardianMonitorController

```java
// src/main/java/com/schoolportal/guardian/controller/GuardianMonitorController.java
package com.schoolportal.guardian.controller;

import com.schoolportal.guardian.dto.GuardianHomeworkItemDto;
import com.schoolportal.guardian.dto.GuardianStudentDto;
import com.schoolportal.guardian.service.GuardianMonitorService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guardian")
public class GuardianMonitorController {

  private final GuardianMonitorService service;

  public GuardianMonitorController(GuardianMonitorService service) {
    this.service = service;
  }

  private String currentUserId() {
    return String.valueOf(SecurityContextHolder.getContext().getAuthentication().getPrincipal());
  }

  @PreAuthorize("hasRole('GUARDIAN')")
  @GetMapping("/students")
  public List<GuardianStudentDto> linkedStudents() {
    return service.listLinkedStudents(currentUserId());
  }

  @PreAuthorize("hasRole('GUARDIAN')")
  @GetMapping("/homework")
  public List<GuardianHomeworkItemDto> homework(@RequestParam String studentId) {
    return service.homeworkMonitor(currentUserId(), studentId);
  }
}
```

### A7) Improvement (optional but recommended)

The file download endpoint in earlier code scanned all submissions to find a fileKey.
For performance, consider storing `fileKey -> submissionId` mapping or add a Mongo query by embedded fileKey.


## PART B — Frontend — Teacher Submissions: add file download buttons

If you already generated Teacher Submissions page, ensure the dialog shows files and calls `/api/files/{fileKey}`.

```html
<!-- teacher-submissions.component.html (inside Submission Details dialog) -->
<div class="mb-3" *ngIf="sub.files?.length">
  <label class="block mb-2 font-medium">Files</label>
  <ul class="m-0 pl-3">
    <li *ngFor="let f of sub.files">
      <button pButton class="p-button-link" type="button" icon="pi pi-download"
        (click)="download(f.fileKey, f.fileName)" label="{{ f.fileName }}"></button>
    </li>
  </ul>
</div>
```

```ts
// teacher-submissions.component.ts (download helper)
download(fileKey: string, fileName: string) {
  this.subSvc.downloadFile(fileKey).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => this.toastError(err, 'Download failed'),
  });
}
```

```ts
// teacher-submissions.service.ts (download API)
downloadFile(fileKey: string) {
  return this.http.get(`${this.base}/api/files/${fileKey}`, { responseType: 'blob' });
}
```


## PART C — Admin Dashboard with Stats (PrimeNG)

### C1) Backend: `/api/admin/overview` counts (Admin only)

```java
// src/main/java/com/schoolportal/admin/controller/AdminOverviewController.java
package com.schoolportal.admin.controller;

import com.schoolportal.audit.repo.AuditLogRepository;
import com.schoolportal.classroom.repo.ClassRoomRepository;
import com.schoolportal.homework.repo.HomeworkRepository;
import com.schoolportal.homework.repo.SubmissionRepository;
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

### C2) Frontend: PrimeNG Admin Overview cards

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
      error: () => {
        this.loading.set(false);
        this.msg.add({ severity: 'warn', summary: 'Info', detail: 'Could not load stats (backend not ready?)' });
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
  <p class="mt-2 text-sm">System stats and quick links.</p>
</div>

<div class="grid">
  <div class="col-12 md:col-3">
    <p-card header="Users" subheader="Accounts">
      <div class="text-2xl font-bold mb-2">{{ stats()?.users ?? '-' }}</div>
      <button pButton label="Users" icon="pi pi-users" routerLink="../users"></button>
    </p-card>
  </div>

  <div class="col-12 md:col-3">
    <p-card header="Classes" subheader="Sections">
      <div class="text-2xl font-bold mb-2">{{ stats()?.classes ?? '-' }}</div>
      <button pButton label="Classes" icon="pi pi-building" routerLink="../classes"></button>
    </p-card>
  </div>

  <div class="col-12 md:col-3">
    <p-card header="Homeworks" subheader="Assigned">
      <div class="text-2xl font-bold mb-2">{{ stats()?.homeworks ?? '-' }}</div>
      <button pButton label="Go" icon="pi pi-file" routerLink="../classes"></button>
    </p-card>
  </div>

  <div class="col-12 md:col-3">
    <p-card header="Submissions" subheader="Student work">
      <div class="text-2xl font-bold mb-2">{{ stats()?.submissions ?? '-' }}</div>
      <button pButton label="Audit" icon="pi pi-search" routerLink="../audit-logs"></button>
    </p-card>
  </div>
</div>

<div class="grid mt-3">
  <div class="col-12 md:col-3">
    <p-card header="Audit Logs" subheader="Tracking">
      <div class="text-2xl font-bold mb-2">{{ stats()?.auditLogs ?? '-' }}</div>
      <button pButton label="Audit Logs" icon="pi pi-shield" routerLink="../audit-logs"></button>
    </p-card>
  </div>
</div>
```


## PART D — Copilot prompts (copy/paste)

```text
PROMPT 1 — Guardian monitor backend
Using docs/Guardian-Monitor-Backend-TeacherDownload-AdminStats.md, generate Spring Boot code for GuardianMonitorController + GuardianMonitorService + DTOs + repositories. Ensure guardian ownership check is enforced.

PROMPT 2 — Teacher submissions download
Update TeacherSubmissionsComponent to render file download links in the submission detail dialog and call GET /api/files/{fileKey}. Ensure TeacherSubmissionsService implements downloadFile(fileKey) returning blob.

PROMPT 3 — Admin dashboard stats
Generate AdminOverviewController (GET /api/admin/overview) and AdminOverviewComponent (PrimeNG cards) with AdminOverviewService calling the endpoint.
```
