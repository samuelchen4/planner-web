import { dateKey, toLocalIso } from '@/lib/time';

import type { HabitDay, Task } from './schema';
import { habitDayTable } from './tables';

const now = () => toLocalIso(new Date());

const habitDayId = (habitId: string, date: string) => `${habitId}:${date}`;

function changeDay(habit: Task, day: Date, change: Partial<Pick<HabitDay, 'done_at' | 'note'>>) {
  const date = dateKey(day);
  const id = habitDayId(habit.id, date);
  const row = habitDayTable.get(id);
  const next = {
    done_at: row?.done_at ?? null,
    note: row?.note ?? null,
    ...change,
  };
  const empty = !next.done_at && !next.note?.trim();
  if (!row) {
    if (!empty) {
      habitDayTable.insert({
        id,
        habit_id: habit.id,
        user_id: habit.user_id,
        date,
        ...next,
        updated_at: now(),
      });
    }
  } else if (empty) habitDayTable.delete([id]);
  else habitDayTable.update(id, { ...change, updated_at: now() });
}

export function toggleHabitDay(habit: Task, day: Date) {
  const done = !!habitDayTable.get(habitDayId(habit.id, dateKey(day)))?.done_at;
  changeDay(habit, day, { done_at: done ? null : now() });
}

export function setHabitDayNote(habit: Task, day: Date, note: string) {
  changeDay(habit, day, { note: note.trim() ? note : null });
}
