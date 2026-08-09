import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { apiJson } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { TextEntry } from "@/lib/types";
import { Screen, SectionDesc, Card, CardLabel, PromptBox, FormRow, TextArea, TextField, PrimaryButton, AiCard } from "@/components/ui";
import { TabColors } from "@/constants/theme";

const BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

export default function TextTab() {
  const [book, setBook] = useState("");
  const [passage, setPassage] = useState("");
  const [aboutGod, setAboutGod] = useState("");
  const [aboutSelf, setAboutSelf] = useState("");
  const [apply, setApply] = useState("");
  const [prayer, setPrayer] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiText, setAiText] = useState("");

  async function submit() {
    if (!book || !aboutGod || busy) return;
    setBusy(true); setAiText("");
    try {
      const entry = await apiJson<TextEntry>("/api/qt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, passage, aboutGod, aboutSelf, apply, prayer }),
      });
      setAiText(entry.aiReflection);
      setBook(""); setPassage(""); setAboutGod(""); setAboutSelf(""); setApply(""); setPrayer("");
      showToast("QT saved 📖", TabColors.text.color);
    } catch { setAiText("Could not save. Please try again."); }
    setBusy(false);
  }

  return (
    <Screen>
      <SectionDesc>Open the Word. See God. See yourself. Carry one truth into today.</SectionDesc>
      <Card>
        <CardLabel>Today&apos;s Passage</CardLabel>

        <View style={styles.row2col}>
          <View style={styles.col}>
            <Text style={styles.label}>Book</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={book} onValueChange={setBook}>
                <Picker.Item label="— Select —" value="" />
                {BOOKS.map(b => <Picker.Item key={b} label={b} value={b} />)}
              </Picker>
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Chapter & Verses  <Text style={styles.hint}>e.g. 3:1-16</Text></Text>
            <TextField value={passage} onChangeText={setPassage} placeholder="1:1-18" />
          </View>
        </View>

        <CardLabel>Reflection</CardLabel>

        <FormRow>
          <PromptBox>What does this passage reveal about who God is?</PromptBox>
          <TextArea value={aboutGod} onChangeText={setAboutGod} placeholder="Write freely. What struck you about God here?" />
        </FormRow>
        <FormRow>
          <PromptBox>What does it reveal about you?</PromptBox>
          <TextArea value={aboutSelf} onChangeText={setAboutSelf} placeholder="What convicts, comforts, or challenges you?" />
        </FormRow>
        <FormRow>
          <PromptBox>What one truth do you want to carry into today?</PromptBox>
          <TextArea value={apply} onChangeText={setApply} placeholder="How does this change how you see or act today?" />
        </FormRow>
        <FormRow>
          <PromptBox>What do you want to say back to God right now?</PromptBox>
          <TextArea value={prayer} onChangeText={setPrayer} placeholder="Praise, confession, request — or simply sit with Him…" minHeight={56} />
        </FormRow>

        <PrimaryButton
          tab="text" busy={busy} disabled={!book || !aboutGod}
          label="Receive Reflection →" busyLabel="Reflecting with you…" onPress={submit}
        />
      </Card>
      <AiCard tab="text" label="✦ Pastoral Response" busy={busy} busyText="Sitting with what you've seen…" text={aiText} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row2col: { flexDirection: "row", gap: 12 },
  col: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: "600", color: "#333" },
  hint: { fontSize: 11, fontWeight: "400", color: "#999" },
  pickerWrap: { borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 8, overflow: "hidden" },
});
