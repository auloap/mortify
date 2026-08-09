import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (userId === "local-dev") {
    return NextResponse.json({ userId, email: "local-dev@localhost" });
  }
  const sql = getSql();
  const rows = await sql`SELECT id, email FROM users WHERE id = ${userId}`;
  if (rows.length === 0) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ userId: String(rows[0].id), email: rows[0].email as string });
}
