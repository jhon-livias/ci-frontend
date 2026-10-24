import { Component, computed, input, output, signal } from '@angular/core';

export type UiTableCell = string | number | null | undefined;
export type UiTableRow = Readonly<Record<string, UiTableCell>>;
export type UiTableSortDirection = 'ascending' | 'descending';

export interface UiTableColumn {
  readonly key: string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly align?: 'start' | 'center' | 'end';
}

export interface UiTableSort {
  readonly key: string;
  readonly direction: UiTableSortDirection;
}

export interface UiTablePageChange {
  readonly page: number;
  readonly pageSize: number;
}

@Component({
  selector: 'ui-table',
  templateUrl: './ui-table.component.html',
  styleUrl: './ui-table.component.css',
})
export class UiTableComponent {
  readonly columns = input.required<readonly UiTableColumn[]>();
  readonly rows = input.required<readonly UiTableRow[]>();
  readonly totalItems = input<number | null>(null);
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 20]);
  readonly emptyMessage = input('No hay resultados para mostrar.');
  readonly sortChange = output<UiTableSort>();
  readonly pageChange = output<UiTablePageChange>();

  protected readonly page = signal(0);
  protected readonly pageSize = signal(5);
  protected readonly sort = signal<UiTableSort | null>(null);
  protected readonly total = computed(() => this.totalItems() ?? this.rows().length);
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly visibleRows = computed(() => {
    const sortedRows = [...this.rows()];
    const sort = this.sort();

    if (sort) {
      sortedRows.sort((left, right) => this.compareCells(left[sort.key], right[sort.key], sort.direction));
    }

    const start = this.page() * this.pageSize();
    return sortedRows.slice(start, start + this.pageSize());
  });
  protected readonly rangeStart = computed(() => (this.total() === 0 ? 0 : this.page() * this.pageSize() + 1));
  protected readonly rangeEnd = computed(() => Math.min((this.page() + 1) * this.pageSize(), this.total()));

  protected sortColumn(column: UiTableColumn): void {
    if (!column.sortable) {
      return;
    }

    const currentSort = this.sort();
    const direction: UiTableSortDirection =
      currentSort?.key === column.key && currentSort.direction === 'ascending'
        ? 'descending'
        : 'ascending';
    const sort = { key: column.key, direction } as const;
    this.sort.set(sort);
    this.page.set(0);
    this.sortChange.emit(sort);
    this.emitPageChange();
  }

  protected changePage(page: number): void {
    const nextPage = Math.min(Math.max(page, 0), this.pageCount() - 1);
    if (nextPage === this.page()) {
      return;
    }

    this.page.set(nextPage);
    this.emitPageChange();
  }

  protected changePageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!this.pageSizeOptions().includes(value)) {
      return;
    }

    this.pageSize.set(value);
    this.page.set(0);
    this.emitPageChange();
  }

  protected ariaSort(column: UiTableColumn): 'none' | UiTableSortDirection {
    const sort = this.sort();
    return sort?.key === column.key ? sort.direction : 'none';
  }

  private emitPageChange(): void {
    this.pageChange.emit({ page: this.page(), pageSize: this.pageSize() });
  }

  private compareCells(left: UiTableCell, right: UiTableCell, direction: UiTableSortDirection): number {
    const factor = direction === 'ascending' ? 1 : -1;
    if (left == null) {
      return right == null ? 0 : factor;
    }
    if (right == null) {
      return -factor;
    }
    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * factor;
    }
    return String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' }) * factor;
  }
}
