import {
  Activity,
  BedDouble,
  BookOpen,
  Brain,
  Coffee,
  Droplet,
  Dumbbell,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  Pencil,
  PersonStanding,
  PhoneOff,
  Pill,
  Sparkles,
  Star,
  Sun,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

import type { Task, TaskColor } from '@/db/schema';

export const HABIT_ICONS: [symbol: string, Icon: LucideIcon][] = [
  ['drop.fill', Droplet],
  ['book.fill', BookOpen],
  ['figure.walk', Footprints],
  ['figure.run', Activity],
  ['figure.flexibility', PersonStanding],
  ['dumbbell.fill', Dumbbell],
  ['bed.double.fill', BedDouble],
  ['moon.fill', Moon],
  ['sun.max.fill', Sun],
  ['leaf.fill', Leaf],
  ['heart.fill', Heart],
  ['brain.head.profile', Brain],
  ['pills.fill', Pill],
  ['fork.knife', Utensils],
  ['cup.and.saucer.fill', Coffee],
  ['iphone.slash', PhoneOff],
  ['pencil', Pencil],
  ['music.note', Music],
  ['sparkles', Sparkles],
  ['star.fill', Star],
];

export const HABIT_COLORS: TaskColor[] = ['yellow', 'orange', 'pink', 'lavender', 'blue'];

const ICONS = new Map(HABIT_ICONS);

export const paperOf = (color: TaskColor) => `var(--note-${color}-paper)`;
export const edgeOf = (color: TaskColor) => `var(--note-${color}-edge)`;

export function habitLook(habit: Task) {
  const color = habit.color ?? 'blue';
  return {
    color,
    symbol: habit.icon ?? 'star.fill',
    Icon: ICONS.get(habit.icon ?? '') ?? Star,
    paper: paperOf(color),
    edge: edgeOf(color),
    faint: `color-mix(in srgb, ${edgeOf(color)} 40%, transparent)`,
  };
}
