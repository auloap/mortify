import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();
  const { goalId, outcome, pulseEnergy } = body;

  if (!goalId || !["won", "skip", "fell"].includes(outcome)) {
    return NextResponse.json({ error: "goalId and outcome (won/skip/fell) required" }, { status: 400 });
  }

  await ensureTables(userId);
  const sql = getSql();

  const goal = await sql`SELECT id FROM triumph_goals WHERE id = ${Number(goalId)} AND "userId" = ${userId}`;
  if (goal.length === 0) {
    return NextResponse.json({ error: "goal not found" }, { status: 404 });
  }

  const loggedAt = new Date().toISOString();
  const date = loggedAt.slice(0, 10);

  const rows = await sql`
    INSERT INTO triumph_resist_logs ("goalId", date, outcome, "pulseEnergy", "loggedAt", "userId")
    VALUES (${Number(goalId)}, ${date}, ${outcome}, ${pulseEnergy ?? null}, ${loggedAt}, ${userId})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
