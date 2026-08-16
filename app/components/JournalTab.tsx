"use client";

import { useMemo, useState } from "react";
import {
  fmt, firstSentence, emotionColor, todayISO,
  TreatEntry, TextEntry, TaskEntry, TestEntry,
} from "./shared";

type Kind = "treat" | "text" | "task" | "test";
type Filter = "all" | Kind;

interface Row {
  kind: Kind;
  id: number;
  date: string;
  title: string;
  badge?: "won" | "fell";
  body: string;
  emotions?: string[];
  ai?: { text: string; tone: "grace" | "warfare" };
}

const GLYPHS: Record<Kind, { g: string; bg: string; fg: string }> = {
  treat: { g: "❧", bg: "var(--green-wash)", fg: "var(--green)" },
  text:  { g: "✜", bg: "var(--gold-wash)",  fg: "var(--gold-ink)" },
  task:  { g: "✦", bg: "var(--task-wash)",  fg: "var(--task-ink)" },
  test:  { g: "⚔", bg: "var(--rust-wash)",  fg: "var(--rust)" },
};

function dayLabel(date: string) {
  const d = date.slice(0, 10);
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return "Today";
  if (d === yesterday) return "Yesterday";
  return fmt(date);
}

export default function JournalTab({ treatEntries, textEntries, taskEntries, testEntries, onDelete }: {
  treatEntries: TreatEntry[]; textEntries: TextEntry[]; taskEntries: TaskEntry[]; testEntries: TestEntry[];
  onDelete: (kind: Kind, id: number) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    treatEntries.forEach(e => out.push({
      kind: "treat", id: e.id, date: e.date, title: "Thanksgiving", body: e.gratitude,
      ai: e.aiReflection ? { text: firstSentence(e.aiReflection), tone: "grace" } : undefined,
    }));
    textEntries.forEach(e => out.push({
      kind: "text", id: e.id, date: e.date,
      title: `${e.book}${e.passage ? " " + e.passage : ""}`,
      body: e.aboutGod || e.apply || "",
    }));
    taskEntries.forEach(e => out.push({
      kind: "task", id: e.id, date: e.date, title: "One obedience", body: e.task,
      ai: e.aiReflection ? { text: firstSentence(e.aiReflection), tone: "grace" } : undefined,
    }));
    testEntries.forEach(e => {
      const won = e.outcome === "won";
      out.push({
        kind: "test", id: e.id, date: e.date, title: e.sin,
        badge: won ? "won" : "fell",
        body: won ? (e.whatHelped || e.situation || "") : (e.situation || e.counterfeit || ""),
        emotions: e.emotions,
        ai: won
          ? (e.aiVictory ? { text: firstSentence(e.aiVictory), tone: "grace" } : undefined)
          : (e.aiPivot ? { text: firstSentence(e.aiPivot), tone: "grace" }
            : e.aiReflection ? { text: firstSentence(e.aiReflection), tone: "warfare" } : undefined),
      });
    });
    out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
    return out;
  }, [treatEntries, textEntries, taskEntries, testEntries]);

  const filtered = filter === "all" ? rows : rows.filter(r => r.kind === filter);
  const counts: Record<Filter, number> = {
    all: rows.length,
    treat: treatEntries.length, text: textEntries.length,
    task: taskEntries.length, test: testEntries.length,
  };

  let lastDay = "";

  return (
    <div>
      <div className="pg-eyebrow">Journal</div>
      <div className="pg-title">Everything, one place</div>
      <div className="pg-sub">The record you&apos;re building — grace and war alike.</div>

      <div className="jfilters">
        {(["all", "treat", "text", "task", "test"] as Filter[]).map(f => (
          <button key={f} className={`jf${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} {counts[f] > 0 && `· ${counts[f]}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          <div className="e-serif">Nothing here yet.</div>
          <p>Entries appear the day you make them — start with today&apos;s rhythm.</p>
        </div>
      )}

      {filtered.map(r => {
        const day = dayLabel(r.date);
        const showDay = day !== lastDay;
        lastDay = day;
        const glyph = GLYPHS[r.kind];
        return (
          <div key={`${r.kind}-${r.id}`}>
            {showDay && <div className="jday">{day}</div>}
            <div className="jentry">
              <div className="jg" style={{ background: glyph.bg, color: glyph.fg }}>{glyph.g}</div>
              <div className="jbody">
                <div className="jt">
                  {r.title}
                  {r.badge === "won" && <span className="jbadge w">STOOD</span>}
                  {r.badge === "fell" && <span className="jbadge f">FELL</span>}
                </div>
                {r.body && <div className="jx">{r.body}</div>}
                {r.emotions && r.emotions.length > 0 && (
                  <div className="jchips">
                    {r.emotions.map(em => (
                      <span className="jchip" key={em} style={{ color: emotionColor(em) }}>{em}</span>
                    ))}
                  </div>
                )}
                {r.ai && <div className={`jai ${r.ai.tone}`}>✦ {r.ai.text}</div>}
              </div>
              <button className="jdel" onClick={() => onDelete(r.kind, r.id)} aria-label="Delete entry">✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
