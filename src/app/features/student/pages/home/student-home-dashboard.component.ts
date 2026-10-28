import { Component, OnInit, inject, signal } from '@angular/core';
import { StudentWorkspaceService, type StudentWorkspace } from '../../data-access/student-workspace.service';

@Component({
  selector: 'app-student-home-dashboard',
  templateUrl: './student-home-dashboard.component.html',
})
export class StudentHomeDashboardComponent implements OnInit {
  private readonly api = inject(StudentWorkspaceService);
  protected readonly workspace = signal<StudentWorkspace | null>(null);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.workspace.set(await this.api.workspace());
    } catch {
      this.message.set('No se pudo cargar el inicio.');
    }
  }
}
