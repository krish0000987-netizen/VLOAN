import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = process.env.NEXUS_DB || path.join(DATA_DIR, "nexus.db");

const _db = new DatabaseSync(DB_PATH);
_db.exec("PRAGMA journal_mode = WAL;");
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
