import { Component, input, model } from '@angular/core';

export interface UiSelectOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-select',
  templateUrl: './ui-select.component.html',
  styleUrl: './ui-select.component.css',
})
export class UiSelectComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly UiSelectOption[]>();
  readonly placeholder = input<string>('Selecciona una opción');
  readonly disabled = input(false);
  readonly required = input(false);
  readonly value = model('');

  protected onValueChange(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
