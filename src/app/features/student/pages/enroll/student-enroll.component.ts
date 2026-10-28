import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { StudentWorkspaceService, type OfferedGroup, type StudentEnrollment } from '../../data-access/student-workspace.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-student-enroll',
  imports: [DatePipe, UiButtonComponent],
  templateUrl: './student-enroll.component.html',
})
export class StudentEnrollComponent implements OnInit {
  private readonly api = inject(StudentWorkspaceService);
  protected readonly languages = signal<readonly string[]>([]);
  protected readonly minStudents = signal(30);
  protected readonly language = signal('');
  protected readonly last = signal<StudentEnrollment | null>(null);
  protected readonly nextLevel = signal<string | null>(null);
  protected readonly blocked = signal(false);
  protected readonly groups = signal<readonly OfferedGroup[]>([]);
  protected readonly selected = signal('');
  protected readonly terms = signal(false);
  protected readonly termsOpen = signal(false);
  protected readonly loading = signal(false);
  protected readonly message = signal('');
  protected readonly tone = signal<'ok' | 'error'>('ok');

  ngOnInit(): void {
    void this.boot();
  }

  protected onSelectLanguage(event: Event): void {
    void this.onLanguage((event.target as HTMLSelectElement).value);
  }

  protected onTerms(event: Event): void {
    this.terms.set((event.target as HTMLInputElement).checked);
  }

  protected async onLanguage(value: string): Promise<void> {
    this.language.set(value);
    this.selected.set('');
    this.message.set('');
    if (!value) {
      this.groups.set([]);
      this.last.set(null);
      return;
    }
    try {
      const result = await this.api.groups(value);
      this.last.set(result.last);
      this.nextLevel.set(result.nextLevel);
      this.blocked.set(result.blocked);
      this.groups.set(result.groups);
      this.minStudents.set(result.minStudents || 30);
    } catch {
      this.message.set('No se pudieron cargar los grupos.');
      this.tone.set('error');
    }
  }

  protected async enroll(): Promise<void> {
    const groupId = this.selected();
    if (!groupId || !this.terms()) return;
    this.loading.set(true);
    try {
      const notice = await this.api.enroll(groupId);
      this.tone.set('ok');
      this.message.set(notice);
      await this.onLanguage(this.language());
    } catch {
      this.tone.set('error');
      this.message.set('No se pudo registrar la matrícula.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async wait(group: OfferedGroup): Promise<void> {
    try {
      await this.api.wait(group.id);
      this.tone.set('ok');
      this.message.set(`Se envió la solicitud para habilitar otro grupo en el horario de ${group.code}.`);
    } catch {
      this.tone.set('error');
      this.message.set('No se pudo enviar la solicitud.');
    }
  }

  private async boot(): Promise<void> {
    try {
      const workspace = await this.api.workspace();
      this.languages.set(workspace.languages);
      this.minStudents.set(workspace.minStudents || 30);
    } catch {
      this.message.set('No se pudo cargar el catálogo de idiomas.');
      this.tone.set('error');
    }
  }
}
