import { ComponentProps } from "react";
import { ColorValue } from "react-native";
import { Redirect, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TabColors } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

type IconName = ComponentProps<typeof Ionicons>["name"];

function icon(name: IconName) {
  function TabIcon({ color, size }: { focused: boolean; color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { identity } = useAuth();
  if (!identity) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarLabelStyle: { fontSize: 10 } }}>
      <Tabs.Screen name="treat" options={{ title: "Treat", tabBarActiveTintColor: TabColors.treat.color, tabBarIcon: icon("leaf") }} />
      <Tabs.Screen name="text" options={{ title: "Text", tabBarActiveTintColor: TabColors.text.color, tabBarIcon: icon("book") }} />
      <Tabs.Screen name="task" options={{ title: "Task", tabBarActiveTintColor: TabColors.task.color, tabBarIcon: icon("checkmark-circle") }} />
      <Tabs.Screen name="test" options={{ title: "Test", tabBarActiveTintColor: TabColors.test.color, tabBarIcon: icon("shield") }} />
      <Tabs.Screen name="triumph" options={{ title: "Triumph", tabBarActiveTintColor: TabColors.triumph.color, tabBarIcon: icon("trophy") }} />
      <Tabs.Screen name="prayer-lock" options={{ title: "Prayer Lock", tabBarActiveTintColor: TabColors.prayerLock.color, tabBarIcon: icon("lock-closed") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarActiveTintColor: "#555", tabBarIcon: icon("stats-chart") }} />
    </Tabs>
  );
}
