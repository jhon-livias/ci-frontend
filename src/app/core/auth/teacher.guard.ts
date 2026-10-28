import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthSessionService } from './auth-session.service';

export const teacherGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  return session.hasRole('TEACHER') ? true : inject(Router).createUrlTree(['/login']);
};
