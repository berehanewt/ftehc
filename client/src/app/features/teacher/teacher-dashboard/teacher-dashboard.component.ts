import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DASHBOARD_PRIMENG_STYLES } from '../../../shared/ui/dashboard-primeng.styles';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TagModule],
  template: `
    <section class="dashboard">
      <header class="dashboard-header">
        <div>
          <h1>Teacher Dashboard</h1>
          <p>Track classes, create homework, review submissions, and publish announcements.</p>
        </div>
        <p-tag value="Teacher Workspace" severity="success"></p-tag>
      </header>

      <div class="summary-grid">
        <p-card>
          <ng-template pTemplate="title">Classes</ng-template>
          <p class="metric">Manage your assigned classes</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Homework</ng-template>
          <p class="metric">Create and maintain assignments</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Submissions</ng-template>
          <p class="metric">Review student work quickly</p>
        </p-card>
      </div>

      <div class="action-grid">
        <p-card header="My Classes" subheader="Class rosters and schedule">
          <button pButton type="button" label="Open Classes" icon="pi pi-book" routerLink="/teacher/classes"></button>
        </p-card>

        <p-card header="Homework" subheader="Assignments and due dates">
          <button pButton type="button" label="Open Homework" icon="pi pi-file-edit" routerLink="/teacher/homework"></button>
        </p-card>

        <p-card header="Submissions" subheader="Student submissions review">
          <button pButton type="button" label="Open Submissions" icon="pi pi-check-square" routerLink="/teacher/submissions"></button>
        </p-card>

        <p-card header="Announcements" subheader="Class and school updates">
          <button pButton type="button" label="Open Announcements" icon="pi pi-megaphone" routerLink="/teacher/announcements"></button>
        </p-card>
      </div>
    </section>
  `,
  styles: [DASHBOARD_PRIMENG_STYLES]
})
export class TeacherDashboardComponent {}

