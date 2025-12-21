// server/utils/db.ts
import { drizzle } from 'drizzle-orm/libsql'; // Changed from /better-sqlite3
import { createClient } from '@libsql/client';
import * as schema from '../../server/db/schema';

// This driver doesn't need C++ bindings, so it won't throw that error.
const client = createClient({ url: 'file:balce.db' });

export const db = drizzle(client, { schema });
export const tables = schema;