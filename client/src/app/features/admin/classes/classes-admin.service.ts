import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminClass {
  id: string;
  name: string;
  grade?: string;
  teacherId?: string;
  studentIds: string[];
}

export interface UpsertAdminClassRequest {
  name: string;
  grade?: string;
  teacherId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassesAdminService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/classes`;

  constructor(private http: HttpClient) {}

  listClasses(): Observable<AdminClass[]> {
    return this.http.get<AdminClass[]>(this.apiUrl);
  }

  createClass(payload: UpsertAdminClassRequest): Observable<AdminClass> {
    return this.http.post<AdminClass>(this.apiUrl, payload);
  }

  updateClass(id: string, payload: UpsertAdminClassRequest): Observable<AdminClass> {
    return this.http.put<AdminClass>(`${this.apiUrl}/${id}`, payload);
  }

  deleteClass(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

