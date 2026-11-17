import { X } from 'lucide-react';

import type { Task } from '@/db/schema';
import { updateTask } from '@/db/tasks';

import { Modal } from '../ui';
import { edgeOf, NOTE_COLORS } from '../note-colors';
import { HABIT_ICONS, habitLook } from './habit-look';

export function HabitBadge({ habit, size = 32 }: { habit: Task; size?: number }) {
  const { Icon, edge } = habitLook(habit);
  return (
    <span
      className="flex shrink-0 items-center justify-center text-on-accent"
      style={{ width: size, height: size, borderRadius: size * 0.3, background: edge }}
    >
      <Icon size={size * 0.5} strokeWidth={2.25} aria-hidden="true" />
    </span>
  );
}

export function LookDialog({ habit, onClose }: { habit: Task; onClose: () => void }) {
  return (
    <Modal label="Icon and colour" onClose={onClose}>
      <div className="mb-6 flex items-center gap-3">
        <HabitBadge habit={habit} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-headline font-semibold text-ink">Icon & colour</p>
          <p className="truncate text-footnote text-muted">{habit.title || 'New habit'}</p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-full p-1.5 text-muted hover:bg-app hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>
      <LookPicker habit={habit} />
      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full rounded-full bg-accent py-2 text-subhead font-semibold text-on-accent hover:bg-accent/90"
      >
        Done
      </button>
    </Modal>
  );
}

function LookPicker({ habit }: { habit: Task }) {
  const look = habitLook(habit);
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-footnote font-semibold uppercase text-muted">Colour</p>
        <div className="flex gap-3">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === look.color}
              aria-label={c}
              onClick={() => updateTask(habit.id, { color: c })}
              className="flex h-10 w-10 items-center justify-center rounded-full border-[2.5px]"
              style={{ borderColor: c === look.color ? edgeOf(c) : 'transparent' }}
            >
              <span className="h-7 w-7 rounded-full" style={{ background: edgeOf(c) }} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-footnote font-semibold uppercase text-muted">Icon</p>
        <div className="grid grid-cols-10 gap-1.5">
          {HABIT_ICONS.map(([symbol, Icon]) => {
            const selected = symbol === look.symbol;
            return (
              <button
                key={symbol}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={symbol}
                onClick={() => updateTask(habit.id, { icon: symbol })}
                className={`flex aspect-square items-center justify-center rounded-xl ${
                  selected ? 'text-on-accent' : 'bg-app text-muted hover:text-ink'
                }`}
                style={selected ? { background: look.edge } : undefined}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
