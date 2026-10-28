import { Component, OnInit, inject, signal } from '@angular/core';

import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { FollowUpService, type TeacherAbsenceRow } from '../../../follow-up/data-access/follow-up.service';

@Component({
  selector: 'app-director-teacher-justifications',
  imports: [UiButtonComponent, UiFieldComponent],
  templateUrl: './director-teacher-justifications.component.html',
})
export class DirectorTeacherJustificationsComponent implements OnInit {
  private readonly api = inject(FollowUpService);
  protected readonly query = signal('');
  protected readonly date = signal('');
  protected readonly status = signal('Injustificado');
  protected readonly rows = signal<readonly TeacherAbsenceRow[]>([]);
  protected readonly message = signal('');
  ngOnInit(): void { this.consult(); }

  protected setDate(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
  }

  protected setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
  }

  protected consult(): void { void this.load(); }

  protected clear(): void {
    this.query.set('');
    this.date.set('');
    this.status.set('Injustificado');
    this.consult();
  }
  protected async download(row: TeacherAbsenceRow): Promise<void> { if (!row.teacherAbsenceId) return; try { const file = await this.api.teacherAttachment(row.teacherAbsenceId); const raw = atob(file.base64); const bytes = Uint8Array.from(raw, (value) => value.charCodeAt(0)); const url = URL.createObjectURL(new Blob([bytes], { type: file.contentType })); const link = document.createElement('a'); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url); } catch { this.message.set('No se pudo descargar el adjunto.'); } }
  private async load(): Promise<void> { try { this.rows.set(await this.api.teacherAbsences(this.query().trim(), this.date(), this.status())); this.message.set(''); } catch { this.message.set('No se pudieron cargar las justificaciones docentes.'); } }
}
