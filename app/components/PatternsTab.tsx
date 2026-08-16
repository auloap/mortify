"use client";

import { useState } from "react";
import { tgFetch } from "@/lib/telegramFetch";
import { haptic } from "./telegram";
import {
  SINS, todayISO, fmt, showToast, getAnalytics,
  TextEntry, TestEntry, TriumphData, TriumphGoal, ResistLog, TriumphWin,
} from "./shared";

function winStats(resistLogs: ResistLog[], goalId: number) {
  const logs = resistLogs.filter(l => l.goalId === goalId && l.outcome !== "skip");
  const wins = logs.filter(l => l.outcome === "won").length;
  const pct = logs.length ? Math.round((wins / logs.length) * 100) : 0;
  return { wins, total: logs.length, pct };
}

export default function PatternsTab({ textEntries, testEntries, triumph, onTriumphChange, onFell }: {
  textEntries: TextEntry[];
  testEntries: TestEntry[];
  triumph: TriumphData;
  onTriumphChange: (d: TriumphData) => void;
  onFell: (sin: string, goalName: string) => void;
}) {
  const a = getAnalytics(textEntries, testEntries, 30);
  const today = todayISO();
  const [editing, setEditing] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [linkedSin, setLinkedSin] = useState("");
  const [addingWin, setAddingWin] = useState(false);
  const [winText, setWinText] = useState("");
  const [saving, setSaving] = useState(false);

  const resistGoals = triumph.goals.filter(g => g.type === "resist");

  async function logResist(goal: TriumphGoal, outcome: "won" | "skip" | "fell") {
    if (outcome === "fell") {
      await tgFetch("/api/triumph/resist-log", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id, outcome }),
      });
      onFell(goal.linkedSin || "Other", goal.name);
      return;
    }
    const res = await tgFetch("/api/triumph/resist-log", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: goal.id, outcome }),
    });
    const log: ResistLog = await res.json();
    onTriumphChange({ ...triumph, resistLogs: [...triumph.resistLogs, log] });
    if (outcome === "won") haptic("success");
    showToast(outcome === "won" ? "Victory logged 🏆" : "Skipped", outcome === "won" ? "grace" : "ink");
  }

  async function addGoal() {
    const name = goalName.trim();
    if (!name || saving) return;
    setSaving(true);
    const res = await tgFetch("/api/triumph/goals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "resist", icon: "🛡", linkedSin }),
    });
    const goal: TriumphGoal = await res.json();
    onTriumphChange({ ...triumph, goals: [...triumph.goals, goal] });
    setGoalName(""); setLinkedSin(""); setAddingGoal(false);
    showToast("Resist goal added", "grace");
    setSaving(false);
  }

  async function delGoal(id: number) {
    await tgFetch(`/api/triumph/goals/${id}`, { method: "DELETE" });
    onTriumphChange({
      ...triumph,
      goals: triumph.goals.filter(g => g.id !== id),
      resistLogs: triumph.resistLogs.filter(l => l.goalId !== id),
    });
  }

  async function addWin() {
    const text = winText.trim();
    if (!text || saving) return;
    setSaving(true);
    const res = await tgFetch("/api/triumph/wins", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const win: TriumphWin = await res.json();
    onTriumphChange({ ...triumph, wins: [win, ...triumph.wins] });
    setWinText(""); setAddingWin(false);
    haptic("success");
    showToast("Win recorded ✦", "grace");
    setSaving(false);
  }

  async function delWin(id: number) {
    await tgFetch(`/api/triumph/wins/${id}`, { method: "DELETE" });
    onTriumphChange({ ...triumph, wins: triumph.wins.filter(w => w.id !== id) });
  }

  function shareStronghold() {
    const d = a.strongholdDetail;
    if (!d) return;
    const lines = [
      `I need to bring something into the light.`,
      `"${d.sin}" has beaten me ${d.lost} of ${d.total} times this month.`,
      d.companion ? `It usually finds me with: ${d.companion}.` : "",
      `Would you check in on me about it?`,
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join("\n")).then(
      () => showToast("Copied — send it to someone you trust", "grace"),
      () => showToast("Could not copy", "warfare"),
    );
  }

  const hasTests = a.totalTests > 0;

  return (
    <div>
      <div className="pg-eyebrow">Patterns</div>
      <div className="pg-title">Last 30 days</div>
      <div className="pg-sub">What the log is trying to tell you.</div>

      {/* ── Stronghold ── */}
      {a.strongholdDetail && (
        <div className="shcard">
          <div className="sh-lbl">Stronghold</div>
          <div className="sh-big">{a.strongholdDetail.sin} — lost {a.strongholdDetail.lost} of {a.strongholdDetail.total}</div>
          <div className="sh-x">
            {a.strongholdDetail.companion
              ? <><b>{a.strongholdDetail.companion}</b> shows up in {a.strongholdDetail.companionCount} of the losses. This one wants company in the dark — bring it into the light.</>
              : <>Falling this often is a pattern, not a coincidence. Bring it to a pastor or a friend who prays.</>}
          </div>
          <button className="shbtn" onClick={shareStronghold}>Share with someone you trust →</button>
        </div>
      )}
      {a.strongholds.slice(1).map(s => (
        <div className="shcard" key={s} style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div className="sh-x"><b>{s}</b> — lost {a.lostCounts[s]} times this month. Also a stronghold.</div>
        </div>
      ))}

      {/* ── Stats ── */}
      <div className="statrow">
        <div className="stat"><div className={`sn ${a.winRate !== null && a.winRate >= 50 ? "g" : "r"}`}>{a.winRate !== null ? `${a.winRate}%` : "—"}</div><div className="sl">win rate</div></div>
        <div className="stat"><div className="sn">{a.totalTests}</div><div className="sl">encounters</div></div>
        <div className="stat"><div className="sn gd">{a.streak}</div><div className="sl">day streak</div></div>
      </div>

      {/* ── Wins vs losses ── */}
      <div className="pcard">
        <div className="pc-hd"><span className="pc-t">Wins &amp; losses by temptation</span></div>
        {!hasTests ? (
          <div className="empty" style={{ padding: "14px 0" }}>
            <div className="e-serif">Nothing logged this month.</div>
            <p>Every encounter you log — win or loss — sharpens this picture.</p>
          </div>
        ) : (
          <>
            {a.topSins.map(([s, c]) => {
              const wins = a.sinWins[s] || 0;
              const losses = c - wins;
              return (
                <div className="brow" key={s}>
                  <span className="bl">{s}</span>
                  <div className="btrack" style={{ width: `${Math.max((c / a.maxSin) * 100, 12)}%` }}>
                    {wins > 0 && <span className="w" style={{ width: `${(wins / c) * 100}%` }} />}
                    {losses > 0 && <span className="l" style={{ width: `${(losses / c) * 100}%` }} />}
                  </div>
                  <span className="bc">{wins}W/{losses}L</span>
                </div>
              );
            })}
            <div className="legend">
              <span><i style={{ background: "var(--green)" }} /> stood</span>
              <span><i style={{ background: "var(--rust)", opacity: .42 }} /> fell</span>
            </div>
          </>
        )}
      </div>

      {/* ── Trigger insight ── */}
      {a.insight && (
        <div className="insight">
          <div className="in-t">Trigger insight</div>
          <div className="in-x">
            <b>{a.insight.emotion}</b> appears in {a.insight.lossPct}% of losses
            {a.insight.winPct > 0 ? <> but only {a.insight.winPct}% of wins.</> : <> and almost none of the wins.</>}{" "}
            Watch for it — it&apos;s the doorway, not the door.
          </div>
        </div>
      )}

      {/* ── Resist goals ── */}
      <div className="pcard">
        <div className="pc-hd">
          <span className="pc-t">🛡 Standing against</span>
          {resistGoals.length > 0 && (
            <button className={`pc-edit${editing ? " on" : ""}`} onClick={() => setEditing(v => !v)}>
              {editing ? "done" : "edit"}
            </button>
          )}
        </div>
        {resistGoals.length === 0 && !addingGoal && (
          <div style={{ fontSize: "0.78rem", color: "var(--mute)", padding: "4px 0 8px" }}>
            Name the thing you&apos;re resisting, and log each encounter here.
          </div>
        )}
        {resistGoals.map(goal => {
          const { wins, total, pct } = winStats(triumph.resistLogs, goal.id);
          const todayLogs = triumph.resistLogs.filter(l => l.goalId === goal.id && l.date === today);
          const todayOutcome = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1].outcome : null;
          return (
            <div className="resist" key={goal.id}>
              <div className="resist-hd">
                <span className="resist-name">{goal.name}</span>
                {editing
                  ? <button className="rdel" onClick={() => delGoal(goal.id)} aria-label={`Delete ${goal.name}`}>✕</button>
                  : <span className="resist-pct">{total > 0 ? `${pct}%` : "—"}</span>}
              </div>
              <div className="resist-sub">{total > 0 ? `${wins} of ${total} encounters stood` : "No encounters logged yet"}</div>
              <div className="resist-track"><i style={{ width: `${pct}%` }} /></div>
              {!editing && (
                <div className="resist-actions">
                  <button className={`rbtn won${todayOutcome === "won" ? " sel" : ""}`} onClick={() => logResist(goal, "won")}>🏆 Stood</button>
                  <button className={`rbtn skip${todayOutcome === "skip" ? " sel" : ""}`} onClick={() => logResist(goal, "skip")}>· No test today</button>
                  <button className="rbtn fell" onClick={() => logResist(goal, "fell")}>⚔ Fell →</button>
                </div>
              )}
            </div>
          );
        })}
        {addingGoal ? (
          <div style={{ marginTop: 10 }}>
            <div className="form-row">
              <label>What are you resisting?</label>
              <input
                type="text" value={goalName} autoFocus
                onChange={e => setGoalName(e.target.value)}
                placeholder="e.g. Late-night scrolling, overeating…"
                onKeyDown={e => e.key === "Enter" && addGoal()}
              />
            </div>
            <div className="form-row">
              <label>Linked sin <span className="hint">optional — pre-fills the log when you fall</span></label>
              <div className="chiprow">
                {SINS.filter(s => s !== "Other").map(s => (
                  <button key={s} className={`chip${linkedSin === s ? " on" : ""}`} onClick={() => setLinkedSin(linkedSin === s ? "" : s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="mood-note" style={{ marginTop: 4 }}>
              <button className="go" style={{ padding: "10px 15px" }} onClick={addGoal} disabled={saving}>{saving ? "Saving…" : "Add"}</button>
              <button className="nah" onClick={() => { setAddingGoal(false); setGoalName(""); setLinkedSin(""); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="addline" onClick={() => setAddingGoal(true)}>
            <span>＋</span><span>Add something to resist…</span>
          </button>
        )}
      </div>

      {/* ── One-off wins ── */}
      <div className="pcard">
        <div className="pc-hd"><span className="pc-t">✦ Wins worth remembering</span></div>
        {triumph.wins.length === 0 && !addingWin && (
          <div style={{ fontSize: "0.78rem", color: "var(--mute)", padding: "4px 0 8px" }}>
            One-off victories — record them, they&apos;re evidence of grace.
          </div>
        )}
        {triumph.wins.map(win => (
          <div className="winitem" key={win.id}>
            <span className="wg">✦</span>
            <div style={{ flex: 1 }}>
              <div className="wx">{win.text}</div>
              <div className="wd">{fmt(win.createdAt)}</div>
            </div>
            <button className="jdel" onClick={() => delWin(win.id)} aria-label="Delete win">✕</button>
          </div>
        ))}
        {addingWin ? (
          <div style={{ marginTop: 10 }}>
            <textarea
              value={winText} autoFocus rows={2} style={{ minHeight: 64 }}
              onChange={e => setWinText(e.target.value)}
              placeholder="Walked 2km. Said no. Called the friend I'd been avoiding."
            />
            <div className="mood-note" style={{ marginTop: 8 }}>
              <button className="go" style={{ padding: "10px 15px" }} onClick={addWin} disabled={saving}>{saving ? "Saving…" : "Record win"}</button>
              <button className="nah" onClick={() => { setAddingWin(false); setWinText(""); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="addline" onClick={() => setAddingWin(true)}>
            <span>＋</span><span>Record a win…</span>
          </button>
        )}
      </div>

      {/* ── Books ── */}
      <div className="pcard">
        <div className="pc-hd"><span className="pc-t">Books you&apos;ve sat with</span></div>
        {a.topBooks.length === 0 ? (
          <div style={{ fontSize: "0.78rem", color: "var(--mute)", padding: "4px 0 8px" }}>No Text entries yet.</div>
        ) : a.topBooks.map(([b, c]) => (
          <div className="brow" key={b}>
            <span className="bl">{b}</span>
            <div className="btrack"><span className="n" style={{ width: `${(c / a.maxBook) * 100}%` }} /></div>
            <span className="bc">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
