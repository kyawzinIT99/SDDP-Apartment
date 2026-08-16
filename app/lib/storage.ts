import { nodeBindings } from "./node-db";

type D1Result<T> = { results?: T[] };
export type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
  all: <T>() => Promise<D1Result<T>>;
};
export type D1Database = { prepare: (sql: string) => D1Statement; batch: (items: D1Statement[]) => Promise<unknown> };
type R2Bucket = { put: (key: string, value: ArrayBuffer, options?: unknown) => Promise<unknown>; get: (key: string) => Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null> };
export type RuntimeBindings = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  N8N_INQUIRY_WEBHOOK?: string;
  N8N_WEBHOOK_SECRET?: string;
  GUEST_DATA_ENCRYPTION_KEY?: string;
};

type GlobalRuntime = typeof globalThis & { __SDDP_RUNTIME?: RuntimeBindings };

function nodeEnv(name: string) {
  try {
    return typeof process !== "undefined" ? process.env[name] : undefined;
  } catch {
    return undefined;
  }
}

function nodeSqliteAvailable() {
  try {
    const loader = (process as NodeJS.Process & { getBuiltinModule?: (name: string) => unknown }).getBuiltinModule;
    return typeof loader === "function" && Boolean(loader("node:sqlite"));
  } catch {
    return false;
  }
}

export function bindings() {
  const dbPath = nodeEnv("SDDP_DB_PATH") || (nodeEnv("RENDER") ? "./data/sddp.sqlite" : undefined) || (nodeSqliteAvailable() ? "./data/sddp.sqlite" : undefined);
  if (dbPath) return nodeBindings(dbPath);
  const runtime = (globalThis as GlobalRuntime).__SDDP_RUNTIME;
  if (!runtime?.DB) throw new Error("Database binding is unavailable");
  return runtime;
}

async function addColumnIfMissing(db: D1Database, table: string, column: string, definition: string) {
  const columns = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if (!(columns.results ?? []).some((item) => item.name === column)) {
    await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

export async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS site_settings (id TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL, updated_by TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, channel TEXT NOT NULL DEFAULT 'phone', stay_type TEXT NOT NULL DEFAULT 'monthly', room_number TEXT NOT NULL DEFAULT '', arrival_date TEXT, message TEXT, locale TEXT NOT NULL DEFAULT 'en', status TEXT NOT NULL DEFAULT 'new', notes TEXT NOT NULL DEFAULT '', converted_resident_id TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_inquiries_status_created_at ON inquiries(status, created_at)"),
    db.prepare("CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, file_name TEXT NOT NULL, content_type TEXT NOT NULL, caption TEXT NOT NULL DEFAULT '', visible INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS residents (id TEXT PRIMARY KEY, full_name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', nationality TEXT NOT NULL DEFAULT '', resident_type TEXT NOT NULL DEFAULT 'monthly', passport_ciphertext TEXT, passport_last4 TEXT NOT NULL DEFAULT '', room_number TEXT NOT NULL DEFAULT '', check_in_date TEXT, check_out_date TEXT, status TEXT NOT NULL DEFAULT 'active', consent_recorded_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, created_by TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_residents_room_status ON residents(room_number, status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_residents_name ON residents(full_name)"),
  ]);
  await addColumnIfMissing(db, "inquiries", "room_number", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, "inquiries", "notes", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, "inquiries", "converted_resident_id", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, "inquiries", "updated_at", "INTEGER");
}
