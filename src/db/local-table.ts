import { useSyncExternalStore } from 'react';

export interface TableWriter {
  insert(table: string, row: object): void;
  update(table: string, id: string, patch: object): void;
  delete(table: string, ids: string[]): void;
}

export class LocalTable<Row extends { id: string }> {
  private rows = new Map<string, Row>();
  private sorted: Row[] = [];
  private listeners = new Set<() => void>();

  constructor(
    readonly name: string,
    private writer: TableWriter,
    private compare: (a: Row, b: Row) => number,
  ) {}

  load(rows: Row[]) {
    this.rows = new Map(rows.map((r) => [r.id, r]));
    this.changed();
  }

  replace(rows: Row[]) {
    let changed = rows.length !== this.rows.size;
    const next = new Map<string, Row>();
    for (const row of rows) {
      const current = this.rows.get(row.id);
      const same =
        current &&
        Object.keys(row).every(
          (k) => (current[k as keyof Row] ?? null) === (row[k as keyof Row] ?? null),
        );
      next.set(row.id, same ? current : row);
      if (!same) changed = true;
    }
    if (!changed) return;
    this.rows = next;
    this.changed();
  }

  all = (): Row[] => this.sorted;

  get(id: string): Row | undefined {
    return this.rows.get(id);
  }

  insert(row: Row) {
    this.rows.set(row.id, row);
    this.changed();
    this.writer.insert(this.name, row);
  }

  update(id: string, patch: Partial<Row>) {
    const row = this.rows.get(id);
    if (!row) return;
    this.rows.set(id, { ...row, ...patch });
    this.changed();
    this.writer.update(this.name, id, patch);
  }

  delete(ids: string[]) {
    const gone = ids.filter((id) => this.rows.delete(id));
    if (!gone.length) return;
    this.changed();
    this.writer.delete(this.name, gone);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private changed() {
    this.sorted = [...this.rows.values()].sort(this.compare);
    for (const listener of this.listeners) listener();
  }
}

export function useRows<Row extends { id: string }>(table: LocalTable<Row>): Row[] {
  return useSyncExternalStore(table.subscribe, table.all);
}
