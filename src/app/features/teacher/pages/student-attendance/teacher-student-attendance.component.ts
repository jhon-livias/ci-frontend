import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TeacherWorkspaceService, type TeachingGroup } from '../../data-access/teacher-workspace.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-teacher-student-attendance',
  imports: [DatePipe, RouterLink, UiButtonComponent],
  templateUrl: './teacher-student-attendance.component.html',
})
export class TeacherStudentAttendanceComponent implements OnInit {
  private readonly api = inject(TeacherWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  protected readonly group = signal<TeachingGroup | null>(null);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    try {
      const groups = await this.api.groups();
      this.group.set(groups.find((item) => item.id === id) ?? null);
    } catch {
      this.message.set('No se pudo cargar el grupo.');
    }
  }
}
