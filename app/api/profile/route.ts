import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";

export async function GET() {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`SELECT * FROM user_profile LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ enneagramType: null, wing: null });
  return NextResponse.json(rows[0]);
}

export async function POST(req: NextRequest) {
  const { enneagramType, wing } = await req.json();
  await ensureTables();
  const sql = getSql();

  const existing = await sql`SELECT id FROM user_profile LIMIT 1`;
  if (existing.length === 0) {
    const rows = await sql`
      INSERT INTO user_profile ("enneagramType", wing)
      VALUES (${enneagramType ?? null}, ${wing ?? null})
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  }

  const rows = await sql`
    UPDATE user_profile
    SET "enneagramType" = ${enneagramType ?? null}, wing = ${wing ?? null}
    WHERE id = ${existing[0].id as number}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
