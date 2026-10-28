import { Component, signal } from '@angular/core';

import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';

@Component({
  selector: 'app-director-teacher-justifications',
  imports: [UiButtonComponent, UiFieldComponent],
  templateUrl: './director-teacher-justifications.component.html',
})
export class DirectorTeacherJustificationsComponent {
  protected readonly query = signal('');
  protected readonly date = signal('');
  protected readonly status = signal('Injustificado');

  protected setDate(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
  }

  protected setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
  }

  protected consult(): void {
    this.query.set(this.query().trim());
  }

  protected clear(): void {
    this.query.set('');
    this.date.set('');
    this.status.set('Injustificado');
  }
}
