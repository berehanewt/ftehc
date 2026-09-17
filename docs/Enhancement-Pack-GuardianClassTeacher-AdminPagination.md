# Enhancement Pack - Guardian Class/Teacher + Admin Pagination

## Purpose
This pack adds two practical upgrades aligned with your current project:

1. **Guardian Homework Monitor enrichment**
   - Show `className` and `teacherName` per homework row.
2. **Admin pagination upgrades (PrimeNG)**
   - Standardize Admin list pages with PrimeNG table pagination and page-size controls.

This guide references your current Angular files and route structure.

## Current Frontend Targets
- Guardian monitor: `client/src/app/features/guardian/homework/guardian-homework.component.ts`
- Admin users: `client/src/app/features/admin/users/users-list.component.ts`
- Admin audit logs: `client/src/app/features/admin/audit-logs/audit-logs.component.ts`

## Current Backend Note
Your backend package namespace in this repo is `com.ftehc.ftehc`. Use that namespace when generating Java classes.

---

## Part A - Guardian Monitor: Add Teacher Name

### A1) Frontend model update
Update `client/src/app/features/guardian/homework/guardian-homework.models.ts`:

```ts
export interface GuardianStudentDto {
  id: string;
  email?: string;
  name?: string;
}

export type GuardianHomeworkStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface GuardianHomeworkItemDto {
  homeworkId: string;
  title: string;
  dueDate: string;

  classId?: string;
  className?: string;
  teacherName?: string; // NEW

  status: GuardianHomeworkStatus;
  submittedAt?: string;
  grade?: number;
}
```

### A2) Frontend table update
Update template in `client/src/app/features/guardian/homework/guardian-homework.component.ts`:

```html
<p-table [value]="rows" [loading]="loading" [paginator]="true" [rows]="10" sortField="dueDate" [sortOrder]="1">
  <ng-template pTemplate="header">
    <tr>
      <th>Homework</th>
      <th>Class</th>
      <th>Teacher</th>
      <th>Due Date</th>
      <th>Status</th>
      <th>Submitted</th>
      <th>Grade</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-row>
    <tr>
      <td>{{ row.title }}</td>
      <td>{{ row.className || row.classId || '-' }}</td>
      <td>{{ row.teacherName || '-' }}</td>
      <td>{{ row.dueDate }}</td>
      <td><p-tag [severity]="statusSeverity(row.status)" [value]="row.status"></p-tag></td>
      <td>{{ row.submittedAt || '-' }}</td>
      <td>{{ row.grade ?? '-' }}</td>
    </tr>
  </ng-template>
</p-table>
```

### A3) Backend response enrichment (service mapping)
If `/api/guardian/homework` does not yet return teacher/class names, enrich in backend service layer.

Example DTO (backend):

```java
// src/main/java/com/ftehc/ftehc/guardians/dto/GuardianHomeworkItemDto.java
package com.ftehc.ftehc.guardians.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GuardianHomeworkItemDto {
  private String homeworkId;
  private String title;
  private String dueDate;

  private String classId;
  private String className;
  private String teacherName;

  private String status;
  private String submittedAt;
  private Integer grade;
}
```

Service enrichment pattern (pseudo-real snippet):

```java
// 1) collect classIds from homework rows
// 2) bulk load classes -> map classId -> className/teacherId
// 3) bulk load teacher users -> map teacherId -> displayName/email
// 4) map DTO with className + teacherName
```

Keep enrichment in one query path to avoid N+1 lookups.

---

## Part B - Admin Pagination Standard (PrimeNG)

### B1) Users page migration target
`client/src/app/features/admin/users/users-list.component.ts` currently uses native table and no client-side page controls.

Target pattern:
- PrimeNG `p-table`
- `[paginator]="true"`
- `[rows]="10"`
- `[rowsPerPageOptions]="[10,25,50]"`
- `currentPageReportTemplate`

Template snippet:

