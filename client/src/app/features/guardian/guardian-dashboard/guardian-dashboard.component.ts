import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DASHBOARD_PRIMENG_STYLES } from '../../../shared/ui/dashboard-primeng.styles';

@Component({
  selector: 'app-guardian-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TagModule],
  template: `
    <section class="dashboard">
      <header class="dashboard-header">
        <div>
          <h1>Guardian Dashboard</h1>
          <p>Monitor progress, review announcements, and access student resources.</p>
        </div>
        <p-tag value="Guardian View" severity="warn"></p-tag>
      </header>

      <div class="summary-grid">
        <p-card>
          <ng-template pTemplate="title">Child Progress</ng-template>
          <p class="metric">Track homework and submission trends</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Announcements</ng-template>
          <p class="metric">Stay updated on school news</p>
        </p-card>
        <p-card>
          <ng-template pTemplate="title">Documents</ng-template>
          <p class="metric">Open materials and notices</p>
        </p-card>
      </div>

      <div class="action-grid">
        <p-card header="Child Progress" subheader="Homework and completion overview">
          <button pButton type="button" label="View Progress" icon="pi pi-chart-line" routerLink="/guardian/progress"></button>
        </p-card>

        <p-card header="Announcements" subheader="Recent school communications">
          <button pButton type="button" label="Open Announcements" icon="pi pi-megaphone" routerLink="/guardian/announcements"></button>
        </p-card>

        <p-card header="Documents" subheader="Forms and learning resources">
          <button pButton type="button" label="Open Documents" icon="pi pi-folder" routerLink="/guardian/documents"></button>
        </p-card>

        <p-card header="School Updates" subheader="Important reminders and notices">
          <button pButton type="button" label="View Updates" icon="pi pi-bell" routerLink="/guardian/announcements"></button>
        </p-card>
      </div>
    </section>
  `,
  styles: [DASHBOARD_PRIMENG_STYLES]
})
export class GuardianDashboardComponent {}

