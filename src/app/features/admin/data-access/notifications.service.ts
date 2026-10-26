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
  private socket: WebSocket | undefined;
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
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${location.host}/api/v1/auth/notifications/stream`);
    socket.addEventListener('message', (event) => {
      const parsed = this.parseMessage(event.data);
      if (!parsed) return;
      this.items.update((current) => current.some((item) => item.id === parsed.id) ? current : [parsed, ...current].slice(0, 20));
    });
    this.socket = socket;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = undefined;
    this.items.set([]);
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
