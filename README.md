# Pazimo Organizer Mobile

A new, independent React Native app that replaces Pazimo's existing organizer
mobile app. It talks to the real Pazimo backend (`../pazimo/backend`) — there
is no mock API and no separate backend in this repo.

**Status:** foundation + authentication are in place (login, organizer
sign-up with phone-OTP request). Organizer dashboards, ticket scanning, and
usher mode are scaffolded but not yet built out — see "Next steps" below.

## Roles

- **Organizer** — manages their own events, tickets and (eventually) the
  scanner. Full access is gated behind the backend's own approval flow: a
  newly self-registered organizer is created `isActive: false` and cannot log
  in until an admin approves the registration.
- **Usher** — intended to be a stripped-down, scanner-only mode for door
  staff assigned to one event. **The Pazimo backend does not have this role
  today** (see "Backend limitations"). The navigation shell for it exists
  (`app/usher/`) so wiring it up later doesn't require restructuring the app,
  but nothing can reach it yet.

Role is always read from the backend (`GET /api/auth/me`), never chosen in
the UI. An authenticated user whose role is neither `organizer` nor `usher`
(e.g. `customer`, `venue`, `cinema`) lands on a dedicated
"account not supported" screen instead of silently getting organizer access.

## Tech stack

- React Native + Expo (SDK 57), TypeScript, Expo Router (`Stack.Protected`
  role-based route guards)
- Zustand for auth/session state
- TanStack Query for server-state (mutations today; queries once the
  dashboard lands)
- Zod for form validation
- Expo SecureStore for the auth token (never AsyncStorage)
- Plain `fetch` behind a single API client — no HTTP library added just for
  convenience

## Project structure

```
app/
  _layout.tsx           # role-based route guards (Stack.Protected)
  (auth)/
    index.tsx            # login
    organizer-signup.tsx  # multi-step organizer sign-up + phone OTP
  organizer/
    index.tsx            # placeholder home (post-login landing)
  usher/
    index.tsx            # placeholder — backend has no usher role yet
  unsupported-role.tsx    # any other authenticated role lands here

src/
  api/        client.ts (fetch wrapper, error normalization, 401 handling)
              auth.ts (login, getCurrentUser, sendOtp, organizerSignUp)
  components/ shared UI: Button, TextField, OtpInput, Banner, Screen, ...
  features/auth/schemas.ts   # zod validation
  lib/        config.ts, theme.ts, secureStorage.ts, queryClient.ts
  store/      authStore.ts (zustand: session, bootstrap, sign in/out)
  types/      shapes mirrored from the backend's actual responses
```

## Environment variables

Copy `.env.example` to `.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

`EXPO_PUBLIC_*` variables are inlined into the JS bundle at build time and
are readable by anyone with the app installed — never put secrets here. The
app refuses to start a non-dev build pointed at a plain-`http://` URL unless
it's localhost (`src/lib/config.ts`).

## Local development

```bash
npm install
npm start          # then press `a` for Android, `i` for iOS, `w` for web
```

Pointing the app at your local backend:
- **Android emulator:** `10.0.2.2` reaches the host machine, e.g.
  `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api`.
- **Physical device (Expo Go):** use your machine's LAN IP, e.g.
  `http://192.168.1.20:5000/api`, and make sure the backend is reachable on
  your network.
- **iOS simulator:** `http://localhost:5000/api` works as-is.

```bash
npm run android     # expo start --android
npm run ios         # expo start --ios (macOS only)
npm run web          # expo start --web
```

## Production builds

This project hasn't been configured for EAS Build yet. When it is:

```bash
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

Set `EXPO_PUBLIC_API_URL` to the production HTTPS backend URL in that EAS
build profile — never commit it.

## Authentication architecture

```
Login (email + password)
  → POST /api/auth/login
  → token stored in Expo SecureStore
  → GET /api/auth/me to resolve the authoritative role
  → Stack.Protected routes to organizer / usher / unsupported-role
