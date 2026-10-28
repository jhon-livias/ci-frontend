import { Component, OnInit, inject, signal } from '@angular/core';

import { TeacherWorkspaceService, type TeachingGroup } from '../../data-access/teacher-workspace.service';

const limaToday = (): { day: string; date: string } => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  const key = (parts['weekday'] ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const days: Record<string, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
  return { day: days[key] ?? '', date: `${parts['year']}-${parts['month']}-${parts['day']}` };
};

@Component({
  selector: 'app-teacher-home-dashboard',
  templateUrl: './teacher-home-dashboard.component.html',
})
export class TeacherHomeDashboardComponent implements OnInit {
  private readonly api = inject(TeacherWorkspaceService);
  protected readonly manual = signal<'document' | 'video' | null>(null);
  protected readonly nextClasses = signal<readonly TeachingGroup[]>([]);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.load();
  }

  protected openManual(kind: 'document' | 'video'): void {
    this.manual.set(kind);
  }

  protected closeManual(): void {
    this.manual.set(null);
  }

  private async load(): Promise<void> {
    try {
      const today = limaToday();
      const groups = await this.api.groups();
      this.nextClasses.set(groups.filter((group) => {
        if (group.status !== 'OPENED') return false;
        const start = group.startsAt.slice(0, 10);
        const end = group.endsAt.slice(0, 10);
        return today.date >= start && today.date <= end && group.slots.some((slot) => slot.day === today.day);
      }));
    } catch {
      this.message.set('No se pudieron cargar las próximas clases.');
    }
  }
}
