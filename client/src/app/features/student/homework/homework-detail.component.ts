import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-homework-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Homework Detail</h2>
      <p>Homework details and submission form will be displayed here.</p>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { color: #1976d2; }
  `]
})
export class HomeworkDetailComponent {
  constructor(private route: ActivatedRoute) {}
}

