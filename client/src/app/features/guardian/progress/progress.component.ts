import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guardian-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Child's Academic Progress</h2>
      <p>Homework status and submissions will be displayed here.</p>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { color: #1976d2; }
  `]
})
export class ProgressComponent {}

