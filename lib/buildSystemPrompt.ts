import { getProfilePrompt, getStressNote, EnneagramType } from "./prompts/profile-layer";
import {
  BASE_QT_INSTRUCTION,
  BASE_MORTIFICATION_INSTRUCTION,
  BASE_PIVOT_INSTRUCTION,
  BASE_VICTORY_INSTRUCTION,
  BASE_DAY_REVIEW_INSTRUCTION,
} from "./prompts/base-pastoral";

export interface UserProfile {
  enneagramType: EnneagramType | null;
  wing: number | null;
}

export interface QTContext {
  book: string;
  passage: string;
  aboutGod: string;
  aboutSelf: string;
  apply: string;
  prayer?: string;
}

export interface SinContext {
  sin: string;
  emotions: string[];
  situation: string;
  counterfeit: string;
  postMortem: string;
  journal?: string;
}

export interface VictoryContext {
  sin: string;
  emotions: string[];
  situation: string;
  whatHelped: string;
  howFeeling: string[];
}

function profileSection(profile: UserProfile): string {
  if (!profile.enneagramType) return "";
  const prose = getProfilePrompt(profile.enneagramType, profile.wing);
  return `\n\nPersonal context for this person (use to inform tone and emphasis — do not reference or explain this framework):\n${prose}`;
}

function stressSection(profile: UserProfile): string {
  if (!profile.enneagramType) return "";
  return `\n\nNote: this person has logged multiple sin entries today. ${getStressNote(profile.enneagramType)}`;
}

// --- QT ---

export function buildQTSystem(profile: UserProfile): string {
  return `${BASE_QT_INSTRUCTION}${profileSection(profile)}`;
}

export function buildQTUserMessage(ctx: QTContext): string {
  return `QT entry:
- Passage: ${ctx.book} ${ctx.passage}
- What they saw of God: ${ctx.aboutGod}
- What they saw of themselves: ${ctx.aboutSelf}
- Application: ${ctx.apply}
- Prayer: ${ctx.prayer || "(none)"}`;
}

// --- Sin: Mortification ---

export function buildMortificationSystem(profile: UserProfile, isStressDay: boolean): string {
  const stress = isStressDay ? stressSection(profile) : "";
  return `${BASE_MORTIFICATION_INSTRUCTION}${profileSection(profile)}${stress}`;
}

export function buildMortificationUserMessage(ctx: SinContext): string {
  return `Sin entry:
- Sin: ${ctx.sin}
- Emotional triggers: ${ctx.emotions.join(", ")}
- Situation: ${ctx.situation}
- Counterfeit satisfaction: ${ctx.counterfeit}
- Post-mortem cost: ${ctx.postMortem}
- Journal: ${ctx.journal || "(none)"}`;
}

// --- Day Review ---

export interface DayContext {
  moods: { energy: number; note: string; loggedAt: string }[];
  sins: { sin: string; outcome: string; whatHelped: string; situation: string }[];
  qts: { book: string; passage: string; aboutGod: string }[];
  treats: { gratitude: string }[];
  tasks: { task: string }[];
  wins: { text: string }[];
}

const MOOD_WORDS = ["", "Drained", "Low", "Okay", "Good", "Sharp"];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function buildDayReviewSystem(profile: UserProfile): string {
  return `${BASE_DAY_REVIEW_INSTRUCTION}${profileSection(profile)}`;
}

export function buildDayReviewUserMessage(ctx: DayContext): string {
  const moodLog = ctx.moods.length > 0
    ? ctx.moods.map(m => `  ${fmtTime(m.loggedAt)}: [${m.energy}/5 ${MOOD_WORDS[m.energy]}]${m.note ? ` — "${m.note}"` : ""}`).join("\n")
    : "  (none logged)";

  const sinLog = ctx.sins.length > 0
    ? ctx.sins.map(s => `  • ${s.sin} — ${s.outcome === "won" ? `WON (${s.whatHelped || "no note"})` : `lost (${s.situation || "no context"})`}`).join("\n")
    : "  (none)";

  const qtLog = ctx.qts.length > 0
    ? ctx.qts.map(q => `  ${q.book} ${q.passage}: "${q.aboutGod}"`).join("\n")
    : "  (none)";

  const treatLog = ctx.treats.length > 0
    ? ctx.treats.map(t => `  "${t.gratitude}"`).join("\n")
    : "  (none)";

  const taskLog = ctx.tasks.length > 0
    ? ctx.tasks.map(t => `  "${t.task}"`).join("\n")
    : "  (none)";

  const winLog = ctx.wins.length > 0
    ? ctx.wins.map(w => `  "${w.text}"`).join("\n")
    : "  (none)";

  return `Day summary for review:

Mood log:
${moodLog}

Temptations (Test):
${sinLog}

Quiet time (Text):
${qtLog}

Gratitude (Treat):
${treatLog}

Task committed:
${taskLog}

Triumph wins:
${winLog}`;
}

// --- Sin: Victory Debrief ---

export function buildVictorySystem(profile: UserProfile): string {
  return `${BASE_VICTORY_INSTRUCTION}${profileSection(profile)}`;
}

export function buildVictoryUserMessage(ctx: VictoryContext): string {
  return `Victory entry:
- Temptation faced: ${ctx.sin}
- Emotional state during: ${ctx.emotions.join(", ") || "(not noted)"}
- Situation: ${ctx.situation || "(not noted)"}
- What helped them win: ${ctx.whatHelped || "(not noted)"}
- How they feel now: ${ctx.howFeeling.join(", ") || "(not noted)"}`;
}

// --- Sin: Gospel Pivot ---

export function buildPivotSystem(profile: UserProfile, isStressDay: boolean): string {
  const stress = isStressDay ? stressSection(profile) : "";
  return `${BASE_PIVOT_INSTRUCTION}${profileSection(profile)}${stress}`;
}

export function buildPivotUserMessage(ctx: SinContext): string {
  return `Sin: ${ctx.sin}
Emotional trigger: ${ctx.emotions.join(", ")}
What it counterfeit-promised: ${ctx.counterfeit}`;
}
