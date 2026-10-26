import { Component, OnInit, inject, input, signal } from '@angular/core';

import { AccessPolicyService, type AccessPolicy } from '../../data-access/access-policy.service';
import { UiBadgeComponent } from '../../../../shared/ui/badge/ui-badge.component';
import { UiCardComponent } from '../../../../shared/ui/card/ui-card.component';

@Component({
  selector: 'app-admin-access-policy',
  imports: [UiBadgeComponent, UiCardComponent],
  templateUrl: './admin-access-policy.component.html',
})
export class AdminAccessPolicyComponent implements OnInit {
  readonly view = input.required<'roles' | 'permissions'>();
  private readonly accessPolicy = inject(AccessPolicyService);
  protected readonly policy = signal<AccessPolicy | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      this.policy.set(await this.accessPolicy.read());
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected roleNames(policy: AccessPolicy, permission: string): string {
    return policy.roles.filter((role) => role.permissions.includes(permission)).map((role) => role.name).join(', ') || 'Ninguno';
  }
}
