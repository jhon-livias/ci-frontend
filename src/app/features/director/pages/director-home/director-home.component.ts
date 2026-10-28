import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AccountProfileComponent } from '../../../account/pages/profile/account-profile.component';
import { NotificationInboxService } from '../../../admin/data-access/notifications.service';
import { StudentAttendanceComponent } from '../../../follow-up/pages/student-attendance/student-attendance.component';
import { TeacherAttendanceComponent } from '../../../follow-up/pages/teacher-attendance/teacher-attendance.component';
import { DirectorGroupsComponent } from '../groups/director-groups.component';
import { DirectorHomeDashboardComponent } from '../home/director-home-dashboard.component';
import { DirectorScheduleCombosComponent } from '../schedule-combos/director-schedule-combos.component';
import { DirectorTeacherJustificationsComponent } from '../teacher-justifications/director-teacher-justifications.component';
import { DirectorTeachersComponent } from '../teachers/director-teachers.component';

type DirectorNavIcon = 'home' | 'students' | 'teachers' | 'follow' | 'justify' | 'groups' | 'schedule';
type DirectorSection = 'home' | 'students' | 'teacher-follow' | 'teachers' | 'justifications' | 'groups' | 'schedules' | 'profile';

@Component({
  imports: [
    NgTemplateOutlet, RouterLink, AccountProfileComponent, StudentAttendanceComponent, TeacherAttendanceComponent,
    DirectorHomeDashboardComponent, DirectorTeachersComponent, DirectorTeacherJustificationsComponent,
    DirectorGroupsComponent, DirectorScheduleCombosComponent,
  ],
  templateUrl: './director-home.component.html',
})
export class DirectorHomeComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly inbox = inject(NotificationInboxService);
  protected readonly notifications = this.inbox.notifications;
  protected readonly section = this.resolveSection(inject(ActivatedRoute).snapshot.data['section']);
  protected readonly menuOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly notificationsOpen = signal(false);
  protected readonly displayName = computed(() => this.session.user()?.displayName || 'Director');
  protected readonly navigation: readonly { label: string; icon: DirectorNavIcon; route: string; section: DirectorSection }[] = [
    { label: 'Inicio', icon: 'home', route: '/inicio', section: 'home' },
    { label: 'Alumnos', icon: 'students', route: '/direccion/alumnos', section: 'students' },
    { label: 'Gestión de docentes', icon: 'teachers', route: '/direccion/docentes', section: 'teachers' },
    { label: 'Seguimiento de docentes', icon: 'follow', route: '/direccion/seguimiento-docentes', section: 'teacher-follow' },
    { label: 'Justificación de docentes', icon: 'justify', route: '/direccion/justificacion-docentes', section: 'justifications' },
    { label: 'Gestión de grupos', icon: 'groups', route: '/direccion/grupos', section: 'groups' },
    { label: 'Combo horario', icon: 'schedule', route: '/direccion/combos', section: 'schedules' },
  ];

  ngOnInit(): void {
    this.inbox.connect();
    void this.inbox.refresh().catch(() => undefined);
  }

  private resolveSection(value: unknown): DirectorSection {
    return value === 'students' || value === 'teacher-follow' || value === 'teachers' || value === 'justifications' || value === 'groups' || value === 'schedules' || value === 'profile' ? value : 'home';
  }

  protected isCurrent(itemSection: string): boolean {
    return itemSection === this.section;
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen.set(false);
    this.profileOpen.update((open) => !open);
  }

  protected toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen.set(false);
    this.notificationsOpen.update((open) => !open);
  }

  protected closePanels(): void {
    this.profileOpen.set(false);
    this.notificationsOpen.set(false);
  }

  protected async logout(): Promise<void> {
    try {
      await this.session.logout();
    } finally {
      this.inbox.disconnect();
      await this.router.navigateByUrl('/login');
    }
  }
}
