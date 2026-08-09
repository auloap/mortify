import { useState } from "react";
import { apiJson } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { TreatEntry } from "@/lib/types";
import { Screen, SectionDesc, Card, CardLabel, PromptBox, FormRow, TextArea, PrimaryButton, AiCard } from "@/components/ui";
import { TabColors } from "@/constants/theme";

export default function TreatTab() {
  const [gratitude, setGratitude] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiText, setAiText] = useState("");

  async function submit() {
    if (!gratitude.trim() || busy) return;
    setBusy(true); setAiText("");
    try {
      const entry = await apiJson<TreatEntry>("/api/treat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gratitude }),
      });
      setAiText(entry.aiReflection);
      setGratitude("");
      showToast("Thanksgiving saved 🌿", TabColors.treat.color);
    } catch { setAiText("Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <Screen>
      <SectionDesc>Name what God has given you today — big or small. See the Giver behind the gifts.</SectionDesc>
      <Card>
        <CardLabel>Today&apos;s Gifts</CardLabel>
        <PromptBox>What can you thank God for today?</PromptBox>
        <FormRow label="Your gratitude" hint="1–3 things">
          <TextArea
            value={gratitude}
            onChangeText={setGratitude}
            placeholder="e.g. A good conversation. Energy to get through the day. A moment of peace."
          />
        </FormRow>
        <PrimaryButton
          tab="treat" busy={busy} disabled={!gratitude.trim()}
          label="Give Thanks →" busyLabel="Offering thanks…" onPress={submit}
        />
      </Card>
      <AiCard tab="treat" label="✦ Doxology" busy={busy} busyText="Seeing the Giver behind the gifts…" text={aiText} />
    </Screen>
  );
}
