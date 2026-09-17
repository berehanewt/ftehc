import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, LoginResponse, AuthState, UserRole } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
      private readonly knownRoles: UserRole[] = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'];

  private apiUrl = `${environment.apiBaseUrl}/auth`;
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = sessionStorage.getItem('accessToken');
    const user = sessionStorage.getItem('user');
    if (token && user) {
      try {
        const authState: AuthState = {
          ...this.authStateSubject.value,
          accessToken: token,
          user: JSON.parse(user),
          isAuthenticated: true
        };
        this.authStateSubject.next(authState);
      } catch (e) {
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.setLoading(true);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(error => {
          this.setError(error.error?.message || 'Login failed');
          return throwError(() => error);
        }),
        finalize(() => this.setLoading(false))
      );
  }

  refresh(): Observable<LoginResponse> {
    const refreshToken = this.authStateSubject.value.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(error => {
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    const refreshToken = this.authStateSubject.value.refreshToken;
    return this.http.post(`${this.apiUrl}/logout`, { refreshToken })
      .pipe(
        tap(() => this.clearAuth()),
        catchError(() => {
          this.clearAuth();
          return throwError(() => new Error('Logout failed'));
        })
      );
  }

  private handleAuthSuccess(response: LoginResponse): void {
    const normalizedRoles = (response.roles ?? [])
      .map(role => role.startsWith('ROLE_') ? role.substring(5) : role)
      .filter((role): role is UserRole => this.knownRoles.includes(role as UserRole));

    const user: User = {
      id: response.userId,
      email: response.email,
      roles: normalizedRoles
    };

    const authState: AuthState = {
      user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      loading: false,
      error: null
    };

    sessionStorage.setItem('accessToken', response.accessToken);
    sessionStorage.setItem('user', JSON.stringify(user));

    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    this.authStateSubject.next(authState);
  }

  private clearAuth(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('refreshToken');

    this.authStateSubject.next({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  }

  private setLoading(loading: boolean): void {
    const current = this.authStateSubject.value;
    this.authStateSubject.next({ ...current, loading });
  }

  private setError(error: string | null): void {
    const current = this.authStateSubject.value;
    this.authStateSubject.next({ ...current, error });
  }

  getAccessToken(): string | null {
    return this.authStateSubject.value.accessToken;
  }

  getUser(): User | null {
    return this.authStateSubject.value.user;
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  hasRole(role: string): boolean {
    return this.authStateSubject.value.user?.roles?.includes(role as any) ?? false;
  }
}
