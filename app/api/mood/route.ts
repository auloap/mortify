import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";

export async function GET() {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`SELECT * FROM mood_entries ORDER BY "loggedAt" DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { energy, note = "" } = body;

  if (!energy || energy < 1 || energy > 5) {
    return NextResponse.json({ error: "energy must be 1–5" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();

  const loggedAt = new Date().toISOString();
  const date = loggedAt.slice(0, 10);

  const rows = await sql`
    INSERT INTO mood_entries (date, energy, note, "loggedAt")
    VALUES (${date}, ${energy}, ${note}, ${loggedAt})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
