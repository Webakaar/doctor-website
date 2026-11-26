import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { HospitalDatabase } from "@/types/hospital";
import { createSeedDatabase } from "@/lib/db/seed";
import { isSupabaseConfigured } from "@/lib/db/supabase-client";
import { readSupabaseDb, writeSupabaseDb } from "@/lib/db/supabase-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "hospital-db.json");

// Global promise mutex to guarantee atomic sequential writes & prevent double-booking races
let mutexChain: Promise<void> = Promise.resolve();

function ensureDbFile(): HospitalDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw) as HospitalDatabase;
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
    const tmpFile = `${DB_FILE}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tmpFile, DB_FILE);
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
