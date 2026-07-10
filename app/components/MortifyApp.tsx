"use client";

import { useState, useEffect, useCallback, CSSProperties } from "react";

// ── Constants ──────────────────────────────────────────────────────────────

const EMOTION_GROUPS = [
  { family: "Fear & Anxiety",      color: "#7b5ea7", emotions: ["Anxiety","Dread","Panic","Worry","Hypervigilance","Nervousness","Apprehension"] },
  { family: "Anger & Frustration", color: "#b94040", emotions: ["Anger","Irritability","Resentment","Bitterness","Contempt","Rage","Indignation"] },
  { family: "Sadness & Loss",      color: "#4a6fa5", emotions: ["Grief","Sadness","Despair","Disappointment","Helplessness","Emptiness","Sorrow"] },
  { family: "Shame & Guilt",       color: "#8b5e3c", emotions: ["Shame","Guilt","Embarrassment","Humiliation","Regret","Self-disgust","Unworthiness"] },
  { family: "Pride & Ego",         color: "#c9a84c", emotions: ["Pride","Arrogance","Entitlement","Superiority","Defensiveness","Vanity","Self-sufficiency"] },
  { family: "Desire & Craving",    color: "#c0392b", emotions: ["Lust","Craving","Restlessness","Yearning","Addiction-pull","Boredom","Dissatisfaction"] },
  { family: "Relational Pain",     color: "#2d6a4f", emotions: ["Loneliness","Rejection","Jealousy","Envy","Betrayal","Abandonment","Invisibility"] },
  { family: "Insecurity & Fear",   color: "#5b6b7c", emotions: ["Insecurity","Inadequacy","Fear of failure","Fear of man","Comparison","Imposter feeling","Unwanted"] },
];

const SINS = ["Pride","Lust","Anger","Envy","Sloth","Gluttony","Greed","Bitterness","Deceit","Fear/Unbelief","Control","Self-pity","Other"];
const BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
const STRONGHOLD = 4;

// ── Pulse chip system ──────────────────────────────────────────────────────

const DEFAULT_FEELINGS = ["Anxious","Lonely","Angry","Tired","Tempted","Restless","Sad","Frustrated","Bored","Numb"];
const DEFAULT_CONTEXTS = ["Alone","Late night","Work stress","Spouse tension","After a fight","Scrolling phone","Post-sleep","Travelling","After a win","Bored at home"];
const ENERGY_WORDS = ["","Drained","Low","Okay","Good","Sharp"];
const PULSE_KEY = "wttt_pulse_cfg";
const PRUNE_AFTER = 10; // start removing unused defaults after this many submissions

type ChipItem   = { label: string; count: number; isDefault: boolean; isPending: boolean };
type PulseConfig = { feelings: ChipItem[]; contexts: ChipItem[]; total: number };

function defaultPulseConfig(): PulseConfig {
  return {
    feelings: DEFAULT_FEELINGS.map(label => ({ label, count: 0, isDefault: true, isPending: false })),
    contexts: DEFAULT_CONTEXTS.map(label => ({ label, count: 0, isDefault: true, isPending: false })),
    total: 0,
  };
}
function loadPulseConfig(): PulseConfig {
  if (typeof window === "undefined") return defaultPulseConfig();
  try { const s = localStorage.getItem(PULSE_KEY); return s ? JSON.parse(s) : defaultPulseConfig(); }
  catch { return defaultPulseConfig(); }
}
function savePulseConfig(cfg: PulseConfig) {
  try { localStorage.setItem(PULSE_KEY, JSON.stringify(cfg)); } catch {}
}
function commitPulse(cfg: PulseConfig, selF: string[], selC: string[]): PulseConfig {
  const total = cfg.total + 1;
  function upd(chips: ChipItem[], sel: string[]): ChipItem[] {
    return chips
      .map(c => {
        if (!sel.includes(c.label)) return c;
        const count = c.count + 1;
        return { ...c, count, isPending: count >= 2 ? false : c.isPending };
      })
      .filter(c => total < PRUNE_AFTER || !c.isDefault || c.count > 0);
  }
  return { feelings: upd(cfg.feelings, selF), contexts: upd(cfg.contexts, selC), total };
}
function addCustomChip(cfg: PulseConfig, field: "feelings" | "contexts", raw: string): PulseConfig {
  const label = raw.trim();
  if (!label || cfg[field].some(c => c.label.toLowerCase() === label.toLowerCase())) return cfg;
  return { ...cfg, [field]: [...cfg[field], { label, count: 0, isDefault: false, isPending: true }] };
}

const TAB_COLORS: Record<string, { color: string; light: string; border: string }> = {
  treat: { color: "#d4890a", light: "#fef7e8", border: "#f5d9a0" },
  text:  { color: "#1a7a50", light: "#e8f5ee", border: "#a8d9bf" },
  task:  { color: "#2d4f8a", light: "#e8edf8", border: "#a8bad9" },
  test:  { color: "#9b2c1a", light: "#fbeae8", border: "#f0b8b0" },
};

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = "treat" | "text" | "task" | "test" | "more";
type HistoryView = "treat" | "text" | "task" | "test";

