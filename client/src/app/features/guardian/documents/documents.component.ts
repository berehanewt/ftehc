import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guardian-documents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Course Documents</h2>
      <p>Documents will be displayed here.</p>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { color: #1976d2; }
  `]
})
export class DocumentsComponent {}

