import { CalendarDays, Ellipsis, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';

import type { Task } from '@/db/schema';
import { taskTable } from '@/db/tables';
import { deleteIfUntitled, deleteTask, newEntry, toggleDone, updateTask } from '@/db/tasks';

import { NoteMark } from '../icons';
import { edgeOf, paperOf } from '../note-colors';
import { Check, ConfirmDialog } from '../ui';
import { ListSettings } from './list-settings';
import { whenLabel } from './when';

const ROW_H = 32;
const GAP = 6;
const MAX_ITEMS_H = 10.5 * ROW_H + 10 * GAP;

function InlineTitle({
  value,
  done,
  placeholder,
  autoFocus,
  className,
  onSave,
  onEmpty,
}: {
  value: string;
  done: boolean;
  placeholder: string;
  autoFocus?: boolean;
  className: string;
  onSave: (title: string) => void;
  onEmpty: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const cancelled = useRef(false);
  return (
    <input
      autoFocus={autoFocus}
      value={editing ? draft : value}
      placeholder={placeholder}
      aria-label="Title"
      onFocus={() => {
        cancelled.current = false;
        setDraft(value);
        setEditing(true);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancelled.current = true;
        if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
      }}
      onBlur={() => {
        setEditing(false);
        const title = (cancelled.current ? value : draft).trim();
        if (!title) onEmpty();
        else if (title !== value) onSave(title);
      }}
      className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle ${
        done ? 'text-muted line-through' : 'text-ink'
      } ${className}`}
    />
  );
}

function Entry({ entry }: { entry: Task }) {
  const done = entry.status === 'done';
  return (
    <div className="group h-8 shrink-0 rounded-lg bg-card">
      <div
        className={`flex h-full overflow-hidden rounded-lg ${done ? 'bg-done/15' : 'bg-accent/15'}`}
      >
        <div className={`w-1 shrink-0 ${done ? 'bg-done' : 'bg-accent'}`} />
        <div className="flex min-w-0 flex-1 items-center pl-2 pr-1.5">
          <InlineTitle
            value={entry.title}
            done={done}
            placeholder="Item"
            className="text-footnote font-semibold"
            onSave={(title) => updateTask(entry.id, { title })}
            onEmpty={() => deleteTask(entry.id)}
          />
          {!!entry.notes?.trim() && <NoteMark />}
          <button
            type="button"
            aria-label={`Delete "${entry.title}"`}
            onClick={() => deleteTask(entry.id)}
            className="ml-1 rounded p-0.5 text-subtle opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100"
          >
            <X size={14} />
          </button>
          <span className="pl-1.5">
            <Check
              size={16}
              done={done}
              onToggle={() => toggleDone(entry.id)}
              label={`Mark "${entry.title}" done`}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

function AddEntry({ list, edge }: { list: Task; edge: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const add = () => {
    const title = value.trim();
    if (title) taskTable.insert({ ...newEntry(list), title });
    setValue('');
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-footnote text-muted hover:bg-card/60 hover:text-ink"
      >
        <Plus size={14} strokeWidth={2.5} />
        Add item
      </button>
    );
  }
  return (
    <input
      autoFocus
      value={value}
      placeholder="New item, Enter to add"
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') add();
        if (e.key === 'Escape') {
          setValue('');
          setOpen(false);
        }
      }}
      onBlur={() => {
        add();
        setOpen(false);
      }}
      className="h-8 rounded-lg border border-dashed bg-card/70 px-3 text-footnote text-ink outline-none placeholder:text-subtle"
      style={{ borderColor: edge }}
    />
  );
}

export function ListNote({
  list,
  entries,
  isNew,
}: {
  list: Task;
  entries: Task[];
  isNew: boolean;
}) {
  const [dialog, setDialog] = useState<'settings' | 'delete' | null>(null);
  const color = list.color ?? 'yellow';
  const edge = edgeOf(color);
  const done = list.status === 'done';
  const left = entries.filter((e) => e.status !== 'done').length;
  const when = whenLabel(list);

  return (
    <article
      className="group/note mb-5 flex break-inside-avoid flex-col gap-3 rounded-[14px] border-[1.5px] px-3 pb-3 pt-3.5 shadow-sm"
      style={{ background: paperOf(color), borderColor: edge }}
    >
      <div className="flex items-center gap-2 px-1">
        <InlineTitle
          value={list.title}
          done={done}
          placeholder="New list"
          autoFocus={isNew}
          className="text-headline font-semibold"
          onSave={(title) => updateTask(list.id, { title })}
          onEmpty={() => deleteIfUntitled(list.id)}
        />
        {!!list.notes?.trim() && <NoteMark />}
        <span className="shrink-0 text-footnote tabular-nums text-subtle">
          {entries.length === 0 ? '' : left === 0 ? 'All done' : `${left} left`}
        </span>
        <button
          type="button"
          aria-label="List settings"
          onClick={() => setDialog('settings')}
          className="shrink-0 rounded-full p-1 text-muted opacity-0 hover:bg-card/60 hover:text-ink focus:opacity-100 group-hover/note:opacity-100"
        >
          <Ellipsis size={16} />
        </button>
        <Check
          size={22}
          done={done}
          onToggle={() => toggleDone(list.id)}
          label={`Mark "${list.title}" done`}
        />
      </div>

      {when && (
        <button
          type="button"
          onClick={() => setDialog('settings')}
          className="-mt-1.5 flex items-center gap-1.5 self-start px-1 text-footnote text-muted hover:text-ink"
        >
          <CalendarDays size={13} />
          {when}
        </button>
      )}

      {entries.length > 0 && (
        <div className="flex flex-col overflow-y-auto" style={{ gap: GAP, maxHeight: MAX_ITEMS_H }}>
          {entries.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
      <AddEntry list={list} edge={edge} />

      {dialog === 'settings' && (
        <ListSettings
          list={list}
          onClose={() => setDialog(null)}
          onDelete={() => setDialog('delete')}
        />
      )}
      {dialog === 'delete' && (
        <ConfirmDialog
          title="Delete list?"
          message={
            <>
              <span className="font-semibold text-ink">{list.title || 'This list'}</span>
              {entries.length
                ? ` and its ${entries.length} item${entries.length === 1 ? '' : 's'} will be deleted.`
                : ' will be deleted.'}{' '}
              This can’t be undone.
            </>
          }
          confirmLabel="Delete"
          onConfirm={() => deleteTask(list.id)}
          onClose={() => setDialog(null)}
        />
      )}
    </article>
  );
}
