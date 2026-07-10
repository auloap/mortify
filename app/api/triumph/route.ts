import { NextResponse } from "next/server";
import { getSql, ensureTables } from "@/lib/db";

export async function GET() {
  await ensureTables();
  const sql = getSql();

  const [goals, doLogs, resistLogs, wins, textDates, treatDates, taskDates] = await Promise.all([
    sql`SELECT * FROM triumph_goals ORDER BY "createdAt" ASC`,
    sql`SELECT * FROM triumph_do_logs ORDER BY "loggedAt" DESC`,
    sql`SELECT * FROM triumph_resist_logs ORDER BY "loggedAt" DESC`,
    sql`SELECT * FROM triumph_wins ORDER BY "createdAt" DESC`,
    sql`SELECT date FROM qt_entries`,
    sql`SELECT date FROM treat_entries`,
    sql`SELECT date FROM task_entries`,
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
