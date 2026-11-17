import { Check, Flame, Palette, Plus, Trophy } from 'lucide-react';
import { Fragment, useMemo, useState, type ReactNode } from 'react';

import { toggleHabitDay } from '@/db/habits';
import type { HabitDay, Task } from '@/db/schema';
import { useHabitDays, useTasks } from '@/db/tables';
import { createTask, deleteIfUntitled, deleteTask, updateTask } from '@/db/tasks';
import { doneByHabit, recentDays, streak } from '@/lib/habit-days';
import { dateKey } from '@/lib/time';

import { DayCard, MonthCalendar } from './history';
import { habitLook } from './habit-look';
import { HabitBadge, LookDialog } from './look';
import { ConfirmDialog } from '../ui';
import { bestStreak, doneInMonth } from './stats';

const NONE = new Set<string>();

function Panel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card bg-card p-6 shadow-sm ${className}`}>
      {title && <h2 className="text-headline font-semibold text-ink">{title}</h2>}
      {subtitle && <p className="mt-1 text-footnote text-muted">{subtitle}</p>}
      {children}
    </section>
  );
}

function HabitTitle({ habit, autoFocus }: { habit: Task; autoFocus: boolean }) {
  const [draft, setDraft] = useState(habit.title);
  const [editing, setEditing] = useState(false);
  return (
    <input
      autoFocus={autoFocus}
      value={editing ? draft : habit.title}
      placeholder="New habit"
      aria-label="Habit name"
      onFocus={() => {
        setDraft(habit.title);
        setEditing(true);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(habit.title);
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        setEditing(false);
        const title = e.currentTarget.value.trim();
        if (title && title !== habit.title) updateTask(habit.id, { title });
        else if (!title) deleteIfUntitled(habit.id);
      }}
      className="min-w-0 flex-1 bg-transparent font-rounded text-title1 font-bold text-ink outline-none placeholder:text-subtle"
    />
  );
}

function WeekStrip({ habit, done }: { habit: Task; done: Set<string> }) {
  const today = new Date();
  const days = recentDays(today);
  const look = habitLook(habit);
  const count = days.filter((d) => done.has(dateKey(d))).length;

  return (
    <Panel>
      <p className="text-center text-title3 font-semibold text-ink">
        You did{' '}
        <mark className="rounded-md px-1.5 text-ink" style={{ background: look.paper }}>
          {habit.title || 'this habit'}
        </mark>{' '}
        on {count} of the last 7 days
      </p>
      <div className="mt-6 flex items-start justify-center">
        {days.map((day, i) => {
          const key = dateKey(day);
          const isDone = done.has(key);
          const isToday = i === days.length - 1;
          return (
            <Fragment key={key}>
              {i > 0 && (
                <div className="mt-[19px] h-0 w-4 border-t-2 border-dashed border-border lg:w-8" />
              )}
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                aria-label={day.toLocaleDateString(undefined, { weekday: 'long' })}
                onClick={() => toggleHabitDay(habit, day)}
                className="group flex w-20 flex-col items-center gap-2"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-on-accent transition-transform group-hover:scale-105"
                  style={{
                    background: isDone ? look.edge : undefined,
                    borderColor: isDone || isToday ? look.edge : look.faint,
                  }}
                >
                  {isDone && <Check size={18} strokeWidth={3} />}
                </span>
                <span
                  className={`text-caption ${isToday ? 'font-semibold text-ink' : 'text-muted'}`}
                >
                  {isToday ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'long' })}
                </span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </Panel>
  );
}

function Stat({ icon, value, unit }: { icon: ReactNode; value: number; unit: string }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      {icon}
      <span className="font-rounded text-large-title font-bold tabular-nums text-ink">{value}</span>
      <span className="text-subhead text-muted">{unit}</span>
    </div>
  );
}

function HabitDetail({ habit, rows, isNew }: { habit: Task; rows: HabitDay[]; isNew: boolean }) {
  const today = new Date();
  const [selected, setSelected] = useState(today);
  const [editingLook, setEditingLook] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const look = habitLook(habit);
  const { done, notes } = useMemo(() => {
    const done = new Set<string>();
    const notes = new Map<string, string>();
    for (const r of rows) {
      if (r.done_at) done.add(r.date);
      if (r.note?.trim()) notes.set(r.date, r.note);
    }
    return { done, notes };
  }, [rows]);

  const current = streak(done, today);
  const best = bestStreak(done);
  const doneToday = done.has(dateKey(today));
  const selectedKey = dateKey(selected);
  const plural = (n: number) => (n === 1 ? 'day' : 'days');

  return (
    <div className="space-y-6 px-8 py-8">
      <header className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Edit icon and colour"
          onClick={() => setEditingLook(true)}
          className="rounded-[16px] transition-opacity hover:opacity-80"
        >
          <HabitBadge habit={habit} size={52} />
        </button>
        <div className="min-w-0 flex-1">
          <HabitTitle key={habit.id} habit={habit} autoFocus={isNew} />
          <p className="text-subhead text-muted">Every day</p>
        </div>
        <button
          type="button"
          onClick={() => setEditingLook(true)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-footnote text-muted hover:bg-card hover:text-ink"
        >
          <Palette size={14} />
          Edit icon & colour
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="rounded-full border border-border px-3.5 py-1.5 text-footnote font-semibold text-danger hover:bg-card"
        >
          Delete
        </button>
      </header>

      <WeekStrip habit={habit} done={done} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel
            title="Your streak"
            subtitle={
              doneToday
                ? 'Done today. Nice work.'
                : current
                  ? 'Check off today to keep it going.'
                  : 'Check off today to start a streak.'
            }
          >
            <Stat
              icon={<Flame size={34} fill={look.edge} stroke={look.edge} />}
              value={current}
              unit={plural(current)}
            />
          </Panel>
          <Panel
            title="Best streak"
            subtitle={`${doneInMonth(done, today)} ${plural(doneInMonth(done, today))} this month, ${done.size} in total.`}
          >
            <Stat
              icon={<Trophy size={32} stroke={look.edge} strokeWidth={2.25} />}
              value={best}
              unit={plural(best)}
            />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel>
            <MonthCalendar
              habit={habit}
              done={done}
              notes={notes}
              selected={selected}
              onSelect={setSelected}
            />
          </Panel>
          <Panel>
            <DayCard
              key={selectedKey}
              habit={habit}
              day={selected}
              done={done.has(selectedKey)}
              note={notes.get(selectedKey) ?? ''}
            />
          </Panel>
        </div>
      </div>
      {editingLook && <LookDialog habit={habit} onClose={() => setEditingLook(false)} />}
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete habit?"
          message={
            <>
              <span className="font-semibold text-ink">{habit.title || 'This habit'}</span> and all
              its history will be deleted. This can’t be undone.
            </>
          }
          confirmLabel="Delete"
          onConfirm={() => deleteTask(habit.id)}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

export function HabitsView() {
  const tasks = useTasks();
  const habitDays = useHabitDays();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const today = new Date();

  const habits = useMemo(
    () => tasks.filter((t) => t.type === 'habit' && t.status !== 'cancelled'),
    [tasks],
  );
  const byHabit = useMemo(() => doneByHabit(habitDays), [habitDays]);
  const habit = habits.find((h) => h.id === selectedId) ?? habits[0];
  const rows = useMemo(
    () => (habit ? habitDays.filter((d) => d.habit_id === habit.id) : []),
    [habitDays, habit],
  );

  const add = () => {
    const id = createTask('habit', new Date());
    setSelectedId(id);
    setNewId(id);
  };

  return (
    <div className="flex h-full">
      <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between px-5 pb-3 pt-6">
          <p className="text-caption font-semibold uppercase tracking-wide text-muted">Habits</p>
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-footnote font-semibold text-accent hover:bg-accent/10"
          >
            <Plus size={14} strokeWidth={2.5} />
            New
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {habits.map((h) => {
            const done = byHabit.get(h.id) ?? NONE;
            const count = streak(done, today);
            const look = habitLook(h);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedId(h.id)}
                aria-current={h.id === habit?.id ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${
                  h.id === habit?.id ? 'bg-app' : 'hover:bg-app/60'
                }`}
              >
                <HabitBadge habit={h} size={30} />
                <span
                  className={`min-w-0 flex-1 truncate text-callout ${
                    h.title ? 'font-semibold text-ink' : 'text-subtle'
                  }`}
                >
                  {h.title || 'New habit'}
                </span>
                {done.has(dateKey(today)) && (
                  <Check size={16} strokeWidth={3} className="text-done" aria-label="Done today" />
                )}
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums text-ink"
                  style={{ background: look.paper }}
                >
                  <Flame size={12} fill={look.edge} stroke={look.edge} />
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto">
        {habit ? (
          <HabitDetail key={habit.id} habit={habit} rows={rows} isNew={habit.id === newId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Flame size={40} className="text-subtle" />
            <div>
              <p className="text-headline font-semibold text-ink">No habits yet</p>
              <p className="text-subhead text-muted">Something to do every day, like reading.</p>
            </div>
            <button
              type="button"
              onClick={add}
              className="rounded-full bg-accent px-4 py-2 text-subhead font-semibold text-on-accent hover:bg-accent/90"
            >
              New habit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
