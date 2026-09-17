import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/app-shell.component')
      .then(m => m.AppShellComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./shared/pages/role-landing.component')
          .then(m => m.RoleLandingComponent)
      },
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component')
              .then(m => m.AdminDashboardComponent)
          },
          {
            path: 'users',
            loadComponent: () => import('./features/admin/users/users-list.component')
              .then(m => m.UsersListComponent)
          },
          {
            path: 'classes',
            loadComponent: () => import('./features/admin/classes/classes-list.component')
              .then(m => m.AdminClassesComponent)
          },
          {
            path: 'enrollment',
            loadComponent: () => import('./features/admin/enrollment/enrollment.component')
              .then(m => m.AdminEnrollmentsComponent)
          },
          {
            path: 'guardian-links',
            loadComponent: () => import('./features/admin/guardian-links/guardian-links.component')
              .then(m => m.GuardianLinksComponent)
          },
          {
            path: 'admissions',
            loadComponent: () => import('./features/admin/admissions/admissions-enrollment.component')
              .then(m => m.AdmissionsEnrollmentComponent)
          },
          {
            path: 'audit-logs',
            loadComponent: () => import('./features/admin/audit-logs/audit-logs.component')
              .then(m => m.AuditLogsComponent)
          }
        ]
      },
      {
        path: 'teacher',
        canActivate: [RoleGuard],
        data: { roles: ['TEACHER'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/teacher/teacher-dashboard/teacher-dashboard.component')
              .then(m => m.TeacherDashboardComponent)
          },
          {
            path: 'classes',
            loadComponent: () => import('./features/teacher/classes/classes-list.component')
              .then(m => m.ClassesListComponent)
          },
          {
            path: 'homework',
            loadComponent: () => import('./features/teacher/homework/homework-list.component')
              .then(m => m.TeacherHomeworkComponent)
          },
          {
            path: 'homework/create',
            loadComponent: () => import('./features/teacher/homework/homework-create.component')
              .then(m => m.HomeworkCreateComponent)
          },
          {
            path: 'submissions',
            loadComponent: () => import('./features/teacher/submissions/submissions-list.component')
              .then(m => m.TeacherSubmissionsComponent)
          },
          {
            path: 'announcements',
            loadComponent: () => import('./features/teacher/announcements/announcements.component')
              .then(m => m.AnnouncementsComponent)
          }
        ]
      },
      {
        path: 'student',
        canActivate: [RoleGuard],
        data: { roles: ['STUDENT'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/student/student-dashboard/student-dashboard.component')
              .then(m => m.StudentDashboardComponent)
          },
          {
            path: 'homework',
            loadComponent: () => import('./features/student/homework/homework-list.component')
              .then(m => m.HomeworkListComponent)
          },
          {
            path: 'homework/:id',
            loadComponent: () => import('./features/student/homework/homework-detail.component')
              .then(m => m.HomeworkDetailComponent)
          },
          {
            path: 'submissions',
            loadComponent: () => import('./features/student/submissions/student-submissions.component')
              .then(m => m.StudentSubmissionsComponent)
          },
          {
            path: 'announcements',
            loadComponent: () => import('./features/student/announcements/announcements.component')
              .then(m => m.AnnouncementsComponent)
          },
          {
            path: 'documents',
            loadComponent: () => import('./features/student/documents/documents.component')
              .then(m => m.DocumentsComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('./features/student/profile/profile.component')
              .then(m => m.ProfileComponent)
          }
        ]
      },
      {
        path: 'guardian',
        canActivate: [RoleGuard],
        data: { roles: ['GUARDIAN'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/guardian/guardian-dashboard/guardian-dashboard.component')
              .then(m => m.GuardianDashboardComponent)
          },
          {
            path: 'progress',
            loadComponent: () => import('./features/guardian/progress/progress.component')
              .then(m => m.ProgressComponent)
          },
          {
            path: 'homework',
            loadComponent: () => import('./features/guardian/homework/guardian-homework.component')
              .then(m => m.GuardianHomeworkComponent)
          },
          {
            path: 'announcements',
            loadComponent: () => import('./features/guardian/announcements/announcements.component')
              .then(m => m.AnnouncementsComponent)
          },
          {
            path: 'documents',
            loadComponent: () => import('./features/guardian/documents/documents.component')
              .then(m => m.DocumentsComponent)
          }
        ]
      },
      {
        path: 'unauthorized',
        loadComponent: () => import('./shared/pages/unauthorized.component')
          .then(m => m.UnauthorizedComponent)
      },
      {
        path: 'not-found',
        loadComponent: () => import('./shared/pages/not-found.component')
          .then(m => m.NotFoundComponent)
      }
    ]
  },
  {
    path: 'admissions',
    loadComponent: () => import('./features/public/admissions/admissions.component')
      .then(m => m.AdmissionsComponent)
  },
  {
    path: 'our-school',
    loadComponent: () => import('./features/public/our-school/our-school.component')
      .then(m => m.OurSchoolComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/public/contact/contact.component')
      .then(m => m.ContactComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)
  },
  {
    path: '**',
    redirectTo: '/not-found'
  }
];
