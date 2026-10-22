import { Component, input, model } from '@angular/core';

@Component({
  selector: 'ui-field',
  templateUrl: './ui-field.component.html',
  styleUrl: './ui-field.component.css',
})
export class UiFieldComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'email' | 'number' | 'password' | 'search' | 'tel' | 'text'>('text');
  readonly autocomplete = input<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly placeholder = input<string>('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly value = model('');

  protected onValueChange(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
