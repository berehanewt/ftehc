import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DASHBOARD_PRIMENG_STYLES } from '../../../shared/ui/dashboard-primeng.styles';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TagModule],
  template: `
    <section class="dashboard">
      <header class="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage users, classes, enrollment, guardians, and audit activity from one place.</p>
        </div>
        <p-tag value="Admin Access" severity="info"></p-tag>
      </header>

      <div class="summary-grid">
        <p-card>
          <ng-template pTemplate="title">Admissions</ng-template>
          <p class="metric">Enroll guardian &amp; student together</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Users</ng-template>
          <p class="metric">User and role administration</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Classes</ng-template>
          <p class="metric">Academic class structure setup</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Enrollment</ng-template>
          <p class="metric">Student assignment to classes</p>
        </p-card>
      </div>

      <div class="action-grid">
        <p-card header="Admissions" subheader="Enroll guardian &amp; student together">
          <button pButton type="button" label="Open Admissions" icon="pi pi-user-plus" routerLink="/admin/admissions"></button>
        </p-card>

        <p-card header="Users" subheader="Manage accounts and roles">
          <button pButton type="button" label="Open Users" icon="pi pi-users" routerLink="/admin/users"></button>
        </p-card>

        <p-card header="Classes" subheader="Create and maintain classes">
          <button pButton type="button" label="Open Classes" icon="pi pi-book" routerLink="/admin/classes"></button>
        </p-card>

        <p-card header="Enrollment" subheader="Assign students to classes">
          <button pButton type="button" label="Open Enrollment" icon="pi pi-id-card" routerLink="/admin/enrollment"></button>
        </p-card>

        <p-card header="Audit Logs" subheader="Track sensitive actions">
          <button pButton type="button" label="Open Audit Logs" icon="pi pi-history" routerLink="/admin/audit-logs"></button>
        </p-card>
      </div>
    </section>
  `,
  styles: [DASHBOARD_PRIMENG_STYLES]
})
export class AdminDashboardComponent {}

