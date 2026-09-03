const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and fill it in.",
  );
}

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
};
