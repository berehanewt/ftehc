import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TeacherSubmissionDto,
  UpdateTeacherSubmissionRequest
} from './teacher-submissions.models';

@Injectable({ providedIn: 'root' })
export class TeacherSubmissionsService {
  private readonly teacherApi = `${environment.apiBaseUrl}/teacher`;

  constructor(private readonly http: HttpClient) {}

  listSubmissions(homeworkId: string): Observable<TeacherSubmissionDto[]> {
    const params = new HttpParams().set('homeworkId', homeworkId);
    return this.http.get<TeacherSubmissionDto[]>(`${this.teacherApi}/submissions`, { params });
  }

  updateSubmission(submissionId: string, payload: UpdateTeacherSubmissionRequest): Observable<TeacherSubmissionDto> {
    return this.http.patch<TeacherSubmissionDto>(`${this.teacherApi}/submissions/${submissionId}`, payload);
  }

  downloadFile(fileKey: string): Observable<Blob> {
    return this.http.get(`${this.teacherApi}/submissions/files/${fileKey}`, { responseType: 'blob' });
  }
}

