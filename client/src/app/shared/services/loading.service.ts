import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private loadingStack: Set<string> = new Set();

  show(key: string = 'default'): void {
    this.loadingStack.add(key);
    this.updateLoadingState();
  }

  hide(key: string = 'default'): void {
    this.loadingStack.delete(key);
    this.updateLoadingState();
  }

  isLoading(): boolean {
    return this.loadingStack.size > 0;
  }

  private updateLoadingState(): void {
    this.loadingSubject.next(this.loadingStack.size > 0);
  }
}

