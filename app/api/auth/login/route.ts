import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSql, ensureTables } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  await ensureTables();
  const sql = getSql();

  const rows = await sql`SELECT id, "passwordHash" FROM users WHERE email = ${email}`;
  const invalid = () => NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  if (rows.length === 0) return invalid();

  const ok = await bcrypt.compare(password, rows[0].passwordHash as string);
  if (!ok) return invalid();

  const userId = String(rows[0].id);
  const { token, expiresAt } = await createSession(sql, userId);
  return NextResponse.json({ token, expiresAt, userId, email });
}
