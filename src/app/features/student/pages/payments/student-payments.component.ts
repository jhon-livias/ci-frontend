import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { StudentWorkspaceService, type StudentPayment } from '../../data-access/student-workspace.service';

@Component({
  selector: 'app-student-payments',
  imports: [DatePipe],
  templateUrl: './student-payments.component.html',
})
export class StudentPaymentsComponent implements OnInit {
  private readonly api = inject(StudentWorkspaceService);
  protected readonly rows = signal<readonly StudentPayment[]>([]);
  protected readonly preview = signal<StudentPayment | null>(null);
  protected readonly message = signal('');

  ngOnInit(): void {
    void this.api.workspace().then((data) => this.rows.set(data.payments)).catch(() => this.message.set('No se pudo cargar el historial de pagos.'));
  }

  protected open(row: StudentPayment): void {
    if (row.status !== 'CONFIRMED') {
      this.message.set('El comprobante se habilita cuando la pasarela confirme el pago.');
      return;
    }
    this.preview.set(row);
  }

  protected close(): void {
    this.preview.set(null);
  }

  protected print(): void {
    window.print();
  }
}
