import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DASHBOARD_PRIMENG_STYLES } from '../../../shared/ui/dashboard-primeng.styles';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TagModule],
  template: `
    <section class="dashboard">
      <header class="dashboard-header">
        <div>
          <h1>Student Dashboard</h1>
          <p>See assignments, announcements, documents, and profile actions in one place.</p>
        </div>
        <p-tag value="Student Portal" severity="info"></p-tag>
      </header>

      <div class="summary-grid">
        <p-card>
          <ng-template pTemplate="title">Homework</ng-template>
          <p class="metric">Track tasks and due dates</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Announcements</ng-template>
          <p class="metric">Stay updated with school news</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Documents</ng-template>
          <p class="metric">Download learning resources</p>
        </p-card>
      </div>

      <div class="action-grid">
        <p-card header="My Homework" subheader="Assignments and submissions">
          <button pButton type="button" label="Open Homework" icon="pi pi-file" routerLink="/student/homework"></button>
        </p-card>

        <p-card header="Announcements" subheader="School and class updates">
          <button pButton type="button" label="Open Announcements" icon="pi pi-megaphone" routerLink="/student/announcements"></button>
        </p-card>

        <p-card header="Documents" subheader="Materials and references">
          <button pButton type="button" label="Open Documents" icon="pi pi-folder" routerLink="/student/documents"></button>
        </p-card>

        <p-card header="Profile" subheader="Your account details">
          <button pButton type="button" label="Open Profile" icon="pi pi-user" routerLink="/student/profile"></button>
        </p-card>
      </div>
    </section>
  `,
  styles: [DASHBOARD_PRIMENG_STYLES]
})
export class StudentDashboardComponent {}

