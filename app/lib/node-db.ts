import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

type D1Result<T> = { results?: T[] };
type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
  all: <T>() => Promise<D1Result<T>>;
};
type D1Database = { prepare: (sql: string) => D1Statement; batch: (items: D1Statement[]) => Promise<unknown> };

type NodeRuntime = {
  DB: D1Database;
  MEDIA?: undefined;
  N8N_INQUIRY_WEBHOOK?: string;
  N8N_WEBHOOK_SECRET?: string;
  GUEST_DATA_ENCRYPTION_KEY?: string;
};

let cached: NodeRuntime | undefined;

function statement(db: DatabaseSync, sql: string, values: unknown[] = []): D1Statement {
  return {
    bind: (...next: unknown[]) => statement(db, sql, next),
    first: async <T>() => (db.prepare(sql).get(...values) as T | undefined) ?? null,
    all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
    run: async () => db.prepare(sql).run(...values),
  };
}

function wrapDatabase(db: DatabaseSync): D1Database {
  return {
    prepare: (sql: string) => statement(db, sql),
    batch: async (items: D1Statement[]) => {
      db.exec("BEGIN");
      try {
        for (const item of items) await item.run();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

export function nodeBindings(dbPath: string): NodeRuntime {
  if (cached) return cached;
  mkdirSync(dirname(dbPath) === "." ? "data" : dirname(dbPath), { recursive: true });
  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec("PRAGMA journal_mode = WAL");
  sqlite.exec("PRAGMA foreign_keys = ON");
  cached = {
    DB: wrapDatabase(sqlite),
    N8N_INQUIRY_WEBHOOK: process.env.N8N_INQUIRY_WEBHOOK,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
    GUEST_DATA_ENCRYPTION_KEY: process.env.GUEST_DATA_ENCRYPTION_KEY,
  };
  return cached;
}
