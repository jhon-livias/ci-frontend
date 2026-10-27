import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface InboxNotification {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly unread: boolean;
}

const isNotification = (value: unknown): value is InboxNotification => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate['id'] === 'string'
    && typeof candidate['title'] === 'string'
    && typeof candidate['body'] === 'string'
    && typeof candidate['createdAt'] === 'string'
    && typeof candidate['unread'] === 'boolean';
};

@Injectable({ providedIn: 'root' })
export class NotificationInboxService {
  private readonly http = inject(HttpClient);
  private readonly items = signal<readonly InboxNotification[]>([]);
  private stream: AbortController | undefined;
  readonly notifications = this.items.asReadonly();

  async refresh(): Promise<void> {
    const response = await firstValueFrom(this.http.get<unknown>('/api/v1/auth/notifications'));
    if (typeof response !== 'object' || response === null || !Array.isArray((response as { notifications?: unknown }).notifications)) {
      throw new Error('Respuesta de notificaciones inválida.');
    }
    const notifications = (response as { notifications: unknown[] }).notifications;
    if (!notifications.every(isNotification)) throw new Error('Respuesta de notificaciones inválida.');
    this.items.set(notifications);
  }

  connect(): void {
    if (this.stream) return;
    const stream = new AbortController();
    this.stream = stream;
    void this.readStream(stream.signal);
  }

  disconnect(): void {
    this.stream?.abort();
    this.stream = undefined;
    this.items.set([]);
  }

  private async readStream(signal: AbortSignal): Promise<void> {
    try {
      const response = await fetch('/api/v1/auth/notifications/events', {
        credentials: 'include',
        signal,
        headers: { Accept: 'text/event-stream' },
      });
      if (!response.ok || !response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!signal.aborted) {
        const chunk = await reader.read();
        if (chunk.done) return;
        buffer += decoder.decode(chunk.value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) this.consumeFrame(frame);
      }
    } catch {
      // La vista se cerró o el canal se cortó. La siguiente visita vuelve a conectarse.
    }
  }

  private consumeFrame(frame: string): void {
    const line = frame.split('\n').find((item) => item.startsWith('data: '));
    if (!line) return;
    const parsed = this.parseMessage(line.slice('data: '.length));
    if (!parsed) return;
    this.items.update((current) =>
      current.some((item) => item.id === parsed.id) ? current : [parsed, ...current].slice(0, 20),
    );
  }

  private parseMessage(data: unknown): InboxNotification | undefined {
    if (typeof data !== 'string') return undefined;
    try {
      const parsed: unknown = JSON.parse(data);
      return isNotification(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
}
