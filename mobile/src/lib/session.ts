import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "mortify_session_token";

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
