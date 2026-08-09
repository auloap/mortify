import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";
import { apiJson } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { TestEntry } from "@/lib/types";
import { SINS, WIN_FEELINGS } from "@/lib/constants";
import { EmoPicker } from "@/components/emo-picker";
import { Screen, SectionDesc, Card, CardLabel, PromptBox, FormRow, TextArea, TextField, AiCard } from "@/components/ui";
import { TabColors } from "@/constants/theme";

export default function TestTab() {
  const params = useLocalSearchParams<{ sin?: string; fromGoal?: string }>();
  const [prefillDismissed, setPrefillDismissed] = useState(false);
  const prefill = !prefillDismissed && params.fromGoal ? { sin: params.sin || "", fromGoal: params.fromGoal } : null;

  // Prefill from the Triumph tab's "Fell →" flow arrives as route params,
  // already available on first render — no effect needed to sync it in.
  const [sin, setSin] = useState(() => prefill?.sin ? (SINS.includes(prefill.sin) ? prefill.sin : "Other") : "");
  const [custom, setCustom] = useState(() => prefill?.sin && !SINS.includes(prefill.sin) ? prefill.sin : "");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [situation, setSituation] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const [outcome, setOutcome] = useState<"won" | "fell" | null>(prefill?.sin ? "fell" : null);

  const [whatHelped, setWhatHelped] = useState("");
  const [howFeeling, setHowFeeling] = useState<string[]>([]);

  const [counterfeit, setCounterfeit] = useState("");
  const [postMortem, setPostMortem] = useState("");
  const [journal, setJournal] = useState("");

  const [busy, setBusy] = useState(false);
  const [aiVictory, setAiVictory] = useState("");
  const [aiReflection, setAiReflection] = useState("");
  const [aiPivot, setAiPivot] = useState("");

  const toggleEmo = (em: string) => setEmotions(p => p.includes(em) ? p.filter(x => x !== em) : [...p, em]);
  const toggleGroup = (f: string) => setOpenGroups(p => ({ ...p, [f]: !p[f] }));
  const toggleFeeling = (f: string) => setHowFeeling(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  function reset() {
    setSin(""); setCustom(""); setEmotions([]); setSituation(""); setOutcome(null);
    setWhatHelped(""); setHowFeeling([]);
    setCounterfeit(""); setPostMortem(""); setJournal("");
    setAiVictory(""); setAiReflection(""); setAiPivot("");
    setPrefillDismissed(true);
  }

  async function submit() {
    if (!sin || !outcome || busy) return;
    setBusy(true); setAiVictory(""); setAiReflection(""); setAiPivot("");
    const resolvedSin = sin === "Other" ? (custom || "Other") : sin;
    try {
      const entry = await apiJson<TestEntry>("/api/sin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sin: resolvedSin, emotions, situation, outcome,
          whatHelped, howFeeling,
          counterfeit, postMortem, journal,
          pulseEnergy: null,
          pulseFeelings: [],
          pulseContexts: [],
        }),
      });
      if (outcome === "won") setAiVictory(entry.aiVictory || "");
      else { setAiReflection(entry.aiReflection); setAiPivot(entry.aiPivot); }

      setSin(""); setCustom(""); setEmotions([]); setSituation(""); setOutcome(null);
      setWhatHelped(""); setHowFeeling([]);
      setCounterfeit(""); setPostMortem(""); setJournal("");
      setPrefillDismissed(true);
      showToast(outcome === "won" ? "Victory logged 🏆" : "Entry saved ⚔", TabColors.test.color);
    } catch {
      setAiReflection("Could not save. Please try again.");
    }
    setBusy(false);
  }

  const canSubmit = !!sin && !!outcome && !busy;
  const submitLabel = busy
    ? (outcome === "won" ? "Logging the victory…" : "Examining the heart…")
    : !outcome ? "Mark the outcome above first"
    : outcome === "won" ? "Log the Victory →"
    : "Mortify & Find the Satisfy →";

  return (
    <Screen>
      <SectionDesc>Record the temptation — win or loss. Every encounter builds your pattern.</SectionDesc>

      {prefill && (
        <View style={s.fellBanner}>
          <Text style={s.fellIcon}>⚔</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.fellTitle}>Fell on: {prefill.fromGoal}</Text>
            <Text style={s.fellText}>Log it. Name it. Bring it to the light.</Text>
          </View>
          <Pressable onPress={() => { setPrefillDismissed(true); setOutcome(null); }}>
            <Text style={s.fellClose}>✕</Text>
          </Pressable>
        </View>
      )}

      <Card>
        <CardLabel>The Temptation</CardLabel>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.label}>Temptation / sin type</Text>
            <View style={s.pickerWrap}>
              <Picker selectedValue={sin} onValueChange={setSin}>
                <Picker.Item label="— Select —" value="" />
                {SINS.map(so => <Picker.Item key={so} label={so} value={so} />)}
              </Picker>
            </View>
          </View>
          {sin === "Other" && (
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.label}>Name it specifically</Text>
              <TextField value={custom} onChangeText={setCustom} placeholder="e.g. People-pleasing" />
            </View>
          )}
        </View>

        <EmoPicker selected={emotions} openGroups={openGroups} onToggle={toggleEmo} onToggleGroup={toggleGroup} onClear={() => setEmotions([])} />

        <FormRow label="Situation / trigger" hint="optional">
          <TextArea value={situation} onChangeText={setSituation} placeholder="What was happening? Who was there? What set it off?" minHeight={52} />
        </FormRow>

        <Text style={s.outcomeHdr}>How did it go?</Text>
        <View style={s.outcomeRow}>
          <Pressable
            style={[s.outcomeBtn, outcome === "won" && { backgroundColor: "#e8f5ee", borderColor: TabColors.text.color }]}
            onPress={() => setOutcome("won")}
          >
            <Text style={s.outcomeIcon}>🏆</Text>
            <Text style={s.outcomeLbl}>Won it</Text>
          </Pressable>
          <Pressable
            style={[s.outcomeBtn, outcome === "fell" && { backgroundColor: TabColors.test.light, borderColor: TabColors.test.color }]}
            onPress={() => setOutcome("fell")}
          >
            <Text style={s.outcomeIcon}>⚔</Text>
            <Text style={s.outcomeLbl}>Lost it</Text>
          </Pressable>
        </View>

        {outcome === "won" && (
          <>
            <CardLabel>The Victory</CardLabel>
            <FormRow>
              <PromptBox>What helped you win?</PromptBox>
              <TextArea value={whatHelped} onChangeText={setWhatHelped} placeholder="Prayer, called a friend, remembered a verse, went for a walk, fled the situation…" />
            </FormRow>
            <FormRow label="How do you feel right now?" hint="pick all that apply">
              <View style={s.chipsRow}>
                {WIN_FEELINGS.map(f => (
                  <Pressable
                    key={f}
                    style={[s.feelingChip, howFeeling.includes(f) && { backgroundColor: TabColors.text.color, borderColor: TabColors.text.color }]}
                    onPress={() => toggleFeeling(f)}
                  >
                    <Text style={[s.feelingChipText, howFeeling.includes(f) && { color: "#fff" }]}>{f}</Text>
                  </Pressable>
                ))}
              </View>
            </FormRow>
          </>
        )}

        {outcome === "fell" && (
          <>
            <CardLabel>The Anatomy</CardLabel>
            <FormRow label="What did it promise?">
              <TextArea value={counterfeit} onChangeText={setCounterfeit} placeholder="What relief, comfort, or control did you expect?" minHeight={68} />
            </FormRow>
            <FormRow label="What did it actually cost?">
              <TextArea value={postMortem} onChangeText={setPostMortem} placeholder="Guilt, numbness, distance from God…" minHeight={68} />
            </FormRow>
            <FormRow label="Free journal" hint="optional">
              <TextArea value={journal} onChangeText={setJournal} placeholder="Confess, reflect, ask…" minHeight={68} />
            </FormRow>
          </>
        )}

        <Pressable
          style={[s.submitBtn, { backgroundColor: !canSubmit ? "#ccc" : outcome === "won" ? "#1a7a50" : TabColors.test.color }]}
          onPress={submit}
          disabled={!canSubmit}
        >
          <Text style={s.submitText}>{submitLabel}</Text>
        </Pressable>

        {!!(aiVictory || aiReflection) && (
          <Pressable style={s.againBtn} onPress={reset}>
            <Text style={s.againText}>Log another →</Text>
          </Pressable>
        )}
      </Card>

      {aiVictory ? (
        <View style={[s.victoryCard]}>
          <Text style={s.victoryLbl}>🏆 Victory Debrief</Text>
          <Text style={s.victoryText}>{aiVictory}</Text>
        </View>
      ) : busy && outcome === "won" ? (
        <View style={s.victoryCard}>
          <Text style={s.victoryLbl}>🏆 Victory Debrief</Text>
          <Text style={s.loadingText}>Reflecting on how you stood firm…</Text>
        </View>
      ) : null}

      {(aiReflection || (busy && outcome === "fell")) && (
        <>
          <AiCard tab="test" label="⚔ Mortification" busy={busy} busyText="Searching the Scripture…" text={aiReflection} />
          {(aiPivot || (busy && outcome === "fell")) && (
            <View style={s.pivotCard}>
              <Text style={s.pivotLbl}>✦ Gospel Pivot — What God Truly Offers</Text>
              {busy ? <Text style={s.loadingText}>Finding the true satisfaction…</Text> : <Text style={s.pivotText}>{aiPivot}</Text>}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: "#333" },
  pickerWrap: { borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 8, overflow: "hidden" },
  fellBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fbeae8", borderWidth: 1, borderColor: "#f0b8b0", borderRadius: 10, padding: 12 },
  fellIcon: { fontSize: 20 },
  fellTitle: { fontSize: 13, fontWeight: "700", color: "#9b2c1a" },
  fellText: { fontSize: 12, color: "#9b2c1a" },
  fellClose: { fontSize: 16, color: "#9b2c1a", padding: 4 },
  outcomeHdr: { fontSize: 12, fontWeight: "600", color: "#333", marginTop: 4 },
  outcomeRow: { flexDirection: "row", gap: 10 },
  outcomeBtn: { flex: 1, alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 10, paddingVertical: 14 },
  outcomeIcon: { fontSize: 22 },
  outcomeLbl: { fontSize: 12, fontWeight: "600", color: "#333" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  feelingChip: { borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  feelingChipText: { fontSize: 11, color: "#444" },
  submitBtn: { borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  againBtn: { marginTop: 4, padding: 10, borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 8, alignItems: "center" },
  againText: { fontSize: 11, color: "#888" },
  victoryCard: { backgroundColor: "#e8f5ee", borderWidth: 1, borderColor: "#a8d9bf", borderRadius: 12, padding: 16, gap: 8 },
  victoryLbl: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, color: "#1a7a50" },
  victoryText: { fontSize: 14, lineHeight: 22, color: "#222" },
  pivotCard: { backgroundColor: "#f0ebff", borderWidth: 1, borderColor: "#c4b5fd", borderRadius: 12, padding: 16, gap: 8 },
  pivotLbl: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, color: "#6d28d9" },
  pivotText: { fontSize: 14, lineHeight: 22, color: "#222" },
  loadingText: { fontSize: 13, color: "#666", fontStyle: "italic" },
});
