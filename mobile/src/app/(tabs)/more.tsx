import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { Screen, SectionDesc } from "@/components/ui";

export default function MoreTab() {
  const { identity, logout } = useAuth();

  return (
    <Screen>
      <SectionDesc>Patterns & History dashboard lands in Phase 3.</SectionDesc>
      <View style={styles.account}>
        <Text style={styles.email}>{identity?.email}</Text>
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: "#e5e5e5" },
  email: { fontSize: 13, color: "#666" },
  logoutBtn: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#f0f0f0" },
  logoutText: { fontSize: 13, fontWeight: "600", color: "#333" },
});
