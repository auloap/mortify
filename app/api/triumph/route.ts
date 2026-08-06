import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  await ensureTables(userId);
  const sql = getSql();

  const [goals, doLogs, resistLogs, wins, textDates, treatDates, taskDates] = await Promise.all([
    sql`SELECT * FROM triumph_goals WHERE "userId" = ${userId} ORDER BY "createdAt" ASC`,
    sql`SELECT * FROM triumph_do_logs WHERE "userId" = ${userId} ORDER BY "loggedAt" DESC`,
    sql`SELECT * FROM triumph_resist_logs WHERE "userId" = ${userId} ORDER BY "loggedAt" DESC`,
    sql`SELECT * FROM triumph_wins WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`,
    sql`SELECT date FROM qt_entries WHERE "userId" = ${userId}`,
    sql`SELECT date FROM treat_entries WHERE "userId" = ${userId}`,
    sql`SELECT date FROM task_entries WHERE "userId" = ${userId}`,
  ]);

  return NextResponse.json({
    goals,
    doLogs,
    resistLogs,
    wins,
    autoDates: {
      text:  textDates.map(r => (r.date as string).slice(0, 10)),
      treat: treatDates.map(r => (r.date as string).slice(0, 10)),
      task:  taskDates.map(r => (r.date as string).slice(0, 10)),
    },
  });
}
