import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req);
  const { id } = await params;
  await ensureTables(userId);
  const sql = getSql();
  await sql`DELETE FROM triumph_goals WHERE id = ${Number(id)} AND "userId" = ${userId}`;
  return NextResponse.json({ ok: true });
}
