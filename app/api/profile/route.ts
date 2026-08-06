import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  await ensureTables(userId);
  const sql = getSql();
  const rows = await sql`SELECT * FROM user_profile WHERE "userId" = ${userId} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ enneagramType: null, wing: null });
  return NextResponse.json(rows[0]);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const { enneagramType, wing } = await req.json();
  await ensureTables(userId);
  const sql = getSql();

  const existing = await sql`SELECT id FROM user_profile WHERE "userId" = ${userId} LIMIT 1`;
  if (existing.length === 0) {
    const rows = await sql`
      INSERT INTO user_profile ("enneagramType", wing, "userId")
      VALUES (${enneagramType ?? null}, ${wing ?? null}, ${userId})
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  }

  const rows = await sql`
    UPDATE user_profile
    SET "enneagramType" = ${enneagramType ?? null}, wing = ${wing ?? null}
    WHERE id = ${existing[0].id as number} AND "userId" = ${userId}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
