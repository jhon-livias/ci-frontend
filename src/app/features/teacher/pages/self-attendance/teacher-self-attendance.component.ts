import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { interval } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { TeacherWorkspaceService, type TeacherSession, type TeachingGroup } from '../../data-access/teacher-workspace.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-teacher-self-attendance',
  imports: [DatePipe, RouterLink, UiButtonComponent],
  templateUrl: './teacher-self-attendance.component.html',
})
export class TeacherSelfAttendanceComponent implements OnInit {
  private readonly api = inject(TeacherWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly now = signal(new Date());
  protected readonly group = signal<TeachingGroup | null>(null);
  protected readonly sessions = signal<readonly TeacherSession[]>([]);
  protected readonly message = signal('');
  protected readonly displayName = computed(() => this.session.user()?.displayName || 'Docente');
  protected readonly code = computed(() => this.session.user()?.username || '');
  protected readonly canPunch = computed(() => this.group()?.status === 'OPENED');
  protected readonly todaySession = computed(() => {
    const today = this.isoDate(this.now());
    return this.sessions().find((row) => row.sessionDate === today) ?? null;
  });

  ngOnInit(): void {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.now.set(new Date()));
    void this.load();
  }

  protected clock(part: 'hour' | 'minute' | 'second'): string {
    const lima = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(this.now());
    const value = lima.find((item) => item.type === part)?.value ?? '00';
    return value.padStart(2, '0');
  }

  protected limaDate(): string {
    return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric' }).format(this.now());
  }

  protected weekday(value: string): string {
    const stamp = Date.parse(`${value}T12:00:00.000Z`);
    if (!Number.isFinite(stamp)) return '';
    return new Intl.DateTimeFormat('es-PE', { timeZone: 'UTC', weekday: 'short' }).format(stamp).replace('.', '').toUpperCase();
  }

  protected clockStamp(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(value));
  }

  protected async checkIn(): Promise<void> {
    const group = this.group();
    if (!group) return;
    try {
      await this.api.checkIn(group.id);
      this.message.set('');
      await this.load();
    } catch {
      this.message.set('No se pudo registrar la entrada. Verifica que hoy haya clase programada en un grupo aperturado.');
    }
  }

  protected async checkOut(): Promise<void> {
    const group = this.group();
    if (!group) return;
    try {
      await this.api.checkOut(group.id);
      this.message.set('');
      await this.load();
    } catch {
      this.message.set('No se pudo registrar la salida. Primero registra la entrada.');
    }
  }

  protected download(): void {
    const group = this.group();
    const rows = [
      ['Fecha', 'Día', 'Horario programado', 'Hora de entrada', 'Hora de salida', 'Tipo de asistencia'],
      ...this.sessions().map((row) => [row.sessionDate, this.weekday(row.sessionDate), row.hours, this.clockStamp(row.checkInAt), this.clockStamp(row.checkOutAt), row.classType]),
    ];
    const csv = rows.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asistencia_docente_${group?.code ?? 'grupo'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private isoDate(value: Date): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
  }

  private async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    try {
      const groups = await this.api.groups();
      this.group.set(groups.find((item) => item.id === id) ?? null);
      this.sessions.set(await this.api.sessions(id));
    } catch {
      this.message.set('No se pudo cargar la asistencia del docente.');
    }
  }
}
