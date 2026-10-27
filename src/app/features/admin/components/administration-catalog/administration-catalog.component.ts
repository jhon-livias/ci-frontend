import { Component, computed, input, signal } from '@angular/core';

import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import {
  UiTableComponent,
  type UiTableColumn,
  type UiTableRow,
} from '../../../../shared/ui/table/ui-table.component';

export type AdministrationCatalog = 'modules' | 'sites' | 'permissions' | 'roles' | 'users';

interface CatalogDefinition {
  readonly title: string;
  readonly description: string;
  readonly columns: readonly UiTableColumn[];
  readonly rows: readonly UiTableRow[];
  readonly helper?: string;
}

const catalogDefinitions: Readonly<Record<AdministrationCatalog, CatalogDefinition>> = {
  modules: {
    title: 'Módulos',
    description: 'Funciones disponibles en el Centro de Idiomas y los roles que pueden acceder a ellas.',
    columns: [
      { key: 'module', label: 'Módulo', sortable: true },
      { key: 'purpose', label: 'Finalidad', sortable: true },
      { key: 'roles', label: 'Roles', sortable: true },
      { key: 'status', label: 'Estado', sortable: true, align: 'center' },
    ],
    rows: [
      { module: 'Matrícula', purpose: 'Registro y pago de matrícula', roles: 'Estudiante', status: 'Activo' },
      { module: 'Exámenes', purpose: 'Inscripción a suficiencia', roles: 'Estudiante', status: 'Activo' },
      { module: 'Asistencia y notas', purpose: 'Control académico', roles: 'Docente, Asesora, Director', status: 'Activo' },
      { module: 'Grupos', purpose: 'Gestión de grupos y horarios', roles: 'Director', status: 'Activo' },
      { module: 'Administración', purpose: 'Control y supervisión', roles: 'Administrador', status: 'Activo' },
    ],
  },
  sites: {
    title: 'Sedes',
    description: 'Sedes habilitadas para la operación del Centro de Idiomas.',
    helper: 'Actualmente la operación está configurada únicamente para la sede Trujillo.',
    columns: [
      { key: 'code', label: 'Código', sortable: true },
      { key: 'site', label: 'Sede', sortable: true },
      { key: 'city', label: 'Ciudad', sortable: true },
      { key: 'status', label: 'Estado', sortable: true, align: 'center' },
    ],
    rows: [{ code: 'TRU', site: 'Trujillo', city: 'Trujillo', status: 'Activa' }],
  },
  permissions: {
    title: 'Permisos',
    description: 'Acciones autorizadas por función, según las responsabilidades descritas en el manual.',
    columns: [
      { key: 'permission', label: 'Permiso', sortable: true },
      { key: 'description', label: 'Descripción', sortable: true },
      { key: 'roles', label: 'Roles autorizados', sortable: true },
    ],
    rows: [
      { permission: 'enrollment.manage-own', description: 'Registrar y consultar su matrícula', roles: 'Estudiante' },
      { permission: 'attendance.record', description: 'Registrar asistencia y notas', roles: 'Docente' },
      { permission: 'attendance.monitor', description: 'Consultar asistencia y alertas', roles: 'Asesora, Director' },
      { permission: 'groups.manage', description: 'Crear y administrar grupos y horarios', roles: 'Director' },
      { permission: 'users.manage', description: 'Gestionar usuarios y acceso', roles: 'Administrador' },
      { permission: 'audit.read', description: 'Supervisar bitácora e incidencias', roles: 'Administrador' },
    ],
  },
  roles: {
    title: 'Roles',
    description: 'Roles institucionales definidos en el manual de funcionamiento.',
    columns: [
      { key: 'role', label: 'Rol', sortable: true },
      { key: 'responsibility', label: 'Responsabilidad principal', sortable: true },
      { key: 'status', label: 'Estado', sortable: true, align: 'center' },
    ],
    rows: [
      { role: 'Estudiante', responsibility: 'Matrícula, pagos, historial y exámenes', status: 'Activo' },
      { role: 'Docente', responsibility: 'Asistencia, notas y justificaciones', status: 'Activo' },
      { role: 'Asesora', responsibility: 'Seguimiento académico y asistencia', status: 'Activo' },
      { role: 'Director', responsibility: 'Gestión de docentes, grupos y justificaciones', status: 'Activo' },
      { role: 'Administrador', responsibility: 'Control y supervisión del sistema', status: 'Activo' },
    ],
  },
  users: {
    title: 'Usuarios',
    description: 'Cuentas institucionales y el acceso asignado a cada una.',
    helper: 'Las cuentas se listarán aquí al conectar el API administrativo. No se muestran datos personales de ejemplo.',
    columns: [
      { key: 'username', label: 'Usuario', sortable: true },
      { key: 'name', label: 'Nombre', sortable: true },
      { key: 'role', label: 'Rol', sortable: true },
      { key: 'status', label: 'Estado', sortable: true, align: 'center' },
    ],
    rows: [],
  },
};

@Component({
  selector: 'app-administration-catalog',
  imports: [UiFieldComponent, UiTableComponent],
  templateUrl: './administration-catalog.component.html',
})
export class AdministrationCatalogComponent {
  readonly section = input.required<AdministrationCatalog>();
  protected readonly search = signal('');
  protected readonly definition = computed(() => catalogDefinitions[this.section()]);
  protected readonly filteredRows = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('es');
    if (!query) {
      return this.definition().rows;
    }

    return this.definition().rows.filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLocaleLowerCase('es').includes(query)),
    );
  });

  protected singularLabel(): string {
    const labels: Readonly<Record<AdministrationCatalog, string>> = {
      modules: 'módulo',
      sites: 'sede',
      permissions: 'permiso',
      roles: 'rol',
      users: 'usuario',
    };
    return labels[this.section()];
  }

  protected updateSearch(value: string): void {
    this.search.set(value);
  }
}
