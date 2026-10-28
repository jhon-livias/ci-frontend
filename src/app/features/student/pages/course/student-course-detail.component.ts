import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { StudentWorkspaceService, type StudentEnrollment } from '../../data-access/student-workspace.service';

@Component({
  selector: 'app-student-course-detail',
  imports: [RouterLink],
  templateUrl: './student-course-detail.component.html',
})
export class StudentCourseDetailComponent implements OnInit {
  private readonly api = inject(StudentWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  protected readonly course = signal<StudentEnrollment | null>(null);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    try {
      const data = await this.api.workspace();
      this.course.set(data.enrollments.find((item) => item.id === id) ?? null);
    } catch {
      this.message.set('No se pudo cargar el grupo.');
    }
  }
}
