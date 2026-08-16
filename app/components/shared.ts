// ── Shared constants & types ───────────────────────────────────────────────

export const EMOTION_GROUPS = [
  { family: "Fear & Anxiety",      color: "#7b5ea7", emotions: ["Anxiety","Dread","Panic","Worry","Hypervigilance","Nervousness","Apprehension"] },
  { family: "Anger & Frustration", color: "#b94040", emotions: ["Anger","Irritability","Resentment","Bitterness","Contempt","Rage","Indignation"] },
  { family: "Sadness & Loss",      color: "#4a6fa5", emotions: ["Grief","Sadness","Despair","Disappointment","Helplessness","Emptiness","Sorrow"] },
  { family: "Shame & Guilt",       color: "#8b5e3c", emotions: ["Shame","Guilt","Embarrassment","Humiliation","Regret","Self-disgust","Unworthiness"] },
  { family: "Pride & Ego",         color: "#c9a84c", emotions: ["Pride","Arrogance","Entitlement","Superiority","Defensiveness","Vanity","Self-sufficiency"] },
  { family: "Desire & Craving",    color: "#c0392b", emotions: ["Lust","Craving","Restlessness","Yearning","Addiction-pull","Boredom","Dissatisfaction"] },
  { family: "Relational Pain",     color: "#2d6a4f", emotions: ["Loneliness","Rejection","Jealousy","Envy","Betrayal","Abandonment","Invisibility"] },
  { family: "Insecurity & Fear",   color: "#5b6b7c", emotions: ["Insecurity","Inadequacy","Fear of failure","Fear of man","Comparison","Imposter feeling","Unwanted"] },
];

export const SINS = ["Pride","Lust","Anger","Envy","Sloth","Gluttony","Greed","Bitterness","Deceit","Fear/Unbelief","Control","Self-pity","Other"];
export const SOS_PULLS = ["Lust","Anger","Scrolling","Envy","Self-pity","Pride","Control","Gluttony"];
export const BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
export const STRONGHOLD = 4;
export const WIN_FEELINGS = ["Grateful","Relieved","Peaceful","Still shaky","Hopeful","Joyful","Tired"];
export const ENERGY_WORDS = ["","Drained","Low","Okay","Good","Sharp"];
export const GOAL_ICONS = ["🎯","💪","🙏","🏃","📚","💧","🌅","✝️","🤝","❤️"];

// ── Types (unchanged API shapes) ───────────────────────────────────────────

export interface MoodEntry    { id: number; date: string; energy: number; note: string; loggedAt: string; }
export interface TriumphGoal  { id: number; name: string; type: "do" | "resist"; icon: string; linkedSin: string; autoTab: string; isDefault: boolean; createdAt: string; }
export interface DoLog        { id: number; goalId: number; date: string; loggedAt: string; }
export interface ResistLog    { id: number; goalId: number; date: string; outcome: "won" | "skip" | "fell"; pulseEnergy: number | null; loggedAt: string; }
export interface TriumphWin   { id: number; text: string; date: string; createdAt: string; }
export interface TriumphData  { goals: TriumphGoal[]; doLogs: DoLog[]; resistLogs: ResistLog[]; wins: TriumphWin[]; autoDates: { text: string[]; treat: string[]; task: string[] }; }

export interface TreatEntry   { id: number; date: string; gratitude: string; aiReflection: string; }
export interface TextEntry    { id: number; date: string; book: string; passage: string; aboutGod: string; aboutSelf: string; apply: string; prayer: string; aiReflection: string; }
export interface TaskEntry    { id: number; date: string; task: string; obstacle: string; aiReflection: string; }
export interface TestEntry    { id: number; date: string; sin: string; emotions: string[]; situation: string; counterfeit: string; postMortem: string; journal: string; aiReflection: string; aiPivot: string; pulseEnergy?: number; pulseFeelings?: string[]; pulseContexts?: string[]; outcome?: "won" | "fell"; whatHelped?: string; howFeeling?: string[]; aiVictory?: string; }

// ── Helpers ────────────────────────────────────────────────────────────────

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
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
export function emotionColor(em: string) {
  return EMOTION_GROUPS.find(g => g.emotions.includes(em))?.color || "#8a7d69";
}

