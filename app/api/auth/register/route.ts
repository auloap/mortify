import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSql, ensureTables } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();

  const existing = await sql`SELECT 1 FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const createdAt = new Date().toISOString();
  const rows = await sql`
    INSERT INTO users (email, "passwordHash", "createdAt")
    VALUES (${email}, ${passwordHash}, ${createdAt})
    RETURNING id
  `;
  const userId = String(rows[0].id);

  const { token, expiresAt } = await createSession(sql, userId);
  return NextResponse.json({ token, expiresAt, userId, email });
}