```

Session restoration on app launch re-runs the `/auth/me` check rather than
trusting a cached role — an expired or revoked token clears the stored token
and drops the user back to the login screen (`src/store/authStore.ts`,
`bootstrap()`). Any `401` from any API call clears the session globally
(`src/api/client.ts`'s `setUnauthorizedHandler`), not just in the screen that
happened to make the failing request.

### Organizer sign-up + phone verification

`app/(auth)/organizer-signup.tsx` is a 4-step wizard: account → organization
→ phone verification → review/submit. Step 3 calls the real
`POST /api/auth/send-otp`, which sends an actual SMS via GeezSMS. **There is
currently no backend endpoint to verify the code** — see "Backend
limitations" below. The step only checks that 6 digits were entered; it does
not (and currently cannot) confirm the code matches what was texted. This is
called out explicitly in `src/api/auth.ts` so it doesn't get mistaken for
real verification later.

Final submission calls the real `POST /api/organizers/sign-up`, which is a
`multipart/form-data` endpoint server-side (it runs through multer for an
optional business-license upload) — the client sends `FormData` even though
this app doesn't yet support attaching a file. On success the account is
created but inactive; the success screen tells the organizer their
application needs admin approval before they can sign in, matching what the
backend actually does.

## Security considerations

- The backend is the only authorization boundary. Nothing in this app — role
  checks, event-ownership checks, ticket-scan permissions — is trusted
  client-side; the app only reflects what the API allows.
- Auth token lives in Expo SecureStore, never AsyncStorage.
- No tokens, passwords, or OTP codes are logged anywhere in this codebase.
- API errors are normalized (`src/api/client.ts`) so raw backend error
  bodies/stack traces are never shown to the user; unrecognized errors fall
  back to a generic per-status message.
- `EXPO_PUBLIC_API_URL` is validated at startup: a non-dev build pointed at
  plain HTTP (other than localhost) throws immediately instead of silently
  sending credentials unencrypted.
- The backend has its own active security review at
  `../pazimo/docs/SECURITY_VULNERABILITIES.md` — several open items there
  (unauthenticated OTP flow, no rate limit on organizer sign-up, JWT
  lifetime/revocation) directly affect what this app can safely promise
  users about phone verification and session handling until they land.

## Backend limitations discovered

1. **No OTP-verification endpoint.** `POST /api/auth/send-otp` sends a real
   SMS but there is no `verify-otp` counterpart, and it isn't wired into
   `POST /api/organizers/sign-up` at all today (confirmed by reading both
   controllers — the existing web organizer-registration flow at
   `../organzier-pazimo/app/organizer-registration/page.tsx` doesn't call
   `send-otp` either, and creates the user with `isPhoneVerified: false`).
   The mobile app's OTP step is UI-only until this exists.
   - **Smallest fix:** a `POST /api/auth/verify-otp { phoneNumber, code }`
     endpoint that checks the code server-side (GeezSMS supports code
     verification via their API — the current integration only calls their
     `send` endpoint) and either issues a short-lived "phone verified" token
     the sign-up call must include, or sets `isPhoneVerified: true` directly
     if verified before account creation.
2. **No "usher" role or event-staff-assignment model.** `User.js`'s role
   enum is `["customer", "organizer", "venue", "cinema"]` — no usher/staff
   role, and no model anywhere assigns a user to scan a specific event.
   Today, ticket scanning is implicitly whoever is authenticated as the
   event's organizer (or admin); there's no way to grant a separate account
   scan-only access to one event.
   - **Smallest fix:** add `"usher"` to the role enum plus a minimal
     assignment model (e.g. `EventStaff { userId, eventId }`), and gate the
     ticket-scan endpoint on "caller is the event's organizer OR caller is
     assigned staff for that event," not just organizer ownership.

## Next steps

- Wire up `verify-otp` once it exists on the backend; until then, don't
  present the current OTP step as real verification to end users.
- Build out the organizer dashboard (events, ticket sales, attendee info)
  against the real endpoints once scoped.
- Ticket scanning: needs the usher/staff model above before an usher-scoped
  scanner can exist; an organizer-scoped scanner could be built sooner
  against whatever ticket-validation endpoint the existing organizer app
  uses (not yet inspected in this pass).
- Add EAS Build configuration when it's time to produce real app binaries.

## GitHub

Not pushed yet. To create the remote and push:

```bash
cd pazimo-organizer-mobile
gh repo create pazimo-organizer-mobile --private --source=. --remote=origin
git push -u origin main
```
