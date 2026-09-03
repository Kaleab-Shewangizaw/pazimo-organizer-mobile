import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Thin wrapper around Expo SecureStore for the one thing that actually needs
 * it: the auth token. Never move this to AsyncStorage.
 *
 * expo-secure-store ships no web implementation at all (its own
 * ExpoSecureStore.web.ts is an empty module) — calling setItemAsync/
 * deleteItemAsync there never resolves or rejects, so signIn()/signOut()
 * would hang forever with no error. This app's real target is iOS/Android,
 * where SecureStore works normally; the localStorage fallback below exists
 * only so `npm run web` is usable for quick UI iteration during
 * development — it is NOT secure storage and must never be treated as
 * equivalent to the native path.
 */
const TOKEN_KEY = "pazimo_auth_token";
const isWeb = Platform.OS === "web";

export async function getStoredToken(): Promise<string | null> {
  try {
    if (isWeb) return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
