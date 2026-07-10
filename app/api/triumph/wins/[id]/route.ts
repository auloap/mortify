import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await ensureTables();
  const sql = getSql();
  await sql`DELETE FROM triumph_wins WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
