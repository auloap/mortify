export interface TreatEntry { id: number; date: string; gratitude: string; aiReflection: string; }

export interface TextEntry {
  id: number; date: string; book: string; passage: string;
  aboutGod: string; aboutSelf: string; apply: string; prayer: string;
  aiReflection: string;
}

export interface TaskEntry { id: number; date: string; task: string; obstacle: string; aiReflection: string; }

export interface TestEntry {
  id: number; date: string; sin: string; emotions: string[]; situation: string;
  counterfeit: string; postMortem: string; journal: string;
  aiReflection: string; aiPivot: string;
  pulseEnergy?: number | null; pulseFeelings?: string[]; pulseContexts?: string[];
  outcome?: "won" | "fell"; whatHelped?: string; howFeeling?: string[]; aiVictory?: string;
}

export interface MoodEntry { id: number; date: string; energy: number; note: string; loggedAt: string; }

export interface TriumphGoal {
  id: number; name: string; type: "do" | "resist"; icon: string;
  linkedSin: string; autoTab: "text" | "treat" | "task" | ""; isDefault: boolean; createdAt: string;
}
export interface DoLog { id: number; goalId: number; date: string; loggedAt: string; }
export interface ResistLog { id: number; goalId: number; date: string; outcome: "won" | "skip" | "fell"; pulseEnergy: number | null; loggedAt: string; }
export interface TriumphWin { id: number; text: string; date: string; createdAt: string; }
export interface TriumphData {
  goals: TriumphGoal[]; doLogs: DoLog[]; resistLogs: ResistLog[]; wins: TriumphWin[];
  autoDates: { text: string[]; treat: string[]; task: string[] };
}

export const EMPTY_TRIUMPH: TriumphData = { goals: [], doLogs: [], resistLogs: [], wins: [], autoDates: { text: [], treat: [], task: [] } };
