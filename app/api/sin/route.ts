import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildMortificationSystem,
  buildMortificationUserMessage,
  buildPivotSystem,
  buildPivotUserMessage,
  buildVictorySystem,
  buildVictoryUserMessage,
  UserProfile,
} from "@/lib/buildSystemPrompt";

const client = new Anthropic();

export async function GET() {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`SELECT * FROM sin_entries ORDER BY date DESC`;
  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      emotions:      JSON.parse((r.emotions      as string) || "[]"),
      pulseFeelings: JSON.parse((r.pulseFeelings as string) || "[]"),
      pulseContexts: JSON.parse((r.pulseContexts as string) || "[]"),
      howFeeling:    JSON.parse((r.howFeeling    as string) || "[]"),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    sin,
    emotions = [],
    situation,
    // loss path
    counterfeit,
    postMortem,
    journal,
    // win path
    outcome = "fell",
    whatHelped,
    howFeeling = [],
    // pulse
    pulseEnergy,
    pulseFeelings = [],
    pulseContexts = [],
  } = body;

  if (!sin) {
    return NextResponse.json({ error: "sin is required" }, { status: 400 });
  }

  await ensureTables();
  const sql = getSql();

  // Fetch profile and today's sin count in parallel
  const today = new Date().toISOString().slice(0, 10);
  const [profileRows, todayRows] = await Promise.all([
    sql`SELECT * FROM user_profile LIMIT 1`,
    sql`SELECT COUNT(*) as count FROM sin_entries WHERE date LIKE ${today + "%"}`,
  ]);

  const profile: UserProfile = profileRows.length > 0
    ? { enneagramType: profileRows[0].enneagramType as UserProfile["enneagramType"], wing: profileRows[0].wing as number | null }
    : { enneagramType: null, wing: null };

  const isStressDay = Number(todayRows[0].count) >= 2;

  let aiReflection = "";
  let aiPivot = "";
  let aiVictory = "";

  try {
    if (outcome === "won") {
      // Victory path — single AI call
      const victoryCtx = {
        sin,
        emotions,
        situation: situation ?? "",
        whatHelped: whatHelped ?? "",
        howFeeling,
      };
      const victoryMsg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: buildVictorySystem(profile),
        messages: [{ role: "user", content: buildVictoryUserMessage(victoryCtx) }],
      });
      aiVictory = victoryMsg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    } else {
      // Loss path — mortification + gospel pivot in parallel
      const sinCtx = {
        sin,
        emotions,
        situation: situation ?? "",
        counterfeit: counterfeit ?? "",
        postMortem: postMortem ?? "",
        journal,
      };
      const [pastoralMsg, pivotMsg] = await Promise.all([
        client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: buildMortificationSystem(profile, isStressDay),
          messages: [{ role: "user", content: buildMortificationUserMessage(sinCtx) }],
        }),
        client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: buildPivotSystem(profile, isStressDay),
          messages: [{ role: "user", content: buildPivotUserMessage(sinCtx) }],
        }),
      ]);
      aiReflection = pastoralMsg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      aiPivot = pivotMsg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    }
  } catch (err) {
    const msg = `Could not reach AI. (${err instanceof Error ? err.message : "Unknown error"})`;
    if (outcome === "won") aiVictory = msg;
    else aiReflection = msg;
  }

  const date = new Date().toISOString();
  const rows = await sql`
    INSERT INTO sin_entries (
      date, sin, emotions, situation, counterfeit, "postMortem", journal,
      "aiReflection", "aiPivot",
      "pulseEnergy", "pulseFeelings", "pulseContexts",
      outcome, "whatHelped", "howFeeling", "aiVictory"
    )
    VALUES (
      ${date}, ${sin}, ${JSON.stringify(emotions)}, ${situation ?? ""}, ${counterfeit ?? ""}, ${postMortem ?? ""}, ${journal ?? ""},
      ${aiReflection}, ${aiPivot},
      ${pulseEnergy ?? null}, ${JSON.stringify(pulseFeelings)}, ${JSON.stringify(pulseContexts)},
      ${outcome}, ${whatHelped ?? ""}, ${JSON.stringify(howFeeling)}, ${aiVictory}
    )
    RETURNING *
  `;
  const row = rows[0] as Record<string, unknown>;
  return NextResponse.json({
    ...row,
    emotions:      JSON.parse((row.emotions      as string) || "[]"),
    pulseFeelings: JSON.parse((row.pulseFeelings as string) || "[]"),
    pulseContexts: JSON.parse((row.pulseContexts as string) || "[]"),
    howFeeling:    JSON.parse((row.howFeeling    as string) || "[]"),
  });
}
