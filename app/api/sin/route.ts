import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

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

  let aiReflection = "";
  let aiPivot = "";

  try {
    const [pastoralMsg, pivotMsg] = await Promise.all([
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a Reformed pastor helping someone fight indwelling sin through John Owen's mortification principles.

Sin entry:
- Sin: ${sin}
- Emotional triggers: ${emotions.join(", ")}
- Situation: ${situation}
- Counterfeit satisfaction: ${counterfeit}
- Post-mortem cost: ${postMortem}
- Journal: ${journal || "(none)"}

Respond in flowing prose — no headers, no lists:
1. A specific Scripture verse (book chapter:verse) speaking to the root desire beneath this sin.
2. One-sentence theological diagnosis: what is the heart believing the sin promises to provide?
3. A mortification prompt (2-3 sentences): what Gospel truth should they meditate on to starve this sin?

Tone: warm, pastoral, direct. Speak to the heart.`,
          },
        ],
      }),
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a Gospel-centred pastor helping someone see that every sinful craving is a distorted reach for something only God can truly give.

Sin: ${sin}
Emotional trigger: ${emotions.join(", ")}
What it counterfeit-promised: ${counterfeit}

Write 3 short paragraphs — no headers, no lists:
1. Name the legitimate God-given desire underneath the sin. Be compassionate — do not shame the desire.
2. Show how God in Christ genuinely satisfies that desire. Include one Scripture reference.
3. One concrete way they can run to God today to satisfy this need rightly.

Tone: like Jesus at the well — grace and truth. Deeply human and deeply divine.`,
          },
        ],
      }),
    ]);

    aiReflection = pastoralMsg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    aiPivot = pivotMsg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  } catch (err) {
    aiReflection = `Could not reach AI. (${err instanceof Error ? err.message : "Unknown error"})`;
  }

  await ensureTables();
  const sql = getSql();
  const date = new Date().toISOString();
  const rows = await sql`
    INSERT INTO sin_entries (date, sin, emotions, situation, counterfeit, "postMortem", journal, "aiReflection", "aiPivot")
    VALUES (${date}, ${sin}, ${JSON.stringify(emotions)}, ${situation ?? ""}, ${counterfeit ?? ""}, ${postMortem ?? ""}, ${journal ?? ""}, ${aiReflection}, ${aiPivot})
    RETURNING *
  `;
  const row = rows[0] as Record<string, unknown>;
  return NextResponse.json({ ...row, emotions: JSON.parse((row.emotions as string) || "[]") });
}
