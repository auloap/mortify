import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch, apiJson } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TreatEntry, TextEntry, TaskEntry, TestEntry } from "@/lib/types";
import { getAnalytics, fmt, firstSentence, emotionColor } from "@/lib/helpers";
import { STRONGHOLD, ENERGY_WORDS } from "@/lib/constants";
import { Screen } from "@/components/ui";
import { TabColors } from "@/constants/theme";

type HistoryView = "treat" | "text" | "task" | "test";

interface MoodEntry { id: number; date: string; energy: number; note: string; loggedAt: string; }

async function fetchList<T>(url: string): Promise<T[]> {
  try {
    const res = await apiFetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export default function MoreTab() {
  const { identity, logout } = useAuth();
  const [treatEntries, setTreatEntries] = useState<TreatEntry[]>([]);
  const [textEntries, setTextEntries] = useState<TextEntry[]>([]);
  const [taskEntries, setTaskEntries] = useState<TaskEntry[]>([]);
  const [testEntries, setTestEntries] = useState<TestEntry[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [view, setView] = useState<HistoryView>("treat");
  const [dayReview, setDayReview] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = useCallback(async () => {
    const [treat, text, task, test, mood] = await Promise.all([
      fetchList<TreatEntry>("/api/treat"),
      fetchList<TextEntry>("/api/qt"),
      fetchList<TaskEntry>("/api/task"),
      fetchList<TestEntry>("/api/sin"),
      fetchList<MoodEntry>("/api/mood"),
    ]);
    setTreatEntries(treat); setTextEntries(text); setTaskEntries(task); setTestEntries(test); setMoodEntries(mood);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const { sinWins, lostCounts, strongholds, topSins, topEmo, topBooks, maxSin, maxEmo, maxBook, streak, totalTests, totalWins, winRate } = getAnalytics(textEntries, testEntries);

  const today = new Date().toISOString().slice(0, 10);
  const todayMoods = moodEntries.filter(e => e.date === today);

  async function getDayReview() {
    setReviewBusy(true); setDayReview("");
    try {
      const json = await apiJson<{ aiSummary?: string }>("/api/mood/summary", { method: "POST" });
      setDayReview(json.aiSummary || "No summary returned.");
    } catch { setDayReview("Could not reach AI. Please try again."); }
    setReviewBusy(false);
  }

  async function delEntry(kind: HistoryView, id: number) {
    const endpoint = { treat: "/api/treat", text: "/api/qt", task: "/api/task", test: "/api/sin" }[kind];
    await apiFetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (kind === "treat") setTreatEntries(p => p.filter(e => e.id !== id));
    if (kind === "text") setTextEntries(p => p.filter(e => e.id !== id));
    if (kind === "task") setTaskEntries(p => p.filter(e => e.id !== id));
    if (kind === "test") setTestEntries(p => p.filter(e => e.id !== id));
  }

  return (
    <Screen>
      {/* Day Review */}
      <View style={s.dayReviewCard}>
        <View style={s.dayReviewHdr}>
          <Text style={s.dayReviewTitle}>✦ How&apos;s today?</Text>
          <Pressable style={s.dayReviewBtn} onPress={getDayReview} disabled={reviewBusy}>
            <Text style={s.dayReviewBtnText}>{reviewBusy ? "Reading…" : "Get Day Summary"}</Text>
          </Pressable>
        </View>
        {todayMoods.length > 0 && (
          <View style={s.moodRow}>
            {todayMoods.slice().reverse().map(m => (
              <Text key={m.id} style={s.moodDot}>{m.energy} {ENERGY_WORDS[m.energy]}{m.note ? ` · ${m.note}` : ""}</Text>
            ))}
          </View>
        )}
        {reviewBusy && <Text style={s.loading}>Synthesising your day…</Text>}
        {!!dayReview && !reviewBusy && <Text style={s.dayReviewText}>{dayReview}</Text>}
        {!dayReview && !reviewBusy && todayMoods.length === 0 && (
          <Text style={s.muted}>Log your mood throughout the day, then get a pastoral summary here.</Text>
        )}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatBox num={streak} color={TabColors.text.color} label="Text streak (days)" />
        <StatBox num={treatEntries.length} color={TabColors.treat.color} label="Treats logged" />
        <StatBox num={winRate !== null ? `${winRate}%` : "—"} color={TabColors.text.color} label={`Win rate (${totalWins}/${totalTests})`} />
        <StatBox num={strongholds.length} color={strongholds.length > 0 ? "#c0392b" : TabColors.test.color} label="Strongholds" />
      </View>

      {strongholds.map(sh => (
        <View key={sh} style={s.strongholdBanner}>
          <Text style={{ fontSize: 16 }}>⚠</Text>
          <Text style={s.strongholdText}>
            <Text style={{ fontWeight: "700" }}>{sh}</Text> — lost {lostCounts[sh]} times. This may be a stronghold. Bring it to a pastor or accountability partner.
          </Text>
        </View>
      ))}

      {/* Charts */}
      <ChartSection title="Books you've spent time in" empty="No Text entries yet" data={topBooks} max={maxBook} color={TabColors.text.color} />

      <View style={s.chartSection}>
        <Text style={s.chartTitle}>Temptation encounters — wins vs losses</Text>
        {topSins.length === 0 ? <Text style={s.noData}>No Test entries yet</Text> : topSins.map(([sn, c]) => {
          const wins = sinWins[sn] || 0;
          const losses = c - wins;
          const isStronghold = (lostCounts[sn] || 0) >= STRONGHOLD;
          return (
            <View key={sn} style={s.barRow}>
              <Text style={s.barLbl} numberOfLines={1}>{sn}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(c / maxSin) * 100}%`, backgroundColor: isStronghold ? "#c0392b" : TabColors.test.color, opacity: 0.35 }]} />
                <View style={[s.barFill, s.barFillOverlay, { width: `${(wins / maxSin) * 100}%`, backgroundColor: TabColors.text.color }]} />
              </View>
              <Text style={s.barSplit}>{wins}W/{losses}L</Text>
            </View>
          );
        })}
        <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
          <Legend color={TabColors.text.color} label="Won" />
          <Legend color={TabColors.test.color} opacity={0.35} label="Lost" />
        </View>
      </View>

      <ChartSection title="Top emotional triggers" empty="Log Test entries to see triggers" data={topEmo} max={maxEmo} colorFor={emotionColor} />

      {/* History */}
      <Text style={[s.chartTitle, { marginBottom: 4 }]}>History</Text>
      <View style={s.histToggle}>
        {(["treat", "text", "task", "test"] as HistoryView[]).map(v => (
          <Pressable key={v} style={[s.histTab, view === v && s.histTabActive]} onPress={() => setView(v)}>
            <Text style={[s.histTabText, view === v && s.histTabTextActive]}>
              {v === "treat" ? `🌿 Treat (${treatEntries.length})` : v === "text" ? `📖 Text (${textEntries.length})` : v === "task" ? `✦ Task (${taskEntries.length})` : `⚔ Test (${testEntries.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {view === "treat" && (treatEntries.length === 0
        ? <EmptyHistory title="No treats logged yet" sub="Begin giving thanks to build a record" />
        : treatEntries.map(e => (
          <EntryCard key={e.id} title="Thanksgiving" titleColor={TabColors.treat.color} date={fmt(e.date)} onDelete={() => delEntry("treat", e.id)}>
            <Text style={s.entryVal}>{e.gratitude}</Text>
            {e.aiReflection ? <Text style={[s.entryAi, { color: TabColors.treat.color }]}>✦ {firstSentence(e.aiReflection)}</Text> : null}
          </EntryCard>
        ))
      )}

      {view === "text" && (textEntries.length === 0
        ? <EmptyHistory title="No Text entries yet" sub="Begin your quiet time to build a record" />
        : textEntries.map(e => (
          <EntryCard key={e.id} title={`${e.book}${e.passage ? " " + e.passage : ""}`} titleColor={TabColors.text.color} date={fmt(e.date)} onDelete={() => delEntry("text", e.id)}>
            {e.aboutGod ? <><Text style={s.entryLbl}>What I saw of God</Text><Text style={s.entryVal}>{e.aboutGod}</Text></> : null}
            {e.apply ? <><Text style={s.entryLbl}>Application</Text><Text style={s.entryVal}>{e.apply}</Text></> : null}
          </EntryCard>
        ))
      )}

      {view === "task" && (taskEntries.length === 0
        ? <EmptyHistory title="No tasks committed yet" sub="Start with one act of obedience today" />
        : taskEntries.map(e => (
          <EntryCard key={e.id} title="Task" titleColor={TabColors.task.color} date={fmt(e.date)} onDelete={() => delEntry("task", e.id)}>
            <Text style={s.entryVal}>{e.task}</Text>
            {e.aiReflection ? <Text style={[s.entryAi, { color: TabColors.task.color }]}>✦ {firstSentence(e.aiReflection)}</Text> : null}
          </EntryCard>
        ))
      )}

      {view === "test" && (testEntries.length === 0
        ? <EmptyHistory title="No Test entries yet" sub="Start logging temptations — wins and losses" />
        : testEntries.map(e => {
          const isSH = strongholds.includes(e.sin);
          const won = e.outcome === "won";
          return (
            <View key={e.id} style={[s.entry, { borderLeftColor: won ? TabColors.text.color : TabColors.test.color }]}>
              <Pressable style={s.delBtn} onPress={() => delEntry("test", e.id)}><Text style={s.delBtnText}>✕</Text></Pressable>
              <View style={s.entryHdr}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", flex: 1, paddingRight: 20 }}>
                  <Text style={[s.entryTtl, { color: won ? TabColors.text.color : TabColors.test.color }]}>{e.sin}</Text>
                  <Text style={[s.outcomeBadge, won ? s.outcomeBadgeWon : s.outcomeBadgeFell]}>{won ? "🏆 Won" : "⚔ Lost"}</Text>
                  {isSH && <Text style={s.strongholdTag}>STRONGHOLD</Text>}
                </View>
                <Text style={s.entryDate}>{fmt(e.date)}</Text>
              </View>
              {(e.emotions?.length ?? 0) > 0 && (
                <View style={s.entryChips}>
                  {e.emotions.map(em => <Text key={em} style={s.entryChip}>{em}</Text>)}
                </View>
              )}
              {e.situation ? <><Text style={s.entryLbl}>Situation</Text><Text style={s.entryVal}>{e.situation}</Text></> : null}
              {won && e.whatHelped ? <><Text style={[s.entryLbl, { color: TabColors.text.color }]}>What helped</Text><Text style={s.entryVal}>{e.whatHelped}</Text></> : null}
              {!won && e.counterfeit ? <><Text style={s.entryLbl}>What it promised</Text><Text style={s.entryVal}>{e.counterfeit}</Text></> : null}
              {won && e.aiVictory ? <Text style={[s.entryAi, { color: TabColors.text.color }]}>🏆 {firstSentence(e.aiVictory)}</Text> : null}
              {!won && e.aiReflection ? <Text style={s.entryAi}>⚔ {firstSentence(e.aiReflection)}</Text> : null}
              {!won && e.aiPivot ? <Text style={[s.entryAi, { color: TabColors.text.color }]}>✦ {firstSentence(e.aiPivot)}</Text> : null}
            </View>
          );
        })
      )}

      <View style={s.account}>
        <Text style={s.email}>{identity?.email}</Text>
        <Pressable style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function StatBox({ num, color, label }: { num: number | string; color: string; label: string }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statNum, { color }]}>{num}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

function Legend({ color, opacity = 1, label }: { color: string; opacity?: number; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 10, height: 4, borderRadius: 2, backgroundColor: color, opacity }} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

function ChartSection({ title, empty, data, max, color, colorFor }: {
  title: string; empty: string; data: [string, number][]; max: number; color?: string; colorFor?: (k: string) => string;
}) {
  return (
    <View style={s.chartSection}>
      <Text style={s.chartTitle}>{title}</Text>
      {data.length === 0 ? <Text style={s.noData}>{empty}</Text> : data.map(([k, c]) => (
        <View key={k} style={s.barRow}>
          <Text style={s.barLbl} numberOfLines={1}>{k}</Text>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${(c / max) * 100}%`, backgroundColor: colorFor ? colorFor(k) : color }]} />
          </View>
          <Text style={s.barCount}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

function EmptyHistory({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={s.emptyHistory}>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  );
}

function EntryCard({ title, titleColor, date, onDelete, children }: {
  title: string; titleColor: string; date: string; onDelete: () => void; children: React.ReactNode;
}) {
  return (
    <View style={s.entry}>
      <Pressable style={s.delBtn} onPress={onDelete}><Text style={s.delBtnText}>✕</Text></Pressable>
      <View style={s.entryHdr}>
        <Text style={[s.entryTtl, { color: titleColor, flex: 1, paddingRight: 20 }]}>{title}</Text>
        <Text style={s.entryDate}>{date}</Text>
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  dayReviewCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8, borderWidth: 1, borderColor: "#e5e5e5" },
  dayReviewHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayReviewTitle: { fontSize: 14, fontWeight: "600", color: "#333" },
  dayReviewBtn: { backgroundColor: "#1a1410", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  dayReviewBtnText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  moodDot: { fontSize: 10, backgroundColor: "#f5f5f5", borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8, color: "#666" },
  loading: { fontSize: 13, color: "#666", fontStyle: "italic" },
  dayReviewText: { fontSize: 13, lineHeight: 20, color: "#222" },
  muted: { fontSize: 12, color: "#999" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: { flexBasis: "47%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e5e5e5", gap: 2 },
  statNum: { fontSize: 22, fontWeight: "700" },
  statLbl: { fontSize: 10, color: "#888" },
  strongholdBanner: { flexDirection: "row", gap: 8, backgroundColor: "#fbeae8", borderWidth: 1, borderColor: "#f0b8b0", borderRadius: 10, padding: 12 },
  strongholdText: { flex: 1, fontSize: 12, color: "#9b2c1a", lineHeight: 18 },
  chartSection: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e5e5", gap: 6 },
  chartTitle: { fontSize: 12, fontWeight: "700", color: "#333", marginBottom: 4 },
  noData: { fontSize: 12, color: "#999" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLbl: { fontSize: 11, color: "#444", width: 84 },
  barTrack: { flex: 1, height: 8, backgroundColor: "#f0f0f0", borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  barFillOverlay: { position: "absolute", top: 0, left: 0 },
  barCount: { fontSize: 11, color: "#888", width: 20, textAlign: "right" },
  barSplit: { fontSize: 10, color: "#888", width: 48, textAlign: "right" },
  legendText: { fontSize: 10, color: "#888" },
  histToggle: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  histTab: { borderWidth: 1.5, borderColor: "#e5e5e5", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  histTabActive: { backgroundColor: "#1a1410", borderColor: "#1a1410" },
  histTabText: { fontSize: 11, color: "#555" },
  histTabTextActive: { color: "#fff" },
  emptyHistory: { alignItems: "center", padding: 24, gap: 4 },
  emptyTitle: { fontSize: 13, fontWeight: "600", color: "#444" },
  emptySub: { fontSize: 11, color: "#999" },
  entry: { backgroundColor: "#fff", borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: "#ddd", borderWidth: 1, borderColor: "#e5e5e5", gap: 6 },
  entryHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entryTtl: { fontSize: 13, fontWeight: "700" },
  entryDate: { fontSize: 10, color: "#999" },
  entryVal: { fontSize: 12, color: "#333", lineHeight: 18 },
  entryLbl: { fontSize: 10, fontWeight: "600", color: "#888", marginTop: 2 },
  entryAi: { fontSize: 11, fontStyle: "italic", marginTop: 4 },
  entryChips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  entryChip: { fontSize: 9, backgroundColor: "#f5f5f5", borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7, color: "#666" },
  outcomeBadge: { fontSize: 9, fontWeight: "700", borderRadius: 999, paddingVertical: 1, paddingHorizontal: 6, overflow: "hidden" },
  outcomeBadgeWon: { backgroundColor: "#e8f5ee", color: "#1a7a50" },
  outcomeBadgeFell: { backgroundColor: "#fbeae8", color: "#9b2c1a" },
  strongholdTag: { fontSize: 9, fontWeight: "700", color: "#c0392b" },
  delBtn: { position: "absolute", top: 10, right: 10, padding: 4, zIndex: 1 },
  delBtnText: { fontSize: 12, color: "#bbb" },
  account: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: "#e5e5e5" },
  email: { fontSize: 12, color: "#666" },
  logoutBtn: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#f0f0f0" },
  logoutText: { fontSize: 12, fontWeight: "600", color: "#333" },
});
