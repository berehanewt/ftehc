import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-classes-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>My Classes</h2>
      <p>Your classes will be displayed here.</p>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { color: #1976d2; }
  `]
})
export class ClassesListComponent {}

