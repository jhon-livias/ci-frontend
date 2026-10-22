import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Centro de Idiomas',
    loadComponent: () => import('./features/home/pages/home-page.component').then((module) => module.HomePageComponent),
  },
  { path: '**', redirectTo: '' },
];
