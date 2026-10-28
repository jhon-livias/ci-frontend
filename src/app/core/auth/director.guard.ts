import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthSessionService } from './auth-session.service';

export const directorGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  return session.hasRole('DIRECTOR') ? true : inject(Router).createUrlTree(['/login']);
};
