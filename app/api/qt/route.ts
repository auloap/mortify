import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

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

  let aiReflection = "";
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a warm, Reformed pastor helping someone grow in their love for God through daily Scripture reading.

QT entry:
- Passage: ${book} ${passage}
- What they saw of God: ${aboutGod}
- What they saw of themselves: ${aboutSelf}
- Application: ${apply}
- Prayer: ${prayer || "(none)"}

Respond with 3 things in flowing prose — no headers, no lists:
1. A one-sentence affirmation of the specific insight about God they've seen.
2. A deepening question — one thing they may not have noticed about God's character that could deepen their delight in Him.
3. A doxology prompt — a short warm invitation to linger in awe over what they've seen today.

Tone: a pastor who deeply loves God and wants to ignite that same love. Warm, rich prose.`,
        },
      ],
    });
    aiReflection = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  } catch (err) {
    aiReflection = `Could not reach AI. (${err instanceof Error ? err.message : "Unknown error"})`;
  }

  await ensureTables();
  const sql = getSql();
  const date = new Date().toISOString();
  const rows = await sql`
    INSERT INTO qt_entries (date, book, passage, "aboutGod", "aboutSelf", apply, prayer, "aiReflection")
    VALUES (${date}, ${book}, ${passage ?? ""}, ${aboutGod}, ${aboutSelf ?? ""}, ${apply ?? ""}, ${prayer ?? ""}, ${aiReflection})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
