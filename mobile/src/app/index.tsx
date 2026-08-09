import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function Index() {
  const { identity } = useAuth();
  return <Redirect href={identity ? "/(tabs)/treat" : "/login"} />;
}
