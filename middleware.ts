import { NextRequest, NextResponse } from "next/server";
import { getSql } from "./lib/db";

export const runtime = "nodejs";

export const config = {
  matcher: "/api/:path*",
};

// Registering and logging in must work without an existing session.
const PUBLIC_PATHS = ["/api/auth/register", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  if (PUBLIC_PATHS.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  let userId: string | null = null;
  if (token) {
    try {
      const sql = getSql();
      const rows = await sql`SELECT "userId", "expiresAt" FROM sessions WHERE token = ${token}`;
      if (rows.length > 0 && new Date(rows[0].expiresAt as string) > new Date()) {
        userId = rows[0].userId as string;
      }
    } catch {
      // sessions table not provisioned yet (fresh deploy, nobody has registered) — fall through to 401
    }
  }

  if (!userId) {
    if (process.env.NODE_ENV !== "production") {
      userId = "local-dev";
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const headers = new Headers(req.headers);
  headers.set("x-user-id", userId);
  headers.set("x-session-token", token);
  return NextResponse.next({ request: { headers } });
}
