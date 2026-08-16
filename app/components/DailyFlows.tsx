"use client";

import { useState, ReactNode } from "react";
import { tgFetch } from "@/lib/telegramFetch";
import GuidedFlow, { FlowQuestion } from "./GuidedFlow";
import { useMainButton, useBackButton, useSwipeLock, haptic } from "./telegram";
import { BOOKS, TreatEntry, TextEntry, TaskEntry, showToast } from "./shared";

// ── Shared result screen ────────────────────────────────────────────────────

export function FlowResult({ title, onDone, children }: {
  title: string;
  onDone: () => void;
  children: ReactNode;
}) {
  useSwipeLock(true);
  useMainButton({ visible: true, text: "Amen — done", tone: "grace", onClick: onDone });
  useBackButton(true, onDone);
  return (
    <div className="flow">
      <div className="flow-inner">
        <div className="fbar">
          <button className="fx" onClick={onDone} aria-label="Close">✕</button>
          <span className="fmid">{title}</span>
          <span className="fnum">✦</span>
        </div>
        <div className="fscroll">{children}</div>
        <div className="ffoot">
          <button className="fallbackbtn" onClick={onDone}>Amen — done</button>
        </div>
      </div>
    </div>
  );
}

export function AICard({ label, tone, text, loading }: {
  label: string;
  tone: "grace" | "warfare";
  text?: string;
  loading?: boolean;
}) {
  return (
    <div className={`aicard ${tone === "grace" ? "grace" : "warfare"}`}>
      <div className="ai-lbl">✦ {label}</div>
      {loading ? <div className="ai-loading">Sitting with what you&apos;ve written…</div>
        : <div className="ai-text">{text}</div>}
    </div>
  );
}

// ── Treat — one question ────────────────────────────────────────────────────

export function TreatFlow({ onSaved, onClose }: { onSaved: (e: TreatEntry) => void; onClose: () => void }) {
  const [gratitude, setGratitude] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TreatEntry | null>(null);

  async function submit() {
    if (!gratitude.trim() || busy) return;
    setBusy(true);
    try {
      const res = await tgFetch("/api/treat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gratitude }),
      });
      const entry: TreatEntry = await res.json();
      onSaved(entry);
      setResult(entry);
      haptic("success");
      showToast("Thanksgiving kept ❧", "grace");
    } catch {
      showToast("Could not save — try again", "warfare");
    }
    setBusy(false);
  }

  if (result) {
    return (
      <FlowResult title="Treat · Doxology" onDone={onClose}>
        <FlowQuestion q="See the Giver behind the gifts." />
        <AICard label="Doxology" tone="grace" text={result.aiReflection} />
      </FlowResult>
    );
  }

  return (
    <GuidedFlow
      title="Treat · Give thanks" step={1} total={1}
      canContinue={!!gratitude.trim()} continueLabel={busy ? "Offering thanks…" : "Give thanks"}
      busy={busy} onContinue={submit} onBack={null} onClose={onClose}
    >
      <FlowQuestion q="What can you thank God for today?" hint="One to three things — big or small." />
      <div className="fbody">
        <textarea
          value={gratitude} autoFocus
          onChange={e => setGratitude(e.target.value)}
          placeholder="A good conversation. Energy to get through the day. A moment of peace."
        />
      </div>
    </GuidedFlow>
  );
}

// ── Text — book, then four questions ────────────────────────────────────────

const TEXT_STEPS = [
  { key: "aboutGod",  q: "What does this passage reveal about who God is?",   hint: "Write freely — one honest thought is enough.", required: true },
  { key: "aboutSelf", q: "And what does it reveal about you?",                hint: "What convicts, comforts, or challenges you?", required: false },
  { key: "apply",     q: "What one truth will you carry into today?",         hint: "How does it change how you see, or act?", required: false },
  { key: "prayer",    q: "What do you want to say back to God right now?",    hint: "Praise, confession, request — or simply sit with Him.", required: false },
] as const;

