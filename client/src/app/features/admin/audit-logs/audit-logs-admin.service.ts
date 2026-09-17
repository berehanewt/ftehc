import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuditLogItem {
  id: string;
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  timestamp?: string;
  path?: string;
  method?: string;
  ip?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogsAdminService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/audit`;

  constructor(private http: HttpClient) {}

  queryLogs(filter: AuditLogFilter): Observable<AuditLogItem[]> {
    let params = new HttpParams();

    if (filter.userId) {
      params = params.set('userId', filter.userId);
    }
    if (filter.action) {
      params = params.set('action', filter.action);
    }
    if (filter.from) {
      params = params.set('from', filter.from);
    }
    if (filter.to) {
      params = params.set('to', filter.to);
    }

    params = params.set('limit', String(filter.limit ?? 200));

    return this.http.get<AuditLogItem[]>(this.apiUrl, { params });
  }
}

