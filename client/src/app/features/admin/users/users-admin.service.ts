import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../../../core/models/auth.model';

export interface AdminUser {
  id: string;
  email: string;
  roles: UserRole[];
  active: boolean;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  name?: string;
  subject?: string;
  relationship?: string;
}

export interface CreateAdminUserRequest {
  email: string;
  password: string;
  roles: UserRole[];
  firstName?: string;
  lastName?: string;
  grade?: string;
  name?: string;
  subject?: string;
  relationship?: string;
}

export interface UpdateAdminUserRequest {
  roles?: UserRole[];
  password?: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  name?: string;
  subject?: string;
  relationship?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersAdminService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  createUser(payload: CreateAdminUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, payload);
  }

  updateUser(id: string, payload: UpdateAdminUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/${id}`, payload);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  setUserActive(id: string, active: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/active`, { active });
  }
}

