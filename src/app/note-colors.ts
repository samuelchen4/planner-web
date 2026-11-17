import type { TaskColor } from '@/db/schema';

export const NOTE_COLORS: TaskColor[] = ['yellow', 'orange', 'pink', 'lavender', 'blue'];

export const paperOf = (color: TaskColor) => `var(--note-${color}-paper)`;
export const edgeOf = (color: TaskColor) => `var(--note-${color}-edge)`;
