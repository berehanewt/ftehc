# Enhancement Pack - Guardian Unread + CSV Export + Due Presets

## Purpose
This pack upgrades `GuardianHomeworkComponent` with three practical UX features:

1. **Unread feedback indicator** per homework row
2. **Export CSV** for currently filtered rows
3. **Due-date quick presets** (`Overdue`, `Today`, `Next 7`, `Next 30`, `Custom`)

This guide is aligned with your current file:
- `client/src/app/features/guardian/homework/guardian-homework.component.ts`

It uses your existing PrimeNG style (`p-select`, `p-table`, `p-tag`, standalone components).

## Assumptions
- Guardian monitor already has filters and table rendering in place.
- Backend can return either:
  - `unreadFeedback` boolean directly, or
  - `feedbackUpdatedAt` / `feedbackReadAt` timestamps.

---

## Part A - Model Updates

Update `client/src/app/features/guardian/homework/guardian-homework.models.ts`:

```ts
export interface GuardianHomeworkItemDto {
  homeworkId: string;
  title: string;
  dueDate: string;
  classId?: string;
  className?: string;
  teacherName?: string;
  status: GuardianHomeworkStatus;
  submittedAt?: string;
  grade?: number;

  // NEW options for unread indicator
  unreadFeedback?: boolean;
  feedbackUpdatedAt?: string;
  feedbackReadAt?: string;
}
```

---

## Part B - Component TS Enhancements

### B1) PrimeNG imports
In `client/src/app/features/guardian/homework/guardian-homework.component.ts`, add:

```ts
import { SelectButtonModule } from 'primeng/selectbutton';
```

Include in `imports` array:

```ts
SelectButtonModule
```

### B2) Preset types and state
Inside component class:

```ts
type DuePreset = 'CUSTOM' | 'OVERDUE' | 'TODAY' | 'NEXT_7' | 'NEXT_30';

selectedDuePreset: DuePreset = 'CUSTOM';
duePresetOptions: Array<{ label: string; value: DuePreset }> = [
  { label: 'Custom', value: 'CUSTOM' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Today', value: 'TODAY' },
  { label: 'Next 7', value: 'NEXT_7' },
  { label: 'Next 30', value: 'NEXT_30' }
];
```

### B3) Preset date helpers
Add methods:

```ts
onDuePresetChange(preset: DuePreset): void {
  this.selectedDuePreset = preset;

  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const toYmd = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const addDays = (d: Date, n: number): Date => {
    const out = new Date(d);
    out.setDate(out.getDate() + n);
    return out;
  };

  if (preset === 'CUSTOM') {
    return;
  }
  if (preset === 'OVERDUE') {
    this.dueFrom = '';
    this.dueTo = toYmd(addDays(dayStart, -1));
    return;
  }
  if (preset === 'TODAY') {
    const ymd = toYmd(dayStart);
    this.dueFrom = ymd;
    this.dueTo = ymd;
    return;
  }
  if (preset === 'NEXT_7') {
    this.dueFrom = toYmd(dayStart);
    this.dueTo = toYmd(addDays(dayStart, 7));
    return;
  }

  this.dueFrom = toYmd(dayStart);
  this.dueTo = toYmd(addDays(dayStart, 30));
}
```

Update clear/reset path:

```ts
clearFilters(): void {
  this.searchTitle = '';
  this.selectedStatus = 'ALL';
  this.selectedTeacher = 'ALL';
  this.dueFrom = '';
  this.dueTo = '';
  this.selectedDuePreset = 'CUSTOM';
}
```

When user manually edits due dates, keep preset in sync by setting it to `CUSTOM`.

### B4) Unread feedback helper
Add helper:

```ts
isUnreadFeedback(row: GuardianHomeworkItemDto): boolean {
  if (typeof row.unreadFeedback === 'boolean') {
    return row.unreadFeedback;
  }

  if (row.feedbackUpdatedAt) {
    if (!row.feedbackReadAt) {
      return true;
    }
    return new Date(row.feedbackReadAt).getTime() < new Date(row.feedbackUpdatedAt).getTime();
  }

  return false;
}
```

