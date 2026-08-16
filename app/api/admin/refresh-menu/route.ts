import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PROD_URL = "https://mortify-pi.vercel.app";

/**
 * One-shot maintenance endpoint: points the bot's menu button at the
 * production domain and reports the configuration it found. The target URL
 * is hardcoded, so re-triggering it only ever re-applies our own config.
 * Exempted from initData auth in middleware.ts (it takes no user input and
 * exposes no user data).
 */
export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  async function tg(method: string, body?: Record<string, unknown>) {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    return res.json();
  }

  const me = await tg("getMe");
  const before = await tg("getChatMenuButton");
  const set = await tg("setChatMenuButton", {
    menu_button: { type: "web_app", text: "Open Mortify", web_app: { url: PROD_URL } },
  });
  const after = await tg("getChatMenuButton");

  return NextResponse.json({
    bot: { username: me?.result?.username, has_main_web_app: me?.result?.has_main_web_app ?? null },
    menu_button_before: before?.result ?? before,
    set_ok: set?.ok ?? false,
    menu_button_after: after?.result ?? after,
    target: PROD_URL,
  });
}
