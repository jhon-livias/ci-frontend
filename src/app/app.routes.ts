import { Routes } from '@angular/router';
import { administratorGuard } from './core/auth/administrator.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    title: 'Iniciar sesión | Centro de Idiomas UPRIT',
    loadComponent: () =>
      import('./features/auth/pages/login/login-page.component').then((module) => module.LoginPageComponent),
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar contraseña | Centro de Idiomas UPRIT',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/forgot-password-page.component').then(
        (module) => module.ForgotPasswordPageComponent,
      ),
  },
  {
    path: 'inicio',
    title: 'Centro de Idiomas',
    loadComponent: () => import('./features/home/pages/home-page.component').then((module) => module.HomePageComponent),
  },
  {
    path: 'administracion',
    title: 'Administración | Centro de Idiomas UPRIT',
    canActivate: [administratorGuard],
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  { path: '**', redirectTo: 'login' },
];
