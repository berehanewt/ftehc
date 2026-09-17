import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GuardianHomeworkItemDto, GuardianStudentDto } from './guardian-homework.models';

@Injectable({ providedIn: 'root' })
export class GuardianHomeworkService {
  private readonly guardianApi = `${environment.apiBaseUrl}/guardian`;

  constructor(private readonly http: HttpClient) {}

  listStudents(): Observable<GuardianStudentDto[]> {
    return this.http.get<GuardianStudentDto[]>(`${this.guardianApi}/students`);
  }

  listHomework(studentId: string): Observable<GuardianHomeworkItemDto[]> {
    const params = new HttpParams().set('studentId', studentId);
    return this.http.get<GuardianHomeworkItemDto[]>(`${this.guardianApi}/homework`, { params });
  }
}

