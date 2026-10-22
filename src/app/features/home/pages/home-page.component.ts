import { Component } from '@angular/core';
import { PublicLayoutComponent } from '../../../layouts/public-layout/public-layout.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';

@Component({
  imports: [PublicLayoutComponent, UiButtonComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {}
