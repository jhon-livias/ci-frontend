import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AccountProfileComponent } from '../../../account/pages/profile/account-profile.component';
import { NotificationInboxService } from '../../../admin/data-access/notifications.service';
import { StudentAbsencesComponent } from '../../../follow-up/pages/student-absences/student-absences.component';
import { StudentAttendanceComponent } from '../../../follow-up/pages/student-attendance/student-attendance.component';
import { TeacherAttendanceComponent } from '../../../follow-up/pages/teacher-attendance/teacher-attendance.component';
import { AdvisorHomeDashboardComponent } from '../home/advisor-home-dashboard.component';

type AdvisorNavIcon = 'home' | 'students' | 'teachers' | 'absences';
type AdvisorSection = 'home' | 'students' | 'teachers' | 'absences' | 'profile';

@Component({
  imports: [NgTemplateOutlet, RouterLink, AdvisorHomeDashboardComponent, StudentAttendanceComponent, TeacherAttendanceComponent, StudentAbsencesComponent, AccountProfileComponent],
  templateUrl: './advisor-home.component.html',
})
export class AdvisorHomeComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly inbox = inject(NotificationInboxService);
  protected readonly notifications = this.inbox.notifications;
  protected readonly section = this.resolveSection(inject(ActivatedRoute).snapshot.data['section']);
  protected readonly menuOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly notificationsOpen = signal(false);
  protected readonly displayName = computed(() => this.session.user()?.displayName || 'Asesora');
  protected readonly navigation: readonly { label: string; icon: AdvisorNavIcon; route: string; section: AdvisorSection }[] = [
    { label: 'Inicio', icon: 'home', route: '/inicio', section: 'home' },
    { label: 'Asistencias y notas de alumnos', icon: 'students', route: '/asesoria/asistencias-alumnos', section: 'students' },
    { label: 'Asistencia de docentes', icon: 'teachers', route: '/asesoria/asistencias-docentes', section: 'teachers' },
    { label: 'Faltas de alumnos', icon: 'absences', route: '/asesoria/faltas-alumnos', section: 'absences' },
  ];

  ngOnInit(): void {
    this.inbox.connect();
    void this.inbox.refresh().catch(() => undefined);
  }

  private resolveSection(value: unknown): AdvisorSection {
    return value === 'students' || value === 'teachers' || value === 'absences' || value === 'profile' ? value : 'home';
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
