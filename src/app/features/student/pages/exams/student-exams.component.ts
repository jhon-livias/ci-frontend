import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { StudentWorkspaceService, type StudentExam } from '../../data-access/student-workspace.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-student-exams',
  imports: [DatePipe, UiButtonComponent],
  templateUrl: './student-exams.component.html',
})
export class StudentExamsComponent implements OnInit {
  private readonly api = inject(StudentWorkspaceService);
  protected readonly languages = signal<readonly string[]>([]);
  protected readonly language = signal('');
  protected readonly upcoming = signal<string | null>(null);
  protected readonly amount = signal<string | null>(null);
  protected readonly terms = signal(false);
  protected readonly termsOpen = signal(false);
  protected readonly registered = signal<StudentExam | null>(null);
  protected readonly identity = signal({ documentNumber: '', name: '' });
  protected readonly message = signal('');
  protected readonly tone = signal<'ok' | 'error'>('ok');
  protected readonly loading = signal(false);

  ngOnInit(): void {
    void this.boot();
  }

  protected onSelectLanguage(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.language.set(value);
    void this.refreshDate(value);
  }

  protected onTerms(event: Event): void {
    this.terms.set((event.target as HTMLInputElement).checked);
  }

  protected async register(): Promise<void> {
    if (!this.language() || !this.terms()) return;
    this.loading.set(true);
    try {
      const result = await this.api.registerExam(this.language());
      this.registered.set(result.exam);
      this.identity.set({ documentNumber: result.documentNumber, name: result.name });
      this.tone.set('ok');
      this.message.set(result.notice);
    } catch {
      this.tone.set('error');
      this.message.set('No se pudo registrar el examen.');
    } finally {
      this.loading.set(false);
    }
  }

  private async boot(): Promise<void> {
    try {
      const [workspace, info] = await Promise.all([this.api.workspace(), this.api.examInfo()]);
      this.languages.set(workspace.languages);
      this.upcoming.set(info.upcoming);
      this.amount.set(info.amount);
    } catch {
      this.message.set('No se pudo cargar la información del examen.');
      this.tone.set('error');
    }
  }

  private async refreshDate(language: string): Promise<void> {
    try {
      const info = await this.api.examInfo(language);
      this.upcoming.set(info.upcoming);
      this.amount.set(info.amount);
    } catch {
      this.upcoming.set(null);
    }
  }
}
