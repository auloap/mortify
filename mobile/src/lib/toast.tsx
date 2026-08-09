import { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ToastState { id: number; message: string; color: string; }

let nextId = 0;
let listener: ((t: ToastState) => void) | null = null;

/** Fire-and-forget toast, callable from anywhere — matches the web app's showToast(). */
export function showToast(message: string, color = "#1a7a50") {
  listener?.({ id: nextId++, message, color });
}

/** Mount once near the root of the app. */
export function ToastHost() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    listener = (t) => {
      setToast(t);
      setTimeout(() => setToast(current => (current?.id === t.id ? null : current)), 2500);
    };
    return () => { listener = null; };
  }, []);

  if (!toast) return null;
  return (
    <SafeAreaView style={styles.container} pointerEvents="none">
      <Text style={[styles.toast, { backgroundColor: toast.color }]}>{toast.message}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", zIndex: 100 },
  toast: {
    marginTop: 8, color: "#fff", paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: 8, fontSize: 14, overflow: "hidden",
  },
});