export function TextFlow({ onSaved, onClose }: { onSaved: (e: TextEntry) => void; onClose: () => void }) {
  const [step, setStep] = useState(0); // 0 = passage, 1..4 = questions
  const [book, setBook] = useState("");
  const [passage, setPassage] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({ aboutGod: "", aboutSelf: "", apply: "", prayer: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TextEntry | null>(null);

  const total = TEXT_STEPS.length + 1;

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await tgFetch("/api/qt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, passage, ...answers }),
      });
      const entry: TextEntry = await res.json();
      onSaved(entry);
      setResult(entry);
      haptic("success");
      showToast("Quiet time kept ✜", "grace");
    } catch {
      showToast("Could not save — try again", "warfare");
    }
    setBusy(false);
  }

  if (result) {
    return (
      <FlowResult title="Text · Pastoral response" onDone={onClose}>
        <FlowQuestion q={`${result.book}${result.passage ? " " + result.passage : ""}`} />
        <AICard label="Pastoral response" tone="grace" text={result.aiReflection} />
      </FlowResult>
    );
  }

  const isLast = step === total - 1;
  const current = step > 0 ? TEXT_STEPS[step - 1] : null;
  const canContinue = step === 0 ? !!book
    : current!.required ? !!answers[current!.key].trim() : true;

  return (
    <GuidedFlow
      title={`Text${book ? " · " + book + (passage ? " " + passage : "") : " · Sit with the Word"}`}
      step={step + 1} total={total}
      canContinue={canContinue}
      continueLabel={busy ? "Reflecting with you…" : isLast ? "Receive reflection" : "Continue"}
      busy={busy}
      onContinue={() => (isLast ? submit() : setStep(s => s + 1))}
      onBack={step > 0 ? () => setStep(s => s - 1) : null}
      onClose={onClose}
      footNote={current && !current.required ? "This one is optional — continue to skip." : undefined}
    >
      {step === 0 ? (
        <>
          <FlowQuestion q="Where were you in the Word today?" hint="Book first; chapter and verses if you like." />
          <div className="fbody">
            <div className="form-2col">
              <div>
                <label>Book</label>
                <select value={book} onChange={e => setBook(e.target.value)}>
                  <option value="">— Select —</option>
                  {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label>Chapter <span className="hint">e.g. 3:1–16</span></label>
                <input type="text" value={passage} onChange={e => setPassage(e.target.value)} placeholder="34" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <FlowQuestion q={current!.q} hint={current!.hint} />
          <div className="fbody">
            <textarea
              value={answers[current!.key]} autoFocus
              onChange={e => setAnswers(a => ({ ...a, [current!.key]: e.target.value }))}
              placeholder="Write freely…"
            />
          </div>
        </>
      )}
    </GuidedFlow>
  );
}

// ── Task — the one thing, and what resists it ───────────────────────────────

export function TaskFlow({ onSaved, onClose }: { onSaved: (e: TaskEntry) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [task, setTask] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TaskEntry | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await tgFetch("/api/task", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, obstacle }),
      });
      const entry: TaskEntry = await res.json();
      onSaved(entry);
      setResult(entry);
      haptic("success");
      showToast("Task committed ✦", "grace");
    } catch {
      showToast("Could not save — try again", "warfare");
    }
    setBusy(false);
  }

  if (result) {
    return (
      <FlowResult title="Task · Sent with you" onDone={onClose}>
        <FlowQuestion q={result.task} />
        <AICard label="Sent with you" tone="grace" text={result.aiReflection} />
      </FlowResult>
    );
  }

  const isLast = step === 1;
  return (
    <GuidedFlow
      title="Task · One obedience" step={step + 1} total={2}
      canContinue={step === 0 ? !!task.trim() : true}
      continueLabel={busy ? "Sending you out…" : isLast ? "Commit to this" : "Continue"}
      busy={busy}
      onContinue={() => (isLast ? submit() : setStep(1))}
      onBack={step > 0 ? () => setStep(0) : null}
      onClose={onClose}
      footNote={isLast ? "Optional — continue to skip." : undefined}
    >
      {step === 0 ? (
        <>
          <FlowQuestion q="What is the one thing God is asking of you today?" hint="Be specific. Small and real beats grand and vague." />
          <div className="fbody">
            <textarea
              value={task} autoFocus
              onChange={e => setTask(e.target.value)}
              placeholder="Call my father. Forgive. Sit still for ten minutes. Send the email I've been avoiding."
            />
          </div>
        </>
      ) : (
        <>
          <FlowQuestion q="Why does this feel hard?" hint="Name the resistance, fear, or distraction in the way." />
          <div className="fbody">
            <textarea
              value={obstacle} autoFocus
              onChange={e => setObstacle(e.target.value)}
              placeholder="What's in the way?"
            />
          </div>
        </>
      )}
    </GuidedFlow>
  );
}
