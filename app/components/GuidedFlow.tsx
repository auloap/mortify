"use client";

import { ReactNode } from "react";
import { useMainButton, useBackButton, useSwipeLock } from "./telegram";

/**
 * The one-question-per-screen shell every flow lives in: progress bar,
 * mono breadcrumb, native BackButton/MainButton (with in-page fallbacks),
 * and a scroll area for the step body.
 */
export default function GuidedFlow({
  title, step, total, canContinue, continueLabel, tone = "grace",
  onContinue, onBack, onClose, busy = false, children, footNote,
}: {
  title: string;
  step: number;            // 1-based
  total: number;
  canContinue: boolean;
  continueLabel: string;
  tone?: "grace" | "warfare";
  onContinue: () => void;
  onBack: (() => void) | null;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
  footNote?: string;
}) {
  useSwipeLock(true);
  useMainButton({
    visible: true,
    text: busy ? "…" : continueLabel,
    disabled: !canContinue || busy,
    tone,
    onClick: onContinue,
  });
  useBackButton(true, () => (onBack ? onBack() : onClose()));

  return (
    <div className="flow">
      <div className="flow-inner">
        <div className="fbar">
          <button className="fx" onClick={onClose} aria-label="Close">✕</button>
          <span className="fmid">{title}</span>
          <span className="fnum">{step}/{total}</span>
        </div>
        <div className="fprog"><i style={{ width: `${(step / total) * 100}%` }} /></div>
        <div className="fscroll">
          {children}
          {onBack && (
            <button className="fback" onClick={onBack}>← previous question</button>
          )}
        </div>
        <div className="ffoot">
          <button
            className={`fallbackbtn${tone === "warfare" ? " rust" : ""}`}
            disabled={!canContinue || busy}
            onClick={onContinue}
          >
            {busy ? "…" : continueLabel}
          </button>
          {footNote && (
            <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--faint)", marginTop: 8 }}>
              {footNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FlowQuestion({ q, hint }: { q: string; hint?: string }) {
  return (
    <>
      <div className="fq">{q}</div>
      {hint && <div className="fhint">{hint}</div>}
    </>
  );
}
