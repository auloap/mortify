import { useState, useCallback } from "react";
import { View, Text, Pressable, TextInput, Modal, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { apiFetch, apiJson } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { TriumphData, TriumphGoal, DoLog, ResistLog, TriumphWin, EMPTY_TRIUMPH } from "@/lib/types";
import { GOAL_ICONS, SIN_CHIPS } from "@/lib/constants";
import { calcStreak, winStats, fmt } from "@/lib/helpers";
import { Screen, SectionDesc } from "@/components/ui";
import { TabColors } from "@/constants/theme";

export default function TriumphTab() {
  const [data, setData] = useState<TriumphData>(EMPTY_TRIUMPH);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddWin, setShowAddWin] = useState(false);
  const [addType, setAddType] = useState<"do" | "resist">("do");
  const [goalName, setGoalName] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [linkedSin, setLinkedSin] = useState("");
  const [winText, setWinText] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingWin, setSavingWin] = useState(false);
  const [pressedGoal, setPressedGoal] = useState<TriumphGoal | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    try {
      const fresh = await apiJson<TriumphData>("/api/triumph");
      setData(fresh);
    } catch { /* keep showing last-known data */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function doGoalDates(goal: TriumphGoal): string[] {
    if (goal.autoTab === "text")  return data.autoDates.text;
    if (goal.autoTab === "treat") return data.autoDates.treat;
    if (goal.autoTab === "task")  return data.autoDates.task;
    return data.doLogs.filter(l => l.goalId === goal.id).map(l => l.date);
  }

  function isDoneToday(goal: TriumphGoal): boolean {
    if (goal.autoTab) return doGoalDates(goal).includes(today);
    return data.doLogs.some(l => l.goalId === goal.id && l.date === today);
  }

  async function toggleDo(goal: TriumphGoal) {
    if (goal.autoTab) return;
    try {
      const json = await apiJson<{ toggled: boolean; log: DoLog }>("/api/triumph/do-log", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id }),
      });
      setData(d => ({
        ...d,
        doLogs: json.toggled
          ? [...d.doLogs, json.log]
          : d.doLogs.filter(l => !(l.goalId === goal.id && l.date === today)),
      }));
      showToast(json.toggled ? "Done! 🔥" : "Unmarked", TabColors.triumph.color);
    } catch { showToast("Could not save. Please try again.", "#b94040"); }
  }

  async function logResist(goal: TriumphGoal, outcome: "won" | "skip" | "fell") {
    if (outcome === "fell") {
      await apiFetch("/api/triumph/resist-log", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id, outcome }),
      });
      router.push({ pathname: "/(tabs)/test", params: { sin: goal.linkedSin || "Other", fromGoal: goal.name } });
      return;
    }
    try {
      const log = await apiJson<ResistLog>("/api/triumph/resist-log", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id, outcome }),
      });
      setData(d => ({ ...d, resistLogs: [...d.resistLogs, log] }));
      showToast(outcome === "won" ? "Victory logged! 🏆" : "Skipped ·", TabColors.triumph.color);
    } catch { showToast("Could not save. Please try again.", "#b94040"); }
  }

  async function addGoal() {
    if (!goalName.trim() || savingGoal) return;
    setSavingGoal(true);
    try {
      const goal = await apiJson<TriumphGoal>("/api/triumph/goals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: goalName, type: addType, icon: goalIcon, linkedSin }),
      });
      setData(d => ({ ...d, goals: [...d.goals, goal] }));
      setGoalName(""); setGoalIcon("🎯"); setLinkedSin(""); setShowAddGoal(false);
      showToast("Goal added 🎯", TabColors.triumph.color);
    } catch { showToast("Could not save. Please try again.", "#b94040"); }
    setSavingGoal(false);
  }

  async function delGoal(id: number) {
    await apiFetch(`/api/triumph/goals/${id}`, { method: "DELETE" });
    setData(d => ({
      ...d,
      goals: d.goals.filter(g => g.id !== id),
      doLogs: d.doLogs.filter(l => l.goalId !== id),
      resistLogs: d.resistLogs.filter(l => l.goalId !== id),
    }));
  }

  async function addWin() {
    if (!winText.trim() || savingWin) return;
    setSavingWin(true);
    try {
      const win = await apiJson<TriumphWin>("/api/triumph/wins", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: winText }),
      });
      setData(d => ({ ...d, wins: [win, ...d.wins] }));
      setWinText(""); setShowAddWin(false);
      showToast("Win recorded! ⭐", TabColors.triumph.color);
    } catch { showToast("Could not save. Please try again.", "#b94040"); }
    setSavingWin(false);
  }

  async function delWin(id: number) {
    await apiFetch(`/api/triumph/wins/${id}`, { method: "DELETE" });
    setData(d => ({ ...d, wins: d.wins.filter(w => w.id !== id) }));
  }

  const doGoals = data.goals.filter(g => g.type === "do");
  const resistGoals = data.goals.filter(g => g.type === "resist");

  return (
    <Screen>
      <SectionDesc>Track your growth — streaks, victories, wins. Every step of faithfulness counts.</SectionDesc>

      {/* Do Goals */}
      <View style={s.section}>
        <Text style={s.sectionHdr}>🔥 Do Goals — Daily Habits</Text>
        {doGoals.map(goal => {
          const streak = calcStreak(doGoalDates(goal));
          const done = isDoneToday(goal);
          const isAuto = !!goal.autoTab;
          return (
            <Pressable
              key={goal.id}
              style={[s.doGoal, done && s.doGoalDone]}
              onLongPress={() => setPressedGoal(goal)}
              delayLongPress={600}
            >
              <View style={s.doGoalStreak}>
                <Text style={{ fontSize: 18 }}>🔥</Text>
                <Text style={s.doGoalStreakNum}>{streak}</Text>
                <Text style={s.doGoalStreakLbl}>day streak</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.doGoalName}>{goal.icon} {goal.name}</Text>
                <Text style={s.doGoalSub}>
                  {isAuto
                    ? `Auto-tracked from ${goal.autoTab.charAt(0).toUpperCase() + goal.autoTab.slice(1)} tab`
                    : done ? "Done today ✓" : "Not done yet today"}
                </Text>
              </View>
              {!isAuto && (
                <Pressable style={[s.doCheck, done && { backgroundColor: TabColors.triumph.color, borderColor: TabColors.triumph.color }]} onPress={() => toggleDo(goal)}>
                  {done && <Text style={{ color: "#fff" }}>✓</Text>}
                </Pressable>
              )}
              {isAuto && done && (
                <View style={[s.doCheck, { backgroundColor: TabColors.triumph.color, borderColor: TabColors.triumph.color }]}>
                  <Text style={{ color: "#fff" }}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {!showAddGoal && (
          <Pressable style={s.addBar} onPress={() => { setAddType("do"); setShowAddGoal(true); }}>
            <Text style={s.addPrompt}>＋ Add a daily Do goal…</Text>
          </Pressable>
        )}
      </View>

      {/* Resist Goals */}
      <View style={s.section}>
        <Text style={s.sectionHdr}>🛡 Resist Goals — Win Rate</Text>
        {resistGoals.length === 0 && <Text style={s.emptyText}>No resist goals yet. Add one below.</Text>}
        {resistGoals.map(goal => {
          const { wins, total, pct } = winStats(data.resistLogs, goal.id);
          const todayLogs = data.resistLogs.filter(l => l.goalId === goal.id && l.date === today);
          const todayOutcome = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1].outcome : null;
          return (
            <Pressable key={goal.id} style={s.resistGoal} onLongPress={() => setPressedGoal(goal)} delayLongPress={600}>
              <View style={s.resistHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.doGoalName}>{goal.icon} {goal.name}</Text>
                  <Text style={s.doGoalSub}>{total > 0 ? `${wins} wins out of ${total} encounters` : "No encounters logged yet"}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.resistPct}>{pct}%</Text>
                  <Text style={s.doGoalSub}>win rate</Text>
                </View>
              </View>
              <View style={s.resistTrack}>
                <View style={[s.resistFill, { width: `${pct}%` }]} />
              </View>
              <View style={s.resistActions}>
                {(["won", "skip", "fell"] as const).map(outcome => (
                  <Pressable
                    key={outcome}
                    style={[
                      s.resistBtn,
                      todayOutcome === outcome && { backgroundColor: TabColors.triumph.light, borderColor: TabColors.triumph.color },
                    ]}
                    onPress={() => logResist(goal, outcome)}
                  >
                    <Text style={s.resistBtnText}>{outcome === "won" ? "🏆 Won" : outcome === "skip" ? "· Skip" : "⚔ Fell →"}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          );
        })}

        {!showAddGoal && (
          <Pressable style={s.addBar} onPress={() => { setAddType("resist"); setShowAddGoal(true); }}>
            <Text style={s.addPrompt}>＋ Add a Resist goal…</Text>
          </Pressable>
        )}
      </View>

      {/* Add Goal form */}
      {showAddGoal && (
        <View style={s.addForm}>
          <View style={s.typeToggle}>
            <Pressable style={[s.typeBtn, addType === "do" && s.typeBtnActive]} onPress={() => setAddType("do")}>
              <Text style={s.typeBtnText}>🔥 Do Goal</Text>
            </Pressable>
            <Pressable style={[s.typeBtn, addType === "resist" && s.typeBtnActive]} onPress={() => setAddType("resist")}>
              <Text style={s.typeBtnText}>🛡 Resist Goal</Text>
            </Pressable>
          </View>

          <Text style={s.label}>Icon</Text>
          <View style={s.iconGrid}>
            {GOAL_ICONS.map(ic => (
              <Pressable
                key={ic}
                style={[s.iconBtn, goalIcon === ic && { borderColor: TabColors.triumph.color, backgroundColor: TabColors.triumph.light }]}
                onPress={() => setGoalIcon(ic)}
              >
                <Text style={{ fontSize: 16 }}>{ic}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>{addType === "do" ? "Habit name" : "What are you resisting?"}</Text>
          <TextInput
            style={s.input}
            value={goalName}
            onChangeText={setGoalName}
            placeholder={addType === "do" ? "e.g. Morning walk, Cold shower…" : "e.g. Social media, Overeating…"}
            onSubmitEditing={addGoal}
          />

          {addType === "resist" && (
            <>
              <Text style={s.label}>Linked sin type <Text style={s.hint}>optional — for &quot;Fell →&quot; pre-fill</Text></Text>
              <View style={s.chipsRow}>
                {SIN_CHIPS.map(sc => (
                  <Pressable
                    key={sc}
                    style={[s.sinChip, linkedSin === sc && { backgroundColor: TabColors.test.light, borderColor: TabColors.test.color }]}
                    onPress={() => setLinkedSin(linkedSin === sc ? "" : sc)}
                  >
                    <Text style={[s.sinChipText, linkedSin === sc && { color: TabColors.test.color }]}>{sc}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <View style={s.formActions}>
            <Pressable style={[s.saveBtn, (!goalName.trim() || savingGoal) && s.btnDisabled]} onPress={addGoal} disabled={!goalName.trim() || savingGoal}>
              <Text style={s.saveBtnText}>{savingGoal ? "Saving…" : "Add Goal"}</Text>
            </Pressable>
            <Pressable style={s.cancelBtn} onPress={() => { setShowAddGoal(false); setGoalName(""); setLinkedSin(""); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Wins Log */}
      <View style={s.section}>
        <Text style={s.sectionHdr}>⭐ Wins — One-off Victories</Text>
        {data.wins.length === 0 && !showAddWin && <Text style={s.emptyText}>No wins logged yet. Record your first victory.</Text>}
        {data.wins.map(win => (
          <View key={win.id} style={s.winItem}>
            <Text style={{ fontSize: 16 }}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.winText}>{win.text}</Text>
              <Text style={s.winDate}>{fmt(win.createdAt)}</Text>
            </View>
            <Pressable onPress={() => delWin(win.id)}><Text style={s.winDel}>✕</Text></Pressable>
          </View>
        ))}

        {showAddWin ? (
          <View style={s.addForm}>
            <Text style={s.label}>What did you win today?</Text>
            <TextInput
              style={[s.input, { minHeight: 56, textAlignVertical: "top" }]}
              value={winText}
              onChangeText={setWinText}
              placeholder="e.g. Walked 2km. Said no to a bad habit. Called a friend I'd been avoiding."
              multiline
            />
            <View style={s.formActions}>
              <Pressable style={[s.saveBtn, (!winText.trim() || savingWin) && s.btnDisabled]} onPress={addWin} disabled={!winText.trim() || savingWin}>
                <Text style={s.saveBtnText}>{savingWin ? "Saving…" : "Record Win ⭐"}</Text>
              </Pressable>
              <Pressable style={s.cancelBtn} onPress={() => { setShowAddWin(false); setWinText(""); }}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={s.addBar} onPress={() => setShowAddWin(true)}>
            <Text style={s.addPrompt}>＋ Record a win…</Text>
          </Pressable>
        )}
      </View>

      {/* Delete action sheet */}
      <Modal visible={!!pressedGoal} transparent animationType="fade" onRequestClose={() => setPressedGoal(null)}>
        <Pressable style={s.sheetBackdrop} onPress={() => setPressedGoal(null)}>
          <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
            <Text style={s.sheetTitle}>{pressedGoal?.icon} {pressedGoal?.name}</Text>
            <Pressable style={s.sheetDelete} onPress={() => { if (pressedGoal) delGoal(pressedGoal.id); setPressedGoal(null); }}>
              <Text style={s.sheetDeleteText}>🗑 Delete goal</Text>
            </Pressable>
            <Pressable style={s.sheetCancel} onPress={() => setPressedGoal(null)}>
              <Text style={s.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  section: { gap: 10 },
  sectionHdr: { fontSize: 12, fontWeight: "700", letterSpacing: 0.4, color: "#333" },
  emptyText: { fontSize: 12, color: "#888", paddingVertical: 10 },
  doGoal: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e5e5" },
  doGoalDone: { borderColor: TabColors.triumph.border },
  doGoalStreak: { alignItems: "center", width: 56 },
  doGoalStreakNum: { fontSize: 18, fontWeight: "700", color: "#333" },
  doGoalStreakLbl: { fontSize: 8, color: "#999", textAlign: "center" },
  doGoalName: { fontSize: 14, fontWeight: "600", color: "#222" },
  doGoalSub: { fontSize: 11, color: "#888", marginTop: 2 },
  doCheck: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },
  addBar: { borderWidth: 1.5, borderColor: "#e5e5e5", borderStyle: "dashed", borderRadius: 10, padding: 14, alignItems: "center" },
  addPrompt: { fontSize: 12, color: "#888" },
  resistGoal: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e5e5", gap: 10 },
  resistHdr: { flexDirection: "row", alignItems: "flex-start" },
  resistPct: { fontSize: 18, fontWeight: "700", color: TabColors.triumph.color },
  resistTrack: { height: 6, backgroundColor: "#eee", borderRadius: 3, overflow: "hidden" },
  resistFill: { height: 6, backgroundColor: TabColors.triumph.color },
  resistActions: { flexDirection: "row", gap: 8 },
  resistBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 8 },
  resistBtnText: { fontSize: 11, fontWeight: "600", color: "#444" },
  addForm: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e5e5", gap: 10 },
  typeToggle: { flexDirection: "row", gap: 8 },
  typeBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 8 },
  typeBtnActive: { borderColor: TabColors.triumph.color, backgroundColor: TabColors.triumph.light },
  typeBtnText: { fontSize: 12, fontWeight: "600", color: "#333" },
  label: { fontSize: 12, fontWeight: "600", color: "#333" },
  hint: { fontSize: 11, fontWeight: "400", color: "#999" },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#e5e5e5", borderRadius: 8 },
  input: { borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 8, padding: 12, fontSize: 14, color: "#111" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  sinChip: { borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  sinChipText: { fontSize: 11, color: "#888" },
  formActions: { flexDirection: "row", gap: 8 },
  saveBtn: { flex: 1, backgroundColor: TabColors.triumph.color, borderRadius: 8, paddingVertical: 13, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  btnDisabled: { backgroundColor: "#ccc" },
  cancelBtn: { paddingVertical: 13, paddingHorizontal: 18, borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 8 },
  cancelBtnText: { fontSize: 12, color: "#888" },
  winItem: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e5e5e5" },
  winText: { fontSize: 13, color: "#222" },
  winDate: { fontSize: 11, color: "#999", marginTop: 2 },
  winDel: { fontSize: 14, color: "#bbb", padding: 4 },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 10 },
  sheetTitle: { fontSize: 15, fontWeight: "600", color: "#222", marginBottom: 4 },
  sheetDelete: { backgroundColor: "#fbeae8", borderRadius: 10, padding: 14, alignItems: "center" },
  sheetDeleteText: { color: "#9b2c1a", fontWeight: "600", fontSize: 13 },
  sheetCancel: { padding: 14, alignItems: "center" },
  sheetCancelText: { color: "#888", fontSize: 13 },
});
