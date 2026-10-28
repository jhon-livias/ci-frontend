import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AccountProfileComponent } from '../../../account/pages/profile/account-profile.component';
import { NotificationInboxService } from '../../../admin/data-access/notifications.service';
import { StudentAcademicHistoryComponent } from '../academic/student-academic-history.component';
import { StudentCourseDetailComponent } from '../course/student-course-detail.component';
import { StudentEnrollComponent } from '../enroll/student-enroll.component';
import { StudentExamsComponent } from '../exams/student-exams.component';
import { StudentEnrollmentHistoryComponent } from '../history/student-enrollment-history.component';
import { StudentHomeDashboardComponent } from '../home/student-home-dashboard.component';
import { StudentPaymentsComponent } from '../payments/student-payments.component';

type StudentNavIcon = 'home' | 'enroll' | 'history' | 'academic' | 'payments' | 'exams';
type StudentSection = 'home' | 'enroll' | 'history' | 'academic' | 'course' | 'payments' | 'exams' | 'profile';

@Component({
  imports: [
    NgTemplateOutlet, RouterLink, AccountProfileComponent, StudentHomeDashboardComponent, StudentEnrollComponent,
    StudentEnrollmentHistoryComponent, StudentAcademicHistoryComponent, StudentCourseDetailComponent, StudentPaymentsComponent, StudentExamsComponent,
  ],
  templateUrl: './student-home.component.html',
})
export class StudentHomeComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly inbox = inject(NotificationInboxService);
  protected readonly notifications = this.inbox.notifications;
  protected readonly section = this.resolveSection(inject(ActivatedRoute).snapshot.data['section']);
  protected readonly menuOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly notificationsOpen = signal(false);
  protected readonly displayName = computed(() => this.session.user()?.displayName || 'Estudiante');
  protected readonly navigation: readonly { label: string; icon: StudentNavIcon; route: string; section: StudentSection }[] = [
    { label: 'Inicio', icon: 'home', route: '/inicio', section: 'home' },
    { label: 'Registrar matrícula', icon: 'enroll', route: '/matricula', section: 'enroll' },
    { label: 'Historial de matrículas', icon: 'history', route: '/matricula/historial', section: 'history' },
    { label: 'Historial académico', icon: 'academic', route: '/historial-academico', section: 'academic' },
    { label: 'Historial de pagos', icon: 'payments', route: '/historial-pagos', section: 'payments' },
    { label: 'Examen de suficiencia', icon: 'exams', route: '/examenes', section: 'exams' },
  ];

  ngOnInit(): void {
    this.inbox.connect();
    void this.inbox.refresh().catch(() => undefined);
  }

  private resolveSection(value: unknown): StudentSection {
    return value === 'enroll' || value === 'history' || value === 'academic' || value === 'course' || value === 'payments' || value === 'exams' || value === 'profile' ? value : 'home';
  }

  protected isCurrent(itemSection: string): boolean {
    if (itemSection === 'academic') return this.section === 'academic' || this.section === 'course';
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
