import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PROD_URL = "https://mortify-pi.vercel.app";

/**
 * Maintenance endpoint for the bot's menu button. Reads the bot token from
 * this deployment's own environment — the token never travels in a request.
 *
 * ?set=none    (default) diagnose only: report bot + current menu button
 * ?set=branch  point the menu button at this deployment's stable branch alias
 * ?set=prod    point the menu button at the production domain
 *
 * The only URLs it can set are this project's own deployment URLs, so an
 * unauthenticated caller can only re-apply our own configuration. Exempted
 * from initData auth in middleware.ts.
 */
export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const env = {
    vercel_env: process.env.VERCEL_ENV ?? null,
    deployment_url: process.env.VERCEL_URL ?? null,
    branch_url: process.env.VERCEL_BRANCH_URL ?? null,
  };
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set in this environment", env }, { status: 500 });
  }

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

  const set = req.nextUrl.searchParams.get("set") ?? "none";
  let target: string | null = null;
  if (set === "prod") target = PROD_URL;
  if (set === "branch" && process.env.VERCEL_BRANCH_URL) target = `https://${process.env.VERCEL_BRANCH_URL}`;

  let setResult: unknown = null;
  let after: unknown = null;
  if (target) {
    setResult = await tg("setChatMenuButton", {
      menu_button: { type: "web_app", text: "Open Mortify", web_app: { url: target } },
    });
    after = (await tg("getChatMenuButton"))?.result ?? null;
  }

  return NextResponse.json({
    env,
    bot: { username: me?.result?.username, has_main_web_app: me?.result?.has_main_web_app ?? null },
    menu_button_before: before?.result ?? before,
    requested_set: set,
    target,
    set_result: setResult,
    menu_button_after: after,
  });
}
