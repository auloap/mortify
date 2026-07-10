import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type = "do", icon = "🎯", linkedSin = "", autoTab = "" } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!["do", "resist"].includes(type)) {
    return NextResponse.json({ error: "type must be do or resist" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();
  const createdAt = new Date().toISOString();

  const rows = await sql`
    INSERT INTO triumph_goals (name, type, icon, "linkedSin", "autoTab", "isDefault", "createdAt")
    VALUES (${name.trim()}, ${type}, ${icon}, ${linkedSin}, ${autoTab}, false, ${createdAt})
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}
