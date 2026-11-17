import { CalendarDays, Clock, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import type { Task } from '@/db/schema';
import { taskTable, useTasks } from '@/db/tables';
import {
  clearTaskTime,
  deleteTask,
  entriesOf,
  saveEntries,
  setTaskDate,
  setTaskTime,
  taskDay,
  taskTimes,
  toggleDone,
  updateTask,
} from '@/db/tasks';
import { dateKey, MINUTES_PER_DAY, parseDateKey } from '@/lib/time';

import { Check, ConfirmDialog, Modal } from '../ui';
import { Subtasks } from './subtasks';

const pad = (n: number) => String(n).padStart(2, '0');
const toInput = (m: number) =>
  m >= MINUTES_PER_DAY ? '23:59' : `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const fromInput = (v: string) => {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
};

function firstStart(day: string | null): number {
  const now = new Date();
  if (day && day !== dateKey(now)) return 9 * 60;
  return Math.min(now.getHours() + 1, 22) * 60;
}

const field =
  'rounded-lg bg-card px-2.5 py-1.5 text-subhead tabular-nums text-ink outline-none [color-scheme:light] focus:ring-2 focus:ring-accent/40 dark:[color-scheme:dark]';

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[52px] items-center gap-3 px-4 py-2">
      <span className="text-muted">{icon}</span>
      <span className="flex-1 text-subhead text-ink">{label}</span>
      {children}
    </div>
  );
}

function ClearButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-full p-1 text-subtle hover:bg-card hover:text-ink"
    >
      <X size={15} />
    </button>
  );
}

function WhenCard({ task }: { task: Task }) {
  const day = taskDay(task);
  const times = taskTimes(task);
  return (
    <div className="divide-y divide-border rounded-2xl bg-app">
      <Row icon={<CalendarDays size={18} />} label="Date">
        <input
          type="date"
          aria-label="Date"
          value={day ?? ''}
          onChange={(e) =>
            setTaskDate(task.id, e.target.value ? parseDateKey(e.target.value) : null)
          }
          className={field}
        />
        {day && <ClearButton label="Remove date" onClick={() => setTaskDate(task.id, null)} />}
      </Row>
      <Row icon={<Clock size={18} />} label="Time">
        {times ? (
          <>
            <input
              type="time"
              aria-label="Starts"
              step={300}
              value={toInput(times.start)}
              onChange={(e) => {
                if (!e.target.value) return;
                const start = fromInput(e.target.value);
                setTaskTime(task.id, start, start + (times.end - times.start));
              }}
              className={field}
            />
            <span className="text-muted">–</span>
            <input
              type="time"
              aria-label="Ends"
              step={300}
              value={toInput(times.end)}
              onChange={(e) => {
                if (e.target.value) setTaskTime(task.id, times.start, fromInput(e.target.value));
              }}
              className={field}
            />
            <ClearButton label="Make all-day" onClick={() => clearTaskTime(task.id)} />
          </>
        ) : (
          <>
            <span className="text-subhead text-muted">{day ? 'All day' : 'None'}</span>
            <button
              type="button"
              onClick={() => {
                const start = firstStart(day);
                setTaskTime(task.id, start, start + 60);
              }}
              className="rounded-full px-3 py-1 text-footnote font-semibold text-accent hover:bg-accent/10"
            >
              Add time
            </button>
          </>
        )}
      </Row>
    </div>
  );
}

function TaskForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [rows, setRows] = useState(() => entriesOf(taskTable.all(), task.id));
  const [confirming, setConfirming] = useState(false);
  const done = task.status === 'done';

  const saveTitle = () => {
    const next = title.trim();
    if (next && next !== task.title) updateTask(task.id, { title: next });
  };
  const saveNotes = () => {
    const next = notes.trim() ? notes : null;
    if (next !== (task.notes ?? null)) updateTask(task.id, { notes: next });
  };
  const close = () => {
    saveTitle();
    saveNotes();
    saveEntries(task.id, rows);
    if (!taskTable.get(task.id)?.title.trim()) deleteTask(task.id);
    onClose();
  };

  if (confirming) {
    return (
      <ConfirmDialog
        title={`Delete ${task.type === 'list' ? 'list' : 'task'}?`}
        message={
          <>
            <span className="font-semibold text-ink">{task.title || 'This task'}</span>
            {rows.length ? ' and its subtasks' : ''} will be deleted. This can’t be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => {
          deleteTask(task.id);
          onClose();
        }}
        onClose={() => setConfirming(false)}
      />
    );
  }

  return (
    <Modal label="Edit task" onClose={close} className="max-w-lg">
      <div className="flex items-start gap-3">
        <span className="pt-1.5">
          <Check
            size={22}
            done={done}
            onToggle={() => toggleDone(task.id)}
            label={`Mark "${task.title}" done`}
          />
        </span>
        <input
          autoFocus={!task.title}
          value={title}
          placeholder="New task"
          aria-label="Title"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className={`min-w-0 flex-1 bg-transparent font-rounded text-title2 font-bold outline-none placeholder:text-subtle ${
            done ? 'text-muted line-through' : 'text-ink'
          }`}
        />
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="rounded-full p-1.5 text-muted hover:bg-app hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-3 pl-[34px]">
        <Subtasks task={task} rows={rows} onChange={setRows} />
      </div>

      <div className="mt-5 space-y-4">
        <WhenCard task={task} />
        <textarea
          value={notes}
          rows={4}
          placeholder="Notes"
          aria-label="Notes"
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          className="w-full resize-none rounded-2xl bg-app px-4 py-3 text-subhead text-ink outline-none placeholder:text-subtle focus:ring-2 focus:ring-accent/40"
        />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full px-3 py-1.5 text-footnote font-semibold text-danger hover:bg-danger/10"
        >
          Delete
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

export function TaskDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const task = useTasks().find((t) => t.id === id);
  useEffect(() => {
    if (!task) onClose();
  }, [task, onClose]);
  if (!task) return null;
  return <TaskForm task={task} onClose={onClose} />;
}
