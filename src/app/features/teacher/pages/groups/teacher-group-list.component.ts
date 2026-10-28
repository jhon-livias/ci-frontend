import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TeacherWorkspaceService, type TeachingGroup } from '../../data-access/teacher-workspace.service';

@Component({
  selector: 'app-teacher-group-list',
  imports: [RouterLink],
  templateUrl: './teacher-group-list.component.html',
})
export class TeacherGroupListComponent implements OnInit {
  private readonly api = inject(TeacherWorkspaceService);
  readonly title = input.required<string>();
  readonly action = input.required<string>();
  readonly mode = input<'self' | 'students' | 'grades'>('self');
  protected readonly groups = signal<readonly TeachingGroup[]>([]);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.load();
  }

  protected dateLabel(value: string): string {
    return value.slice(0, 10).split('-').reverse().join('/');
  }

  protected canOpen(group: TeachingGroup): boolean {
    if (this.mode() === 'self') return group.status === 'OPENED' || group.status === 'COMPLETED';
    if (this.mode() === 'students') return group.status === 'OPENED';
    if (group.status === 'OPENED') return true;
    if (group.status !== 'COMPLETED') return false;
    const end = Date.parse(group.endsAt);
    return Number.isFinite(end) && Date.now() <= end + 14 * 24 * 60 * 60 * 1000;
  }

  protected openLabel(): string {
    return this.mode() === 'self' ? 'Ver' : 'Entrar';
  }

  private async load(): Promise<void> {
    try {
      this.groups.set(await this.api.groups());
    } catch {
      this.message.set('No se pudieron cargar los grupos asignados.');
    }
  }
}
