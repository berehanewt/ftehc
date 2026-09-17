import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homework-create',
  standalone: true,
  template: ''
})
export class HomeworkCreateComponent {
  constructor(private readonly router: Router) {
    this.router.navigateByUrl('/teacher/homework');
  }
}

