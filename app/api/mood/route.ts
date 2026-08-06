import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  await ensureTables(userId);
  const sql = getSql();
  const rows = await sql`SELECT * FROM mood_entries WHERE "userId" = ${userId} ORDER BY "loggedAt" DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();
  const { energy, note = "" } = body;

  if (!energy || energy < 1 || energy > 5) {
    return NextResponse.json({ error: "energy must be 1–5" }, { status: 400 });
  }

  await ensureTables(userId);
  const sql = getSql();

  const loggedAt = new Date().toISOString();
  const date = loggedAt.slice(0, 10);

  const rows = await sql`
    INSERT INTO mood_entries (date, energy, note, "loggedAt", "userId")
    VALUES (${date}, ${energy}, ${note}, ${loggedAt}, ${userId})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
