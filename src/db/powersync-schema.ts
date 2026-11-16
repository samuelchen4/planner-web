import { column, Schema, Table, type BaseColumnType } from '@powersync/web';
import type { PgTable } from 'drizzle-orm/pg-core';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { externalEvents, habitDays, tasks } from './schema';

type SqliteColumn = BaseColumnType<string | number | null>;

function sqliteType(pgType: string): SqliteColumn {
  if (/^(integer|smallint|bigint|boolean)/.test(pgType)) return column.integer;
  if (/^(double precision|real|numeric)/.test(pgType)) return column.real;
  return column.text;
}

function toPowerSync(table: PgTable): Table {
  const config = getTableConfig(table);
  const columns = Object.fromEntries(
    config.columns.filter((c) => c.name !== 'id').map((c) => [c.name, sqliteType(c.getSQLType())]),
  );
  const indexes = Object.fromEntries(
    config.indexes.map((i) => [
      i.config.name ?? '',
      i.config.columns.map((c) => ('name' in c ? (c.name as string) : '')),
    ]),
  );
  return new Table(columns, { indexes });
}

export const AppSchema = new Schema({
  tasks: toPowerSync(tasks),
  habit_days: toPowerSync(habitDays),
  external_events: toPowerSync(externalEvents),
  local_meta: new Table({ value: column.text }, { localOnly: true }),
});
