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
  // Add win/loss outcome columns
  await sql`ALTER TABLE sin_entries ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT 'fell'`;
  await sql`ALTER TABLE sin_entries ADD COLUMN IF NOT EXISTS "whatHelped" TEXT DEFAULT ''`;
  await sql`ALTER TABLE sin_entries ADD COLUMN IF NOT EXISTS "howFeeling" TEXT DEFAULT '[]'`;
  await sql`ALTER TABLE sin_entries ADD COLUMN IF NOT EXISTS "aiVictory" TEXT DEFAULT ''`;

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

  // ── Triumph tables ─────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS triumph_goals (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'do',
      icon TEXT DEFAULT '🎯',
      "linkedSin" TEXT DEFAULT '',
      "autoTab" TEXT DEFAULT '',
      "isDefault" BOOLEAN DEFAULT false,
      "createdAt" TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS triumph_do_logs (
      id SERIAL PRIMARY KEY,
      "goalId" INTEGER NOT NULL,
      date TEXT NOT NULL,
      "loggedAt" TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS triumph_resist_logs (
      id SERIAL PRIMARY KEY,
      "goalId" INTEGER NOT NULL,
      date TEXT NOT NULL,
      outcome TEXT NOT NULL,
      "pulseEnergy" INTEGER,
      "loggedAt" TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS triumph_wins (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      date TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    )
  `;

  // Seed default Do goals (one per autoTab — skip if already exists)
  const now = new Date().toISOString();
  await sql`
    INSERT INTO triumph_goals (name, type, icon, "linkedSin", "autoTab", "isDefault", "createdAt")
    SELECT 'Text', 'do', '📖', '', 'text', true, ${now}
    WHERE NOT EXISTS (SELECT 1 FROM triumph_goals WHERE "autoTab" = 'text')
  `;
  await sql`
    INSERT INTO triumph_goals (name, type, icon, "linkedSin", "autoTab", "isDefault", "createdAt")
    SELECT 'Treat', 'do', '🌿', '', 'treat', true, ${now}
    WHERE NOT EXISTS (SELECT 1 FROM triumph_goals WHERE "autoTab" = 'treat')
  `;
  await sql`
    INSERT INTO triumph_goals (name, type, icon, "linkedSin", "autoTab", "isDefault", "createdAt")
    SELECT 'Task', 'do', '✦', '', 'task', true, ${now}
    WHERE NOT EXISTS (SELECT 1 FROM triumph_goals WHERE "autoTab" = 'task')
  `;
}
