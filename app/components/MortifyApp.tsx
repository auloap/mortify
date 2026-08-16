"use client";

import { useState, useEffect, useCallback } from "react";
import { tgFetch } from "@/lib/telegramFetch";
import { getTG, applyThemeChrome, haptic } from "./telegram";
import {
  ENERGY_WORDS, todayISO, showToast, getAnalytics,
  TreatEntry, TextEntry, TaskEntry, TestEntry, MoodEntry, TriumphData, TriumphGoal,
} from "./shared";
import TodayTab from "./TodayTab";
import PatternsTab from "./PatternsTab";
import JournalTab from "./JournalTab";
import { TreatFlow, TextFlow, TaskFlow } from "./DailyFlows";
import TemptedFlow, { TemptedPrefill } from "./TemptedFlow";

type Place = "today" | "patterns" | "journal";
type Flow = null | "treat" | "text" | "task" | "tempted";

const EMPTY_TRIUMPH: TriumphData = { goals: [], doLogs: [], resistLogs: [], wins: [], autoDates: { text: [], treat: [], task: [] } };

export default function MortifyApp() {
  const [place, setPlace] = useState<Place>("today");
  const [flow, setFlow] = useState<Flow>(null);
  const [temptedPrefill, setTemptedPrefill] = useState<TemptedPrefill>(null);

  const [treatEntries, setTreatEntries] = useState<TreatEntry[]>([]);
  const [textEntries,  setTextEntries]  = useState<TextEntry[]>([]);
  const [taskEntries,  setTaskEntries]  = useState<TaskEntry[]>([]);
  const [testEntries,  setTestEntries]  = useState<TestEntry[]>([]);
  const [moodEntries,  setMoodEntries]  = useState<MoodEntry[]>([]);
  const [triumph,      setTriumph]      = useState<TriumphData>(EMPTY_TRIUMPH);

  const load = useCallback(async () => {
    // A failed request returns an error object, not a list — coercing it into
    // state would blow up the render on .map() and take the whole app down.
    async function fetchList<T>(url: string): Promise<T[]> {
      try {
        const res = await tgFetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    }

    const [treat, text, task, test, mood] = await Promise.all([
      fetchList<TreatEntry>("/api/treat"),
      fetchList<TextEntry>("/api/qt"),
      fetchList<TaskEntry>("/api/task"),
      fetchList<TestEntry>("/api/sin"),
      fetchList<MoodEntry>("/api/mood"),
    ]);

    let tri: TriumphData = EMPTY_TRIUMPH;
    try {
      const res = await tgFetch("/api/triumph");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.goals)) tri = data;
      }
    } catch {}

    setTreatEntries(treat);
    setTextEntries(text);
    setTaskEntries(task);
    setTestEntries(test);
    setMoodEntries(mood);
    setTriumph(tri);
  }, []);

  // Initial data fetch on mount; every setState inside happens after an await.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tg = getTG();
    if (!tg) return;
    tg.ready();
    tg.expand();
    applyThemeChrome();
    const onTheme = () => applyThemeChrome();
    tg.onEvent?.("themeChanged", onTheme);
    return () => tg.offEvent?.("themeChanged", onTheme);
  }, []);

  const { streak, winRate } = getAnalytics(textEntries, testEntries, 30);

  async function logMood(energy: number, note: string) {
    try {
      const res = await tgFetch("/api/mood", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ energy, note }),
      });
      const entry: MoodEntry = await res.json();
      setMoodEntries(p => [entry, ...p]);
      haptic("tap");
      showToast(`Mood logged — ${ENERGY_WORDS[energy]}`, "grace");
    } catch {
      showToast("Could not save mood", "warfare");
    }
  }

  async function toggleGoal(goal: TriumphGoal) {
    const today = todayISO();
    const res = await tgFetch("/api/triumph/do-log", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: goal.id }),
    });
    const json = await res.json();
    setTriumph(t => ({
      ...t,
      doLogs: json.toggled
        ? [...t.doLogs, json.log]
        : t.doLogs.filter(l => !(l.goalId === goal.id && l.date === today)),
    }));
    if (json.toggled) haptic("success");
    showToast(json.toggled ? "Kept — well done" : "Unmarked", json.toggled ? "grace" : "ink");
  }

  async function addGoal(name: string) {
    const res = await tgFetch("/api/triumph/goals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "do", icon: "🎯", linkedSin: "" }),
    });
    const goal: TriumphGoal = await res.json();
    setTriumph(t => ({ ...t, goals: [...t.goals, goal] }));
    showToast("Habit added", "grace");
  }

  async function delGoal(id: number) {
    await tgFetch(`/api/triumph/goals/${id}`, { method: "DELETE" });
    setTriumph(t => ({
      ...t,
      goals: t.goals.filter(g => g.id !== id),
      doLogs: t.doLogs.filter(l => l.goalId !== id),
    }));
  }

  function handleFell(sin: string, goalName: string) {
    setTemptedPrefill({ sin, fromGoal: goalName });
    setFlow("tempted");
  }

  function deleteEntry(kind: "treat" | "text" | "task" | "test", id: number) {
    const endpoint = kind === "text" ? "/api/qt" : kind === "test" ? "/api/sin" : `/api/${kind}`;
    tgFetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (kind === "treat") setTreatEntries(p => p.filter(e => e.id !== id));
    if (kind === "text")  setTextEntries(p => p.filter(e => e.id !== id));
    if (kind === "task")  setTaskEntries(p => p.filter(e => e.id !== id));
    if (kind === "test")  setTestEntries(p => p.filter(e => e.id !== id));
  }

  function closeFlow() {
    setFlow(null);
    setTemptedPrefill(null);
  }

  return (
    <div id="app">
      <div className="main">
        {place === "today" && (
          <TodayTab
            treatEntries={treatEntries} textEntries={textEntries}
            taskEntries={taskEntries} testEntries={testEntries}
            moodEntries={moodEntries} triumph={triumph}
            streak={streak} winRate={winRate}
            onOpenFlow={k => setFlow(k)}
            onLogMood={logMood}
            onToggleGoal={toggleGoal}
            onAddGoal={addGoal}
            onDelGoal={delGoal}
          />
        )}
        {place === "patterns" && (
          <PatternsTab
            textEntries={textEntries} testEntries={testEntries}
            triumph={triumph} onTriumphChange={setTriumph}
            onFell={handleFell}
          />
        )}
        {place === "journal" && (
          <JournalTab
            treatEntries={treatEntries} textEntries={textEntries}
            taskEntries={taskEntries} testEntries={testEntries}
            onDelete={deleteEntry}
          />
        )}
      </div>

      <nav className="pnav">
        <div className="pnav-inner">
          <button className={`ni${place === "today" ? " on" : ""}`} onClick={() => setPlace("today")}>
            <span className="ic">✦</span><span className="lb">Today</span>
          </button>
          <button className={`ni${place === "patterns" ? " on" : ""}`} onClick={() => setPlace("patterns")}>
            <span className="ic">◐</span><span className="lb">Patterns</span>
          </button>
          <button className="act" onClick={() => { setTemptedPrefill(null); setFlow("tempted"); }}>
            <span className="dia"><span>⚔</span></span><span className="lb">Tempted?</span>
          </button>
          <button className={`ni${place === "journal" ? " on" : ""}`} onClick={() => setPlace("journal")}>
            <span className="ic">❧</span><span className="lb">Journal</span>
          </button>
        </div>
      </nav>

      {flow === "treat" && <TreatFlow onSaved={e => setTreatEntries(p => [e, ...p])} onClose={closeFlow} />}
      {flow === "text"  && <TextFlow  onSaved={e => setTextEntries(p => [e, ...p])}  onClose={closeFlow} />}
      {flow === "task"  && <TaskFlow  onSaved={e => setTaskEntries(p => [e, ...p])}  onClose={closeFlow} />}
      {flow === "tempted" && (
        <TemptedFlow
          prefill={temptedPrefill}
          onSaved={e => setTestEntries(p => [e, ...p])}
          onClose={closeFlow}
        />
      )}
    </div>
  );
}
