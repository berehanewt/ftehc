import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdmissionsEnrollRequest {
  // Guardian
  guardianFirstName: string;
  guardianMiddleName?: string;
  guardianLastName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianPassword: string;
  guardianSpouseFirstName?: string;
  guardianSpouseMiddleName?: string;
  guardianSpouseLastName?: string;
  guardianRelationship?: string;
  // Student
  studentFirstName: string;
  studentMiddleName?: string;
  studentLastName: string;
  studentPassword: string;
  studentGender: string;
  studentAge?: number;
  studentGrade?: string;
}

export interface EnrolledProfile {
  id: string;
  email: string;
  roles: string[];
  active: boolean;
  fullName?: string;
  phone?: string;
  spouseFullName?: string;
  relationship?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  grade?: string;
}

export interface AdmissionsEnrollResponse {
  guardian: EnrolledProfile;
  student: EnrolledProfile;
}

export interface GuardianEmailCheckResponse {
  email: string;
  status: 'NEW_EMAIL' | 'EXISTING_GUARDIAN' | 'EXISTING_NON_GUARDIAN' | 'EXISTING_STUDENT';
  roles: string[];
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AdmissionsAdminService {
  private readonly adminApi = `${environment.apiBaseUrl}/admin`;
  private readonly publicAdmissionsApi = `${environment.apiBaseUrl}/public/admissions`;

  constructor(private readonly http: HttpClient) {}

  enroll(req: AdmissionsEnrollRequest): Observable<AdmissionsEnrollResponse> {
    return this.http.post<AdmissionsEnrollResponse>(`${this.adminApi}/admissions/enroll`, req);
  }

  enrollPublic(req: AdmissionsEnrollRequest): Observable<AdmissionsEnrollResponse> {
    return this.http.post<AdmissionsEnrollResponse>(`${this.publicAdmissionsApi}/enroll`, req);
  }

  checkGuardianEmail(email: string): Observable<GuardianEmailCheckResponse> {
    return this.http.get<GuardianEmailCheckResponse>(`${this.publicAdmissionsApi}/guardian-email-check`, {
      params: { email }
    });
  }
}

