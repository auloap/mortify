import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { goalId, outcome, pulseEnergy } = body;

  if (!goalId || !["won", "skip", "fell"].includes(outcome)) {
    return NextResponse.json({ error: "goalId and outcome (won/skip/fell) required" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();

  const loggedAt = new Date().toISOString();
  const date = loggedAt.slice(0, 10);

  const rows = await sql`
    INSERT INTO triumph_resist_logs ("goalId", date, outcome, "pulseEnergy", "loggedAt")
    VALUES (${Number(goalId)}, ${date}, ${outcome}, ${pulseEnergy ?? null}, ${loggedAt})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
