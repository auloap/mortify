import { NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { buildDayReviewSystem, buildDayReviewUserMessage } from "@/lib/buildSystemPrompt";

const client = new Anthropic();

export async function POST() {
  await ensureTables();
  const sql = getSql();

  const today = new Date().toISOString().slice(0, 10);

  const [moods, sins, qts, treats, tasks, wins, profile] = await Promise.all([
    sql`SELECT * FROM mood_entries WHERE date = ${today} ORDER BY "loggedAt" ASC`,
    sql`SELECT * FROM sin_entries WHERE date LIKE ${today + "%"} ORDER BY date ASC`,
    sql`SELECT * FROM qt_entries WHERE date LIKE ${today + "%"} ORDER BY date ASC`,
    sql`SELECT * FROM treat_entries WHERE date LIKE ${today + "%"} ORDER BY date ASC`,
    sql`SELECT * FROM task_entries WHERE date LIKE ${today + "%"} ORDER BY date ASC`,
    sql`SELECT * FROM triumph_wins WHERE date = ${today} ORDER BY "createdAt" ASC`,
    sql`SELECT * FROM user_profile LIMIT 1`,
  ]);

  if (moods.length === 0 && sins.length === 0 && qts.length === 0 && treats.length === 0) {
    return NextResponse.json({ aiSummary: "Not enough logged today for a summary. Come back after you've used the app for a bit." });
  }

  const userProfile = profile.length > 0
    ? { enneagramType: profile[0].enneagramType, wing: profile[0].wing }
    : { enneagramType: null, wing: null };

  const ctx = {
    moods: moods.map(m => ({ energy: m.energy as number, note: m.note as string, loggedAt: m.loggedAt as string })),
    sins: sins.map(s => ({ sin: s.sin as string, outcome: (s.outcome || "fell") as string, whatHelped: s.whatHelped as string, situation: s.situation as string })),
    qts: qts.map(q => ({ book: q.book as string, passage: q.passage as string, aboutGod: q.aboutGod as string })),
    treats: treats.map(t => ({ gratitude: t.gratitude as string })),
    tasks: tasks.map(t => ({ task: t.task as string })),
    wins: wins.map(w => ({ text: w.text as string })),
  };

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: buildDayReviewSystem(userProfile),
      messages: [{ role: "user", content: buildDayReviewUserMessage(ctx) }],
    });
    const aiSummary = msg.content.map(b => (b.type === "text" ? b.text : "")).join("");
    return NextResponse.json({ aiSummary });
  } catch (err) {
    return NextResponse.json({ aiSummary: `Could not generate summary. (${err instanceof Error ? err.message : "Unknown error"})` });
  }
}
