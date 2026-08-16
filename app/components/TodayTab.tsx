"use client";

import { useMemo, useState } from "react";
import { tgFetch } from "@/lib/telegramFetch";
import { firstName } from "./telegram";
import {
  ENERGY_WORDS, todayISO, todayLabel, calcStreak, firstSentence,
  TreatEntry, TextEntry, TaskEntry, TestEntry, MoodEntry, TriumphData, TriumphGoal,
} from "./shared";

function greeting() {
  const h = new Date().getHours();
  const part = h < 5 ? "Night watch" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
  const name = firstName();
  return name ? `${part}, ${name}.` : `${part}.`;
}

export default function TodayTab({
  treatEntries, textEntries, taskEntries, testEntries, moodEntries, triumph,
  streak, winRate, onOpenFlow, onLogMood, onToggleGoal, onAddGoal, onDelGoal,
}: {
  treatEntries: TreatEntry[]; textEntries: TextEntry[]; taskEntries: TaskEntry[]; testEntries: TestEntry[];
  moodEntries: MoodEntry[]; triumph: TriumphData;
  streak: number; winRate: number | null;
  onOpenFlow: (k: "treat" | "text" | "task") => void;
  onLogMood: (energy: number, note: string) => Promise<void>;
  onToggleGoal: (goal: TriumphGoal) => void;
  onAddGoal: (name: string) => Promise<void>;
  onDelGoal: (id: number) => void;
}) {
  const today = todayISO();
  const [pendingMood, setPendingMood] = useState<number | null>(null);
  const [moodNote, setMoodNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [review, setReview] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const todayMoods = moodEntries.filter(e => e.date === today);
  const doneTreat = treatEntries.some(e => e.date.slice(0, 10) === today);
  const doneText  = textEntries.some(e => e.date.slice(0, 10) === today);
  const doneTask  = taskEntries.some(e => e.date.slice(0, 10) === today);

  const customGoals = triumph.goals.filter(g => g.type === "do" && !g.autoTab);
  const goalDone = (g: TriumphGoal) => triumph.doLogs.some(l => l.goalId === g.id && l.date === today);
  const goalStreak = (g: TriumphGoal) => calcStreak(triumph.doLogs.filter(l => l.goalId === g.id).map(l => l.date));

  const rhythmTotal = 3 + customGoals.length;
  const rhythmDone = [doneTreat, doneText, doneTask].filter(Boolean).length + customGoals.filter(goalDone).length;

  // The most recent word of grace the AI already gave — writing is not write-only.
  const grace = useMemo(() => {
    const candidates: { at: string; text: string; src: string }[] = [];
    treatEntries.forEach(e => e.aiReflection && candidates.push({ at: e.date, text: e.aiReflection, src: "Doxology" }));
    textEntries.forEach(e => e.aiReflection && candidates.push({ at: e.date, text: e.aiReflection, src: `${e.book}${e.passage ? " " + e.passage : ""}` }));
    taskEntries.forEach(e => e.aiReflection && candidates.push({ at: e.date, text: e.aiReflection, src: "Sent with you" }));
    testEntries.forEach(e => {
      const t = e.outcome === "won" ? e.aiVictory : e.aiPivot || e.aiReflection;
      if (t) candidates.push({ at: e.date, text: t, src: e.outcome === "won" ? "Victory debrief" : "Gospel pivot" });
    });
    candidates.sort((a, b) => (a.at < b.at ? 1 : -1));
    return candidates[0] || null;
  }, [treatEntries, textEntries, taskEntries, testEntries]);

  async function logMood() {
    if (!pendingMood) return;
    await onLogMood(pendingMood, moodNote);
    setPendingMood(null); setMoodNote("");
  }

  async function getDayReview() {
    setReviewBusy(true); setReview("");
    try {
      const res = await tgFetch("/api/mood/summary", { method: "POST" });
      const json = await res.json();
      setReview(json.aiSummary || "No summary returned.");
    } catch { setReview("Could not reach the AI — try again."); }
    setReviewBusy(false);
  }

  async function addGoal() {
    const name = newGoal.trim();
    if (!name) { setAdding(false); return; }
    await onAddGoal(name);
    setNewGoal(""); setAdding(false);
  }

  const subBits: string[] = [];
  if (streak > 0) subBits.push(`Day ${streak} of your rhythm`);
  if (winRate !== null) subBits.push(`${winRate}% win rate this month`);

  return (
    <div>
      <div className="pg-eyebrow">{todayLabel()}</div>
      <div className="pg-title">{greeting()}</div>
      {subBits.length > 0 && <div className="pg-sub">{subBits.join(" · ")}</div>}

      {/* ── Mood, one line ── */}
      <div className="moodline">
        <span className="ml-q">
          {todayMoods.length > 0
            ? `Today: ${(todayMoods.reduce((s, e) => s + e.energy, 0) / todayMoods.length).toFixed(1)} avg · ${todayMoods.length}×`
            : "How are you right now?"}
        </span>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n}
            className={`mooddot${pendingMood === n ? " on" : ""}`}
            onClick={() => setPendingMood(pendingMood === n ? null : n)}
            aria-label={`Energy ${n} — ${ENERGY_WORDS[n]}`}
          >{n}</button>
        ))}
      </div>
      {pendingMood && (
        <div className="mood-note">
          <input
            type="text" value={moodNote} autoFocus
            onChange={e => setMoodNote(e.target.value)}
            placeholder={`${ENERGY_WORDS[pendingMood]} — what's going on?`}
            onKeyDown={e => {
              if (e.key === "Enter") logMood();
              if (e.key === "Escape") { setPendingMood(null); setMoodNote(""); }
            }}
          />
          <button className="go" onClick={logMood}>Log</button>
          <button className="nah" onClick={() => { setPendingMood(null); setMoodNote(""); }}>✕</button>
        </div>
      )}

      {/* ── The rhythm ── */}
      <div className="pcard">
        <div className="pc-hd">
          <span className="pc-t">Today&apos;s rhythm</span>
          <span style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <span className="pc-m">{rhythmDone} of {rhythmTotal}</span>
            {customGoals.length > 0 && (
              <button className={`pc-edit${editing ? " on" : ""}`} onClick={() => setEditing(v => !v)}>
                {editing ? "done" : "edit"}
              </button>
            )}
          </span>
        </div>

        <div className="rrow">
          <div className="rglyph g-treat">❧</div>
          <div className="rbody">
            <div className="rname">Treat <span className="rsm">— give thanks</span></div>
            <div className="rsub">{doneTreat ? "Kept today" : "Name what God has given"}</div>
          </div>
          {doneTreat
            ? <button className="rcheck on" onClick={() => onOpenFlow("treat")} aria-label="Give thanks again">✓</button>
            : <button className="rgo" onClick={() => onOpenFlow("treat")} aria-label="Give thanks">→</button>}
        </div>

        <div className="rrow">
          <div className="rglyph g-text">✜</div>
          <div className="rbody">
            <div className="rname">Text <span className="rsm">— sit with the Word</span></div>
            <div className="rsub">
              {doneText
                ? `Kept today — ${textEntries[0]?.book || ""}`
                : textEntries[0]?.book ? `Last: ${textEntries[0].book}${textEntries[0].passage ? " " + textEntries[0].passage : ""}` : "Open the Word"}
            </div>
          </div>
          {doneText
            ? <button className="rcheck on" onClick={() => onOpenFlow("text")} aria-label="Read again">✓</button>
            : <button className="rgo" onClick={() => onOpenFlow("text")} aria-label="Sit with the Word">→</button>}
        </div>

        <div className="rrow">
          <div className="rglyph g-task">✦</div>
          <div className="rbody">
            <div className="rname">Task <span className="rsm">— one obedience</span></div>
            <div className="rsub">{doneTask ? `Committed: ${firstSentence(taskEntries[0]?.task || "")}` : "Not named yet"}</div>
          </div>
          {doneTask
            ? <button className="rcheck on" onClick={() => onOpenFlow("task")} aria-label="Commit another">✓</button>
            : <button className="rgo" onClick={() => onOpenFlow("task")} aria-label="Name the task">→</button>}
        </div>

        {customGoals.map(g => (
          <div className="rrow" key={g.id}>
            <div className="rglyph g-goal">{g.icon || "🎯"}</div>
            <div className="rbody">
              <div className="rname">{g.name}</div>
              <div className="rsub">
                {goalStreak(g) > 0 ? <span className="streak">{goalStreak(g)}-day streak</span> : goalDone(g) ? "Done today" : "Not done yet"}
              </div>
            </div>
            {editing
              ? <button className="rdel" onClick={() => onDelGoal(g.id)} aria-label={`Delete ${g.name}`}>✕</button>
              : <button className={`rcheck${goalDone(g) ? " on" : ""}`} onClick={() => onToggleGoal(g)} aria-label={goalDone(g) ? "Unmark" : "Mark done"}>✓</button>}
          </div>
        ))}

        {adding ? (
          <div className="mood-note" style={{ marginTop: 10 }}>
            <input
              type="text" value={newGoal} autoFocus
              onChange={e => setNewGoal(e.target.value)}
              placeholder="e.g. Morning walk, memorise a verse…"
              onKeyDown={e => {
                if (e.key === "Enter") addGoal();
                if (e.key === "Escape") { setAdding(false); setNewGoal(""); }
              }}
            />
            <button className="go" onClick={addGoal}>Add</button>
            <button className="nah" onClick={() => { setAdding(false); setNewGoal(""); }}>✕</button>
          </div>
        ) : (
          <button className="addline" onClick={() => setAdding(true)}>
            <span>＋</span><span>Add a daily habit…</span>
          </button>
        )}
      </div>

      {/* ── Grace resurfaced ── */}
      {grace && (
        <div className="gracecard">
          <div className="g-t">{grace.at.slice(0, 10) === today ? "Today's grace" : "Recent grace"}</div>
          <div className="g-x">&ldquo;{firstSentence(grace.text)}&rdquo;</div>
          <div className="g-src">from your {grace.src}</div>
        </div>
      )}

      {/* ── Day review ── */}
      <div className="pcard">
        <div className="pc-hd">
          <span className="pc-t">✦ How&apos;s today going?</span>
        </div>
        {todayMoods.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {todayMoods.slice().reverse().map(m => (
              <span className="jchip" key={m.id}>{m.energy} {ENERGY_WORDS[m.energy]}{m.note ? ` · ${m.note}` : ""}</span>
            ))}
          </div>
        )}
        {reviewBusy && <div className="ai-loading">Synthesising your day…</div>}
        {review && !reviewBusy && <div style={{ fontSize: "0.86rem", lineHeight: 1.65 }}>{review}</div>}
        {!review && !reviewBusy && todayMoods.length === 0 && (
          <div style={{ fontSize: "0.76rem", color: "var(--mute)" }}>
            Log your mood through the day, then ask for a pastoral read of it here.
          </div>
        )}
        <button className="reviewbtn" onClick={getDayReview} disabled={reviewBusy}>
          {reviewBusy ? "Reading…" : review ? "Read it again" : "Get a day summary"}
        </button>
      </div>
    </div>
  );
}
