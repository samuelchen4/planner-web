import { date, timestamp } from 'drizzle-orm/pg-core';

export const timestamptz = () => timestamp({ withTimezone: true, mode: 'string' });

export const day = () => date({ mode: 'string' });
