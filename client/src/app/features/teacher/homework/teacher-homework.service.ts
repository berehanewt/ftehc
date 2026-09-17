import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateTeacherHomeworkRequest,
  TeacherClassDto,
  TeacherHomeworkDto
} from './teacher-homework.models';

@Injectable({ providedIn: 'root' })
export class TeacherHomeworkService {
  private readonly teacherApi = `${environment.apiBaseUrl}/teacher`;

  constructor(private readonly http: HttpClient) {}

  listClasses(): Observable<TeacherClassDto[]> {
    return this.http.get<TeacherClassDto[]>(`${this.teacherApi}/classes`);
  }

  listHomework(classId: string): Observable<TeacherHomeworkDto[]> {
    const params = new HttpParams().set('classId', classId);
    return this.http.get<TeacherHomeworkDto[]>(`${this.teacherApi}/homework`, { params });
  }

  createHomework(payload: CreateTeacherHomeworkRequest): Observable<TeacherHomeworkDto> {
    return this.http.post<TeacherHomeworkDto>(`${this.teacherApi}/homework`, payload);
  }

  deleteHomework(homeworkId: string): Observable<void> {
    return this.http.delete<void>(`${this.teacherApi}/homework/${homeworkId}`);
  }
}

