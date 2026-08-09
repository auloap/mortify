import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getSql } from "./db";

const SESSION_TTL_DAYS = 90;

export function getUserId(req: NextRequest | Request): string {
  const id = req.headers.get("x-user-id");
  if (!id) throw new Error("Missing x-user-id header — request did not pass through middleware");
  return id;
}

export async function createSession(sql: ReturnType<typeof getSql>, userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO sessions (token, "userId", "expiresAt", "createdAt")
    VALUES (${token}, ${userId}, ${expiresAt}, ${now.toISOString()})
  `;
  return { token, expiresAt };
}
