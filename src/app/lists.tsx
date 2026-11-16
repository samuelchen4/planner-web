import { useMemo } from 'react';

import type { Task } from '@/db/schema';
import { taskTable, useTasks } from '@/db/tables';
import { createTask, deleteTask, entriesOf, newEntry, toggleDone, updateTask } from '@/db/tasks';

import { AddInput, Card, Check, Empty, TitleInput } from './ui';

function ListCard({ list, entries }: { list: Task; entries: Task[] }) {
  const open = entries.filter((e) => e.status !== 'done').length;
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <TitleInput value={list.title} onSave={(title) => updateTask(list.id, { title })} />
        <span className="text-footnote tabular-nums text-muted">{open} open</span>
        <button
          type="button"
          onClick={() => deleteTask(list.id)}
          className="text-footnote text-subtle hover:text-danger"
        >
          Delete
        </button>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 px-4 py-2">
            <Check
              done={entry.status === 'done'}
              onToggle={() => toggleDone(entry.id)}
              label={`Mark "${entry.title}" done`}
            />
            <TitleInput
              value={entry.title}
              done={entry.status === 'done'}
              onSave={(title) => updateTask(entry.id, { title })}
            />
          </div>
        ))}
      </div>
      <div className="p-2">
        <AddInput
          placeholder="Add an item"
          onAdd={(title) => taskTable.insert({ ...newEntry(list), title })}
        />
      </div>
    </Card>
  );
}

export function ListsView() {
  const tasks = useTasks();
  const lists = useMemo(
    () => tasks.filter((t) => t.type === 'list' && t.status !== 'cancelled'),
    [tasks],
  );

  const add = (title: string) => {
    const id = createTask('list', new Date());
    updateTask(id, { title });
  };

  return (
    <div className="space-y-8">
      <h1 className="font-rounded text-large-title font-bold text-ink">Lists</h1>
      <AddInput placeholder="Add a list" onAdd={add} />
      {lists.length === 0 && <Empty>No lists yet</Empty>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lists.map((list) => (
          <ListCard key={list.id} list={list} entries={entriesOf(tasks, list.id)} />
        ))}
      </div>
    </div>
  );
}
