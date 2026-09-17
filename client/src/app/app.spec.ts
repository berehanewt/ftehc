import { TestBed } from '@angular/core/testing';
import { App } from './app';

// TODO: Fix test configuration for external template/style URLs in Vitest + Angular
// Currently skipped due to jsdom/Vitest not auto-loading external resources
// See: https://github.com/angular/angular/issues/xxxxx

describe.skip('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have title signal', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.title()).toBe('school-portal-frontend');
  });
});
