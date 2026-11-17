import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { Task } from '@/db/schema';
import { newEntry } from '@/db/tasks';
import { toLocalIso } from '@/lib/time';

import { Check } from '../ui';

export function Subtasks({
  task,
  rows,
  onChange,
}: {
  task: Task;
  rows: Task[];
  onChange: (rows: Task[]) => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Task>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addAfter = (index: number) => {
    const row = newEntry(task);
    onChange([...rows.slice(0, index + 1), row, ...rows.slice(index + 1)]);
    setFocusId(row.id);
  };

  return (
    <div>
      {rows.length > 0 && (
        <div className="divide-y divide-border border-y border-border">
          {rows.map((row, i) => {
            const done = row.status === 'done';
            return (
              <div key={row.id} className="flex items-center gap-2.5 py-1.5">
                <input
                  autoFocus={row.id === focusId}
                  value={row.title}
                  placeholder="Subtask"
                  aria-label="Subtask"
                  onChange={(e) => update(row.id, { title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAfter(i);
                    }
                  }}
                  className={`min-w-0 flex-1 bg-transparent text-footnote outline-none placeholder:text-subtle ${
                    done ? 'text-subtle line-through' : 'text-muted'
                  }`}
                />
                <Check
                  size={16}
                  done={done}
                  label={`Mark "${row.title}" done`}
                  onToggle={() =>
                    update(row.id, {
                      status: done ? 'open' : 'done',
                      completed_at: done ? null : toLocalIso(new Date()),
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => addAfter(rows.length - 1)}
        className="mt-1.5 flex items-center gap-1.5 py-1 text-footnote text-muted hover:text-ink"
      >
        <Plus size={14} strokeWidth={2.5} />
        {rows.length ? 'Add subtask' : 'Add subtasks'}
      </button>
    </div>
  );
}