### B5) CSV export for filtered rows
Add method:

```ts
exportFilteredCsv(): void {
  const rows = this.filteredRows;
  if (!rows.length) {
    this.notificationService.info('No rows to export');
    return;
  }

  const esc = (v: unknown): string => {
    const s = (v ?? '').toString().replace(/"/g, '""');
    return `"${s}"`;
  };

  const header = [
    'Title', 'Class', 'Teacher', 'DueDate', 'Status', 'SubmittedAt', 'Grade', 'UnreadFeedback'
  ];

  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      esc(r.title),
      esc(r.className || r.classId || ''),
      esc(r.teacherName || ''),
      esc(r.dueDate || ''),
      esc(r.status || ''),
      esc(r.submittedAt || ''),
      esc(r.grade ?? ''),
      esc(this.isUnreadFeedback(r) ? 'YES' : 'NO')
    ].join(','));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'guardian_homework_filtered.csv';
  a.click();

  URL.revokeObjectURL(url);
}
```

---

## Part C - Template Enhancements

In `client/src/app/features/guardian/homework/guardian-homework.component.ts` inline template, add a preset/export row above existing filter grid:

```html
<div class="preset-row">
  <p-selectButton
    [options]="duePresetOptions"
    optionLabel="label"
    optionValue="value"
    [(ngModel)]="selectedDuePreset"
    [ngModelOptions]="{ standalone: true }"
    (onChange)="onDuePresetChange($event.value)"
  ></p-selectButton>

  <button
    pButton
    type="button"
    icon="pi pi-download"
    label="Export CSV"
    (click)="exportFilteredCsv()"
  ></button>
</div>
```

For due date inputs, reset preset to custom when changed manually:

```html
<input pInputText type="date" [(ngModel)]="dueFrom" [ngModelOptions]="{ standalone: true }" (ngModelChange)="selectedDuePreset='CUSTOM'" />
<input pInputText type="date" [(ngModel)]="dueTo" [ngModelOptions]="{ standalone: true }" (ngModelChange)="selectedDuePreset='CUSTOM'" />
```

Add unread indicator column in table:

```html
<th style="width: 110px">Feedback</th>
```

```html
<td>
  <span *ngIf="isUnreadFeedback(row)" class="pi pi-circle-fill unread-dot" title="Unread feedback"></span>
  <span *ngIf="!isUnreadFeedback(row)">-</span>
</td>
```

Update empty message colspan accordingly (increase by 1).

Optional style additions:

```css
.preset-row { display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.unread-dot { color: #d32f2f; font-size: 0.75rem; }
```

---

## Part D - Optional Backend Support

If backend does not return `unreadFeedback`, extend guardian homework DTO mapping to include either:
- `unreadFeedback` boolean, or
- `feedbackUpdatedAt` + `feedbackReadAt`.

Preferred contract for frontend simplicity:

```json
{
  "homeworkId": "...",
  "title": "...",
  "unreadFeedback": true
}
```

---

## Validation Checklist

- Due preset buttons set date range correctly.
- Manual due date edits switch preset back to `CUSTOM`.
- CSV export downloads only currently filtered rows.
- Feedback column shows unread dot only when expected.
- Existing guardian filters and pagination continue working.

---

## Copilot Prompt Starters

```text
1) Add due presets
Update GuardianHomeworkComponent to support due date presets (CUSTOM/OVERDUE/TODAY/NEXT_7/NEXT_30) with SelectButton and date-range updates.

2) Add CSV export
Add exportFilteredCsv() to GuardianHomeworkComponent and Export CSV button to download currently filtered rows.

3) Add unread indicator
Add unread feedback indicator column in Guardian table using unreadFeedback boolean or feedbackUpdatedAt/feedbackReadAt fallback logic.

4) Apply complete enhancement
Apply docs/Enhancement-Pack-Guardian-UnreadCsvPresets.md exactly to guardian-homework component and model.
```

## Last Updated
- 2026-05-12
