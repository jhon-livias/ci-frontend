import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DirectorTeachersService, type DirectorTeacher } from '../../data-access/director-teachers.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';

const empty = () => ({ firstName: '', lastNames: '', documentNumber: '', phone: '', email: '', academicDegree: '' });

@Component({
  selector: 'app-director-teachers',
  imports: [UiButtonComponent, UiConfirmComponent, UiFieldComponent],
  templateUrl: './director-teachers.component.html',
})
export class DirectorTeachersComponent implements OnInit {
  private readonly api = inject(DirectorTeachersService);
  protected readonly teachers = signal<readonly DirectorTeacher[]>([]);
  protected readonly queryDni = signal('');
  protected readonly queryName = signal('');
  protected readonly applied = signal({ dni: '', name: '' });
  protected readonly draft = signal(empty());
  protected readonly editingId = signal('');
  protected readonly open = signal(false);
  protected readonly password = signal('');
  protected readonly message = signal('');
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);
  protected readonly visible = computed(() => {
    const filter = this.applied();
    return this.teachers().filter((row) =>
      (!filter.dni || row.documentNumber.includes(filter.dni)) &&
      (!filter.name || `${row.firstName} ${row.lastNames}`.toLocaleLowerCase('es').includes(filter.name.toLocaleLowerCase('es'))),
    );
  });

  ngOnInit(): void {
    void this.load();
  }

  protected set<K extends keyof ReturnType<typeof empty>>(key: K, value: string): void {
    this.draft.update((current) => ({ ...current, [key]: value }));
  }

  protected startCreate(): void {
    this.editingId.set('');
    this.draft.set(empty());
    this.password.set('');
    this.open.set(true);
  }

  protected startEdit(row: DirectorTeacher): void {
    this.editingId.set(row.id);
    this.draft.set({
      firstName: row.firstName,
      lastNames: row.lastNames,
      documentNumber: row.documentNumber,
      phone: row.phone,
      email: row.email,
      academicDegree: row.academicDegree,
    });
    this.password.set('');
    this.open.set(true);
  }

  protected consult(): void {
    this.applied.set({ dni: this.queryDni().trim(), name: this.queryName().trim() });
  }

  protected clear(): void {
    this.queryDni.set('');
    this.queryName.set('');
    this.consult();
  }

  protected async save(): Promise<void> {
    try {
      const created = await this.api.save(this.draft(), this.editingId() || undefined);
      this.open.set(false);
      this.message.set('');
      if (created?.password) this.password.set(created.password);
      await this.load();
    } catch {
      this.message.set('No se pudo guardar el docente. El correo debe ser @uprit.edu.pe.');
    }
  }

  protected askRemove(row: DirectorTeacher): void {
    this.confirmation.set({
      message: '¿Estás seguro que deseas eliminar este docente?',
      details: [{ label: 'Docente', value: `${row.firstName} ${row.lastNames}` }, { label: 'DNI', value: row.documentNumber }],
      run: async () => {
        try {
          await this.api.remove(row.id);
          await this.load();
        } catch {
          this.message.set('No se pudo eliminar el docente.');
        }
      },
    });
  }

  protected cancelConfirmation(): void {
    this.confirmation.set(null);
  }

  protected async acceptConfirmation(): Promise<void> {
    const current = this.confirmation();
    if (!current) return;
    this.confirmation.set(null);
    await current.run();
  }

  private async load(): Promise<void> {
    try {
      this.teachers.set(await this.api.list());
    } catch {
      this.message.set('No se pudieron cargar los docentes.');
    }
  }
}
