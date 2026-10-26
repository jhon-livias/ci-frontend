import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SitesService, type Site } from '../../data-access/sites.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

@Component({
  selector: 'app-admin-sites',
  imports: [UiButtonComponent, UiFieldComponent, UiTableComponent],
  templateUrl: './admin-sites.component.html',
})
export class AdminSitesComponent implements OnInit {
  private readonly api = inject(SitesService);
  private readonly router = inject(Router);
  protected readonly sites = signal<readonly Site[]>([]);
  protected readonly loading = signal(true);
  protected readonly message = signal('');
  protected readonly search = signal('');
  protected readonly columns: readonly UiTableColumn[] = [{ key: 'code', label: 'Código', sortable: true }, { key: 'name', label: 'Nombre', sortable: true }, { key: 'location', label: 'Ubicación', sortable: true }, { key: 'status', label: 'Estado', sortable: true }];
  protected readonly rows = computed<readonly UiTableRow[]>(() => {
    const q = this.search().trim().toLocaleLowerCase('es');
    return this.sites().filter((s) => `${s.code} ${s.name} ${s.location ?? ''}`.toLocaleLowerCase('es').includes(q)).map((s) => ({ id: s.id, code: s.code, name: s.name, location: s.location, status: s.active ? 'Activo' : 'Inactivo' }));
  });
  ngOnInit(): void { void this.load(); }
  private async load(): Promise<void> { this.loading.set(true); try { this.sites.set(await this.api.list()); } catch { this.message.set('No se pudieron cargar las sedes.'); } finally { this.loading.set(false); } }
  protected startCreate(): void { void this.router.navigateByUrl('/administracion/sedes/nueva'); }
  protected startEdit(row: UiTableRow): void { const site = this.sites().find((s) => s.id === row['id']); if (site) void this.router.navigateByUrl(`/administracion/sedes/${site.id}/editar`); }
  protected async remove(row: UiTableRow): Promise<void> { const site = this.sites().find((s) => s.id === row['id']); if (!site || !confirm(`¿Eliminar la sede ${site.name}?`)) return; this.message.set(''); try { await this.api.remove(site.id); await this.load(); } catch { this.message.set('No se pudo eliminar la sede.'); } }
}
