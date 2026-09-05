import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

type SqliteDb = {
  prepare: (sql: string) => { get: (...values: unknown[]) => unknown; all: (...values: unknown[]) => unknown[]; run: (...values: unknown[]) => unknown };
  exec: (sql: string) => void;
};

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

function openSqlite(path: string): SqliteDb {
  const loader = (process as NodeJS.Process & { getBuiltinModule?: (name: string) => { DatabaseSync: new (file: string) => SqliteDb } }).getBuiltinModule;
  if (typeof loader !== "function") throw new Error("SQLite requires Node 22 with --experimental-sqlite");
  const { DatabaseSync } = loader("node:sqlite");
  return new DatabaseSync(path);
}

function statement(db: SqliteDb, sql: string, values: unknown[] = []): D1Statement {
  return {
    bind: (...next: unknown[]) => statement(db, sql, next),
    first: async <T>() => (db.prepare(sql).get(...values) as T | undefined) ?? null,
    all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
    run: async () => db.prepare(sql).run(...values),
  };
}

function wrapDatabase(db: SqliteDb): D1Database {
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

function migrateLegacySqlite(dbPath: string) {
  if (existsSync(dbPath)) return;
  const legacy = "./data/sddp.sqlite";
  if (!existsSync(legacy) || legacy === dbPath) return;
  mkdirSync(dirname(dbPath) === "." ? "data" : dirname(dbPath), { recursive: true });
  copyFileSync(legacy, dbPath);
  for (const suffix of ["-wal", "-shm"]) {
    if (existsSync(legacy + suffix)) copyFileSync(legacy + suffix, dbPath + suffix);
  }
}

function renderSqlitePath(requested: string) {
  if (!requested.startsWith("/var/data")) return requested;
  if (existsSync("/var/data")) return "/var/data/sddp.sqlite";
  if (existsSync("/var/data ")) return "/var/data /sddp.sqlite";
  return "/var/data/sddp.sqlite";
}

function openAt(path: string): SqliteDb {
  migrateLegacySqlite(path);
  mkdirSync(dirname(path) === "." ? "data" : dirname(path), { recursive: true });
  const sqlite = openSqlite(path);
  sqlite.exec("PRAGMA journal_mode = WAL");
  sqlite.exec("PRAGMA foreign_keys = ON");
  return sqlite;
}

export function nodeBindings(dbPath: string): NodeRuntime {
  if (cached) return cached;
  const resolved = renderSqlitePath(dbPath);
  let sqlite: SqliteDb;
  try {
    sqlite = openAt(resolved);
  } catch (error) {
    if (!resolved.startsWith("/var/data")) throw error;
    console.error("SDDP sqlite could not use", resolved, error);
    sqlite = openAt("./data/sddp.sqlite");
  }
  cached = {
    DB: wrapDatabase(sqlite),
    N8N_INQUIRY_WEBHOOK: process.env.N8N_INQUIRY_WEBHOOK || "https://n8n-al8a.srv1707349.hstgr.cloud/webhook/sddp-inquiry-alert",
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
    GUEST_DATA_ENCRYPTION_KEY: process.env.GUEST_DATA_ENCRYPTION_KEY,
  };
  return cached;
}