```html
<p-table
  [value]="users"
  [loading]="loading"
  [paginator]="true"
  [rows]="10"
  [rowsPerPageOptions]="[10,25,50]"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
  dataKey="id"
>
  <ng-template pTemplate="header">
    <tr>
      <th>Email</th>
      <th>Roles</th>
      <th>Status</th>
      <th style="width: 150px">Action</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-user>
    <tr>
      <td>{{ user.email }}</td>
      <td>{{ user.roles.join(', ') }}</td>
      <td>{{ user.active ? 'Active' : 'Disabled' }}</td>
      <td>
        <button
          pButton
          type="button"
          size="small"
          [label]="user.active ? 'Disable' : 'Activate'"
          severity="secondary"
          [disabled]="loading"
          (click)="toggleActive(user)"
        ></button>
      </td>
    </tr>
  </ng-template>
</p-table>
```

### B2) Audit logs pagination target
`client/src/app/features/admin/audit-logs/audit-logs.component.ts` currently fetches with `limit: 200` and renders a native table.

Two safe upgrade paths:

1. **Client-pagination now**
   - Keep current API
   - Switch to PrimeNG `p-table` paginator for UI consistency.

2. **Server-pagination next** (recommended for scale)
   - Backend endpoint returns `{ items, total, page, size }`
   - PrimeNG `lazy` table + `(onLazyLoad)`.

Client-pagination template starter:

```html
<p-table
  [value]="logs"
  [loading]="loading"
  [paginator]="true"
  [rows]="20"
  [rowsPerPageOptions]="[20,50,100]"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} logs"
>
  <ng-template pTemplate="header">
    <tr>
      <th>Time</th>
      <th>User</th>
      <th>Action</th>
      <th>Entity</th>
      <th>Method</th>
      <th>Path</th>
      <th>IP</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-log>
    <tr>
      <td>{{ formatTime(log.timestamp) }}</td>
      <td>{{ log.userId || '-' }}</td>
      <td>{{ log.action || '-' }}</td>
      <td>{{ log.entity || '-' }}{{ log.entityId ? ' (' + log.entityId + ')' : '' }}</td>
      <td>{{ log.method || '-' }}</td>
      <td>{{ log.path || '-' }}</td>
      <td>{{ log.ip || '-' }}</td>
    </tr>
  </ng-template>
</p-table>
```

---

## Part C - Optional Backend Pagination for Admin Audit

If you choose server-side pagination, create a generic response DTO and a paged admin audit endpoint.

```java
// src/main/java/com/ftehc/ftehc/common/PageResponse.java
package com.ftehc.ftehc.common;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class PageResponse<T> {
  private List<T> items;
  private long total;
  private int page;
  private int size;
}
```

```java
// src/main/java/com/ftehc/ftehc/admin/AdminAuditController.java
// NOTE: adapt repo/model package names to your existing audit implementation.
```

Frontend would then use PrimeNG lazy table loading (`onLazyLoad`) and pass `page`/`size` query params.

---

## Part D - Validation Checklist

- Guardian monitor displays class and teacher columns without template errors.
- Guardian API payload includes `className` and `teacherName` (or graceful `-` fallback).
- Users page paginates with `10/25/50` options.
- Audit logs page paginates with PrimeNG table.
- Existing role guards/routes continue to work.

---

## Copilot Prompt Starters

```text
1) Guardian class+teacher enrichment
Update guardian homework backend mapping so /api/guardian/homework returns className and teacherName. Then update guardian-homework.models.ts and guardian-homework.component.ts table columns to display them.

2) Admin users pagination
Migrate client/src/app/features/admin/users/users-list.component.ts to PrimeNG p-table with paginator, rowsPerPageOptions, and current page report while preserving create/toggle behaviors.

3) Admin audit pagination
Migrate client/src/app/features/admin/audit-logs/audit-logs.component.ts table to PrimeNG p-table with paginator. Keep existing filters and current query logic.

4) Optional server-side audit pagination
Add backend paged admin audit endpoint returning PageResponse and wire frontend lazy table loading.
```

## Last Updated
- 2026-05-12

