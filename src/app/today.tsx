import { useMemo } from 'react';

import type { Task } from '@/db/schema';
import { useTasks } from '@/db/tables';
import { createTask, deleteTask, taskDay, taskTimes, toggleDone, updateTask } from '@/db/tasks';
import { dateKey, formatTime } from '@/lib/time';

import { AddInput, Card, Check, Empty, Section, TitleInput } from './ui';

function TaskRow({ task, time }: { task: Task; time?: string }) {
  const done = task.status === 'done';
  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <Check done={done} onToggle={() => toggleDone(task.id)} label={`Mark "${task.title}" done`} />
      {time && <span className="w-36 shrink-0 text-footnote tabular-nums text-muted">{time}</span>}
      <TitleInput
        value={task.title}
        done={done}
        onSave={(title) => updateTask(task.id, { title })}
      />
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="text-footnote text-subtle opacity-0 hover:text-danger group-hover:opacity-100"
      >
        Delete
      </button>
    </div>
  );
}

function Rows({ tasks, timed }: { tasks: Task[]; timed?: boolean }) {
  return (
    <Card className="divide-y divide-border">
      {tasks.map((task) => {
        const t = timed ? taskTimes(task) : null;
        return (
          <TaskRow
            key={task.id}
            task={task}
            time={t ? `${formatTime(t.start)} – ${formatTime(t.end)}` : undefined}
          />
        );
      })}
    </Card>
  );
}

export function TodayView() {
  const tasks = useTasks();
  const todayKey = dateKey(new Date());

  const { timed, allDay, inbox } = useMemo(() => {
    const plannable = tasks.filter(
      (t) =>
        (t.type === 'task' || t.type === 'time_block') && !t.list_id && t.status !== 'cancelled',
    );
    const timed = plannable
      .filter((t) => t.start_at && taskDay(t) === todayKey)
      .sort((a, b) => (taskTimes(a)?.start ?? 0) - (taskTimes(b)?.start ?? 0));
    const allDay = plannable.filter((t) => !t.start_at && t.all_day_date === todayKey);
    const inbox = plannable.filter((t) => !t.start_at && !t.all_day_date);
    return { timed, allDay, inbox };
  }, [tasks, todayKey]);

  const add = (title: string) => {
    const id = createTask('task', new Date());
    updateTask(id, { title });
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-subhead text-muted">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <h1 className="font-rounded text-large-title font-bold text-ink">Today</h1>
      </header>
      <AddInput placeholder="Add a task for today" onAdd={add} />
      <Section title="Scheduled">
        {timed.length ? <Rows tasks={timed} timed /> : <Empty>Nothing scheduled</Empty>}
      </Section>
      <Section title="All day">
        {allDay.length ? <Rows tasks={allDay} /> : <Empty>No all-day tasks</Empty>}
      </Section>
      {inbox.length > 0 && (
        <Section title="Inbox">
          <Rows tasks={inbox} />
        </Section>
      )}
    </div>
  );
}
