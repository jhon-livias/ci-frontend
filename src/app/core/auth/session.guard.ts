import { inject } from '@angular/core';
import { Router, type CanActivateFn, type CanMatchFn } from '@angular/router';

import { AuthSessionService } from './auth-session.service';

/** Blocks application views until the cookie-backed session was restored. */
export const authenticatedGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  if (!session.isAuthenticated()) return router.createUrlTree(['/login']);
  if (session.user()?.mustChangePassword) return router.createUrlTree(['/cambiar-contrasena']);
  return true;
};

/** Keeps an account with a temporary password on the change screen. */
export const passwordChangeGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  if (!session.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!session.user()?.mustChangePassword) return router.createUrlTree(['/inicio']);
  return true;
};

/** Prevents an active session from returning to public authentication screens. */
export const anonymousGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  return !session.isAuthenticated()
    ? true
    : inject(Router).createUrlTree([session.defaultRoute()]);
};

/** Lets the administrative implementation match only for its authorized role. */
export const administratorMatchGuard: CanMatchFn = () =>
  inject(AuthSessionService).hasRole('ADMINISTRATOR');

/** Lets the advisor portal match only for academic follow-up. */
export const advisorMatchGuard: CanMatchFn = () => inject(AuthSessionService).hasRole('ADVISOR');

/** Lets the director portal match only for academic operations. */
export const directorMatchGuard: CanMatchFn = () => inject(AuthSessionService).hasRole('DIRECTOR');

/** Lets the teacher portal match only for assigned groups. */
export const teacherMatchGuard: CanMatchFn = () => inject(AuthSessionService).hasRole('TEACHER');

/** Lets the student portal match only for own enrollment. */
export const studentMatchGuard: CanMatchFn = () => inject(AuthSessionService).hasRole('STUDENT');
