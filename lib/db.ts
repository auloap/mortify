import { neon } from "@neondatabase/serverless";

export function getSql() {
  return neon(process.env.DATABASE_URL!);
}

export async function ensureTables() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS qt_entries (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      book TEXT NOT NULL,
      passage TEXT DEFAULT '',
      "aboutGod" TEXT DEFAULT '',
      "aboutSelf" TEXT DEFAULT '',
      apply TEXT DEFAULT '',
      prayer TEXT DEFAULT '',
      "aiReflection" TEXT DEFAULT ''
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sin_entries (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      sin TEXT NOT NULL,
      emotions TEXT DEFAULT '[]',
      situation TEXT DEFAULT '',
      counterfeit TEXT DEFAULT '',
      "postMortem" TEXT DEFAULT '',
      journal TEXT DEFAULT '',
      "aiReflection" TEXT DEFAULT '',
      "aiPivot" TEXT DEFAULT ''
    )
  `;
  // Add pulse columns to sin_entries if they don't exist yet
  await sql`ALTER TABLE sin_entries ADD COLUMN IF NOT EXISTS "pulseEnergy" INTEGER`;
  await sql`ALTER TABLE sin_entries ADD COLUMN IF NOT EXISTS "pulseFeelings" TEXT DEFAULT '[]'`;
  await sql`ALTER TABLE sin_entries ADD COLUMN IF NOT EXISTS "pulseContexts" TEXT DEFAULT '[]'`;

  await sql`
    CREATE TABLE IF NOT EXISTS user_profile (
      id SERIAL PRIMARY KEY,
      "enneagramType" INTEGER,
      wing INTEGER
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS treat_entries (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      gratitude TEXT DEFAULT '',
      "aiReflection" TEXT DEFAULT ''
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS task_entries (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      task TEXT DEFAULT '',
      obstacle TEXT DEFAULT '',
      "aiReflection" TEXT DEFAULT ''
    )
  `;
}
