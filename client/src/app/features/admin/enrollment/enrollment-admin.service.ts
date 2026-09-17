import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface EnrollmentClass {
  id: string;
  name: string;
  grade?: string;
  teacherId?: string;
  studentIds: string[];
}

export interface EnrollmentStudent {
  id: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentAdminService {
  private readonly adminApi = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  listClasses(): Observable<EnrollmentClass[]> {
    return this.http.get<EnrollmentClass[]>(`${this.adminApi}/enrollments`);
  }

  listStudents(): Observable<EnrollmentStudent[]> {
    return this.http.get<EnrollmentStudent[]>(`${this.adminApi}/students`);
  }

  enrollStudent(classId: string, studentId: string): Observable<EnrollmentClass> {
    return this.http.post<EnrollmentClass>(`${this.adminApi}/enrollments`, {
      classId,
      studentIds: [studentId]
    });
  }

  removeStudent(classId: string, studentId: string): Observable<EnrollmentClass> {
    return this.http.post<EnrollmentClass>(`${this.adminApi}/enrollments/remove`, {
      classId,
      studentId
    });
  }
}

