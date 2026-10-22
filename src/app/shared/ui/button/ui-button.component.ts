import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-button',
  templateUrl: './ui-button.component.html',
  styleUrl: './ui-button.component.css',
})
export class UiButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly disabled = input(false);
}
