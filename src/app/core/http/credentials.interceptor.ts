import { HttpInterceptorFn } from '@angular/common/http';

const isGatewayRequest = (url: string): boolean => url.startsWith('/api/') || url.startsWith('https://services.uprit.edu.pe/api/');

export const credentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(isGatewayRequest(request.url) ? request.clone({ withCredentials: true }) : request);
