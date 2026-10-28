import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FollowUpService, absenceTone, type StudentAttendanceAlert } from '../../../follow-up/data-access/follow-up.service';

@Component({
  selector: 'app-advisor-home-dashboard',
  imports: [RouterLink],
  templateUrl: './advisor-home-dashboard.component.html',
})
export class AdvisorHomeDashboardComponent implements OnInit {
  private readonly api = inject(FollowUpService);
  protected readonly alerts = signal<readonly StudentAttendanceAlert[]>([]);
  protected readonly limit = signal(30);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.load();
  }

  protected tone(percent: number): string {
    return absenceTone(percent, this.limit());
  }

  private async load(): Promise<void> {
    try {
      const snapshot = await this.api.read();
      this.alerts.set(snapshot.alerts);
      this.limit.set(snapshot.absenceLimit);
    } catch {
      this.message.set('No se pudo cargar el seguimiento.');
    }
  }
}
