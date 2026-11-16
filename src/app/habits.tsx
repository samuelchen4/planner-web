import { useMemo } from 'react';

import { toggleHabitDay } from '@/db/habits';
import { useHabitDays, useTasks } from '@/db/tables';
import { createTask, updateTask } from '@/db/tasks';
import { doneByHabit, recentDays, streak } from '@/lib/habit-days';
import { dateKey } from '@/lib/time';

import { AddInput, Card, Empty, TitleInput } from './ui';

const NONE = new Set<string>();

export function HabitsView() {
  const tasks = useTasks();
  const habitDays = useHabitDays();
  const today = new Date();
  const days = recentDays(today);
  const habits = useMemo(
    () => tasks.filter((t) => t.type === 'habit' && t.status !== 'cancelled'),
    [tasks],
  );
  const byHabit = useMemo(() => doneByHabit(habitDays), [habitDays]);

  const add = (title: string) => {
    const id = createTask('habit', today);
    updateTask(id, { title });
  };

  return (
    <div className="space-y-8">
      <h1 className="font-rounded text-large-title font-bold text-ink">Habits</h1>
      <AddInput placeholder="Add a habit" onAdd={add} />
      {habits.length === 0 && <Empty>No habits yet</Empty>}
      <div className="space-y-3">
        {habits.map((habit) => {
          const done = byHabit.get(habit.id) ?? NONE;
          const count = streak(done, today);
          return (
            <Card key={habit.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <TitleInput
                  value={habit.title}
                  onSave={(title) => updateTask(habit.id, { title })}
                />
                <p className="text-footnote text-muted">
                  {count} day{count === 1 ? '' : 's'} streak
                </p>
              </div>
              <div className="flex gap-2">
                {days.map((day) => {
                  const key = dateKey(day);
                  const isDone = done.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      title={day.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      onClick={() => toggleHabitDay(habit, day)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-caption ${
                        isDone
                          ? 'border-accent bg-accent text-on-accent'
                          : 'border-border text-muted'
                      }`}
                    >
                      {day.toLocaleDateString(undefined, { weekday: 'narrow' })}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
