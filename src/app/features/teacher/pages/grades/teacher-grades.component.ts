import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TeacherWorkspaceService, type StudentGrade, type TeachingGroup } from '../../data-access/teacher-workspace.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-teacher-grades',
  imports: [DatePipe, RouterLink, UiButtonComponent],
  templateUrl: './teacher-grades.component.html',
})
export class TeacherGradesComponent implements OnInit {
  private readonly api = inject(TeacherWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  protected readonly group = signal<TeachingGroup | null>(null);
  protected readonly students = signal<readonly StudentGrade[]>([]);
  protected readonly editing = signal(false);
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
      if (this.group()) this.students.set(await this.api.grades(id));
    } catch {
      this.message.set('No se pudo cargar el grupo.');
    }
  }

  protected setGrade(userId: string, key: keyof Pick<StudentGrade, 'listeningReading' | 'writing' | 'testOne' | 'participation' | 'finalTest'>, event: Event): void {
    const raw = (event.target as HTMLInputElement).value; const value = raw === '' ? null : Number(raw);
    const normalized = value !== null && Number.isFinite(value) && value >= 0 && value <= 20 ? value : null;
    this.students.update((students) => students.map((student) => student.userId === userId ? { ...student, [key]: normalized, total: this.total({ ...student, [key]: normalized }) } : student));
  }
  protected async save(): Promise<void> {
    const group = this.group(); if (!group || this.saving()) return;
    this.saving.set(true); this.message.set('');
    try { await this.api.saveGrades(group.id, this.students().map(({ userId, listeningReading, writing, testOne, participation, finalTest }) => ({ userId, listeningReading, writing, testOne, participation, finalTest }))); this.editing.set(false); this.message.set('Notas guardadas correctamente.'); }
    catch { this.message.set('No se pudieron guardar las notas.'); } finally { this.saving.set(false); }
  }
  protected downloadRecord(): void {
    const group = this.group(); if (!group) return;
    const rows = [['Alumno', 'DNI', 'Listening/Reading', 'Writing', 'Test 1', 'Participación', 'Final', 'Total'], ...this.students().map((student) => [student.name, student.documentNumber, student.listeningReading, student.writing, student.testOne, student.participation, student.finalTest, student.total].map((value) => String(value ?? '')))];
    const csv = rows.map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(';')).join('\r\n'); const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `acta_notas_${group.code}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  protected total(student: Pick<StudentGrade, 'listeningReading' | 'writing' | 'testOne' | 'participation' | 'finalTest'>): number | null { const values = [student.listeningReading, student.writing, student.testOne, student.participation, student.finalTest]; return values.every((value) => value !== null) ? values.reduce((sum, value) => sum + (value ?? 0), 0) : null; }
}
