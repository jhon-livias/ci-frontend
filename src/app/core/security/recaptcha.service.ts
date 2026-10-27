import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

interface RecaptchaRuntimeConfig {
  readonly recaptchaSiteKey?: unknown;
  readonly recaptchaEnabled?: unknown;
}

interface RecaptchaApi {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { readonly action: string }): Promise<string>;
}

interface TrustedTypesWindow {
  readonly trustedTypes?: {
    createPolicy(
      name: string,
      rules: { readonly createScriptURL: (value: string) => string },
    ): { createScriptURL(value: string): string };
  };
}

declare global {
  interface Window {
    readonly __runtimeConfig?: RecaptchaRuntimeConfig;
    readonly grecaptcha?: RecaptchaApi;
  }
}

const scriptId = 'google-recaptcha-v3';
const validSiteKey = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(value);

@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private readonly document = inject(DOCUMENT);
  private loading: Promise<RecaptchaApi> | null = null;

  async executeLogin(): Promise<string> {
    if (!this.isEnabled()) return 'recaptcha-disabled-in-nonproduction';
    const siteKey = this.siteKey();
    // Permite que el backend se ejecute localmente con RECAPTCHA_ENABLED=false.
    // En producción el backend rechaza este marcador al exigir su secreto.
    if (!siteKey) return 'recaptcha-disabled-in-nonproduction';
    const recaptcha = await this.load(siteKey);
    return new Promise<string>((resolve, reject) => {
      recaptcha.ready(() => {
        void recaptcha.execute(siteKey, { action: 'login' }).then(resolve, reject);
      });
    });
  }

  private siteKey(): string | null {
    const windowRef = this.document.defaultView;
    const siteKey = windowRef?.__runtimeConfig?.recaptchaSiteKey;
    return validSiteKey(siteKey) ? siteKey : null;
  }

  private isEnabled(): boolean {
    return this.document.defaultView?.__runtimeConfig?.recaptchaEnabled === 'true';
  }

  private load(siteKey: string): Promise<RecaptchaApi> {
    const windowRef = this.document.defaultView;
    if (!windowRef) return Promise.reject(new Error('El navegador no está disponible.'));
    if (windowRef.grecaptcha) return Promise.resolve(windowRef.grecaptcha);
    if (this.loading) return this.loading;

    this.loading = new Promise<RecaptchaApi>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.id = scriptId;
      script.async = true;
      const scriptUrl = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      const trustedTypes = (windowRef as Window & TrustedTypesWindow).trustedTypes;
      // La política solo recibe una URL construida desde una clave validada; la
      // CSP permite este nombre sin abrir una política genérica de scripts.
      script.src =
        trustedTypes
          ?.createPolicy('recaptcha', { createScriptURL: (value) => value })
          .createScriptURL(scriptUrl) ?? scriptUrl;
      script.onload = () =>
        windowRef.grecaptcha
          ? resolve(windowRef.grecaptcha)
          : reject(new Error('reCAPTCHA no se cargó.'));
      script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA.'));
      this.document.head.append(script);
    }).catch((error: unknown) => {
      this.loading = null;
      throw error;
    });
    return this.loading;
  }
}
