import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthSessionService } from './core/auth/auth-session.service';
import { administratorGuard } from './core/auth/administrator.guard';
import { advisorGuard } from './core/auth/advisor.guard';
import { directorGuard } from './core/auth/director.guard';
import { teacherGuard } from './core/auth/teacher.guard';
import { studentGuard } from './core/auth/student.guard';
import {
  administratorMatchGuard,
  advisorMatchGuard,
  directorMatchGuard,
  teacherMatchGuard,
  studentMatchGuard,
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
    path: 'asesoria/asistencias-alumnos',
    title: 'Asistencias y notas de alumnos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, advisorGuard],
    data: { section: 'students' },
    loadComponent: () =>
      import('./features/advisor/pages/advisor-home/advisor-home.component').then((module) => module.AdvisorHomeComponent),
  },
  {
    path: 'asesoria/asistencias-docentes',
    title: 'Asistencia de docentes | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, advisorGuard],
    data: { section: 'teachers' },
    loadComponent: () =>
      import('./features/advisor/pages/advisor-home/advisor-home.component').then((module) => module.AdvisorHomeComponent),
  },
  {
    path: 'asesoria/faltas-alumnos',
    title: 'Faltas de alumnos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, advisorGuard],
    data: { section: 'absences' },
    loadComponent: () =>
      import('./features/advisor/pages/advisor-home/advisor-home.component').then((module) => module.AdvisorHomeComponent),
  },
  {
    path: 'direccion/alumnos',
    title: 'Alumnos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, directorGuard],
    data: { section: 'students' },
    loadComponent: () =>
      import('./features/director/pages/director-home/director-home.component').then((module) => module.DirectorHomeComponent),
  },
  {
    path: 'direccion/docentes',
    title: 'Gestión de docentes | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, directorGuard],
    data: { section: 'teachers' },
    loadComponent: () =>
      import('./features/director/pages/director-home/director-home.component').then((module) => module.DirectorHomeComponent),
  },
  {
    path: 'direccion/seguimiento-docentes',
    title: 'Seguimiento de docentes | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, directorGuard],
    data: { section: 'teacher-follow' },
    loadComponent: () =>
      import('./features/director/pages/director-home/director-home.component').then((module) => module.DirectorHomeComponent),
  },
  {
    path: 'direccion/justificacion-docentes',
    title: 'Justificación de docentes | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, directorGuard],
    data: { section: 'justifications' },
    loadComponent: () =>
      import('./features/director/pages/director-home/director-home.component').then((module) => module.DirectorHomeComponent),
  },
  {
    path: 'direccion/grupos',
    title: 'Gestión de grupos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, directorGuard],
    data: { section: 'groups' },
    loadComponent: () =>
      import('./features/director/pages/director-home/director-home.component').then((module) => module.DirectorHomeComponent),
  },
  {
    path: 'direccion/combos',
    title: 'Combo horario | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, directorGuard],
    data: { section: 'schedules' },
    loadComponent: () =>
      import('./features/director/pages/director-home/director-home.component').then((module) => module.DirectorHomeComponent),
  },
  {
    path: 'docencia/asistencia-docente/:id',
    title: 'Asistencia del docente | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, teacherGuard],
    data: { section: 'self-detail' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'docencia/asistencia-docente',
    title: 'Asistencia del docente | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, teacherGuard],
    data: { section: 'self' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'docencia/asistencia-alumnos/:id',
    title: 'Asistencia del alumno | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, teacherGuard],
    data: { section: 'student-detail' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'docencia/asistencia-alumnos',
    title: 'Asistencia del alumno | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, teacherGuard],
    data: { section: 'students' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'docencia/justificacion-alumnos',
    title: 'Justificación de alumnos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, teacherGuard],
    data: { section: 'justifications' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'docencia/notas/:id',
    title: 'Notas del alumno | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, teacherGuard],
    data: { section: 'grades-detail' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'docencia/notas',
    title: 'Notas del alumno | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, teacherGuard],
    data: { section: 'grades' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'matricula/historial',
    title: 'Historial de matrículas | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, studentGuard],
    data: { section: 'history' },
    loadComponent: () =>
      import('./features/student/pages/student-home/student-home.component').then((module) => module.StudentHomeComponent),
  },
  {
    path: 'matricula',
    title: 'Registrar matrícula | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, studentGuard],
    data: { section: 'enroll' },
    loadComponent: () =>
      import('./features/student/pages/student-home/student-home.component').then((module) => module.StudentHomeComponent),
  },
  {
    path: 'historial-academico/:id',
    title: 'Detalle del curso | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, studentGuard],
    data: { section: 'course' },
    loadComponent: () =>
      import('./features/student/pages/student-home/student-home.component').then((module) => module.StudentHomeComponent),
  },
  {
    path: 'historial-academico',
    title: 'Historial académico | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, studentGuard],
    data: { section: 'academic' },
    loadComponent: () =>
      import('./features/student/pages/student-home/student-home.component').then((module) => module.StudentHomeComponent),
  },
  {
    path: 'historial-pagos',
    title: 'Historial de pagos | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, studentGuard],
    data: { section: 'payments' },
    loadComponent: () =>
      import('./features/student/pages/student-home/student-home.component').then((module) => module.StudentHomeComponent),
  },
  {
    path: 'examenes',
    title: 'Examen de suficiencia | Centro de Idiomas UPRIT',
    canActivate: [authenticatedGuard, studentGuard],
    data: { section: 'exams' },
    loadComponent: () =>
      import('./features/student/pages/student-home/student-home.component').then((module) => module.StudentHomeComponent),
  },
  {
    path: 'perfil',
    title: 'Perfil | Centro de Idiomas UPRIT',
    canMatch: [administratorMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'profile' },
    loadComponent: () =>
      import('./features/admin/pages/administrator-home/administrator-home.component').then(
        (module) => module.AdministratorHomeComponent,
      ),
  },
  {
    path: 'perfil',
    title: 'Perfil | Centro de Idiomas UPRIT',
    canMatch: [advisorMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'profile' },
    loadComponent: () =>
      import('./features/advisor/pages/advisor-home/advisor-home.component').then((module) => module.AdvisorHomeComponent),
  },
  {
    path: 'perfil',
    title: 'Perfil | Centro de Idiomas UPRIT',
    canMatch: [directorMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'profile' },
    loadComponent: () =>
      import('./features/director/pages/director-home/director-home.component').then((module) => module.DirectorHomeComponent),
  },
  {
    path: 'perfil',
    title: 'Perfil | Centro de Idiomas UPRIT',
    canMatch: [teacherMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'profile' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'perfil',
    title: 'Perfil | Centro de Idiomas UPRIT',
    canMatch: [studentMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'profile' },
    loadComponent: () =>
      import('./features/student/pages/student-home/student-home.component').then((module) => module.StudentHomeComponent),
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
    canMatch: [advisorMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'home' },
    loadComponent: () =>
      import('./features/advisor/pages/advisor-home/advisor-home.component').then((module) => module.AdvisorHomeComponent),
  },
  {
    path: 'inicio',
    title: 'Inicio | Centro de Idiomas UPRIT',
    canMatch: [directorMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'home' },
    loadComponent: () =>
      import('./features/director/pages/director-home/director-home.component').then((module) => module.DirectorHomeComponent),
  },
  {
    path: 'inicio',
    title: 'Inicio | Centro de Idiomas UPRIT',
    canMatch: [teacherMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'home' },
    loadComponent: () =>
      import('./features/teacher/pages/teacher-home/teacher-home.component').then((module) => module.TeacherHomeComponent),
  },
  {
    path: 'inicio',
    title: 'Inicio | Centro de Idiomas UPRIT',
    canMatch: [studentMatchGuard],
    canActivate: [authenticatedGuard],
    data: { section: 'home' },
    loadComponent: () =>
      import('./features/student/pages/student-home/student-home.component').then((module) => module.StudentHomeComponent),
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
