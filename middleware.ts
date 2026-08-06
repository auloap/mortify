import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "./lib/telegramAuth";

export const runtime = "nodejs";

export const config = {
  matcher: "/api/:path*",
};

export function middleware(req: NextRequest) {
  const initData = req.headers.get("x-telegram-init-data") || "";
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  let userId: string | null = null;
  if (botToken && initData) {
    const user = verifyTelegramInitData(initData, botToken);
    if (user) userId = String(user.id);
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
  return NextResponse.next({ request: { headers } });
}
