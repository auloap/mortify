import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text } = body;

  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();

  const createdAt = new Date().toISOString();
  const date = createdAt.slice(0, 10);

  const rows = await sql`
    INSERT INTO triumph_wins (text, date, "createdAt")
    VALUES (${text.trim()}, ${date}, ${createdAt})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
