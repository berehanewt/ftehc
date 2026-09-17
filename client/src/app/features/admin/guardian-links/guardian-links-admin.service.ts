import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GuardianLinkItem {
  id: string;
  relationship?: string;
  studentIds: string[];
}

export interface GuardianSummary {
  id: string;
  relationship?: string;
  studentCount: number;
}

export interface StudentSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuardianLinksAdminService {
  private readonly adminApi = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  listGuardians(): Observable<GuardianSummary[]> {
    return this.http.get<GuardianSummary[]>(`${this.adminApi}/guardians`);
  }

  listStudents(): Observable<StudentSummary[]> {
    return this.http.get<StudentSummary[]>(`${this.adminApi}/students`);
  }

  listGuardianLinks(): Observable<GuardianLinkItem[]> {
    return this.http.get<GuardianLinkItem[]>(`${this.adminApi}/guardian-links`);
  }

  linkGuardian(guardianId: string, studentId: string): Observable<GuardianLinkItem> {
    return this.http.post<GuardianLinkItem>(`${this.adminApi}/guardian-links`, { guardianId, studentId });
  }

  unlinkGuardian(guardianId: string, studentId: string): Observable<GuardianLinkItem> {
    return this.http.post<GuardianLinkItem>(`${this.adminApi}/guardian-links/remove`, { guardianId, studentId });
  }
}

