import { Component, OnInit, inject, signal } from '@angular/core';
import { TeacherWorkspaceService, type TeachingGroup } from '../../data-access/teacher-workspace.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

type Absence = { readonly id: string; readonly date: string; readonly documentNumber: string; readonly studentName: string };
type Upload = { readonly name: string; readonly contentType: string; readonly base64: string };
const MAX = 5 * 1024 * 1024;
const TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

@Component({ selector: 'app-teacher-student-justifications', imports: [UiButtonComponent], templateUrl: './teacher-student-justifications.component.html' })
export class TeacherStudentJustificationsComponent implements OnInit {
  private readonly api = inject(TeacherWorkspaceService);
  protected readonly groups = signal<readonly TeachingGroup[]>([]); protected readonly groupId = signal(''); protected readonly rows = signal<readonly Absence[]>([]);
  protected readonly selected = signal(''); protected readonly reason = signal(''); protected readonly file = signal<Upload | null>(null); protected readonly message = signal(''); protected readonly saving = signal(false);
  async ngOnInit(): Promise<void> { try { this.groups.set(await this.api.groups()); } catch { this.message.set('No se pudieron cargar los grupos.'); } }
  protected async chooseGroup(event: Event): Promise<void> { const id = (event.target as HTMLSelectElement).value; this.groupId.set(id); this.selected.set(''); this.rows.set([]); if (!id) return; try { this.rows.set(await this.api.absences(id)); } catch { this.message.set('No se pudieron cargar las faltas del grupo.'); } }
  protected setReason(event: Event): void { this.reason.set((event.target as HTMLTextAreaElement).value); }
  protected selectAbsence(id: string): void { this.selected.set(id); }
  protected async selectFile(event: Event): Promise<void> { const input = event.target as HTMLInputElement; const value = input.files?.[0]; this.file.set(null); if (!value) return; if (!TYPES.has(value.type) || value.size > MAX) { this.message.set('Adjunta solo PDF, JPG o PNG de hasta 5 MB.'); input.value = ''; return; } const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(); reader.onerror = () => reject(); reader.readAsDataURL(value); }).catch(() => ''); const base64 = dataUrl.split(',', 2)[1] ?? ''; if (!base64) { this.message.set('No se pudo leer el archivo.'); return; } this.file.set({ name: value.name, contentType: value.type, base64 }); }
  protected async save(): Promise<void> { if (!this.groupId() || !this.selected() || !this.reason().trim()) { this.message.set('Selecciona una falta e ingresa el motivo obligatorio.'); return; } this.saving.set(true); try { await this.api.justifyAbsence(this.groupId(), this.selected(), this.reason().trim(), this.file() ?? undefined); this.message.set('Falta justificada correctamente.'); this.reason.set(''); this.file.set(null); this.selected.set(''); this.rows.set(await this.api.absences(this.groupId())); } catch { this.message.set('No se pudo justificar la falta.'); } finally { this.saving.set(false); } }
}
