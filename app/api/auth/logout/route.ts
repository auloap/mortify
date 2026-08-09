import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-session-token") || "";
  if (token) {
    const sql = getSql();
    await sql`DELETE FROM sessions WHERE token = ${token}`;
  }
  return NextResponse.json({ ok: true });
}
