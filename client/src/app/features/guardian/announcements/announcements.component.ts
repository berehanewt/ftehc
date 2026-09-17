import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guardian-announcements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>School Announcements</h2>
      <p>Announcements will be displayed here.</p>
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    h2 { color: #1976d2; }
  `]
})
export class AnnouncementsComponent {}

