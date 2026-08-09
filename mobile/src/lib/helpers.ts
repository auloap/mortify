import { TestEntry, TextEntry, ResistLog } from "./types";
import { EMOTION_GROUPS, STRONGHOLD } from "./constants";

export function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export function todayLabel() {
  return new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });
}

export function firstSentence(s: string) {
  if (!s) return "";
  const i = s.indexOf(".");
  return i >= 0 ? s.slice(0, i + 1) : s;
}

export function emotionColor(em: string): string {
  return EMOTION_GROUPS.find(g => g.emotions.includes(em))?.color || "#888";
}

export function calcStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort().reverse();
  const dt = new Date();
  let streak = 0;
  const today = dt.toISOString().slice(0, 10);
  if (!sorted.length) return 0;
  if (sorted[0] !== today && sorted[0] !== new Date(dt.getTime() - 86400000).toISOString().slice(0, 10)) return 0;
  for (const d of sorted) {
    const expected = dt.toISOString().slice(0, 10);
    if (d === expected) { streak++; dt.setDate(dt.getDate() - 1); } else break;
  }
  return streak;
}

export function winStats(resistLogs: ResistLog[], goalId: number) {
  const logs = resistLogs.filter(l => l.goalId === goalId && l.outcome !== "skip");
  const wins = logs.filter(l => l.outcome === "won").length;
  const pct = logs.length ? Math.round((wins / logs.length) * 100) : 0;
  return { wins, total: logs.length, pct };
}

export function getAnalytics(textEntries: TextEntry[], testEntries: TestEntry[]) {
  const sinCounts: Record<string, number> = {};
  const emoCounts: Record<string, number> = {};
  const bookCounts: Record<string, number> = {};
  const sinWins: Record<string, number> = {};
  testEntries.forEach(e => {
    sinCounts[e.sin] = (sinCounts[e.sin] || 0) + 1;
    if (e.outcome === "won") sinWins[e.sin] = (sinWins[e.sin] || 0) + 1;
    (e.emotions || []).forEach(em => { emoCounts[em] = (emoCounts[em] || 0) + 1; });
  });
  textEntries.forEach(e => { bookCounts[e.book] = (bookCounts[e.book] || 0) + 1; });

  const lostCounts: Record<string, number> = {};
  testEntries.filter(e => e.outcome !== "won").forEach(e => {
    lostCounts[e.sin] = (lostCounts[e.sin] || 0) + 1;
  });
  const strongholds = Object.entries(lostCounts).filter(([, c]) => c >= STRONGHOLD).map(([s]) => s);
  const topSins  = Object.entries(sinCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topEmo   = Object.entries(emoCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSin  = Math.max(...Object.values(sinCounts), 1);
  const maxEmo  = Math.max(...Object.values(emoCounts), 1);
  const maxBook = Math.max(...Object.values(bookCounts), 1);
  const days = [...new Set(textEntries.map(e => e.date.slice(0, 10)))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const diff = Math.round((Date.now() - new Date(days[i]).getTime()) / 86400000);
    if (diff === i || diff === i + 1) streak++; else break;
  }
  const totalTests = testEntries.length;
  const totalWins  = testEntries.filter(e => e.outcome === "won").length;
  const winRate    = totalTests > 0 ? Math.round((totalWins / totalTests) * 100) : null;
  return { sinCounts, sinWins, lostCounts, strongholds, topSins, topEmo, topBooks, maxSin, maxEmo, maxBook, streak, totalTests, totalWins, winRate };
}
