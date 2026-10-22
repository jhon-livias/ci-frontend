import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-alert',
  templateUrl: './ui-alert.component.html',
  styleUrl: './ui-alert.component.css',
})
export class UiAlertComponent {
  readonly tone = input<'error' | 'info'>('info');
}
