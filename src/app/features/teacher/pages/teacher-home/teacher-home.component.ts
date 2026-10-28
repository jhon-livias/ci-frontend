import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AccountProfileComponent } from '../../../account/pages/profile/account-profile.component';
import { NotificationInboxService } from '../../../admin/data-access/notifications.service';
import { TeacherGradesComponent } from '../grades/teacher-grades.component';
import { TeacherGroupListComponent } from '../groups/teacher-group-list.component';
import { TeacherHomeDashboardComponent } from '../home/teacher-home-dashboard.component';
import { TeacherStudentJustificationsComponent } from '../justifications/teacher-student-justifications.component';
import { TeacherSelfAttendanceComponent } from '../self-attendance/teacher-self-attendance.component';
import { TeacherStudentAttendanceComponent } from '../student-attendance/teacher-student-attendance.component';

type TeacherNavIcon = 'home' | 'self' | 'students' | 'justify' | 'grades';
type TeacherSection = 'home' | 'self' | 'self-detail' | 'students' | 'student-detail' | 'justifications' | 'grades' | 'grades-detail' | 'profile';

@Component({
  imports: [
    NgTemplateOutlet, RouterLink, AccountProfileComponent, TeacherHomeDashboardComponent, TeacherGroupListComponent,
    TeacherSelfAttendanceComponent, TeacherStudentAttendanceComponent, TeacherStudentJustificationsComponent, TeacherGradesComponent,
  ],
  templateUrl: './teacher-home.component.html',
})
export class TeacherHomeComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly inbox = inject(NotificationInboxService);
  protected readonly notifications = this.inbox.notifications;
  protected readonly section = this.resolveSection(inject(ActivatedRoute).snapshot.data['section']);
  protected readonly menuOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly notificationsOpen = signal(false);
  protected readonly displayName = computed(() => this.session.user()?.displayName || 'Docente');
  protected readonly navigation: readonly { label: string; icon: TeacherNavIcon; route: string; section: TeacherSection }[] = [
    { label: 'Inicio', icon: 'home', route: '/inicio', section: 'home' },
    { label: 'Asistencia del docente', icon: 'self', route: '/docencia/asistencia-docente', section: 'self' },
    { label: 'Asistencia del alumno', icon: 'students', route: '/docencia/asistencia-alumnos', section: 'students' },
    { label: 'Justificación de alumnos', icon: 'justify', route: '/docencia/justificacion-alumnos', section: 'justifications' },
    { label: 'Notas del alumno', icon: 'grades', route: '/docencia/notas', section: 'grades' },
  ];

  ngOnInit(): void {
    this.inbox.connect();
    void this.inbox.refresh().catch(() => undefined);
  }

  private resolveSection(value: unknown): TeacherSection {
    return value === 'self' || value === 'self-detail' || value === 'students' || value === 'student-detail' || value === 'justifications' || value === 'grades' || value === 'grades-detail' || value === 'profile' ? value : 'home';
  }

  protected isCurrent(itemSection: string): boolean {
    if (itemSection === 'self') return this.section === 'self' || this.section === 'self-detail';
    if (itemSection === 'students') return this.section === 'students' || this.section === 'student-detail';
    if (itemSection === 'grades') return this.section === 'grades' || this.section === 'grades-detail';
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
