import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { setHabitDayNote, toggleHabitDay } from '@/db/habits';
import type { Task } from '@/db/schema';
import { dateKey, relativeDayName } from '@/lib/time';

import { habitLook } from './habit-look';
import { monthWeeks } from './stats';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MonthCalendar({
  habit,
  done,
  notes,
  selected,
  onSelect,
}: {
  habit: Task;
  done: Set<string>;
  notes: Map<string, string>;
  selected: Date;
  onSelect: (day: Date) => void;
}) {
  const today = new Date();
  const todayKey = dateKey(today);
  const selectedKey = dateKey(selected);
  const [month, setMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );
  const before = useRef(selected);
  const look = habitLook(habit);
  const atCurrent =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const step = (dir: 1 | -1) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => step(-1)}
          className="rounded-full p-2 text-muted hover:bg-app hover:text-ink"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-headline font-semibold text-ink">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          disabled={atCurrent}
          onClick={() => step(1)}
          className="rounded-full p-2 text-muted hover:bg-app hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1 text-center text-caption font-semibold text-muted">
            {d}
          </span>
        ))}
        {monthWeeks(month).flatMap((week) =>
          week.map((day, col) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === month.getMonth();
            const isDone = (k: string, d: Date) => d.getMonth() === month.getMonth() && done.has(k);
            const filled = inMonth && done.has(key);
            const prev = week[col - 1];
            const next = week[col + 1];
            const joinLeft = filled && prev && isDone(dateKey(prev), prev);
            const joinRight = filled && next && isDone(dateKey(next), next);
            const future = key > todayKey;
            const isSelected = inMonth && key === selectedKey;
            return (
              <div key={key} className="relative flex h-11 items-center justify-center">
                {filled && (
                  <div
                    className={`absolute inset-y-1.5 ${joinLeft ? 'left-0' : 'left-1 rounded-l-full'} ${
                      joinRight ? 'right-0' : 'right-1 rounded-r-full'
                    }`}
                    style={{ background: look.paper }}
                  />
                )}
                {inMonth && (
                  <button
                    type="button"
                    disabled={future}
                    aria-label={day.toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                    })}
                    aria-pressed={filled}
                    onClick={(e) => {
                      if (e.detail === 2) {
                        toggleHabitDay(habit, day);
                        onSelect(before.current);
                        return;
                      }
                      before.current = selected;
                      onSelect(day);
                    }}
                    className={`relative flex h-8 w-8 flex-col items-center justify-center rounded-full text-subhead tabular-nums disabled:cursor-default ${
                      isSelected
                        ? 'font-semibold text-on-accent'
                        : future
                          ? 'text-subtle/60'
                          : key === todayKey
                            ? 'font-bold text-accent'
                            : filled
                              ? 'font-semibold text-ink'
                              : 'text-ink'
                    }`}
                    style={isSelected ? { background: look.edge } : undefined}
                  >
                    {day.getDate()}
                    {notes.has(key) && (
                      <span
                        className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                          isSelected ? 'bg-on-accent' : 'bg-muted'
                        }`}
                      />
                    )}
                  </button>
                )}
              </div>
            );
          }),
        )}
      </div>
      <p className="text-center text-caption text-subtle">Double-click a day to check it off</p>
    </div>
  );
}

export function DayCard({
  habit,
  day,
  done,
  note,
}: {
  habit: Task;
  day: Date;
  done: boolean;
  note: string;
}) {
  const [draft, setDraft] = useState(note);
  const rel = relativeDayName(day);
  const short = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const title = rel === 'Today' || rel === 'Yesterday' ? `${rel}, ${short}` : rel;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-headline font-semibold text-ink">{title}</p>
        <button
          type="button"
          onClick={() => toggleHabitDay(habit, day)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-footnote font-semibold ${
            done ? 'bg-done text-on-accent' : 'border border-border text-ink hover:bg-app'
          }`}
        >
          {done && <Check size={14} strokeWidth={3} />}
          {done ? 'Done' : 'Mark done'}
        </button>
      </div>
      <textarea
        value={draft}
        placeholder="Add a note for this day"
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== note) setHabitDayNote(habit, day, draft);
        }}
        className="w-full resize-none rounded-xl bg-app px-3 py-2.5 text-subhead text-ink outline-none placeholder:text-subtle focus:ring-2 focus:ring-accent/40"
      />
    </div>
  );
}
