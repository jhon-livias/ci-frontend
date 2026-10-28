import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthSessionService } from './core/auth/auth-session.service';
import { administratorGuard } from './core/auth/administrator.guard';
import {
  administratorMatchGuard,
  anonymousGuard,
  authenticatedGuard,
  passwordChangeGuard,
} from './core/auth/session.guard';

const redirectToLanding = (): string =>
  inject(AuthSessionService).defaultRoute();

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: redirectToLanding,
  },
  {
    path: 'login',
    title: 'Iniciar sesión | Centro de Idiomas UPRIT',
    canActivate: [anonymousGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login-page.component').then(
        (module) => module.LoginPageComponent,
      ),
  },
  {
    path: 'cambiar-contrasena',
    title: 'Cambiar contraseña | Centro de Idiomas UPRIT',
    canActivate: [passwordChangeGuard],
    loadComponent: () =>
      import('./features/auth/pages/change-password/change-password-page.component').then(
        (module) => module.ChangePasswordPageComponent,
      ),
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar contraseña | Centro de Idiomas UPRIT',
    canActivate: [anonymousGuard],
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/forgot-password-page.component').then(
        (module) => module.ForgotPasswordPageComponent,
      ),
  },
  {
    path: 'administracion/usuarios',
    title: 'Usuarios | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'users' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'administracion/roles',
    title: 'Roles | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'roles' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'administracion/permisos',
    title: 'Permisos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'permissions' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'administracion/sedes/:id/editar',
    title: 'Editar sede | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'site-edit' },
    loadComponent: () => import('./features/admin/pages/administrator-home/administrator-home.component').then((module) => module.AdministratorHomeComponent),
  },
  {
    path: 'administracion/sedes/nueva',
    title: 'Agregar sede | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'site-create' },
    loadComponent: () => import('./features/admin/pages/administrator-home/administrator-home.component').then((module) => module.AdministratorHomeComponent),
  },
  {
    path: 'administracion/tarifas',
    title: 'Tarifas y pagos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'payments' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'administracion/configuracion',
    title: 'Configuración académica | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'academic-config' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'administracion/sedes',
    title: 'Sedes | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'sites' },
    loadComponent: () => import('./features/admin/pages/administrator-home/administrator-home.component').then((module) => module.AdministratorHomeComponent),
  },
  {
    path: 'administracion/historial',
    title: 'Historial | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'history' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'administracion/modulos',
    title: 'Módulos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'modules' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'perfil',
    title: 'Perfil | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, administratorGuard],
    data: { section: 'profile' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'inicio',
    title: 'Inicio | Centro de Idiomas UPRIT',
    canMatch: [administratorMatchGuard],
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'inicio',
    title: 'Inicio | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/home/pages/home-page.component').then(
        (module) => module.HomePageComponent,
      ),
  },
  // Fragments such as /#algo resolve to the root route and unknown paths resolve
  // here. In either case, an already restored session keeps the user in the app.
  { path: '**', redirectTo: redirectToLanding },
];
