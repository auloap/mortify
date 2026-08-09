import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "mortify_session_token";

// expo-secure-store has no web implementation (it wraps iOS Keychain /
// Android Keystore) - calling it on web throws. Fall back to localStorage
// there so `expo start --web` works for quick preview/dev.
const isWeb = Platform.OS === "web";

export async function getStoredToken(): Promise<string | null> {
  if (isWeb) return localStorage.getItem(SESSION_KEY);
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  if (isWeb) { localStorage.setItem(SESSION_KEY, token); return; }
  await SecureStore.setItemAsync(SESSION_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (isWeb) { localStorage.removeItem(SESSION_KEY); return; }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
