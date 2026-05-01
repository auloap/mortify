import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildMortificationSystem,
  buildMortificationUserMessage,
  buildPivotSystem,
  buildPivotUserMessage,
  UserProfile,
} from "@/lib/buildSystemPrompt";

const client = new Anthropic();

export async function GET() {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`SELECT * FROM sin_entries ORDER BY date DESC`;
  return NextResponse.json(
    rows.map((r) => ({ ...r, emotions: JSON.parse((r.emotions as string) || "[]") }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sin, emotions = [], situation, counterfeit, postMortem, journal } = body;

  if (!sin) {
    return NextResponse.json({ error: "sin is required" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();

  // Fetch profile and today's sin count in parallel
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const [profileRows, todayRows] = await Promise.all([
    sql`SELECT * FROM user_profile LIMIT 1`,
    sql`SELECT COUNT(*) as count FROM sin_entries WHERE date LIKE ${today + "%"}`,
  ]);

  const profile: UserProfile = profileRows.length > 0
    ? { enneagramType: profileRows[0].enneagramType as UserProfile["enneagramType"], wing: profileRows[0].wing as number | null }
    : { enneagramType: null, wing: null };

  // Stress flag: 2+ existing entries today means this submission is the 3rd
  const isStressDay = Number(todayRows[0].count) >= 2;

  const ctx = { sin, emotions, situation: situation ?? "", counterfeit: counterfeit ?? "", postMortem: postMortem ?? "", journal };

  let aiReflection = "";
  let aiPivot = "";

  try {
    const [pastoralMsg, pivotMsg] = await Promise.all([
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: buildMortificationSystem(profile, isStressDay),
        messages: [{ role: "user", content: buildMortificationUserMessage(ctx) }],
      }),
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: buildPivotSystem(profile, isStressDay),
        messages: [{ role: "user", content: buildPivotUserMessage(ctx) }],
      }),
    ]);

    aiReflection = pastoralMsg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    aiPivot = pivotMsg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  } catch (err) {
    aiReflection = `Could not reach AI. (${err instanceof Error ? err.message : "Unknown error"})`;
  }

  const date = new Date().toISOString();
  const rows = await sql`
    INSERT INTO sin_entries (date, sin, emotions, situation, counterfeit, "postMortem", journal, "aiReflection", "aiPivot")
    VALUES (${date}, ${sin}, ${JSON.stringify(emotions)}, ${situation ?? ""}, ${counterfeit ?? ""}, ${postMortem ?? ""}, ${journal ?? ""}, ${aiReflection}, ${aiPivot})
    RETURNING *
  `;
  const row = rows[0] as Record<string, unknown>;
  return NextResponse.json({ ...row, emotions: JSON.parse((row.emotions as string) || "[]") });
}
