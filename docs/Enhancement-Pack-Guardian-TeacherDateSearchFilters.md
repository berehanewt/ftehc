# Enhancement Pack - Guardian + Teacher Date/Search Filters (PrimeNG)

## Purpose
This pack adds practical filtering enhancements across Guardian and Teacher pages using your current standalone PrimeNG component style:

1. **Guardian Homework Monitor filters**
   - Teacher filter (`p-select`)
   - Status filter (`p-select`)
   - Due date range (`from` / `to`)
   - Homework title search
2. **Teacher Submissions filters**
   - Student search
   - Status filter
   - Submitted date range (`from` / `to`)

This guide is aligned with your current files:
- `client/src/app/features/guardian/homework/guardian-homework.component.ts`
- `client/src/app/features/teacher/submissions/submissions-list.component.ts`

## Prerequisites
- PrimeNG already installed and in use (`p-select`, `p-table`, `p-tag`)
- Date fields are ISO or `yyyy-MM-dd` compatible strings

---

## Part A - Guardian Monitor Filters

### A1) Component state additions
Update `client/src/app/features/guardian/homework/guardian-homework.component.ts` with additional filter state:

```ts
searchTitle = '';
selectedStatus: GuardianHomeworkStatus | 'ALL' = 'ALL';
selectedTeacher = 'ALL';
dueFrom = '';
dueTo = '';

teacherOptions: Array<{ label: string; value: string }> = [{ label: 'All Teachers', value: 'ALL' }];
statusOptions: Array<{ label: string; value: GuardianHomeworkStatus | 'ALL' }> = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Not Submitted', value: 'NOT_SUBMITTED' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Late', value: 'LATE' },
  { label: 'Graded', value: 'GRADED' }
];
```

### A2) Build teacher options after loading rows
In `loadHomework(studentId: string)` after assigning `this.rows = rows;`:

```ts
const teacherNames = Array.from(new Set(
  rows.map(r => (r.teacherName || '').trim()).filter(Boolean)
)).sort((a, b) => a.localeCompare(b));

this.teacherOptions = [
  { label: 'All Teachers', value: 'ALL' },
  ...teacherNames.map(name => ({ label: name, value: name }))
];
```

### A3) Add filteredRows getter
Still in `GuardianHomeworkComponent`:

```ts
get filteredRows(): GuardianHomeworkItemDto[] {
  return this.rows.filter(row => {
    const titleMatch = !this.searchTitle || (row.title || '').toLowerCase().includes(this.searchTitle.toLowerCase());

    const statusMatch = this.selectedStatus === 'ALL' || row.status === this.selectedStatus;

    const teacherMatch = this.selectedTeacher === 'ALL' || (row.teacherName || '') === this.selectedTeacher;

    const due = row.dueDate || '';
    const fromMatch = !this.dueFrom || due >= this.dueFrom;
    const toMatch = !this.dueTo || due <= this.dueTo;

    return titleMatch && statusMatch && teacherMatch && fromMatch && toMatch;
  });
}
```

### A4) Guardian template filter controls
In the template section above the table:

```html
<div class="filter-grid">
  <input pInputText type="text" placeholder="Search homework title" [(ngModel)]="searchTitle" [ngModelOptions]="{ standalone: true }" />

  <p-select
    [options]="statusOptions"
    optionLabel="label"
    optionValue="value"
    [(ngModel)]="selectedStatus"
    [ngModelOptions]="{ standalone: true }"
    placeholder="Status"
  ></p-select>

  <p-select
    [options]="teacherOptions"
    optionLabel="label"
    optionValue="value"
    [(ngModel)]="selectedTeacher"
    [ngModelOptions]="{ standalone: true }"
    placeholder="Teacher"
  ></p-select>

  <input pInputText type="date" [(ngModel)]="dueFrom" [ngModelOptions]="{ standalone: true }" />
  <input pInputText type="date" [(ngModel)]="dueTo" [ngModelOptions]="{ standalone: true }" />
</div>
```

Then switch table binding:

```html
<p-table [value]="filteredRows" ...>
```

Optional style block addition:

```css
.filter-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(160px, 1fr));
  gap: 0.5rem;
}
```

---

## Part B - Teacher Submissions Date/Search Filters

### B1) Component state additions
Update `client/src/app/features/teacher/submissions/submissions-list.component.ts`:

```ts
studentSearch = '';
submittedFrom = '';
submittedTo = '';
selectedSubmissionStatus: SubmissionStatus | 'ALL' = 'ALL';

submissionStatusOptions: Array<{ label: string; value: SubmissionStatus | 'ALL' }> = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Late', value: 'LATE' },
  { label: 'Graded', value: 'GRADED' },
  { label: 'Returned', value: 'RETURNED' }
];
```

### B2) Add filteredSubmissions getter

```ts
get filteredSubmissions(): TeacherSubmissionDto[] {
  return this.submissionRows.filter(row => {
    const studentLabel = (row.studentEmail || row.studentId || '').toLowerCase();
    const studentMatch = !this.studentSearch || studentLabel.includes(this.studentSearch.toLowerCase());

    const statusMatch = this.selectedSubmissionStatus === 'ALL' || row.status === this.selectedSubmissionStatus;

    const submittedDate = row.submittedAt ? row.submittedAt.slice(0, 10) : '';
    const fromMatch = !this.submittedFrom || (submittedDate && submittedDate >= this.submittedFrom);
    const toMatch = !this.submittedTo || (submittedDate && submittedDate <= this.submittedTo);

    return studentMatch && statusMatch && fromMatch && toMatch;
  });
}
```

### B3) Teacher template filter controls
Add below class/homework selectors:

```html
<div class="filter-row-extended">
  <input pInputText type="text" placeholder="Search student" [(ngModel)]="studentSearch" [ngModelOptions]="{ standalone: true }" />

  <p-select
    [options]="submissionStatusOptions"
    optionLabel="label"
    optionValue="value"
    [(ngModel)]="selectedSubmissionStatus"
    [ngModelOptions]="{ standalone: true }"
    placeholder="Status"
  ></p-select>

  <input pInputText type="date" [(ngModel)]="submittedFrom" [ngModelOptions]="{ standalone: true }" />
  <input pInputText type="date" [(ngModel)]="submittedTo" [ngModelOptions]="{ standalone: true }" />
</div>
```

Switch table value binding:

```html
<p-table [value]="filteredSubmissions" ...>
```

Optional style addition:

```css
.filter-row-extended {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 0.6rem;
}
```

---

## Part C - Validation Checklist

- Guardian page still loads selected student homework rows.
- Guardian filter combinations (title + status + teacher + due range) narrow table rows correctly.
- Teacher submissions still deep-link correctly from homework page.
- Teacher submission filters (student + status + submitted range) narrow rows correctly.
- No compile errors after switching table bindings to filtered getters.

---

## Copilot Prompt Starters

```text
1) Guardian filters
Update client/src/app/features/guardian/homework/guardian-homework.component.ts to add title search, status filter, teacher filter, dueFrom/dueTo filters, and bind p-table to filteredRows.

2) Teacher submissions filters
Update client/src/app/features/teacher/submissions/submissions-list.component.ts to add student search, status filter, submittedFrom/submittedTo filters, and bind p-table to filteredSubmissions.

3) Keep deep-link behavior
Ensure queryParam preselection (classId/homeworkId) in TeacherSubmissionsComponent remains intact after filter additions.
```

## Last Updated
- 2026-05-12
