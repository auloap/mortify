"use client";

import { useState, useEffect, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────

const EMOTION_GROUPS = [
  { family: "Fear & Anxiety", color: "#7b5ea7", emotions: ["Anxiety", "Dread", "Panic", "Worry", "Hypervigilance", "Nervousness", "Apprehension"] },
  { family: "Anger & Frustration", color: "#b94040", emotions: ["Anger", "Irritability", "Resentment", "Bitterness", "Contempt", "Rage", "Indignation"] },
  { family: "Sadness & Loss", color: "#4a6fa5", emotions: ["Grief", "Sadness", "Despair", "Disappointment", "Helplessness", "Emptiness", "Sorrow"] },
  { family: "Shame & Guilt", color: "#8b5e3c", emotions: ["Shame", "Guilt", "Embarrassment", "Humiliation", "Regret", "Self-disgust", "Unworthiness"] },
  { family: "Pride & Ego", color: "#c9a84c", emotions: ["Pride", "Arrogance", "Entitlement", "Superiority", "Defensiveness", "Vanity", "Self-sufficiency"] },
  { family: "Desire & Craving", color: "#c0392b", emotions: ["Lust", "Craving", "Restlessness", "Yearning", "Addiction-pull", "Boredom", "Dissatisfaction"] },
  { family: "Relational Pain", color: "#2d6a4f", emotions: ["Loneliness", "Rejection", "Jealousy", "Envy", "Betrayal", "Abandonment", "Invisibility"] },
  { family: "Insecurity & Fear", color: "#5b6b7c", emotions: ["Insecurity", "Inadequacy", "Fear of failure", "Fear of man", "Comparison", "Imposter feeling", "Unwanted"] },
];

const SINS = ["Pride", "Lust", "Anger", "Envy", "Sloth", "Gluttony", "Greed", "Bitterness", "Deceit", "Fear/Unbelief", "Control", "Self-pity", "Other"];

const BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

const STRONGHOLD = 4;

// ── Enneagram ─────────────────────────────────────────────────────────────

const TYPE_NAMES: Record<number, string> = {
  1: "The Reformer",
  2: "The Helper",
  3: "The Achiever",
  4: "The Individualist",
  5: "The Investigator",
  6: "The Loyalist",
  7: "The Enthusiast",
  8: "The Challenger",
  9: "The Peacemaker",
};

const VALID_WINGS: Record<number, number[]> = {
  1: [9, 2], 2: [1, 3], 3: [2, 4], 4: [3, 5],
  5: [4, 6], 6: [5, 7], 7: [6, 8], 8: [7, 9], 9: [8, 1],
};

// ── Types ──────────────────────────────────────────────────────────────────

interface UserProfile {
  enneagramType: number | null;
  wing: number | null;
}

interface QTEntry {
  id: number;
  date: string;
  book: string;
  passage: string;
  aboutGod: string;
  aboutSelf: string;
  apply: string;
  prayer: string;
  aiReflection: string;
}

interface SinEntry {
  id: number;
  date: string;
  sin: string;
  emotions: string[];
  situation: string;
  counterfeit: string;
  postMortem: string;
  journal: string;
  aiReflection: string;
  aiPivot: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function firstSentence(s: string) {
  if (!s) return "";
  const idx = s.indexOf(".");
  return idx >= 0 ? s.slice(0, idx + 1) : s;
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(msg: string, color = "var(--green)") {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  el.style.background = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ── Analytics ──────────────────────────────────────────────────────────────

function getAnalytics(qtEntries: QTEntry[], sinEntries: SinEntry[]) {
  const sinCounts: Record<string, number> = {};
  const emoCounts: Record<string, number> = {};
  const bookCounts: Record<string, number> = {};

  sinEntries.forEach((e) => {
    sinCounts[e.sin] = (sinCounts[e.sin] || 0) + 1;
    (e.emotions || []).forEach((em) => { emoCounts[em] = (emoCounts[em] || 0) + 1; });
  });
  qtEntries.forEach((e) => { bookCounts[e.book] = (bookCounts[e.book] || 0) + 1; });

  const strongholds = Object.entries(sinCounts).filter(([, c]) => c >= STRONGHOLD).map(([s]) => s);
  const topSins = Object.entries(sinCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topEmo = Object.entries(emoCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSin = Math.max(...Object.values(sinCounts), 1);
  const maxEmo = Math.max(...Object.values(emoCounts), 1);
  const maxBook = Math.max(...Object.values(bookCounts), 1);

  const days = [...new Set(qtEntries.map((e) => e.date.slice(0, 10)))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const diff = Math.round((Date.now() - new Date(days[i]).getTime()) / 86400000);
    if (diff === i || diff === i + 1) streak++; else break;
  }

  return { sinCounts, strongholds, topSins, topEmo, topBooks, maxSin, maxEmo, maxBook, streak };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EmoPicker({ selected, openGroups, onToggle, onToggleGroup, onClear }: {
  selected: string[];
  openGroups: Record<string, boolean>;
  onToggle: (em: string) => void;
  onToggleGroup: (family: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="form-row">
      <label>Emotional state at the time</label>
      <div className="emo-groups">
        {EMOTION_GROUPS.map((g) => {
          const selCount = g.emotions.filter((e) => selected.includes(e)).length;
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
                  {g.emotions.map((em) => {
                    const on = selected.includes(em);
                    return (
                      <button
                        key={em}
                        className={`emo-chip${on ? " on" : ""}`}
                        style={on ? { background: g.color } : undefined}
                        onClick={() => onToggle(em)}
                      >
                        {em}
                      </button>
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
          {selected.map((em) => {
            const color = EMOTION_GROUPS.find((g) => g.emotions.includes(em))?.color || "var(--ash)";
            return (
              <button key={em} className="emo-pill" style={{ background: color }} onClick={() => onToggle(em)}>
                {em} ✕
              </button>
            );
          })}
          <button className="emo-clear" onClick={onClear}>clear all</button>
        </div>
      )}
    </div>
  );
}

// ── QT Tab ─────────────────────────────────────────────────────────────────

function QTTab({ onSaved }: { onSaved: (entry: QTEntry) => void }) {
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
    setBusy(true);
    setAiText("");
    try {
      const res = await fetch("/api/qt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, passage, aboutGod, aboutSelf, apply, prayer }),
      });
      const entry: QTEntry = await res.json();
      setAiText(entry.aiReflection);
      onSaved(entry);
      setBook(""); setPassage(""); setAboutGod(""); setAboutSelf(""); setApply(""); setPrayer("");
      showToast("QT entry saved ✦");
    } catch {
      setAiText("Could not save entry. Please try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <p className="section-title">Quiet <em className="green">Time</em></p>
      <p className="section-desc">Level 1 · Grow your love for God · &quot;One thing I ask — that I may dwell in the house of the Lord&quot; — Ps 27:4</p>
      <div className="card qt">
        <div className="card-lbl green">Today&apos;s Passage</div>
        <div className="form-2col">
          <div>
            <label>Book</label>
            <select value={book} onChange={(e) => setBook(e.target.value)}>
              <option value="">— Select —</option>
              {BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label>Chapter &amp; Verses <span className="hint">e.g. 3:1-16</span></label>
            <input type="text" value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="e.g. 1:1-18" />
          </div>
        </div>
        <div className="card-lbl green">Reflection</div>
        <div className="form-row">
          <div className="qt-q">What does this passage reveal about who God is — His character, heart, or ways?</div>
          <textarea value={aboutGod} onChange={(e) => setAboutGod(e.target.value)} placeholder="Write freely. What struck you about God here?" />
        </div>
        <div className="form-row">
          <div className="qt-q">What does this passage reveal about human nature — including you?</div>
          <textarea value={aboutSelf} onChange={(e) => setAboutSelf(e.target.value)} placeholder="What convicts, comforts, or challenges you personally?" />
        </div>
        <div className="form-row">
          <div className="qt-q">What one truth or principle do you want to carry into today?</div>
          <textarea value={apply} onChange={(e) => setApply(e.target.value)} placeholder="How does this change how you see or act today?" />
        </div>
        <div className="form-row">
          <div className="qt-q">What do you want to say back to God right now?</div>
          <textarea value={prayer} onChange={(e) => setPrayer(e.target.value)} placeholder="Praise, confession, request — or simply sit with Him..." style={{ minHeight: 60 }} />
        </div>
        <button className="btn green" onClick={submit} disabled={!book || !aboutGod || busy}>
          {busy ? "Reflecting with you..." : "Submit → Receive Reflection"}
        </button>
      </div>
      {busy && (
        <div className="ai-card green">
          <div className="ai-lbl green">✦ Pastoral Response</div>
          <div className="ai-loading">Sitting with what you&apos;ve seen...</div>
        </div>
      )}
      {aiText && !busy && (
        <div className="ai-card green">
          <div className="ai-lbl green">✦ Pastoral Response</div>
          <div className="ai-text">{aiText}</div>
        </div>
      )}
    </>
  );
}

// ── Sin Tab ────────────────────────────────────────────────────────────────

function SinTab({ onSaved }: { onSaved: (entry: SinEntry) => void }) {
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

  function toggleEmo(em: string) {
    setEmotions((prev) => prev.includes(em) ? prev.filter((x) => x !== em) : [...prev, em]);
  }
  function toggleGroup(family: string) {
    setOpenGroups((prev) => ({ ...prev, [family]: !prev[family] }));
  }

  async function submit() {
    if (!sin || busy) return;
    setBusy(true);
    setAiReflection(""); setAiPivot("");
    const resolvedSin = sin === "Other" ? (custom || "Other") : sin;
    try {
      const res = await fetch("/api/sin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sin: resolvedSin, emotions, situation, counterfeit, postMortem, journal }),
      });
      const entry: SinEntry = await res.json();
      setAiReflection(entry.aiReflection);
      setAiPivot(entry.aiPivot);
      onSaved(entry);
      setSin(""); setCustom(""); setEmotions([]); setSituation(""); setCounterfeit(""); setPostMortem(""); setJournal("");
      showToast("Entry saved ⚔", "var(--rust)");
    } catch {
      setAiReflection("Could not save entry. Please try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <p className="section-title">Morti<em>fy</em></p>
      <p className="section-desc">Level 2 · Kill sin at the root · Discover what God truly offers in its place</p>
      <div className="card sin">
        <div className="card-lbl rust">Identify the Sin</div>
        <div className="form-2col">
          <div>
            <label>The sin</label>
            <select value={sin} onChange={(e) => setSin(e.target.value)}>
              <option value="">— Select —</option>
              {SINS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {sin === "Other" ? (
            <div>
              <label>Name it specifically</label>
              <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. People-pleasing" />
            </div>
          ) : <div />}
        </div>
        <EmoPicker selected={emotions} openGroups={openGroups} onToggle={toggleEmo} onToggleGroup={toggleGroup} onClear={() => setEmotions([])} />
        <div className="card-lbl rust">Anatomy of the Sin</div>
        <div className="form-2col">
          <div>
            <label>Situation / trigger context</label>
            <textarea value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="What was happening? Who was there?" />
          </div>
          <div>
            <label>What the sin promised (counterfeit)</label>
            <textarea value={counterfeit} onChange={(e) => setCounterfeit(e.target.value)} placeholder="What relief or control did you expect?" />
          </div>
          <div>
            <label>Post-mortem: what it actually cost</label>
            <textarea value={postMortem} onChange={(e) => setPostMortem(e.target.value)} placeholder="Guilt, numbness, distance from God..." />
          </div>
          <div>
            <label>Free journal <span className="hint">optional</span></label>
            <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Confess, reflect, ask..." />
          </div>
        </div>
        <button className="btn rust" onClick={submit} disabled={!sin || busy}>
          {busy ? "Examining the heart..." : "Submit → Mortify & Find the True Satisfy"}
        </button>
      </div>
      {busy && (
        <>
          <div className="ai-card"><div className="ai-lbl gold">⚔ Mortification</div><div className="ai-loading">Searching the Scripture...</div></div>
          <div className="pivot-card"><div className="pivot-lbl">✦ Gospel Pivot</div><div className="ai-loading">Finding the true satisfaction...</div></div>
        </>
      )}
      {aiReflection && !busy && (
        <>
          <div className="ai-card"><div className="ai-lbl gold">⚔ Mortification</div><div className="ai-text">{aiReflection}</div></div>
          {aiPivot && <div className="pivot-card"><div className="pivot-lbl">✦ Gospel Pivot — What God Truly Offers</div><div className="pivot-text">{aiPivot}</div></div>}
        </>
      )}
    </>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────

function DashboardTab({ qtEntries, sinEntries }: { qtEntries: QTEntry[]; sinEntries: SinEntry[] }) {
  const { sinCounts, strongholds, topSins, topEmo, topBooks, maxSin, maxEmo, maxBook, streak } = getAnalytics(qtEntries, sinEntries);
  return (
    <>
      <p className="section-title">Pattern <em>Intelligence</em></p>
      <p className="section-desc">Your growth in God · Your war on sin · Stronghold = {STRONGHOLD}+ occurrences</p>
      <div className="stats-row">
        <div className="stat-box"><div className={`stat-num green`}>{streak}</div><div className="stat-lbl">QT streak (days)</div></div>
        <div className="stat-box"><div className="stat-num gold">{qtEntries.length}</div><div className="stat-lbl">QT sessions</div></div>
        <div className="stat-box"><div className="stat-num">{sinEntries.length}</div><div className="stat-lbl">Sin entries</div></div>
        <div className="stat-box"><div className={`stat-num ${strongholds.length > 0 ? "danger" : "gold"}`}>{strongholds.length}</div><div className="stat-lbl">Strongholds</div></div>
      </div>
      {strongholds.map((s) => (
        <div className="stronghold-banner" key={s}>
          <div className="sh-icon">⚠</div>
          <div className="sh-text"><strong>{s}</strong> has appeared {sinCounts[s]} times — this may be a stronghold. Bring it to a pastor or accountability partner.</div>
        </div>
      ))}
      <div className="chart-section">
        <div className="chart-title">Books you&apos;ve spent time in</div>
        {topBooks.length === 0 ? <div className="no-data">No QT entries yet</div> : topBooks.map(([b, c]) => (
          <div className="bar-row" key={b}>
            <div className="bar-lbl">{b}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / maxBook) * 100}%`, background: "var(--green)" }} /></div>
            <div className="bar-count">{c}</div>
          </div>
        ))}
      </div>
      <div className="chart-section">
        <div className="chart-title">Sin frequency</div>
        {topSins.length === 0 ? <div className="no-data">No sin entries yet</div> : topSins.map(([s, c]) => (
          <div className="bar-row" key={s}>
            <div className="bar-lbl">{s}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / maxSin) * 100}%`, background: c >= STRONGHOLD ? "var(--red)" : "var(--rust)" }} /></div>
            <div className="bar-count">{c}</div>
          </div>
        ))}
      </div>
      <div className="chart-section">
        <div className="chart-title">Top emotional triggers</div>
        {topEmo.length === 0 ? <div className="no-data">Log sin entries to see triggers</div> : topEmo.map(([em, c]) => {
          const color = EMOTION_GROUPS.find((g) => g.emotions.includes(em))?.color || "var(--gold)";
          return (
            <div className="bar-row" key={em}>
              <div className="bar-lbl">{em}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / maxEmo) * 100}%`, background: color }} /></div>
              <div className="bar-count">{c}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────

function HistoryTab({ qtEntries, sinEntries, onDelQT, onDelSin }: {
  qtEntries: QTEntry[];
  sinEntries: SinEntry[];
  onDelQT: (id: number) => void;
  onDelSin: (id: number) => void;
}) {
  const [view, setView] = useState<"qt" | "sin">("qt");
  const { strongholds } = getAnalytics(qtEntries, sinEntries);

  return (
    <>
      <p className="section-title">Your <em>Record</em></p>
      <p className="section-desc">An honest account of your walk · Examine with hope, not shame</p>
      <div className="hist-toggle">
        <button className={`hist-tab${view === "qt" ? " ag" : ""}`} onClick={() => setView("qt")}>✦ Quiet Times ({qtEntries.length})</button>
        <button className={`hist-tab${view === "sin" ? " ar" : ""}`} onClick={() => setView("sin")}>⚔ Sin Entries ({sinEntries.length})</button>
      </div>
      {view === "qt" ? (
        qtEntries.length === 0 ? (
          <div className="empty"><h3>No QT entries yet</h3><p>Begin your quiet time to build a record</p></div>
        ) : qtEntries.map((e) => (
          <div className="entry qe" key={e.id}>
            <button className="del-btn" onClick={() => onDelQT(e.id)}>✕</button>
            <div className="entry-hdr">
              <div className="entry-ttl green">{e.book}{e.passage ? " " + e.passage : ""}</div>
              <div className="entry-date">{fmt(e.date)}</div>
            </div>
            {e.aboutGod && <div className="ef"><div className="ef-lbl">What I saw of God</div><div className="ef-val">{e.aboutGod}</div></div>}
            {e.aboutSelf && <div className="ef"><div className="ef-lbl">What I saw of myself</div><div className="ef-val">{e.aboutSelf}</div></div>}
            {e.apply && <div className="ef"><div className="ef-lbl">Application</div><div className="ef-val">{e.apply}</div></div>}
            {e.prayer && <div className="ef"><div className="ef-lbl">Prayer</div><div className="ef-val">{e.prayer}</div></div>}
          </div>
        ))
      ) : (
        sinEntries.length === 0 ? (
          <div className="empty"><h3>No sin entries yet</h3><p>Begin logging to examine your patterns</p></div>
        ) : sinEntries.map((e) => {
          const isSH = strongholds.includes(e.sin);
          return (
            <div className={`entry${isSH ? " se" : ""}`} key={e.id}>
              <button className="del-btn" onClick={() => onDelSin(e.id)}>✕</button>
              <div className="entry-hdr">
                <div className="entry-ttl rust">
                  {e.sin}
                  {isSH && <span style={{ color: "var(--red)", fontSize: "0.55rem", fontFamily: "'DM Mono', monospace", marginLeft: 6 }}>STRONGHOLD</span>}
                </div>
                <div className="entry-date">{fmt(e.date)}</div>
              </div>
              {e.emotions?.length > 0 && (
                <div className="entry-chips">{e.emotions.map((em) => <span className="entry-chip" key={em}>{em}</span>)}</div>
              )}
              {e.situation && <div className="ef"><div className="ef-lbl">Situation</div><div className="ef-val">{e.situation}</div></div>}
              {e.counterfeit && <div className="ef"><div className="ef-lbl">Counterfeit promise</div><div className="ef-val">{e.counterfeit}</div></div>}
              {e.postMortem && <div className="ef"><div className="ef-lbl">Cost</div><div className="ef-val">{e.postMortem}</div></div>}
              {e.journal && <div className="ef"><div className="ef-lbl">Journal</div><div className="ef-val">{e.journal}</div></div>}
              {(e.aiReflection || e.aiPivot) && (
                <div className="entry-ai">
                  {e.aiReflection && <div className="entry-ai-row">⚔ {firstSentence(e.aiReflection)}</div>}
                  {e.aiPivot && <div className="entry-ai-row" style={{ color: "var(--green)" }}>✦ {firstSentence(e.aiPivot)}</div>}
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────

function ProfileTab({ profile, onSaved }: { profile: UserProfile; onSaved: (p: UserProfile) => void }) {
  const [type, setType] = useState<number | null>(profile.enneagramType);
  const [wing, setWing] = useState<number | null>(profile.wing);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function selectType(t: number) {
    setType(t);
    setWing(null);
    setSaved(false);
  }

  function selectWing(w: number) {
    setWing((prev) => (prev === w ? null : w));
    setSaved(false);
  }

  async function save() {
    if (!type || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enneagramType: type, wing }),
      });
      const p: UserProfile = await res.json();
      onSaved(p);
      setSaved(true);
      showToast("Profile saved ✦");
    } catch {
      showToast("Could not save profile", "var(--rust)");
    }
    setBusy(false);
  }

  const wings = type ? VALID_WINGS[type] : [];

  return (
    <>
      <p className="section-title">Your <em className="gold">Profile</em></p>
      <p className="section-desc">Help the AI understand you — responses will be shaped to your heart, not your type number.</p>

      <div className="card">
        <div className="card-lbl gold">Which description fits you most?</div>
        <div className="profile-grid">
          {Object.entries(TYPE_NAMES).map(([n, label]) => {
            const num = Number(n);
            const active = type === num;
            return (
              <button
                key={num}
                className={`profile-type-btn${active ? " active" : ""}`}
                onClick={() => selectType(num)}
              >
                <span className="profile-type-num">{num}</span>
                <span className="profile-type-name">{label}</span>
              </button>
            );
          })}
        </div>

        {type && (
          <>
            <div className="card-lbl gold" style={{ marginTop: "1.2rem" }}>Wing <span className="hint">optional — the adjacent type that colours you</span></div>
            <div className="profile-wing-row">
              {wings.map((w) => (
                <button
                  key={w}
                  className={`profile-wing-btn${wing === w ? " active" : ""}`}
                  onClick={() => selectWing(w)}
                >
                  {type}w{w}
                </button>
              ))}
              {wing && (
                <button className="profile-wing-btn" style={{ opacity: 0.5 }} onClick={() => setWing(null)}>
                  clear
                </button>
              )}
            </div>
          </>
        )}

        <button className="btn" style={{ background: "var(--gold)", color: "var(--ink)", marginTop: "1.4rem" }} onClick={save} disabled={!type || busy}>
          {busy ? "Saving..." : saved ? "Saved ✦" : "Save Profile"}
        </button>
      </div>

      {profile.enneagramType && (
        <div className="ai-card" style={{ borderColor: "var(--gold)" }}>
          <div className="ai-lbl gold">Current profile</div>
          <div className="ai-text">
            Type {profile.enneagramType} — {TYPE_NAMES[profile.enneagramType]}
            {profile.wing ? `, wing ${profile.wing}` : ""}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function MortifyApp() {
  const [tab, setTab] = useState<"qt" | "mortify" | "dashboard" | "history" | "profile">("qt");
  const [qtEntries, setQTEntries] = useState<QTEntry[]>([]);
  const [sinEntries, setSinEntries] = useState<SinEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ enneagramType: null, wing: null });

  const load = useCallback(async () => {
    const [qt, sin, prof] = await Promise.all([
      fetch("/api/qt").then((r) => r.json()),
      fetch("/api/sin").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]);
    setQTEntries(qt);
    setSinEntries(sin);
    setProfile(prof);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function delQT(id: number) {
    await fetch(`/api/qt/${id}`, { method: "DELETE" });
    setQTEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function delSin(id: number) {
    await fetch(`/api/sin/${id}`, { method: "DELETE" });
    setSinEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const { streak, strongholds } = getAnalytics(qtEntries, sinEntries);

  const tabs = [
    { id: "qt" as const, icon: "✦", label: "QT" },
    { id: "mortify" as const, icon: "⚔", label: "Mortify" },
    { id: "dashboard" as const, icon: "◎", label: "Patterns" },
    { id: "history" as const, icon: "▤", label: "History" },
    { id: "profile" as const, icon: "◈", label: "Profile" },
  ];

  return (
    <div id="app">
      <div className="header">
        <div>
          <div className="header-title">morti<span>fy</span></div>
          <div className="header-sub">Know God · Kill Sin</div>
        </div>
        <div className="header-meta">
          <span className="good">QT streak: {streak} day{streak !== 1 ? "s" : ""}</span><br />
          {strongholds.length > 0
            ? <span className="danger">{strongholds.length} stronghold{strongholds.length > 1 ? "s" : ""}</span>
            : <span>{sinEntries.length} sin entries</span>}
        </div>
      </div>
      <div className="main">
        {tab === "qt" && <QTTab onSaved={(e) => setQTEntries((prev) => [e, ...prev])} />}
        {tab === "mortify" && <SinTab onSaved={(e) => setSinEntries((prev) => [e, ...prev])} />}
        {tab === "dashboard" && <DashboardTab qtEntries={qtEntries} sinEntries={sinEntries} />}
        {tab === "history" && <HistoryTab qtEntries={qtEntries} sinEntries={sinEntries} onDelQT={delQT} onDelSin={delSin} />}
        {tab === "profile" && <ProfileTab profile={profile} onSaved={setProfile} />}
      </div>
      <nav className="bottom-nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`nav-item${tab === t.id ? (t.id === "qt" ? " qt-active" : " active") : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
