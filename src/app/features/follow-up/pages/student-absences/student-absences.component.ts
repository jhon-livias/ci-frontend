import { Component, OnInit, inject, signal } from '@angular/core';

import { FollowUpService, type StudentAbsenceRow } from '../../data-access/follow-up.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';

type Upload = { readonly name: string; readonly contentType: string; readonly base64: string };
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set(['application/pdf', 'image/jpeg', 'image/png']);

@Component({
  selector: 'app-student-absences',
  imports: [UiButtonComponent, UiSelectComponent],
  templateUrl: './student-absences.component.html',
})
export class StudentAbsencesComponent implements OnInit {
  private readonly api = inject(FollowUpService);
  protected readonly documentNumber = signal('');
  protected readonly occurredOn = signal('');
  protected readonly status = signal('');
  protected readonly rows = signal<readonly StudentAbsenceRow[]>([]);
  protected readonly selected = signal<StudentAbsenceRow | null>(null);
  protected readonly reason = signal('');
  protected readonly file = signal<Upload | null>(null);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly statusOptions: readonly UiSelectOption[] = [
    { value: '', label: 'Todos' },
    { value: 'Injustificado', label: 'Injustificado' },
    { value: 'Justificado', label: 'Justificado' },
  ];

  ngOnInit(): void {
    void this.load();
  }

  protected onDate(event: Event): void {
    this.occurredOn.set((event.target as HTMLInputElement).value);
  }

  protected consult(): void {
    void this.load();
  }

  protected clear(): void {
    this.documentNumber.set('');
    this.occurredOn.set('');
    this.status.set('');
    this.consult();
  }

  protected select(row: StudentAbsenceRow): void {
    this.selected.set(row);
    this.reason.set('');
    this.file.set(null);
    this.message.set('');
  }

  protected onReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  protected async onFile(event: Event): Promise<void> {
    const selected = (event.target as HTMLInputElement).files?.item(0);
    this.file.set(null);
    if (!selected) return;
    if (!ACCEPTED.has(selected.type) || selected.size > MAX_FILE_BYTES) {
      this.message.set('El adjunto debe ser PDF, JPG o PNG y no superar 5 MB.');
      return;
    }
    const data = await selected.arrayBuffer();
    const bytes = new Uint8Array(data);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    this.file.set({ name: selected.name, contentType: selected.type, base64: btoa(binary) });
  }

  protected async justify(): Promise<void> {
    const row = this.selected();
    if (!row || row.status !== 'Injustificado' || !this.reason().trim()) {
      this.message.set('Selecciona una falta injustificada e indica el motivo.');
      return;
    }
    this.saving.set(true);
    this.message.set('');
    try {
      await this.api.justify(row.id, this.reason().trim(), this.file() ?? undefined);
      this.message.set('La falta fue justificada.');
      this.selected.set(null);
      this.reason.set('');
      this.file.set(null);
      await this.load();
    } catch {
      this.message.set('No se pudo registrar la justificación.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async download(row: StudentAbsenceRow): Promise<void> {
    try {
      const file = await this.api.attachment(row.id);
      const binary = atob(file.base64);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: file.contentType }));
      const link = document.createElement('a'); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url);
    } catch {
      this.message.set('No se pudo descargar el adjunto.');
    }
  }

  private async load(): Promise<void> {
    try {
      this.rows.set(await this.api.absences(this.documentNumber().trim(), this.occurredOn(), this.status()));
    } catch {
      this.message.set('No se pudieron cargar las faltas.');
    }
  }
}
