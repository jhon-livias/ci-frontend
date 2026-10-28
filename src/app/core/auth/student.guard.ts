import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthSessionService } from './auth-session.service';

export const studentGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  return session.hasRole('STUDENT') ? true : inject(Router).createUrlTree(['/login']);
};
