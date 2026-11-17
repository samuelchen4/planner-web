import { ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { Task } from '@/db/schema';
import { useTasks } from '@/db/tables';
import { createTask } from '@/db/tasks';

import { ListNote } from './list-note';

const NONE: Task[] = [];

export function ListsView() {
  const tasks = useTasks();
  const [newId, setNewId] = useState<string | null>(null);

  const { lists, entriesByList, left } = useMemo(() => {
    const lists: Task[] = [];
    const entriesByList = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.status === 'cancelled') continue;
      if (task.type === 'list') lists.push(task);
      else if (task.list_id) {
        const list = entriesByList.get(task.list_id);
        if (list) list.push(task);
        else entriesByList.set(task.list_id, [task]);
      }
    }
    const left = lists.reduce(
      (n, l) => n + (entriesByList.get(l.id) ?? NONE).filter((e) => e.status !== 'done').length,
      0,
    );
    return { lists, entriesByList, left };
  }, [tasks]);

  const add = () => setNewId(createTask('list', new Date()));

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b border-border bg-app px-8 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-rounded text-title2 font-bold text-ink">Lists</h1>
          <p className="text-footnote text-muted">
            {lists.length} list{lists.length === 1 ? '' : 's'} · {left} item
            {left === 1 ? '' : 's'} left
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="rounded-full bg-accent px-4 py-1.5 text-subhead font-semibold text-on-accent hover:bg-accent/90"
        >
          New list
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {lists.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <ListChecks size={40} className="text-subtle" />
            <div>
              <p className="text-headline font-semibold text-ink">No lists yet</p>
              <p className="text-subhead text-muted">Groceries, packing, anything with steps.</p>
            </div>
            <button
              type="button"
              onClick={add}
              className="rounded-full bg-accent px-4 py-2 text-subhead font-semibold text-on-accent hover:bg-accent/90"
            >
              New list
            </button>
          </div>
        ) : (
          <div className="columns-[18rem] gap-5">
            {lists.map((list) => (
              <ListNote
                key={list.id}
                list={list}
                entries={entriesByList.get(list.id) ?? NONE}
                isNew={list.id === newId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
