import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { goalId } = body;

  if (!goalId) {
    return NextResponse.json({ error: "goalId is required" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();

  const loggedAt = new Date().toISOString();
  const date = loggedAt.slice(0, 10);

  // Upsert: only one log per goal per day
  const existing = await sql`
    SELECT id FROM triumph_do_logs WHERE "goalId" = ${Number(goalId)} AND date = ${date}
  `;

  if (existing.length > 0) {
    // Already logged today — toggle off (delete)
    await sql`DELETE FROM triumph_do_logs WHERE "goalId" = ${Number(goalId)} AND date = ${date}`;
    return NextResponse.json({ toggled: false });
  }

  const rows = await sql`
    INSERT INTO triumph_do_logs ("goalId", date, "loggedAt")
    VALUES (${Number(goalId)}, ${date}, ${loggedAt})
    RETURNING *
  `;
  return NextResponse.json({ toggled: true, log: rows[0] });
}
