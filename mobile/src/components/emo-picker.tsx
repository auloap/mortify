import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { EMOTION_GROUPS, EMO_DEFAULT_VISIBLE } from "@/lib/constants";
import { emotionColor } from "@/lib/helpers";

export function EmoPicker({ selected, openGroups, onToggle, onToggleGroup, onClear }: {
  selected: string[];
  openGroups: Record<string, boolean>;
  onToggle: (em: string) => void;
  onToggleGroup: (f: string) => void;
  onClear: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleGroups = showAll ? EMOTION_GROUPS : EMOTION_GROUPS.slice(0, EMO_DEFAULT_VISIBLE);
  const hiddenCount = EMOTION_GROUPS.length - EMO_DEFAULT_VISIBLE;
  const hiddenSelected = selected.filter(em =>
    EMOTION_GROUPS.slice(EMO_DEFAULT_VISIBLE).some(g => g.emotions.includes(em))
  ).length;

  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>Emotional state at the time</Text>
      <View style={{ gap: 6 }}>
        {visibleGroups.map(g => {
          const selCount = g.emotions.filter(e => selected.includes(e)).length;
          const isOpen = !!openGroups[g.family];
          return (
            <View style={s.group} key={g.family}>
              <Pressable style={s.groupHdr} onPress={() => onToggleGroup(g.family)}>
                <View style={s.groupLeft}>
                  <View style={[s.dot, { backgroundColor: g.color }]} />
                  <Text style={s.familyLabel}>{g.family}</Text>
                  {selCount > 0 && <Text style={s.selCount}>{selCount} selected</Text>}
                </View>
                <Text style={s.arrow}>{isOpen ? "▼" : "▶"}</Text>
              </Pressable>
              {isOpen && (
                <View style={s.chipsRow}>
                  {g.emotions.map(em => {
                    const on = selected.includes(em);
                    return (
                      <Pressable
                        key={em}
                        style={[s.chip, on && { backgroundColor: g.color, borderColor: g.color }]}
                        onPress={() => onToggle(em)}
                      >
                        <Text style={[s.chipText, on && s.chipTextOn]}>{em}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        <Pressable style={s.expandBtn} onPress={() => setShowAll(v => !v)}>
          <Text style={s.expandText}>
            {showAll
              ? "Show less ▲"
              : `${hiddenCount} more categories${hiddenSelected > 0 ? ` · ${hiddenSelected} selected` : ""} ▼`}
          </Text>
        </Pressable>
      </View>

      {selected.length > 0 && (
        <View style={s.summary}>
          {selected.map(em => (
            <Pressable key={em} style={[s.pill, { backgroundColor: emotionColor(em) }]} onPress={() => onToggle(em)}>
              <Text style={s.pillText}>{em} ✕</Text>
            </Pressable>
          ))}
          <Pressable onPress={onClear}>
            <Text style={s.clear}>clear all</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: "#333" },
  group: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, overflow: "hidden" },
  groupHdr: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, backgroundColor: "#fafafa" },
  groupLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  familyLabel: { fontSize: 12, fontWeight: "600", color: "#333" },
  selCount: { fontSize: 10, color: "#888" },
  arrow: { fontSize: 10, color: "#999" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 10 },
  chip: { borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  chipText: { fontSize: 11, color: "#444" },
  chipTextOn: { color: "#fff", fontWeight: "600" },
  expandBtn: { borderWidth: 1.5, borderColor: "#e5e5e5", borderStyle: "dashed", borderRadius: 8, padding: 8, alignItems: "center" },
  expandText: { fontSize: 11, color: "#888" },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  pill: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  pillText: { fontSize: 11, color: "#fff", fontWeight: "500" },
  clear: { fontSize: 11, color: "#999", textDecorationLine: "underline" },
});
