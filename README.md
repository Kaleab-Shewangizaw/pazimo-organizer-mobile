# Pazimo Organizer Mobile

A new, independent React Native app that replaces Pazimo's existing organizer
mobile app. It talks to the real Pazimo backend (`../pazimo/backend`) — there
is no mock API and no separate backend in this repo.

**Status:** authentication is complete, including the backend's mandatory
organizer 2FA (login → OTP → token). The organizer home screen shows real
dashboard data (stat tiles, per-event ticket/revenue cards) from the
backend. Event detail, ticket sales drill-down, scanner, and usher mode are
scaffolded but not yet built out — see "Next steps" below.

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
              auth.ts (login, getCurrentUser, organizer OTP send/verify, sendOtp, organizerSignUp)
              organizers.ts (getOrganizerDashboard)
  components/ shared UI: Button, TextField, OtpInput, Banner, Screen,
              StatTile, StatusBadge, EventCard, EmptyState, ...
  features/auth/schemas.ts   # zod validation
  lib/        config.ts, theme.ts, secureStorage.ts, queryClient.ts,
              errors.ts (bannerMessageFor — always shows *something* for an
              unexpected error), format.ts (currency/date formatting)
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
  → organizer accounts: 200 { requiresOtp: true, data: { email, channel, maskedDestination } } — no token yet
      → POST /api/auth/organizer/verify-otp { email, code } → token
  → any other role: 200 { data: { user, token } } directly
  → token stored in Expo SecureStore
  → GET /api/auth/me to resolve the authoritative role (session restore only —
    login/verify-otp already return the user, so they skip this call)
  → Stack.Protected routes to organizer / usher / unsupported-role
```

Every organizer login goes through a mandatory second factor
(`backend/src/controllers/authController.js` `login()`, added 2026-09-04) —
`app/(auth)/index.tsx` handles this as a second in-place step (`VerifyLoginOtp`)
after the password step returns `requiresOtp: true`, with a resend button
that calls the same `organizer/send-otp` endpoint the backend's standalone
"sign in with a code" path uses. The code is single-use, expires in 10
minutes, and the account locks out after 5 wrong attempts (enforced
server-side; the client just surfaces whatever the API says).

Session restoration on app launch re-runs the `/auth/me` check rather than
trusting a cached role — an expired or revoked token clears the stored token
and drops the user back to the login screen (`src/store/authStore.ts`,
`bootstrap()`). Any `401` from any API call clears the session globally
(`src/api/client.ts`'s `setUnauthorizedHandler`), not just in the screen that
happened to make the failing request.

### Organizer sign-up + phone verification

`app/(auth)/organizer-signup.tsx` is a 4-step wizard: account → organization
→ phone verification → review/submit. Step 3 calls the real
`POST /api/auth/send-otp` (a *different* mechanism from the login 2FA above —
see `src/api/auth.ts`), which sends an actual SMS via GeezSMS. **There is
still no backend endpoint to verify that particular code, and it isn't wired
into `POST /api/organizers/sign-up` at all** — see "Backend limitations"
below. The step only checks that 6 digits were entered; it does not (and
currently cannot) confirm the code matches what was texted.

Final submission calls the real `POST /api/organizers/sign-up`, which is a
`multipart/form-data` endpoint server-side (it runs through multer for an
optional business-license upload) — the client sends `FormData` even though
this app doesn't yet support attaching a file. On success the account is
created but inactive; the success screen tells the organizer their
application needs admin approval before they can sign in, matching what the
backend actually does.

## Organizer dashboard

`app/organizer/index.tsx` calls the one endpoint that has everything the
home screen needs: `GET /api/organizers/:organizerId/dashboard?currency=ETB`
(`backend/src/controllers/organizerController.js`) — an aggregation that
returns the organizer's events already joined with per-event ticket stats
and revenue, plus a balance summary. Stat tiles (total/published events,
available balance, total revenue) and a pull-to-refresh event list are built
from that single response — no separate calls per event. Currency is
hardcoded to ETB for now (`app/organizer/index.tsx`'s `CURRENCY` constant);
a currency toggle is a natural next step if organizers need USD.

## Security considerations

- The backend is the only authorization boundary. Nothing in this app — role
  checks, event-ownership checks, ticket-scan permissions — is trusted
  client-side; the app only reflects what the API allows.
- Auth token lives in Expo SecureStore, never AsyncStorage, on iOS/Android —
  the real target platforms. (`src/lib/secureStorage.ts` falls back to
  `localStorage` on web only, since `expo-secure-store` has no web
  implementation at all; that fallback is a dev-convenience for `npm run
  web`, not a security boundary, and irrelevant to the native app.)
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

1. **`POST /api/auth/send-otp` (used by organizer sign-up's phone-verification
   step) still has no verify counterpart**, and isn't wired into
   `POST /api/organizers/sign-up` at all (confirmed by reading both
   controllers — the existing web organizer-registration flow at
   `../organzier-pazimo/app/organizer-registration/page.tsx` doesn't call it
   either, and creates the user with `isPhoneVerified: false` unconditionally).
   This is a *different* mechanism from the organizer login 2FA
   (`/api/auth/organizer/send-otp` + `/verify-otp`), which is real and fully
   wired up (added 2026-09-04) — only the sign-up-flow one is still a gap.
   The mobile app's sign-up OTP step is UI-only until a verify endpoint
   exists for it.
   - **Smallest fix:** either give `POST /api/organizers/sign-up` an
     `otpCode` field it checks against the same `otpCodeHash`/`otpExpires`
     mechanism `generateAndSendOtp`/`verifyOrganizerOtp` already use in
     `authController.js` (the user doc exists by the time sign-up runs, so
     the same hash-and-compare approach applies directly), or add a
     standalone `POST /api/auth/verify-otp { phoneNumber, code }` for
     pre-account-creation phone verification.
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

- Wire up sign-up phone verification once it has a backend-checked path;
  until then, don't present the current sign-up OTP step as real
  verification to end users.
- Event detail screen (tap an event card) — `GET /api/events/:id` has
  everything beyond what the dashboard's list view already shows.
- Ticket sales / attendee list drill-down per event.
- Ticket scanning: needs the usher/staff model above before an usher-scoped
  scanner can exist; an organizer-scoped scanner could be built sooner
  against whatever ticket-validation endpoint the existing organizer app
  uses (not yet inspected in this pass).
- A currency toggle (ETB/USD) on the dashboard, if organizers need it.
- Add EAS Build configuration when it's time to produce real app binaries.

## GitHub

Not pushed yet. To create the remote and push:

```bash
cd pazimo-organizer-mobile
gh repo create pazimo-organizer-mobile --private --source=. --remote=origin
git push -u origin main
```
