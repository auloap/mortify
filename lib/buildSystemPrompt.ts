import { getProfilePrompt, getStressNote, EnneagramType } from "./prompts/profile-layer";
import {
  BASE_QT_INSTRUCTION,
  BASE_MORTIFICATION_INSTRUCTION,
  BASE_PIVOT_INSTRUCTION,
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
