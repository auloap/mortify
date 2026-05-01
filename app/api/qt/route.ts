import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { buildQTSystem, buildQTUserMessage, UserProfile } from "@/lib/buildSystemPrompt";

const client = new Anthropic();

export async function GET() {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`SELECT * FROM qt_entries ORDER BY date DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { book, passage, aboutGod, aboutSelf, apply, prayer } = body;

  if (!book || !aboutGod) {
    return NextResponse.json({ error: "book and aboutGod are required" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();

  const profileRows = await sql`SELECT * FROM user_profile LIMIT 1`;
  const profile: UserProfile = profileRows.length > 0
    ? { enneagramType: profileRows[0].enneagramType as UserProfile["enneagramType"], wing: profileRows[0].wing as number | null }
    : { enneagramType: null, wing: null };

  const ctx = { book, passage: passage ?? "", aboutGod, aboutSelf: aboutSelf ?? "", apply: apply ?? "", prayer };

  let aiReflection = "";
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: buildQTSystem(profile),
      messages: [{ role: "user", content: buildQTUserMessage(ctx) }],
    });
    aiReflection = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  } catch (err) {
    aiReflection = `Could not reach AI. (${err instanceof Error ? err.message : "Unknown error"})`;
  }

  const date = new Date().toISOString();
  const rows = await sql`
    INSERT INTO qt_entries (date, book, passage, "aboutGod", "aboutSelf", apply, prayer, "aiReflection")
    VALUES (${date}, ${book}, ${passage ?? ""}, ${aboutGod}, ${aboutSelf ?? ""}, ${apply ?? ""}, ${prayer ?? ""}, ${aiReflection})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
