import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET() {
  await ensureTables();
  const sql = getSql();
  const rows = await sql`SELECT * FROM treat_entries ORDER BY date DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gratitude } = body;
  if (!gratitude) return NextResponse.json({ error: "gratitude is required" }, { status: 400 });

  let aiReflection = "";
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `You are a warm pastor helping someone cultivate gratitude and see God's hand in their day.

They are thankful for:
${gratitude}

Respond in flowing prose — 2 to 3 sentences, no headers, no lists:
1. Reflect back what this gift reveals about God's character or heart.
2. Connect it briefly to a Scripture truth about God's generosity or faithfulness.
3. End with a single doxology sentence — a brief burst of praise.

Tone: warm, joyful, worshipful. Help them see the Giver behind the gifts.`,
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
    INSERT INTO treat_entries (date, gratitude, "aiReflection")
    VALUES (${date}, ${gratitude}, ${aiReflection})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
