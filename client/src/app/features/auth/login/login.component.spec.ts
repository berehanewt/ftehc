import { ElementRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Router } from '@angular/router';

function createComponent(): LoginComponent {
  const authServiceMock: Partial<AuthService> = {
    isAuthenticated: () => false,
    login: () => of({
      accessToken: 'token',
      refreshToken: 'refresh',
      userId: 'u1',
      email: 'admin@school.com',
      roles: ['ADMIN']
    }),
    getUser: () => ({
      id: 'u1',
      email: 'admin@school.com',
      roles: ['ADMIN']
    })
  };

  const routerMock: Partial<Router> = {
    navigateByUrl: vi.fn()
  };

  const notificationMock: Partial<NotificationService> = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  };

  return new LoginComponent(
    new FormBuilder(),
    authServiceMock as AuthService,
    routerMock as Router,
    notificationMock as NotificationService
  );
}

describe('LoginComponent quick-links menu accessibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('opens menu and focuses first quick link', () => {
    const component = createComponent();
    const focusSpy = vi.fn();
    component.firstQuickLink = {
      nativeElement: { focus: focusSpy }
    } as unknown as ElementRef<HTMLAnchorElement>;

    component.toggleQuickLinksMenu();

    expect(component.showQuickLinksMenu).toBe(true);
    vi.runAllTimers();
    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it('closes menu and returns focus to hamburger button', () => {
    const component = createComponent();
    const focusSpy = vi.fn();
    component.showQuickLinksMenu = true;
    component.hamburgerButton = {
      nativeElement: { focus: focusSpy }
    } as unknown as ElementRef<HTMLButtonElement>;

    component.closeQuickLinksMenu();

    expect(component.showQuickLinksMenu).toBe(false);
    vi.runAllTimers();
    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it('closes menu when escape key handler is called', () => {
    const component = createComponent();
    component.showQuickLinksMenu = true;

    component.onEscapeKey();

    expect(component.showQuickLinksMenu).toBe(false);
  });

  it('toggles menu open and closed on repeated trigger', () => {
    const component = createComponent();

    component.toggleQuickLinksMenu();
    expect(component.showQuickLinksMenu).toBe(true);

    component.toggleQuickLinksMenu();
    expect(component.showQuickLinksMenu).toBe(false);
  });
});
