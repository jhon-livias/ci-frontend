import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SitesService, type Site } from '../../data-access/sites.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent, type UiConfirmDetail } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent, type UiBreadcrumbItem } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

@Component({
  selector: 'app-admin-sites',
  imports: [UiButtonComponent, UiConfirmComponent, UiFieldComponent, UiFilterBarComponent, UiPageHeaderComponent, UiTableComponent],
  templateUrl: './admin-sites.component.html',
})
export class AdminSitesComponent implements OnInit {
  private readonly api = inject(SitesService);
  private readonly router = inject(Router);
  protected readonly sites = signal<readonly Site[]>([]);
  protected readonly loading = signal(true);
  protected readonly message = signal('');
  protected readonly confirmation = signal<{ message: string; details: readonly UiConfirmDetail[]; run: () => Promise<void> } | null>(null);
  protected readonly search = signal('');
  protected readonly crumbs: readonly UiBreadcrumbItem[] = [{ label: 'Inicio' }, { label: 'Sedes' }];
  protected readonly columns: readonly UiTableColumn[] = [{ key: 'code', label: 'Código', sortable: true }, { key: 'name', label: 'Nombre', sortable: true }, { key: 'location', label: 'Ubicación', sortable: true }, { key: 'status', label: 'Estado', sortable: true }];
  protected readonly rows = computed<readonly UiTableRow[]>(() => {
    const q = this.search().trim().toLocaleLowerCase('es');
    return this.sites().filter((s) => `${s.code} ${s.name} ${s.location ?? ''}`.toLocaleLowerCase('es').includes(q)).map((s) => ({ id: s.id, code: s.code, name: s.name, location: s.location, status: s.active ? 'Activo' : 'Inactivo' }));
  });
  ngOnInit(): void { void this.load(); }
  private async load(): Promise<void> { this.loading.set(true); try { this.sites.set(await this.api.list()); } catch { this.message.set('No se pudieron cargar las sedes.'); } finally { this.loading.set(false); } }
  protected startCreate(): void { void this.router.navigateByUrl('/administracion/sedes/nueva'); }
  protected startEdit(row: UiTableRow): void { const site = this.sites().find((s) => s.id === row['id']); if (site) void this.router.navigateByUrl(`/administracion/sedes/${site.id}/editar`); }
  protected remove(row: UiTableRow): void {
    const site = this.sites().find((item) => item.id === row['id']);
    if (!site) return;
    this.confirmation.set({
      message: '¿Estás seguro que deseas eliminar esta sede?',
      details: [
        { label: 'Nombre', value: site.name },
        { label: 'Ubicación', value: site.location || 'Sin ubicación' },
        { label: 'Estado', value: site.active ? 'Activo' : 'Inactivo' },
      ],
      run: async () => {
        this.message.set('');
        try { await this.api.remove(site.id); await this.load(); } catch { this.message.set('No se pudo eliminar la sede.'); }
      },
    });
  }

  protected cancelConfirmation(): void { this.confirmation.set(null); }

  protected async acceptConfirmation(): Promise<void> {
    const current = this.confirmation();
    if (!current) return;
    this.confirmation.set(null);
    await current.run();
  }
}
