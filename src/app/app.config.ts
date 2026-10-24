import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { AuthSessionService } from './core/auth/auth-session.service';
import { provideRouter } from '@angular/router';
import { credentialsInterceptor } from './core/http/credentials.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(AuthSessionService).restore()),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
  ]
};
