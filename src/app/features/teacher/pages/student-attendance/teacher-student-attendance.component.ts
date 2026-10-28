import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TeacherWorkspaceService, type AttendanceStatus, type TeachingGroup, type TeachingStudent } from '../../data-access/teacher-workspace.service';
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
  protected readonly students = signal<readonly TeachingStudent[]>([]);
  protected readonly date = signal('');
  protected readonly saving = signal(false);
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
      if (this.group()) {
        const roster = await this.api.roster(id);
        this.date.set(roster.date);
        this.students.set(roster.students.map((student) => ({ ...student, status: student.status ?? 'PRESENT' })));
      }
    } catch {
      this.message.set('No se pudo cargar el grupo.');
    }
  }

  protected setStatus(userId: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as AttendanceStatus;
    this.students.update((students) => students.map((student) => student.userId === userId ? { ...student, status } : student));
  }

  protected async save(): Promise<void> {
    const group = this.group();
    if (!group || this.saving()) return;
    this.saving.set(true); this.message.set('');
    try {
      await this.api.saveAttendance(group.id, this.students().flatMap((student) => student.status ? [{ studentUserId: student.userId, status: student.status }] : []));
      this.message.set('Asistencia guardada correctamente.');
    } catch { this.message.set('No se pudo guardar la asistencia.'); }
    finally { this.saving.set(false); }
  }

  protected async downloadRecord(): Promise<void> {
    const group = this.group(); if (!group) return;
    try {
      const rows = await this.api.attendanceHistory(group.id);
      const csv = [['Fecha', 'DNI', 'Alumno', 'Estado'], ...rows.map((row) => [row.date, row.documentNumber, row.studentName, row.status])].map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(';')).join('\r\n');
      const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `acta_asistencias_${group.code}.csv`; link.click(); URL.revokeObjectURL(url);
    } catch { this.message.set('No se pudo generar el acta de asistencias.'); }
  }
}
