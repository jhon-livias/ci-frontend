import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';

const isGatewayRequest = (url: string): boolean => url.startsWith('/api/') || url.startsWith('https://services.uprit.edu.pe/api/');

export const credentialsInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isGatewayRequest(request.url)) return next(request);
  const csrfToken = inject(AuthSessionService).csrfToken();
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  return next(request.clone({
    withCredentials: true,
    setHeaders: needsCsrf && csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
  }));
};
