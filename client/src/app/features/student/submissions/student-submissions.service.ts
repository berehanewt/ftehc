import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StudentSubmissionDto } from './student-submissions.models';

@Injectable({ providedIn: 'root' })
export class StudentSubmissionsService {
  private readonly studentApi = `${environment.apiBaseUrl}/student`;

  constructor(private readonly http: HttpClient) {}

  listMySubmissions(homeworkId?: string): Observable<StudentSubmissionDto[]> {
    let params = new HttpParams();
    if (homeworkId) {
      params = params.set('homeworkId', homeworkId);
    }
    return this.http.get<StudentSubmissionDto[]>(`${this.studentApi}/submissions`, { params });
  }

  downloadFile(fileKey: string): Observable<Blob> {
    return this.http.get(`${this.studentApi}/submissions/files/${fileKey}`, { responseType: 'blob' });
  }
}

