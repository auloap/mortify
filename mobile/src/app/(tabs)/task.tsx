import { useState } from "react";
import { apiJson } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { TaskEntry } from "@/lib/types";
import { Screen, SectionDesc, Card, CardLabel, PromptBox, FormRow, TextArea, PrimaryButton, AiCard } from "@/components/ui";
import { TabColors } from "@/constants/theme";

export default function TaskTab() {
  const [task, setTask] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiText, setAiText] = useState("");

  async function submit() {
    if (!task.trim() || busy) return;
    setBusy(true); setAiText("");
    try {
      const entry = await apiJson<TaskEntry>("/api/task", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, obstacle }),
      });
      setAiText(entry.aiReflection);
      setTask(""); setObstacle("");
      showToast("Task committed ✦", TabColors.task.color);
    } catch { setAiText("Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <Screen>
      <SectionDesc>Based on what God is saying — what is the one thing to do today? Name it. Commit to it.</SectionDesc>
      <Card>
        <CardLabel>Today&apos;s Obedience</CardLabel>
        <FormRow label="The task" hint="be specific">
          <PromptBox>What is the one thing God is asking of you today?</PromptBox>
          <TextArea
            value={task}
            onChangeText={setTask}
            placeholder="e.g. Call my father. Forgive. Sit still for 10 minutes. Send the email I've been avoiding."
            minHeight={68}
          />
        </FormRow>
        <FormRow label="Why does this feel hard?" hint="optional">
          <TextArea
            value={obstacle}
            onChangeText={setObstacle}
            placeholder="What resistance, fear, or distraction is in the way?"
            minHeight={52}
          />
        </FormRow>
        <PrimaryButton
          tab="task" busy={busy} disabled={!task.trim()}
          label="Commit to This →" busyLabel="Sending you out…" onPress={submit}
        />
      </Card>
      <AiCard tab="task" label="✦ Sent with You" busy={busy} busyText="Preparing the way…" text={aiText} />
    </Screen>
  );
}
