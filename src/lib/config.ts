import Constants from "expo-constants";

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!RAW_API_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and fill it in.",
  );
}

/**
 * "localhost" only means the dev machine on the iOS simulator. On an
 * Android emulator or any physical phone it's the device itself, so every
 * request failed with "Unable to reach Pazimo". In development, swap it for
 * the host Metro is being reached on (Expo's hostUri, e.g.
 * "192.168.1.20:8081") — by definition an address this device can already
 * reach the dev machine at, and it follows you across Wi-Fi networks
 * without editing .env. Release builds never touch the URL.
 */
function resolveDevHost(url: string): string {
  if (!__DEV__) return url;
  const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (!devHost) return url;
  return url.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/, `$1${devHost}`);
}

const API_URL = resolveDevHost(RAW_API_URL);

// Refuse to ship a build that silently talks to the backend over plain HTTP.
// Localhost is exempt so development against a local backend keeps working.
const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)/.test(
  API_URL,
);
if (!__DEV__ && API_URL.startsWith("http://") && !isLocalhost) {
  throw new Error(
    `EXPO_PUBLIC_API_URL must use HTTPS in production builds, got: ${API_URL}`,
  );
}

export const config = {
  apiUrl: API_URL.replace(/\/+$/, ""),
  // The backend serves uploaded media (e.g. /uploads/...) from its origin,
  // not under the /api prefix — see src/lib/media.ts.
  mediaOrigin: new URL(API_URL).origin,
};
