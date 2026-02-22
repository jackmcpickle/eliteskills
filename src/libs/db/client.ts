import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type AppDb = DrizzleD1Database<typeof schema>;

export function createDb(d1: D1Database): AppDb {
    return drizzle(d1, { schema });
}
