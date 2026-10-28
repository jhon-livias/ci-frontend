import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { StudentWorkspaceService, type StudentEnrollment } from '../../data-access/student-workspace.service';

@Component({
  selector: 'app-student-enrollment-history',
  imports: [DatePipe],
  templateUrl: './student-enrollment-history.component.html',
})
export class StudentEnrollmentHistoryComponent implements OnInit {
  private readonly api = inject(StudentWorkspaceService);
  protected readonly rows = signal<readonly StudentEnrollment[]>([]);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.api.workspace().then((data) => this.rows.set(data.enrollments)).catch(() => this.message.set('No se pudo cargar el historial.'));
  }
}
