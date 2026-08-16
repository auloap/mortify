"use client";

import { useState } from "react";
import { tgFetch } from "@/lib/telegramFetch";
import GuidedFlow, { FlowQuestion } from "./GuidedFlow";
import { FlowResult, AICard } from "./DailyFlows";
import { useMainButton, useBackButton, useSwipeLock, haptic } from "./telegram";
import { EMOTION_GROUPS, SINS, SOS_PULLS, WIN_FEELINGS, TestEntry, showToast } from "./shared";

export type TemptedPrefill = { sin: string; fromGoal: string } | null;

// ── Families-first emotion picker ───────────────────────────────────────────

function EmoFamilies({ selected, onToggle }: {
  selected: string[];
  onToggle: (em: string) => void;
}) {
  const [openFamily, setOpenFamily] = useState<string | null>(null);
  const open = EMOTION_GROUPS.find(g => g.family === openFamily) || null;

  return (
    <>
      <div className="famgrid">
        {EMOTION_GROUPS.map(g => {
          const count = g.emotions.filter(e => selected.includes(e)).length;
          return (
            <button
              key={g.family}
              className={`fam${count > 0 ? " picked" : ""}`}
              style={{ "--famc": g.color } as React.CSSProperties}
              onClick={() => setOpenFamily(g.family)}
            >
              <i style={{ background: g.color }} />
              {g.family}
              {count > 0 && <span className="fcount">{count}</span>}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="emo-selected">
          {selected.map(em => {
            const color = EMOTION_GROUPS.find(g => g.emotions.includes(em))?.color || "#8a7d69";
            return (
              <button key={em} className="emo-pill" style={{ background: color }} onClick={() => onToggle(em)}>
                {em} ✕
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpenFamily(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sh-t"><i style={{ background: open.color }} />{open.family}</div>
            <div className="chiprow">
              {open.emotions.map(em => (
                <button
                  key={em}
                  className={`chip${selected.includes(em) ? " on" : ""}`}
                  style={selected.includes(em) ? { background: open.color, borderColor: open.color, color: "#fff" } : undefined}
                  onClick={() => onToggle(em)}
                >{em}</button>
              ))}
            </div>
            <button className="sh-go" onClick={() => setOpenFamily(null)}>That&apos;s the one →</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── The flow ────────────────────────────────────────────────────────────────

type Stage = "fork" | "sos" | "anatomy";

export default function TemptedFlow({ prefill, onSaved, onClose }: {
  prefill: TemptedPrefill;
  onSaved: (e: TestEntry) => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>(prefill ? "anatomy" : "fork");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TestEntry | null>(null);

  // anatomy state
  const [step, setStep] = useState(0);
  const [sin, setSin] = useState(prefill ? (SINS.includes(prefill.sin) ? prefill.sin : "Other") : "");
  const [custom, setCustom] = useState(prefill && !SINS.includes(prefill.sin) ? prefill.sin : "");
  const [outcome, setOutcome] = useState<"won" | "fell" | null>(prefill ? "fell" : null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [situation, setSituation] = useState("");
  const [whatHelped, setWhatHelped] = useState("");
  const [howFeeling, setHowFeeling] = useState<string[]>([]);
  const [counterfeit, setCounterfeit] = useState("");
  const [postMortem, setPostMortem] = useState("");
  const [journal, setJournal] = useState("");

  // SOS state
  const [pull, setPull] = useState("");

  const resolvedSin = sin === "Other" ? (custom.trim() || "Other") : sin;
  const toggleEmo = (em: string) => setEmotions(p => p.includes(em) ? p.filter(x => x !== em) : [...p, em]);
  const toggleFeel = (f: string) => setHowFeeling(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  async function post(body: Record<string, unknown>): Promise<TestEntry | null> {
    try {
      const res = await tgFetch("/api/sin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emotions: [], situation: "", counterfeit: "", postMortem: "", journal: "",
          whatHelped: "", howFeeling: [], pulseEnergy: null, pulseFeelings: [], pulseContexts: [],
          ...body,
        }),
      });
      return await res.json();
    } catch {
      showToast("Could not save — try again", "warfare");
      return null;
    }
  }

  async function submitStand() {
    if (busy) return;
    setBusy(true);
    const entry = await post({
      sin: pull || "Unnamed pull",
      outcome: "won",
      situation: "In the moment — took the SOS pause",
      whatHelped: "Stopped, breathed, named the pull, and stood",
    });
    if (entry) {
      onSaved(entry);
      setResult(entry);
      haptic("success");
      showToast("Victory logged 🏆", "grace");
    }
    setBusy(false);
  }

  async function submitAnatomy() {
    if (busy || !outcome) return;
    setBusy(true);
    const entry = await post({
      sin: resolvedSin, outcome, emotions, situation,
      whatHelped, howFeeling, counterfeit, postMortem, journal,
    });
    if (entry) {
      onSaved(entry);
      setResult(entry);
      haptic(outcome === "won" ? "success" : "warning");
      showToast(outcome === "won" ? "Victory logged 🏆" : "Brought into the light ⚔", outcome === "won" ? "grace" : "warfare");
    }
    setBusy(false);
  }

  // ── Result ──
  if (result) {
    const won = result.outcome === "won";
    return (
      <FlowResult title={won ? "Test · Victory" : "Test · Mortify"} onDone={onClose}>
        <FlowQuestion
          q={won ? "You stood. Remember how this feels." : "Named, and brought into the light."}
          hint={won ? undefined : "No condemnation for those in Christ Jesus. Now — the pivot."}
        />
        {won
          ? <AICard label="Victory debrief" tone="grace" text={result.aiVictory || result.aiReflection} />
          : <>
              {result.aiReflection && <AICard label="Mortification" tone="warfare" text={result.aiReflection} />}
              {result.aiPivot && <AICard label="Gospel pivot — what God truly offers" tone="grace" text={result.aiPivot} />}
            </>}
      </FlowResult>
    );
  }

  // ── Fork ──
  if (stage === "fork") return <Fork onNow={() => setStage("sos")} onAfter={() => setStage("anatomy")} onClose={onClose} />;

  // ── SOS ──
  if (stage === "sos") {
    return (
      <SOS
        pull={pull} setPull={setPull} busy={busy}
        onStand={submitStand}
        onFell={() => {
          if (pull) { setSin(SINS.includes(pull) ? pull : "Other"); if (!SINS.includes(pull)) setCustom(pull); }
          setOutcome("fell");
          setStage("anatomy");
        }}
        onClose={onClose}
      />
    );
  }

  // ── Anatomy — one question per screen ──
  const branch: ("whatHelped" | "howFeeling" | "counterfeit" | "postMortem" | "journal")[] =
    outcome === "won" ? ["whatHelped", "howFeeling"] : ["counterfeit", "postMortem", "journal"];
  const steps = ["sin", "outcome", "emotions", "situation", ...branch];
  const total = steps.length;
  const key = steps[step];
  const isLast = step === total - 1;

  const canContinue =
    key === "sin" ? !!resolvedSin && !!sin
    : key === "outcome" ? !!outcome
    : key === "counterfeit" ? !!counterfeit.trim()
    : key === "postMortem" ? !!postMortem.trim()
    : key === "whatHelped" ? !!whatHelped.trim()
    : true;

  const continueLabel = busy
    ? (outcome === "won" ? "Logging the victory…" : "Examining the heart…")
    : isLast ? (outcome === "won" ? "Log the victory" : "Mortify & find the true satisfaction")
    : "Continue";

  return (
    <GuidedFlow
      title={prefill ? `Test · Fell on ${prefill.fromGoal}` : "Test · Afterwards"}
      step={step + 1} total={total}
      canContinue={canContinue}
      continueLabel={continueLabel}
      tone={outcome === "won" ? "grace" : "warfare"}
      busy={busy}
      onContinue={() => (isLast ? submitAnatomy() : setStep(s => s + 1))}
      onBack={step > 0 ? () => setStep(s => s - 1) : null}
      onClose={onClose}
      footNote={key === "situation" || key === "journal" || key === "howFeeling" ? "Optional — continue to skip." : undefined}
    >
      {key === "sin" && (
        <>
          <FlowQuestion q="Name the temptation." hint="Naming it takes away half its power." />
          <div className="fbody">
            <div className="chiprow">
              {SINS.map(s => (
                <button key={s} className={`chip${sin === s ? " on" : ""}`} onClick={() => setSin(s)}>{s}</button>
              ))}
            </div>
            {sin === "Other" && (
              <div style={{ marginTop: 12 }}>
                <label>Name it specifically</label>
                <input type="text" value={custom} autoFocus onChange={e => setCustom(e.target.value)} placeholder="e.g. People-pleasing" />
              </div>
            )}
          </div>
        </>
      )}

      {key === "outcome" && (
        <>
          <FlowQuestion q="How did it go?" hint="Honesty is the whole point. Both answers build your pattern." />
          <div className="fbody outcomegrid">
            <button className={`outcome-big won${outcome === "won" ? " sel" : ""}`} onClick={() => setOutcome("won")}>
              <span className="oi">🏆</span><span className="ol">I stood</span>
              <div className="os">By grace, it didn&apos;t take me</div>
            </button>
            <button className={`outcome-big fell${outcome === "fell" ? " sel" : ""}`} onClick={() => setOutcome("fell")}>
              <span className="oi">⚔</span><span className="ol">It took me</span>
              <div className="os">Bring it into the light</div>
            </button>
          </div>
        </>
      )}

      {key === "emotions" && (
        <>
          <FlowQuestion q="What was underneath it?" hint="Pick the family first — the exact word can wait." />
          <div className="fbody">
            <EmoFamilies selected={emotions} onToggle={toggleEmo} />
          </div>
        </>
      )}

      {key === "situation" && (
        <>
          <FlowQuestion q="What was the situation?" hint="Where were you, who was there, what set it off?" />
          <div className="fbody">
            <textarea value={situation} autoFocus onChange={e => setSituation(e.target.value)} placeholder="Late night, alone, scrolling…" />
          </div>
        </>
      )}

      {key === "whatHelped" && (
        <>
          <FlowQuestion q="What helped you stand?" hint="Prayer, a verse, a friend, a walk, fleeing the room — name the weapon." />
          <div className="fbody">
            <textarea value={whatHelped} autoFocus onChange={e => setWhatHelped(e.target.value)} placeholder="I put the phone in the other room and prayed the Psalm from this morning." />
          </div>
        </>
      )}

      {key === "howFeeling" && (
        <>
          <FlowQuestion q="How do you feel right now?" hint="Pick all that apply." />
          <div className="fbody chiprow">
            {WIN_FEELINGS.map(f => (
              <button key={f} className={`chip${howFeeling.includes(f) ? " on grace" : ""}`} onClick={() => toggleFeel(f)}>{f}</button>
            ))}
          </div>
        </>
      )}

      {key === "counterfeit" && (
        <>
          <FlowQuestion q="What did it promise you?" hint="The relief, comfort, or control you expected." />
          <div className="fbody">
            <textarea value={counterfeit} autoFocus onChange={e => setCounterfeit(e.target.value)} placeholder="Rest. Escape. Feeling wanted. Being in control." />
          </div>
        </>
      )}

      {key === "postMortem" && (
        <>
          <FlowQuestion q="And what did it actually cost?" hint="The honest post-mortem." />
          <div className="fbody">
            <textarea value={postMortem} autoFocus onChange={e => setPostMortem(e.target.value)} placeholder="Guilt. Numbness. Distance from God. The morning after." />
          </div>
        </>
      )}

      {key === "journal" && (
        <>
          <FlowQuestion q="Anything else to bring to Him?" hint="Confess, reflect, ask — freely." />
          <div className="fbody">
            <textarea value={journal} autoFocus onChange={e => setJournal(e.target.value)} placeholder="Write freely…" />
          </div>
        </>
      )}
    </GuidedFlow>
  );
}

// ── Fork screen ─────────────────────────────────────────────────────────────

function Fork({ onNow, onAfter, onClose }: { onNow: () => void; onAfter: () => void; onClose: () => void }) {
  useSwipeLock(true);
  useBackButton(true, onClose);
  useMainButton({ visible: false, text: "", onClick: () => {} });
  return (
    <div className="flow">
      <div className="flow-inner">
        <div className="fbar">
          <button className="fx" onClick={onClose} aria-label="Close">✕</button>
          <span className="fmid">Test · Temptation</span>
          <span className="fnum">⚔</span>
        </div>
        <div className="forkwrap">
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div className="fq" style={{ fontSize: "1.8rem" }}>You made it here.</div>
            <div className="fhint" style={{ marginTop: 6 }}>That&apos;s already resistance. Where are you?</div>
          </div>
          <button className="bigbtn fill" onClick={onNow}>
            <span className="bt">I&apos;m in it right now</span>
            <span className="bs">Help me stand — sixty seconds, no typing</span>
          </button>
          <button className="bigbtn ghost" onClick={onAfter}>
            <span className="bt">It&apos;s passed</span>
            <span className="bs">Log it honestly — win or loss</span>
          </button>
          <div className="forkfoot">Either way: no shame. This is training.</div>
        </div>
      </div>
    </div>
  );
}

// ── SOS screen — always night, whatever the theme ───────────────────────────

function SOS({ pull, setPull, busy, onStand, onFell, onClose }: {
  pull: string;
  setPull: (s: string) => void;
  busy: boolean;
  onStand: () => void;
  onFell: () => void;
  onClose: () => void;
}) {
  useSwipeLock(true);
  useBackButton(true, onClose);
  useMainButton({
    visible: true,
    text: busy ? "…" : "I'm standing — log the win",
    tone: "grace",
    disabled: busy,
    onClick: onStand,
  });
  return (
    <div className="flow sos">
      <div className="flow-inner">
        <div className="fbar">
          <button className="fx" onClick={onClose} aria-label="Close">✕</button>
          <span className="fmid">Stand</span>
          <span className="fnum">⚔</span>
        </div>
        <div className="fscroll">
          <div className="sos-ringwrap"><div className="sos-ring"><span className="sb">breathe</span></div></div>
          <div className="sos-cue">In, four counts · out, four counts</div>
          <div className="sos-verse">
            <div className="vx">&ldquo;No temptation has overtaken you that is not common to man… with the temptation He will also provide the way of escape.&rdquo;</div>
            <div className="vc">1 Corinthians 10:13</div>
          </div>
          <div className="sos-chips">
            {SOS_PULLS.map(p => (
              <button key={p} className={`chip${pull === p ? " on" : ""}`} onClick={() => setPull(pull === p ? "" : p)}>{p}</button>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--faint)", marginTop: 10 }}>
            Name what&apos;s pulling — or don&apos;t. Standing counts either way.
          </div>
        </div>
        <div className="ffoot">
          <button className="fallbackbtn" disabled={busy} onClick={onStand}>
            {busy ? "…" : "I'm standing — log the win"}
          </button>
          <div className="sos-foot">
            <button className="sos-fell" onClick={onFell}>It already took me — log it honestly</button>
          </div>
        </div>
      </div>
    </div>
  );
}
