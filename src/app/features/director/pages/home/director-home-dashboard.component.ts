import { Component, OnInit, inject, signal } from '@angular/core';

import { DirectorOperationsService } from '../../data-access/director-operations.service';
import { DirectorTeachersService } from '../../data-access/director-teachers.service';
import { FollowUpService } from '../../../follow-up/data-access/follow-up.service';

@Component({
  selector: 'app-director-home-dashboard',
  templateUrl: './director-home-dashboard.component.html',
})
export class DirectorHomeDashboardComponent implements OnInit {
  private readonly groupsApi = inject(DirectorOperationsService);
  private readonly teachersApi = inject(DirectorTeachersService);
  private readonly followUp = inject(FollowUpService);
  protected readonly students = signal(0);
  protected readonly teachers = signal(0);
  protected readonly groups = signal(0);
  protected readonly alerts = signal(0);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const [teachers, groups, followUp] = await Promise.all([
      this.teachersApi.list().then((rows) => rows.length, () => null),
      this.groupsApi.groups().then((rows) => rows.filter((row) => row.status === 'OPENED').length, () => null),
      this.followUp.read().then((page) => page.alerts.length, () => null),
    ]);
    if (teachers === null || groups === null || followUp === null) this.message.set('No se pudo cargar el resumen.');
    if (teachers !== null) this.teachers.set(teachers);
    if (groups !== null) this.groups.set(groups);
    if (followUp !== null) this.alerts.set(followUp);
  }
}
