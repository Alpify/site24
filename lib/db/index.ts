import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  sql: ReturnType<typeof postgres> | undefined;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export function getDb() {
  if (globalForDb.db) {
    return globalForDb.db;
  }
  // `prepare: false` — required for many connection poolers (e.g. Supabase
  // transaction mode / port 6543). Without it, queries can fail in serverless.
  const client = postgres(getDatabaseUrl(), { max: 10, prepare: false });
  globalForDb.sql = client;
  globalForDb.db = drizzle(client, { schema });
  return globalForDb.db;
}