interface TreatEntry   { id: number; date: string; gratitude: string; aiReflection: string; }
interface TextEntry    { id: number; date: string; book: string; passage: string; aboutGod: string; aboutSelf: string; apply: string; prayer: string; aiReflection: string; }
interface TaskEntry    { id: number; date: string; task: string; obstacle: string; aiReflection: string; }
interface TestEntry    { id: number; date: string; sin: string; emotions: string[]; situation: string; counterfeit: string; postMortem: string; journal: string; aiReflection: string; aiPivot: string; pulseEnergy?: number; pulseFeelings?: string[]; pulseContexts?: string[]; }

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}
function todayLabel() {
  return new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });
}
function firstSentence(s: string) {
  if (!s) return "";
  const i = s.indexOf(".");
  return i >= 0 ? s.slice(0, i + 1) : s;
}
function tabVars(tab: string): CSSProperties {
  const t = TAB_COLORS[tab] || TAB_COLORS.treat;
  return { "--tab-color": t.color, "--tab-light": t.light, "--tab-border": t.border } as CSSProperties;
}

function showToast(msg: string, color = "#1a7a50") {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  el.style.background = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ── Analytics ──────────────────────────────────────────────────────────────

function getAnalytics(textEntries: TextEntry[], testEntries: TestEntry[]) {
  const sinCounts: Record<string, number> = {};
  const emoCounts: Record<string, number> = {};
  const bookCounts: Record<string, number> = {};
  testEntries.forEach(e => {
    sinCounts[e.sin] = (sinCounts[e.sin] || 0) + 1;
    (e.emotions || []).forEach(em => { emoCounts[em] = (emoCounts[em] || 0) + 1; });
  });
  textEntries.forEach(e => { bookCounts[e.book] = (bookCounts[e.book] || 0) + 1; });
  const strongholds = Object.entries(sinCounts).filter(([, c]) => c >= STRONGHOLD).map(([s]) => s);
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
  return { sinCounts, strongholds, topSins, topEmo, topBooks, maxSin, maxEmo, maxBook, streak };
}

// ── EmoPicker ──────────────────────────────────────────────────────────────

function EmoPicker({ selected, openGroups, onToggle, onToggleGroup, onClear }: {
  selected: string[];
  openGroups: Record<string, boolean>;
  onToggle: (em: string) => void;
  onToggleGroup: (f: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="form-row">
      <label>Emotional state at the time</label>
      <div className="emo-groups">
        {EMOTION_GROUPS.map(g => {
          const selCount = g.emotions.filter(e => selected.includes(e)).length;
          const isOpen = openGroups[g.family];
          return (
            <div className="emo-group" key={g.family}>
              <div className="emo-group-hdr" onClick={() => onToggleGroup(g.family)}>
                <div className="emo-group-left">
                  <div className="emo-dot" style={{ background: g.color }} />
                  <span className="emo-family">{g.family}</span>
                  {selCount > 0 && <span className="emo-sel-count">{selCount} selected</span>}
                </div>
                <span className={`emo-arrow${isOpen ? " open" : ""}`}>▶</span>
              </div>
              {isOpen && (
                <div className="emo-chips">
                  {g.emotions.map(em => {
                    const on = selected.includes(em);
                    return (
                      <button key={em} className={`emo-chip${on ? " on" : ""}`}
                        style={on ? { background: g.color } : undefined}
                        onClick={() => onToggle(em)}>{em}</button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="emo-summary">
          {selected.map(em => {
            const color = EMOTION_GROUPS.find(g => g.emotions.includes(em))?.color || "#888";
            return <button key={em} className="emo-pill" style={{ background: color }} onClick={() => onToggle(em)}>{em} ✕</button>;
          })}
          <button className="emo-clear" onClick={onClear}>clear all</button>
        </div>
      )}
    </div>
  );
}

// ── PulsePicker ────────────────────────────────────────────────────────────

function PulsePicker({ energy, setEnergy, feelings, setFeelings, contexts, setContexts, cfg, setCfg }: {
  energy: number | null; setEnergy: (n: number) => void;
  feelings: string[]; setFeelings: (f: string[]) => void;
  contexts: string[]; setContexts: (c: string[]) => void;
  cfg: PulseConfig; setCfg: (c: PulseConfig) => void;
}) {
  const [showOtherF, setShowOtherF] = useState(false);
  const [showOtherC, setShowOtherC] = useState(false);
  const [otherF, setOtherF] = useState("");
  const [otherC, setOtherC] = useState("");

  function toggle(arr: string[], set: (a: string[]) => void, label: string) {
    set(arr.includes(label) ? arr.filter(x => x !== label) : [...arr, label]);
  }

  function commitOther(
    field: "feelings" | "contexts", raw: string,
    arr: string[], set: (a: string[]) => void,
    setInput: (s: string) => void, setShow: (b: boolean) => void
  ) {
    const t = raw.trim();
    if (!t) { setShow(false); return; }
    const newCfg = addCustomChip(cfg, field, t);
    setCfg(newCfg); savePulseConfig(newCfg);
    if (!arr.includes(t)) set([...arr, t]);
    setInput(""); setShow(false);
  }

  function chipCls(chip: ChipItem, sel: string[]) {
    const on = sel.includes(chip.label);
    if (chip.isPending) return `pulse-chip pending${on ? " sel" : ""}`;
    if (!chip.isDefault) return `pulse-chip graduated${on ? " sel" : ""}`;
    return `pulse-chip${on ? " sel" : ""}`;
  }

  return (
    <div className="pulse-block">
      <div className="pulse-lbl">⚡ Pulse right now</div>

      {/* Energy */}
      <div className="pulse-section">
        <div className="pulse-section-lbl">Energy</div>
        <div className="energy-row">
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`energy-btn${energy === n ? " sel" : ""}`} onClick={() => setEnergy(n)}>
              <span className="energy-num">{n}</span>
              <span className="energy-word">{ENERGY_WORDS[n]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feelings */}
      <div className="pulse-section">
        <div className="pulse-section-lbl">Feeling <span className="pulse-hint">pick all that apply</span></div>
        <div className="pulse-chips">
          {cfg.feelings.map(chip => (
            <button key={chip.label} className={chipCls(chip, feelings)} onClick={() => toggle(feelings, setFeelings, chip.label)}>
              {chip.label}{chip.isPending && <sup>¹</sup>}
            </button>
          ))}
          {showOtherF ? (
            <div className="other-input-row">
              <input className="other-input" value={otherF} autoFocus
                onChange={e => setOtherF(e.target.value)} placeholder="e.g. Shame"
                onKeyDown={e => { if (e.key === "Enter") commitOther("feelings", otherF, feelings, setFeelings, setOtherF, setShowOtherF); if (e.key === "Escape") { setShowOtherF(false); setOtherF(""); } }}
              />
              <button className="other-add" onClick={() => commitOther("feelings", otherF, feelings, setFeelings, setOtherF, setShowOtherF)}>Add</button>
              <button className="other-cancel" onClick={() => { setShowOtherF(false); setOtherF(""); }}>✕</button>
            </div>
          ) : (
            <button className="pulse-chip other-btn" onClick={() => setShowOtherF(true)}>+ Other</button>
          )}
        </div>
      </div>

      {/* Contexts */}
      <div className="pulse-section" style={{ marginBottom: 0 }}>
        <div className="pulse-section-lbl">Context <span className="pulse-hint">what&apos;s going on?</span></div>
        <div className="pulse-chips">
          {cfg.contexts.map(chip => (
            <button key={chip.label} className={chipCls(chip, contexts)} onClick={() => toggle(contexts, setContexts, chip.label)}>
              {chip.label}{chip.isPending && <sup>¹</sup>}
            </button>
          ))}
          {showOtherC ? (
            <div className="other-input-row">
              <input className="other-input" value={otherC} autoFocus
                onChange={e => setOtherC(e.target.value)} placeholder="e.g. Can&apos;t sleep"
                onKeyDown={e => { if (e.key === "Enter") commitOther("contexts", otherC, contexts, setContexts, setOtherC, setShowOtherC); if (e.key === "Escape") { setShowOtherC(false); setOtherC(""); } }}
              />
              <button className="other-add" onClick={() => commitOther("contexts", otherC, contexts, setContexts, setOtherC, setShowOtherC)}>Add</button>
              <button className="other-cancel" onClick={() => { setShowOtherC(false); setOtherC(""); }}>✕</button>
            </div>
          ) : (
            <button className="pulse-chip other-btn" onClick={() => setShowOtherC(true)}>+ Other</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Treat Tab ──────────────────────────────────────────────────────────────

function TreatTab({ onSaved }: { onSaved: (e: TreatEntry) => void }) {
  const [gratitude, setGratitude] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiText, setAiText] = useState("");

  async function submit() {
    if (!gratitude.trim() || busy) return;
    setBusy(true); setAiText("");
    try {
      const res = await fetch("/api/treat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gratitude }),
      });
      const entry: TreatEntry = await res.json();
      setAiText(entry.aiReflection);
      onSaved(entry);
      setGratitude("");
      showToast("Thanksgiving saved 🌿", TAB_COLORS.treat.color);
    } catch { setAiText("Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <div style={tabVars("treat")}>
      <p className="section-desc">Name what God has given you today — big or small. See the Giver behind the gifts.</p>
      <div className="card">
        <div className="card-lbl">Today&apos;s Gifts</div>
        <div className="prompt-box">What can you thank God for today?</div>
        <div className="form-row">
          <label>Your gratitude <span className="hint">1–3 things</span></label>
          <textarea value={gratitude} onChange={e => setGratitude(e.target.value)}
            placeholder="e.g. A good conversation. Energy to get through the day. A moment of peace." rows={4} />
        </div>
        <button className="btn" onClick={submit} disabled={!gratitude.trim() || busy}>
          {busy ? "Offering thanks…" : "Give Thanks →"}
        </button>
      </div>
      {busy && <div className="ai-card" style={tabVars("treat")}><div className="ai-lbl">✦ Doxology</div><div className="ai-loading">Seeing the Giver behind the gifts…</div></div>}
      {aiText && !busy && <div className="ai-card" style={tabVars("treat")}><div className="ai-lbl">✦ Doxology</div><div className="ai-text">{aiText}</div></div>}
    </div>
  );
}

// ── Text Tab ───────────────────────────────────────────────────────────────

function TextTab({ onSaved }: { onSaved: (e: TextEntry) => void }) {
  const [book, setBook] = useState("");
  const [passage, setPassage] = useState("");
  const [aboutGod, setAboutGod] = useState("");
  const [aboutSelf, setAboutSelf] = useState("");
  const [apply, setApply] = useState("");
  const [prayer, setPrayer] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiText, setAiText] = useState("");

  async function submit() {
    if (!book || !aboutGod || busy) return;
    setBusy(true); setAiText("");
    try {
      const res = await fetch("/api/qt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, passage, aboutGod, aboutSelf, apply, prayer }),
      });
      const entry: TextEntry = await res.json();
      setAiText(entry.aiReflection);
      onSaved(entry);
      setBook(""); setPassage(""); setAboutGod(""); setAboutSelf(""); setApply(""); setPrayer("");
      showToast("QT saved 📖", TAB_COLORS.text.color);
    } catch { setAiText("Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <div style={tabVars("text")}>
      <p className="section-desc">Open the Word. See God. See yourself. Carry one truth into today.</p>
      <div className="card">
        <div className="card-lbl">Today&apos;s Passage</div>
        <div className="form-2col">
          <div>
            <label>Book</label>
            <select value={book} onChange={e => setBook(e.target.value)}>
              <option value="">— Select —</option>
              {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label>Chapter &amp; Verses <span className="hint">e.g. 3:1-16</span></label>
            <input type="text" value={passage} onChange={e => setPassage(e.target.value)} placeholder="1:1-18" />
          </div>
        </div>
        <div className="card-lbl" style={{ marginTop: 4 }}>Reflection</div>
        <div className="form-row">
          <div className="prompt-box">What does this passage reveal about who God is?</div>
          <textarea value={aboutGod} onChange={e => setAboutGod(e.target.value)} placeholder="Write freely. What struck you about God here?" />
        </div>
        <div className="form-row">
          <div className="prompt-box">What does it reveal about you?</div>
          <textarea value={aboutSelf} onChange={e => setAboutSelf(e.target.value)} placeholder="What convicts, comforts, or challenges you?" />
        </div>
        <div className="form-row">
          <div className="prompt-box">What one truth do you want to carry into today?</div>
          <textarea value={apply} onChange={e => setApply(e.target.value)} placeholder="How does this change how you see or act today?" />
        </div>
        <div className="form-row">
          <div className="prompt-box">What do you want to say back to God right now?</div>
          <textarea value={prayer} onChange={e => setPrayer(e.target.value)} placeholder="Praise, confession, request — or simply sit with Him…" style={{ minHeight: 56 }} />
        </div>
        <button className="btn" onClick={submit} disabled={!book || !aboutGod || busy}>
          {busy ? "Reflecting with you…" : "Receive Reflection →"}
        </button>
      </div>
      {busy && <div className="ai-card" style={tabVars("text")}><div className="ai-lbl">✦ Pastoral Response</div><div className="ai-loading">Sitting with what you&apos;ve seen…</div></div>}
      {aiText && !busy && <div className="ai-card" style={tabVars("text")}><div className="ai-lbl">✦ Pastoral Response</div><div className="ai-text">{aiText}</div></div>}
    </div>
  );
}

// ── Task Tab ───────────────────────────────────────────────────────────────

function TaskTab({ onSaved }: { onSaved: (e: TaskEntry) => void }) {
  const [task, setTask] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiText, setAiText] = useState("");

  async function submit() {
    if (!task.trim() || busy) return;
    setBusy(true); setAiText("");
    try {
      const res = await fetch("/api/task", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, obstacle }),
      });
      const entry: TaskEntry = await res.json();
      setAiText(entry.aiReflection);
      onSaved(entry);
      setTask(""); setObstacle("");
      showToast("Task committed ✦", TAB_COLORS.task.color);
    } catch { setAiText("Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <div style={tabVars("task")}>
      <p className="section-desc">Based on what God is saying — what is the one thing to do today? Name it. Commit to it.</p>
      <div className="card">
        <div className="card-lbl">Today&apos;s Obedience</div>
        <div className="form-row">
          <div className="prompt-box">What is the one thing God is asking of you today?</div>
          <label>The task <span className="hint">be specific</span></label>
          <textarea value={task} onChange={e => setTask(e.target.value)}
            placeholder="e.g. Call my father. Forgive. Sit still for 10 minutes. Send the email I've been avoiding."
            rows={3} />
        </div>
        <div className="form-row">
          <label>Why does this feel hard? <span className="hint">optional</span></label>
          <textarea value={obstacle} onChange={e => setObstacle(e.target.value)}
            placeholder="What resistance, fear, or distraction is in the way?" rows={2} style={{ minHeight: 52 }} />
        </div>
        <button className="btn" onClick={submit} disabled={!task.trim() || busy}>
          {busy ? "Sending you out…" : "Commit to This →"}
        </button>
      </div>
      {busy && <div className="ai-card" style={tabVars("task")}><div className="ai-lbl">✦ Sent with You</div><div className="ai-loading">Preparing the way…</div></div>}
      {aiText && !busy && <div className="ai-card" style={tabVars("task")}><div className="ai-lbl">✦ Sent with You</div><div className="ai-text">{aiText}</div></div>}
    </div>
  );
}

// ── Test Tab ───────────────────────────────────────────────────────────────

function TestTab({ onSaved }: { onSaved: (e: TestEntry) => void }) {
  const [sin, setSin] = useState("");
  const [custom, setCustom] = useState("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [situation, setSituation] = useState("");
  const [counterfeit, setCounterfeit] = useState("");
  const [postMortem, setPostMortem] = useState("");
  const [journal, setJournal] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [aiReflection, setAiReflection] = useState("");
  const [aiPivot, setAiPivot] = useState("");

  // Pulse state
  const [pulseEnergy, setPulseEnergy] = useState<number | null>(null);
  const [pulseFeelings, setPulseFeelings] = useState<string[]>([]);
  const [pulseContexts, setPulseContexts] = useState<string[]>([]);
  const [pulseCfg, setPulseCfg] = useState<PulseConfig>(defaultPulseConfig);
  useEffect(() => { setPulseCfg(loadPulseConfig()); }, []);

  const toggleEmo = (em: string) => setEmotions(p => p.includes(em) ? p.filter(x => x !== em) : [...p, em]);
  const toggleGroup = (f: string) => setOpenGroups(p => ({ ...p, [f]: !p[f] }));

  async function submit() {
    if (!sin || busy) return;
    setBusy(true); setAiReflection(""); setAiPivot("");
    const resolvedSin = sin === "Other" ? (custom || "Other") : sin;
    try {
      const res = await fetch("/api/sin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sin: resolvedSin, emotions, situation, counterfeit, postMortem, journal, pulseEnergy, pulseFeelings, pulseContexts }),
      });
      const entry: TestEntry = await res.json();
      setAiReflection(entry.aiReflection); setAiPivot(entry.aiPivot);
      onSaved(entry);

      // Update adaptive chip config in localStorage
      const newCfg = commitPulse(pulseCfg, pulseFeelings, pulseContexts);
      setPulseCfg(newCfg); savePulseConfig(newCfg);

      setSin(""); setCustom(""); setEmotions([]); setSituation(""); setCounterfeit(""); setPostMortem(""); setJournal("");
      setPulseEnergy(null); setPulseFeelings([]); setPulseContexts([]);
      showToast("Entry saved ⚔", TAB_COLORS.test.color);
    } catch { setAiReflection("Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <div style={tabVars("test")}>
      <p className="section-desc">Where did sin get a foothold today? Examine the heart — with hope, not shame.</p>
      <div className="card">
        <div className="card-lbl">The Struggle</div>

        <PulsePicker
          energy={pulseEnergy} setEnergy={setPulseEnergy}
          feelings={pulseFeelings} setFeelings={setPulseFeelings}
          contexts={pulseContexts} setContexts={setPulseContexts}
          cfg={pulseCfg} setCfg={cfg => { setPulseCfg(cfg); savePulseConfig(cfg); }}
        />

        <div className="form-2col">
          <div>
            <label>The sin</label>
            <select value={sin} onChange={e => setSin(e.target.value)}>
              <option value="">— Select —</option>
              {SINS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {sin === "Other" ? (
            <div>
              <label>Name it specifically</label>
              <input type="text" value={custom} onChange={e => setCustom(e.target.value)} placeholder="e.g. People-pleasing" />
            </div>
          ) : <div />}
        </div>
        <EmoPicker selected={emotions} openGroups={openGroups} onToggle={toggleEmo} onToggleGroup={toggleGroup} onClear={() => setEmotions([])} />
        <div className="card-lbl" style={{ marginTop: 4 }}>Anatomy of the Sin</div>
        <div className="form-2col">
          <div><label>Situation / trigger</label>
            <textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="What was happening? Who was there?" /></div>
          <div><label>What it promised (counterfeit)</label>
            <textarea value={counterfeit} onChange={e => setCounterfeit(e.target.value)} placeholder="What relief or control did you expect?" /></div>
          <div><label>What it actually cost</label>
            <textarea value={postMortem} onChange={e => setPostMortem(e.target.value)} placeholder="Guilt, numbness, distance from God…" /></div>
          <div><label>Free journal <span className="hint">optional</span></label>
            <textarea value={journal} onChange={e => setJournal(e.target.value)} placeholder="Confess, reflect, ask…" /></div>
        </div>
        <button className="btn" onClick={submit} disabled={!sin || busy}>
          {busy ? "Examining the heart…" : "Mortify & Find the Satisfy →"}
        </button>
      </div>
      {busy && (
        <>
          <div className="ai-card" style={tabVars("test")}><div className="ai-lbl">⚔ Mortification</div><div className="ai-loading">Searching the Scripture…</div></div>
          <div className="pivot-card"><div className="pivot-lbl">✦ Gospel Pivot</div><div className="ai-loading">Finding the true satisfaction…</div></div>
        </>
      )}
      {aiReflection && !busy && (
        <>
          <div className="ai-card" style={tabVars("test")}><div className="ai-lbl">⚔ Mortification</div><div className="ai-text">{aiReflection}</div></div>
          {aiPivot && <div className="pivot-card"><div className="pivot-lbl">✦ Gospel Pivot — What God Truly Offers</div><div className="pivot-text">{aiPivot}</div></div>}
        </>
      )}
    </div>
  );
}

// ── More Tab (Patterns + History) ─────────────────────────────────────────

function MoreTab({ treatEntries, textEntries, taskEntries, testEntries, onDelTreat, onDelText, onDelTask, onDelTest }: {
  treatEntries: TreatEntry[]; textEntries: TextEntry[]; taskEntries: TaskEntry[]; testEntries: TestEntry[];
  onDelTreat: (id: number) => void; onDelText: (id: number) => void;
  onDelTask: (id: number) => void; onDelTest: (id: number) => void;
}) {
  const [view, setView] = useState<HistoryView>("treat");
  const { sinCounts, strongholds, topSins, topEmo, topBooks, maxSin, maxEmo, maxBook, streak } = getAnalytics(textEntries, testEntries);

  return (
    <div>
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box"><div className="stat-num" style={{ color: TAB_COLORS.text.color }}>{streak}</div><div className="stat-lbl">Text streak (days)</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: TAB_COLORS.treat.color }}>{treatEntries.length}</div><div className="stat-lbl">Treats logged</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: TAB_COLORS.task.color }}>{taskEntries.length}</div><div className="stat-lbl">Tasks committed</div></div>
        <div className="stat-box"><div className={`stat-num${strongholds.length > 0 ? " warn" : ""}`} style={strongholds.length === 0 ? { color: TAB_COLORS.test.color } : {}}>{strongholds.length}</div><div className="stat-lbl">Strongholds</div></div>
      </div>

      {strongholds.map(s => (
        <div className="stronghold-banner" key={s}>
          <div className="sh-icon">⚠</div>
          <div className="sh-text"><strong>{s}</strong> has appeared {sinCounts[s]} times — this may be a stronghold. Bring it to a pastor or accountability partner.</div>
        </div>
      ))}

      <div className="chart-section">
        <div className="chart-title">Books you&apos;ve spent time in</div>
        {topBooks.length === 0 ? <div className="no-data">No Text entries yet</div> : topBooks.map(([b, c]) => (
          <div className="bar-row" key={b}>
            <div className="bar-lbl">{b}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / maxBook) * 100}%`, background: TAB_COLORS.text.color }} /></div>
            <div className="bar-count">{c}</div>
          </div>
        ))}
      </div>

      <div className="chart-section">
        <div className="chart-title">Sin frequency</div>
        {topSins.length === 0 ? <div className="no-data">No Test entries yet</div> : topSins.map(([s, c]) => (
          <div className="bar-row" key={s}>
            <div className="bar-lbl">{s}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / maxSin) * 100}%`, background: c >= STRONGHOLD ? "#c0392b" : TAB_COLORS.test.color }} /></div>
            <div className="bar-count">{c}</div>
          </div>
        ))}
      </div>

      <div className="chart-section">
        <div className="chart-title">Top emotional triggers</div>
        {topEmo.length === 0 ? <div className="no-data">Log Test entries to see triggers</div> : topEmo.map(([em, c]) => {
          const color = EMOTION_GROUPS.find(g => g.emotions.includes(em))?.color || TAB_COLORS.test.color;
          return (
            <div className="bar-row" key={em}>
              <div className="bar-lbl">{em}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / maxEmo) * 100}%`, background: color }} /></div>
              <div className="bar-count">{c}</div>
            </div>
          );
        })}
      </div>

      {/* History */}
      <div className="chart-title" style={{ marginBottom: 12 }}>History</div>
      <div className="hist-toggle">
        {(["treat","text","task","test"] as HistoryView[]).map(v => (
          <button key={v} className={`hist-tab${view === v ? ` active-${v}` : ""}`} onClick={() => setView(v)}>
            {v === "treat" ? `🌿 Treat (${treatEntries.length})` : v === "text" ? `📖 Text (${textEntries.length})` : v === "task" ? `✦ Task (${taskEntries.length})` : `⚔ Test (${testEntries.length})`}
          </button>
        ))}
      </div>

      {view === "treat" && (treatEntries.length === 0
        ? <div className="empty"><h3>No treats logged yet</h3><p>Begin giving thanks to build a record</p></div>
        : treatEntries.map(e => (
          <div className="entry treat-entry" key={e.id}>
            <button className="del-btn" onClick={() => onDelTreat(e.id)}>✕</button>
            <div className="entry-hdr"><div className="entry-ttl" style={{ color: TAB_COLORS.treat.color }}>Thanksgiving</div><div className="entry-date">{fmt(e.date)}</div></div>
            <div className="ef"><div className="ef-val">{e.gratitude}</div></div>
            {e.aiReflection && <div className="entry-ai"><div className="entry-ai-row" style={{ color: TAB_COLORS.treat.color }}>✦ {firstSentence(e.aiReflection)}</div></div>}
          </div>
        ))
      )}

      {view === "text" && (textEntries.length === 0
        ? <div className="empty"><h3>No Text entries yet</h3><p>Begin your quiet time to build a record</p></div>
        : textEntries.map(e => (
          <div className="entry text-entry" key={e.id}>
            <button className="del-btn" onClick={() => onDelText(e.id)}>✕</button>
            <div className="entry-hdr"><div className="entry-ttl" style={{ color: TAB_COLORS.text.color }}>{e.book}{e.passage ? " " + e.passage : ""}</div><div className="entry-date">{fmt(e.date)}</div></div>
            {e.aboutGod && <div className="ef"><div className="ef-lbl">What I saw of God</div><div className="ef-val">{e.aboutGod}</div></div>}
            {e.apply && <div className="ef"><div className="ef-lbl">Application</div><div className="ef-val">{e.apply}</div></div>}
          </div>
        ))
      )}

      {view === "task" && (taskEntries.length === 0
        ? <div className="empty"><h3>No tasks committed yet</h3><p>Start with one act of obedience today</p></div>
        : taskEntries.map(e => (
          <div className="entry task-entry" key={e.id}>
            <button className="del-btn" onClick={() => onDelTask(e.id)}>✕</button>
            <div className="entry-hdr"><div className="entry-ttl" style={{ color: TAB_COLORS.task.color }}>Task</div><div className="entry-date">{fmt(e.date)}</div></div>
            <div className="ef"><div className="ef-val">{e.task}</div></div>
            {e.aiReflection && <div className="entry-ai"><div className="entry-ai-row" style={{ color: TAB_COLORS.task.color }}>✦ {firstSentence(e.aiReflection)}</div></div>}
          </div>
        ))
      )}

      {view === "test" && (testEntries.length === 0
        ? <div className="empty"><h3>No Test entries yet</h3><p>Begin examining your patterns</p></div>
        : testEntries.map(e => {
          const isSH = strongholds.includes(e.sin);
          return (
            <div className={`entry test-entry`} key={e.id}>
              <button className="del-btn" onClick={() => onDelTest(e.id)}>✕</button>
              <div className="entry-hdr">
                <div className="entry-ttl" style={{ color: TAB_COLORS.test.color }}>
                  {e.sin}{isSH && <span style={{ color: "#c0392b", fontSize: "0.52rem", fontWeight: 600, marginLeft: 6 }}>STRONGHOLD</span>}
                </div>
                <div className="entry-date">{fmt(e.date)}</div>
              </div>
              {/* Pulse snapshot */}
              {(e.pulseEnergy || (e.pulseFeelings?.length ?? 0) > 0 || (e.pulseContexts?.length ?? 0) > 0) && (
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center", marginBottom:6 }}>
                  {e.pulseEnergy && <span style={{ fontSize:"0.5rem", fontWeight:700, background:"#fbeae8", color:"#9b2c1a", border:"1px solid #f0b8b0", borderRadius:999, padding:"2px 7px" }}>⚡ {e.pulseEnergy}/5</span>}
                  {e.pulseFeelings?.map(f => <span key={f} style={{ fontSize:"0.5rem", fontWeight:500, background:"#fbeae8", color:"#9b2c1a", border:"1px solid #f0b8b0", borderRadius:999, padding:"2px 7px" }}>{f}</span>)}
                  {e.pulseContexts?.map(c => <span key={c} style={{ fontSize:"0.5rem", fontWeight:500, background:"#f5f5f5", color:"#666", border:"1px solid #e5e5e5", borderRadius:999, padding:"2px 7px" }}>{c}</span>)}
                </div>
              )}
              {e.emotions?.length > 0 && <div className="entry-chips">{e.emotions.map(em => <span className="entry-chip" key={em}>{em}</span>)}</div>}
              {e.situation && <div className="ef"><div className="ef-lbl">Situation</div><div className="ef-val">{e.situation}</div></div>}
              {e.counterfeit && <div className="ef"><div className="ef-lbl">Counterfeit promise</div><div className="ef-val">{e.counterfeit}</div></div>}
              {(e.aiReflection || e.aiPivot) && (
                <div className="entry-ai">
                  {e.aiReflection && <div className="entry-ai-row">⚔ {firstSentence(e.aiReflection)}</div>}
                  {e.aiPivot && <div className="entry-ai-row" style={{ color: TAB_COLORS.text.color }}>✦ {firstSentence(e.aiPivot)}</div>}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function WTTTApp() {
  const [tab, setTab] = useState<Tab>("treat");
  const [treatEntries, setTreatEntries] = useState<TreatEntry[]>([]);
  const [textEntries,  setTextEntries]  = useState<TextEntry[]>([]);
  const [taskEntries,  setTaskEntries]  = useState<TaskEntry[]>([]);
  const [testEntries,  setTestEntries]  = useState<TestEntry[]>([]);

  const load = useCallback(async () => {
    const [treat, text, task, test] = await Promise.all([
      fetch("/api/treat").then(r => r.json()),
      fetch("/api/qt").then(r => r.json()),
      fetch("/api/task").then(r => r.json()),
      fetch("/api/sin").then(r => r.json()),
    ]);
    setTreatEntries(treat);
    setTextEntries(text);
    setTaskEntries(task);
    setTestEntries(test);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function del(endpoint: string, id: number) {
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
  }

  const { streak, strongholds } = getAnalytics(textEntries, testEntries);
  const activeColor = tab === "more" ? "#111" : (TAB_COLORS[tab]?.color || "#111");

  const tabs = [
    { id: "treat" as Tab, icon: "🌿", label: "Treat" },
    { id: "text"  as Tab, icon: "📖", label: "Text" },
    { id: "task"  as Tab, icon: "✦",  label: "Task" },
    { id: "test"  as Tab, icon: "⚔",  label: "Test" },
    { id: "more"  as Tab, icon: "◎",  label: "More" },
  ];

  const headerTitle = tab === "more"
    ? <span style={{ fontSize: "1.3rem", fontWeight: 600 }}>Patterns & History</span>
    : <>What&apos;s the <strong style={{ color: activeColor }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</strong> today?</>;

  return (
    <div id="app">
      <div className="header">
        <div className="header-eyebrow">{todayLabel()}</div>
        <div className="header-row">
          <div className="header-title">{headerTitle}</div>
          <div className="header-meta">
            <span className="good">{streak} day{streak !== 1 ? "s" : ""} streak</span><br />
            {strongholds.length > 0
              ? <span className="warn">{strongholds.length} stronghold{strongholds.length > 1 ? "s" : ""}</span>
              : <span>{testEntries.length} test entries</span>}
          </div>
        </div>
      </div>

      <div className="main">
        {tab === "treat" && <TreatTab onSaved={e => setTreatEntries(p => [e, ...p])} />}
        {tab === "text"  && <TextTab  onSaved={e => setTextEntries(p => [e, ...p])} />}
        {tab === "task"  && <TaskTab  onSaved={e => setTaskEntries(p => [e, ...p])} />}
        {tab === "test"  && <TestTab  onSaved={e => setTestEntries(p => [e, ...p])} />}
        {tab === "more"  && (
          <MoreTab
            treatEntries={treatEntries} textEntries={textEntries}
            taskEntries={taskEntries}   testEntries={testEntries}
            onDelTreat={id => { del("/api/treat", id); setTreatEntries(p => p.filter(e => e.id !== id)); }}
            onDelText={id  => { del("/api/qt",    id); setTextEntries(p => p.filter(e => e.id !== id)); }}
            onDelTask={id  => { del("/api/task",  id); setTaskEntries(p => p.filter(e => e.id !== id)); }}
            onDelTest={id  => { del("/api/sin",   id); setTestEntries(p => p.filter(e => e.id !== id)); }}
          />
        )}
      </div>

      <nav className="bottom-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-item${tab === t.id ? " active" : ""}`}
            style={{ "--tab-color": t.id === "more" ? "#111" : TAB_COLORS[t.id]?.color } as CSSProperties}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            {t.label}
            {tab === t.id && <div className="nav-dot" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
