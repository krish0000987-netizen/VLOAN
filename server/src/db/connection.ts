import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Pick a writable directory for the SQLite file.
 *
 * - `NEXUS_DB` (env) always wins when set — tests point it at a temp file.
 * - On Vercel the project directory is read-only (only `/tmp` is writable), so
 *   use `/tmp` there. It is ephemeral, but the app re-creates schema and demo
 *   seed on every cold start (`createApp` → `createSchema`/`seedIfEmpty`).
 * - Locally, keep the SQLite file under `server/data/` as before.
 */
function resolveDataDir(): string {
  if (process.env.VERCEL) return "/tmp/nexus";
  const dir = path.resolve(__dirname, "../../data");
  try {
    mkdirSync(dir, { recursive: true });
    return dir;
  } catch {
    // Read-only filesystem (e.g. other serverless hosts): fall back to /tmp.
    const tmp = "/tmp/nexus";
    mkdirSync(tmp, { recursive: true });
    return tmp;
  }
}

const DATA_DIR = resolveDataDir();

export const DB_PATH = process.env.NEXUS_DB || path.join(DATA_DIR, "nexus.db");

const _db = new DatabaseSync(DB_PATH);
try {
  _db.exec("PRAGMA journal_mode = WAL;");
} catch {
  // WAL is an optimization; some ephemeral filesystems reject it.
}
_db.exec("PRAGMA foreign_keys = ON;");

export function db(): DatabaseSync {
  return _db;
}

export type Row = Record<string, any>;

type SQLValue = string | number | bigint | null | Uint8Array;

export function q<T = Row>(sql: string, params: unknown[] = []): T[] {
  const stmt = _db.prepare(sql);
  return stmt.all(...(params as SQLValue[])) as T[];
}

export function q1<T = Row>(sql: string, params: unknown[] = []): T | undefined {
  const stmt = _db.prepare(sql);
  return stmt.get(...(params as SQLValue[])) as T | undefined;
}

export function run(sql: string, params: unknown[] = []): { lastId: number; changes: number } {
  const stmt = _db.prepare(sql);
  const res = stmt.run(...(params as SQLValue[]));
  return { lastId: Number(res.lastInsertRowid), changes: Number(res.changes) };
}

export function tx<T>(fn: () => T): T {
  _db.exec("BEGIN");
  try {
    const out = fn();
    _db.exec("COMMIT");
    return out;
  } catch (e) {
    _db.exec("ROLLBACK");
    throw e;
  }
}

export function now(): string {
  return new Date().toISOString();
}
