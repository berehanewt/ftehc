import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-student-homework-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <h2>My Homework</h2>
      <div class="homework-list">
        <p>Your homework assignments will be displayed here.</p>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { color: #1976d2; }
  `]
})
export class HomeworkListComponent {}