export function calcStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort().reverse();
  const dt = new Date(); let streak = 0;
  const today = dt.toISOString().slice(0, 10);
  if (!sorted.length) return 0;
  if (sorted[0] !== today && sorted[0] !== new Date(dt.getTime() - 86400000).toISOString().slice(0, 10)) return 0;
  for (const d of sorted) {
    const expected = dt.toISOString().slice(0, 10);
    if (d === expected) { streak++; dt.setDate(dt.getDate() - 1); } else break;
  }
  return streak;
}

export function showToast(msg: string, kind: "grace" | "warfare" | "ink" = "grace") {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  const styles = getComputedStyle(document.documentElement);
  const color = kind === "grace" ? styles.getPropertyValue("--green")
    : kind === "warfare" ? styles.getPropertyValue("--rust")
    : styles.getPropertyValue("--ink");
  el.style.background = color.trim() || "#2d6a4f";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ── Analytics ──────────────────────────────────────────────────────────────

export function getAnalytics(textEntries: TextEntry[], testEntries: TestEntry[], windowDays: number | null = null) {
  const cutoff = windowDays ? new Date(Date.now() - windowDays * 86400000).toISOString().slice(0, 10) : null;
  const inWindow = cutoff ? testEntries.filter(e => e.date.slice(0, 10) >= cutoff) : testEntries;

  const sinCounts: Record<string, number> = {};
  const sinWins: Record<string, number> = {};
  const lostCounts: Record<string, number> = {};
  inWindow.forEach(e => {
    sinCounts[e.sin] = (sinCounts[e.sin] || 0) + 1;
    if (e.outcome === "won") sinWins[e.sin] = (sinWins[e.sin] || 0) + 1;
    else lostCounts[e.sin] = (lostCounts[e.sin] || 0) + 1;
  });

  const strongholds = Object.entries(lostCounts)
    .filter(([, c]) => c >= STRONGHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);

  const topSins = Object.entries(sinCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxSin = Math.max(...Object.values(sinCounts), 1);

  const bookCounts: Record<string, number> = {};
  textEntries.forEach(e => { bookCounts[e.book] = (bookCounts[e.book] || 0) + 1; });
  const topBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxBook = Math.max(...Object.values(bookCounts), 1);

  const streak = calcStreak(textEntries.map(e => e.date.slice(0, 10)));
  const totalTests = inWindow.length;
  const totalWins  = inWindow.filter(e => e.outcome === "won").length;
  const winRate    = totalTests > 0 ? Math.round((totalWins / totalTests) * 100) : null;

  // Trigger insight: which emotion separates losses from wins the most.
  const losses = inWindow.filter(e => e.outcome !== "won");
  const wins   = inWindow.filter(e => e.outcome === "won");
  let insight: { emotion: string; lossPct: number; winPct: number } | null = null;
  if (losses.length >= 3) {
    const lossEmo: Record<string, number> = {};
    losses.forEach(e => (e.emotions || []).forEach(em => { lossEmo[em] = (lossEmo[em] || 0) + 1; }));
    const best = Object.entries(lossEmo).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 2) {
      const winCount = wins.filter(e => (e.emotions || []).includes(best[0])).length;
      insight = {
        emotion: best[0],
        lossPct: Math.round((best[1] / losses.length) * 100),
        winPct: wins.length > 0 ? Math.round((winCount / wins.length) * 100) : 0,
      };
    }
  }

  // Stronghold context: what precedes the lead stronghold's losses.
  let strongholdDetail: { sin: string; lost: number; total: number; companion: string | null; companionCount: number } | null = null;
  if (strongholds.length > 0) {
    const sin = strongholds[0];
    const fell = losses.filter(e => e.sin === sin);
    const companions: Record<string, number> = {};
    fell.forEach(e => {
      (e.pulseContexts || []).forEach(c => { companions[c] = (companions[c] || 0) + 1; });
      (e.emotions || []).forEach(em => { companions[em] = (companions[em] || 0) + 1; });
    });
    const top = Object.entries(companions).sort((a, b) => b[1] - a[1])[0];
    strongholdDetail = {
      sin, lost: lostCounts[sin], total: sinCounts[sin],
      companion: top && top[1] >= 2 ? top[0] : null,
      companionCount: top ? top[1] : 0,
    };
  }

  return { sinCounts, sinWins, lostCounts, strongholds, strongholdDetail, topSins, maxSin, topBooks, maxBook, streak, totalTests, totalWins, winRate, insight };
}
