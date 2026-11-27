import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { HospitalDatabase } from "@/types/hospital";
import { createSeedDatabase } from "@/lib/db/seed";
import { isSupabaseConfigured } from "@/lib/db/supabase-client";
import { readSupabaseDb, writeSupabaseDb } from "@/lib/db/supabase-store";

const DATA_DIR = path.join(process.cwd(), "data");
const TMP_DATA_DIR = path.join(os.tmpdir(), "auracare-hospital-data");
let memoryFallbackDb: HospitalDatabase | null = null;

function resolveWritableDbFile(): string | null {
  for (const dir of [DATA_DIR, TMP_DATA_DIR]) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.accessSync(dir, fs.constants.W_OK);
      return path.join(dir, "hospital-db.json");
    } catch {
      // Read-only directory (e.g. /var/task on Vercel serverless); try next fallback
    }
  }
  return null;
}

// Global promise mutex to guarantee atomic sequential writes & prevent double-booking races
let mutexChain: Promise<void> = Promise.resolve();

function ensureDbFile(): HospitalDatabase {
  const dbFile = resolveWritableDbFile();
  if (!dbFile) {
    if (!memoryFallbackDb) {
      memoryFallbackDb = createSeedDatabase();
    }
    return memoryFallbackDb;
  }

  try {
    if (!fs.existsSync(dbFile)) {
      const seed = createSeedDatabase();
      fs.writeFileSync(dbFile, JSON.stringify(seed, null, 2), "utf8");
      return seed;
    }
    const raw = fs.readFileSync(dbFile, "utf8");
    return JSON.parse(raw) as HospitalDatabase;
  } catch {
    if (!memoryFallbackDb) {
      memoryFallbackDb = createSeedDatabase();
    }
    return memoryFallbackDb;
  }
}

export async function readDb(): Promise<HospitalDatabase> {
  await mutexChain;
  if (isSupabaseConfigured()) {
    return readSupabaseDb();
  }
  return ensureDbFile();
}

export async function mutateDb<T>(
  mutator: (db: HospitalDatabase) => Promise<T> | T
): Promise<T> {
  let result!: T;
  const run = async () => {
    if (isSupabaseConfigured()) {
      const prev = await readSupabaseDb();
      const next = structuredClone(prev);
      result = await mutator(next);
      await writeSupabaseDb(prev, next);
      return;
    }

    const db = ensureDbFile();
    result = await mutator(db);
    const dbFile = resolveWritableDbFile();
    if (!dbFile) {
      memoryFallbackDb = db;
      return;
    }
    const tmpFile = `${dbFile}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tmpFile, dbFile);
  };

  const next = mutexChain.then(run, run);
  mutexChain = next.then(
    () => undefined,
    () => undefined
  );
  await next;
  return result;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateBookingRef(existingCount: number): string {
  const year = new Date().getFullYear();
  const num = 1001 + existingCount + Math.floor(Math.random() * 90);
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `AUR-${year}-${num}${suffix}`;
}
