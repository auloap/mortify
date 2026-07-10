import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET() {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`SELECT * FROM task_entries ORDER BY date DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { task, obstacle } = body;
  if (!task) return NextResponse.json({ error: "task is required" }, { status: 400 });

  let aiReflection = "";
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `You are a pastor helping someone commit to one act of daily obedience based on what God has been saying to them.

Their task today: ${task}
Why it feels hard: ${obstacle || "(not shared)"}

Respond in flowing prose — 2 to 3 sentences, no headers, no lists:
1. Affirm the goodness of this act of obedience — name what it costs and why it matters.
2. Point them to God's presence and power in this specific act.
3. End with a commissioning sentence — short, grounded, sending them out.

Tone: encouraging but not cheesy. Speak to the heart of someone who genuinely wants to obey but finds it hard.`,
      }],
    });
    aiReflection = msg.content.map(b => b.type === "text" ? b.text : "").join("");
  } catch (err) {
    aiReflection = `Could not reach AI. (${err instanceof Error ? err.message : "Unknown error"})`;
  }

  await ensureTables();
  const sql = getSql();
  const date = new Date().toISOString();
  const rows = await sql`
    INSERT INTO task_entries (date, task, obstacle, "aiReflection")
    VALUES (${date}, ${task}, ${obstacle ?? ""}, ${aiReflection})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
