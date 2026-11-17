import { X } from 'lucide-react';
import { useState } from 'react';

import type { Task } from '@/db/schema';
import { setTaskDate, updateTask } from '@/db/tasks';
import { parseDateKey } from '@/lib/time';

import { edgeOf, NOTE_COLORS, paperOf } from '../note-colors';
import { Modal } from '../ui';
import { listDateKey } from './when';

function Label({ children }: { children: string }) {
  return <p className="text-footnote font-semibold uppercase text-muted">{children}</p>;
}

export function ListSettings({
  list,
  onClose,
  onDelete,
}: {
  list: Task;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(list.notes ?? '');
  const color = list.color ?? 'yellow';
  const date = listDateKey(list);
  const saveNotes = () => {
    const next = notes.trim() ? notes : null;
    if (next !== (list.notes ?? null)) updateTask(list.id, { notes: next });
  };
  const close = () => {
    saveNotes();
    onClose();
  };

  return (
    <Modal label="List settings" onClose={close}>
      <div className="mb-6 flex items-center gap-3">
        <span
          className="h-10 w-10 shrink-0 rounded-xl border-[1.5px]"
          style={{ background: paperOf(color), borderColor: edgeOf(color) }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-headline font-semibold text-ink">List settings</p>
          <p className="truncate text-footnote text-muted">{list.title || 'New list'}</p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="rounded-full p-1.5 text-muted hover:bg-app hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Colour</Label>
          <div className="flex gap-3">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === color}
                aria-label={c}
                onClick={() => updateTask(list.id, { color: c })}
                className="flex h-10 w-10 items-center justify-center rounded-full border-[2.5px]"
                style={{ borderColor: c === color ? edgeOf(c) : 'transparent' }}
              >
                <span className="h-7 w-7 rounded-full" style={{ background: edgeOf(c) }} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>On the calendar</Label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date ?? ''}
              onChange={(e) =>
                setTaskDate(list.id, e.target.value ? parseDateKey(e.target.value) : null)
              }
              className="flex-1 rounded-xl bg-app px-3 py-2 text-subhead text-ink outline-none [color-scheme:light] focus:ring-2 focus:ring-accent/40 dark:[color-scheme:dark]"
            />
            {date && (
              <button
                type="button"
                onClick={() => setTaskDate(list.id, null)}
                className="rounded-full px-3 py-1.5 text-footnote font-semibold text-muted hover:bg-app hover:text-ink"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-caption text-muted">
            {date ? 'Shown on that day in the calendar.' : 'No date: only shown here.'}
          </p>
        </div>

        <div className="space-y-3">
          <Label>Notes</Label>
          <textarea
            value={notes}
            rows={3}
            placeholder="Add notes"
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            className="w-full resize-none rounded-xl bg-app px-3 py-2.5 text-subhead text-ink outline-none placeholder:text-subtle focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            saveNotes();
            onDelete();
          }}
          className="rounded-full px-3 py-1.5 text-footnote font-semibold text-danger hover:bg-danger/10"
        >
          Delete list
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-full bg-accent px-5 py-2 text-subhead font-semibold text-on-accent hover:bg-accent/90"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}
