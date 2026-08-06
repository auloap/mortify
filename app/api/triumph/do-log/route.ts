import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();
  const { goalId } = body;

  if (!goalId) {
    return NextResponse.json({ error: "goalId is required" }, { status: 400 });
  }

  await ensureTables(userId);
  const sql = getSql();

  const goal = await sql`SELECT id FROM triumph_goals WHERE id = ${Number(goalId)} AND "userId" = ${userId}`;
  if (goal.length === 0) {
    return NextResponse.json({ error: "goal not found" }, { status: 404 });
  }

  const loggedAt = new Date().toISOString();
  const date = loggedAt.slice(0, 10);

  // Upsert: only one log per goal per day
  const existing = await sql`
    SELECT id FROM triumph_do_logs WHERE "goalId" = ${Number(goalId)} AND date = ${date} AND "userId" = ${userId}
  `;

  if (existing.length > 0) {
    // Already logged today — toggle off (delete)
    await sql`DELETE FROM triumph_do_logs WHERE "goalId" = ${Number(goalId)} AND date = ${date} AND "userId" = ${userId}`;
    return NextResponse.json({ toggled: false });
  }

  const rows = await sql`
    INSERT INTO triumph_do_logs ("goalId", date, "loggedAt", "userId")
    VALUES (${Number(goalId)}, ${date}, ${loggedAt}, ${userId})
    RETURNING *
  `;
  return NextResponse.json({ toggled: true, log: rows[0] });
}
