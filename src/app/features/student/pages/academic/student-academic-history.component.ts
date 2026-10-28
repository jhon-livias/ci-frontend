import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StudentWorkspaceService, type StudentEnrollment } from '../../data-access/student-workspace.service';

@Component({
  selector: 'app-student-academic-history',
  imports: [DatePipe, RouterLink],
  templateUrl: './student-academic-history.component.html',
})
export class StudentAcademicHistoryComponent implements OnInit {
  private readonly api = inject(StudentWorkspaceService);
  protected readonly rows = signal<readonly StudentEnrollment[]>([]);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.api.workspace().then((data) => this.rows.set(data.enrollments)).catch(() => this.message.set('No se pudo cargar el historial académico.'));
  }
}
