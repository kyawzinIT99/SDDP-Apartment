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

function sqlitePath() {
  const configured = nodeEnv("SDDP_DB_PATH");
  if (nodeEnv("RENDER")) {
    if (configured?.startsWith("/var/data/")) return configured;
    return "/var/data/sddp.sqlite";
  }
  return configured || (nodeSqliteAvailable() ? "./data/sddp.sqlite" : undefined);
}

export function bindings() {
  const dbPath = sqlitePath();
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
    db.prepare("CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, book_number TEXT NOT NULL, invoice_number TEXT NOT NULL, room_number TEXT NOT NULL DEFAULT '', resident_name TEXT NOT NULL, address TEXT NOT NULL DEFAULT '', billing_month INTEGER NOT NULL, billing_year TEXT NOT NULL, issue_date TEXT NOT NULL, rent_amount REAL NOT NULL DEFAULT 0, electric_rate REAL NOT NULL DEFAULT 7, electric_prev REAL NOT NULL DEFAULT 0, electric_curr REAL NOT NULL DEFAULT 0, electric_units REAL NOT NULL DEFAULT 0, electric_amount REAL NOT NULL DEFAULT 0, water_rate REAL NOT NULL DEFAULT 17, water_prev REAL NOT NULL DEFAULT 0, water_curr REAL NOT NULL DEFAULT 0, water_units REAL NOT NULL DEFAULT 0, water_amount REAL NOT NULL DEFAULT 0, other_label TEXT NOT NULL DEFAULT '', other_amount REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, total_words TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, created_by TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_invoices_room ON invoices(room_number, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_invoices_name ON invoices(resident_name)"),
    db.prepare("CREATE TABLE IF NOT EXISTS chat_logs (id TEXT PRIMARY KEY, lang TEXT NOT NULL DEFAULT 'en', messages TEXT NOT NULL DEFAULT '[]', question_count INTEGER NOT NULL DEFAULT 0, user_agent TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at)"),
  ]);
  await addColumnIfMissing(db, "inquiries", "room_number", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, "inquiries", "notes", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, "inquiries", "converted_resident_id", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing(db, "inquiries", "updated_at", "INTEGER");
}
