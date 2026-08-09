import { ReactNode } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, TextInputProps } from "react-native";
import { TabColors, TabName } from "@/constants/theme";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function SectionDesc({ children }: { children: ReactNode }) {
  return <Text style={s.sectionDesc}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

export function CardLabel({ children }: { children: ReactNode }) {
  return <Text style={s.cardLabel}>{children}</Text>;
}

export function PromptBox({ children }: { children: ReactNode }) {
  return <Text style={s.promptBox}>{children}</Text>;
}

export function FormRow({ label, hint, children }: { label?: string; hint?: string; children: ReactNode }) {
  return (
    <View style={s.formRow}>
      {label ? (
        <Text style={s.label}>
          {label}
          {hint ? <Text style={s.hint}>  {hint}</Text> : null}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function TextArea(props: TextInputProps & { minHeight?: number }) {
  const { minHeight = 88, style, ...rest } = props;
  return (
    <TextInput
      style={[s.input, { minHeight, textAlignVertical: "top" }, style]}
      multiline
      placeholderTextColor="#999"
      {...rest}
    />
  );
}

export function TextField(props: TextInputProps) {
  return <TextInput style={s.input} placeholderTextColor="#999" {...props} />;
}

export function PrimaryButton({ tab, label, busyLabel, busy, disabled, onPress }: {
  tab: TabName; label: string; busyLabel: string; busy: boolean; disabled: boolean; onPress: () => void;
}) {
  const color = TabColors[tab].color;
  const isDisabled = disabled || busy;
  return (
    <Pressable
      style={[s.button, { backgroundColor: isDisabled ? "#ccc" : color }]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <Text style={s.buttonText}>{busy ? busyLabel : label}</Text>
    </Pressable>
  );
}

export function AiCard({ tab, label, busy, busyText, text }: {
  tab: TabName; label: string; busy: boolean; busyText: string; text: string;
}) {
  const c = TabColors[tab];
  if (!busy && !text) return null;
  return (
    <View style={[s.aiCard, { backgroundColor: c.light, borderColor: c.border }]}>
      <Text style={[s.aiLabel, { color: c.color }]}>{label}</Text>
      {busy
        ? <Text style={s.aiLoading}>{busyText}</Text>
        : <Text style={s.aiText}>{text}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f5f5" },
  screenContent: { padding: 16, paddingBottom: 40, gap: 14 },
  sectionDesc: { fontSize: 13, color: "#666", fontStyle: "italic", lineHeight: 19 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: "#e5e5e5" },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: "#333" },
  promptBox: { fontSize: 13, color: "#555", fontStyle: "italic" },
  formRow: { gap: 6 },
  label: { fontSize: 12, fontWeight: "600", color: "#333" },
  hint: { fontSize: 11, fontWeight: "400", color: "#999" },
  input: {
    borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 8, padding: 12,
    fontSize: 14, color: "#111", backgroundColor: "#fff",
  },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  aiCard: { borderRadius: 12, padding: 16, borderWidth: 1, gap: 8 },
  aiLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  aiLoading: { fontSize: 13, color: "#666", fontStyle: "italic" },
  aiText: { fontSize: 14, lineHeight: 22, color: "#222" },
});
