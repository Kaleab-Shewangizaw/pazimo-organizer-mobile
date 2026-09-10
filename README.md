# Pazimo Organizer Mobile

A new, independent React Native app that replaces Pazimo's existing organizer
mobile app. It talks to the real Pazimo backend (`../pazimo/backend`) — there
is no mock API and no separate backend in this repo.

**Status:** three roles are fully wired end to end — **organizer**, **usher**,
and **cashier** (the app's name for the backend's `cinema` role) all sign in
for real and land on a real tab-based experience: a Dashboard, a Tickets
tab, and a Bar tab (organizer/cashier), or a My Events → unlock-event-code →
camera QR scanner flow (usher). A branded, animated sign-in screen replaces
the old two-button welcome screen, and the app opens with a native splash
that hands off to that screen's own entrance animation. Event detail and a
per-event ticket sales drill-down (tapping into one event from the
dashboard) are not built yet — see "Next steps" below.

## Roles

- **Organizer** — dashboard (balance, per-event ticket/revenue cards),
  Tickets tab (every ticket sold across their events, plus a top-customers
  list), and a Bar tab (drinks sold, gated behind the backend's own
  beverage-eligibility flag — an admin has to turn it on per organizer).
  Full access is gated behind the backend's own approval flow: a newly
  self-registered organizer is created `isActive: false` and cannot log in
  until an admin approves the registration. There is currently no linked
  path to *create* an organizer account from this app (see below) —
  sign-up still exists at `app/(auth)/organizer-signup.tsx` but isn't
  reachable from the UI right now.
- **Usher** — scanner-only mode for door staff. Ushers are admin-created
  accounts (no self sign-up) that gain scan access to one or more events by
  redeeming a short code an admin/organizer generated for that event
  (`app/usher/unlock.tsx` → `POST /api/ushers/unlock-event`). `app/usher/index.tsx`
  lists every event the usher currently has access to
  (`GET /api/ushers/my-events`); tapping one opens a live camera QR scanner
  (`app/usher/scanner/[eventId].tsx`, `expo-camera`'s `CameraView`) that
  validates each scanned ticket against that specific event
  (`POST /api/tickets/validate-qr`). This role didn't exist on the backend
  until 2026-09-06 — see "Backend limitations" below for how that work was
  coordinated.
- **Cashier** — the cinema box office + concessions counter. Maps directly
  onto the backend's `cinema` role, which already had a complete API surface
  before this app existed (`/api/cinemas/me/*`): a combined + per-stream
  (tickets vs. beverages) balance on the Dashboard tab, a box-office ticket
  sales list on the Tickets tab, and a concessions catalog + sales summary
  on the Bar tab.

The sign-in screen (`app/(auth)/index.tsx`) just picks which login copy/screen
to show — Organizer, Usher, or Cashier — all three go through the exact same
`POST /api/auth/login`. Role is always read from the backend response, never
chosen in the UI: signing in on the wrong role's screen still lands wherever
the account's real role routes it. An authenticated user whose role is none
of `organizer`/`usher`/`cinema` (e.g. `customer`, `venue`) lands on a
dedicated "account not supported" screen instead of silently getting access
to any of the three.

## Tech stack

- React Native + Expo (SDK 57), TypeScript, Expo Router (`Stack.Protected`
  role-based route guards; classic `Tabs` — not the `unstable-native-tabs`
  variant — for each role's Dashboard/Tickets/Bar tab bar)
- Zustand for auth/session state
- TanStack Query for server-state — `useQuery` for dashboards, `useInfiniteQuery`
  for the paginated Tickets tabs, mutations for sign-in/unlock-event/scan
- Zod for form validation
- Expo SecureStore for the auth token (never AsyncStorage)
- Plain `fetch` behind a single API client — no HTTP library added just for
  convenience
- `expo-camera`'s `CameraView` for the usher QR scanner
- `expo-splash-screen` (native splash) + `react-native-reanimated`'s
  built-in entrance presets (the sign-in screen's own "logo take-over" on
  mount) + `expo-linear-gradient` (sign-in background) + `expo-haptics`
  (light tap feedback on the role picker) + `@expo/vector-icons` (tab bar
  and role icons)
- `@expo-google-fonts/manrope` — the one display typeface, used only for
  headings and figures (see "Design system" below); everything else stays
  on the system font

## Design system

Every screen reads colors through `useColors()` (`src/lib/useColors.ts`),
never a static import — that's what makes the Light/Dark/System toggle (each
role's Account tab, `src/store/themeStore.ts`) actually work. The palette
itself (`src/lib/theme.ts`, `lightColors`/`darkColors`) is adapted from a
design reference the user provided — a Lovable mockup of this exact app —
converted from its oklch tokens to hex via the real CSS Color 4 matrices,
not eyeballed.

- **Color**: a warm off-white/near-black-navy pair (not pure white/black) in
  both directions, with one vivid gold (`accent`) reserved for the figure
  that matters most on a screen — an available balance, a hero revenue
  number. Status colors (success/warning/error) stay visually distinct from
  that gold. One deliberate deviation from the reference: its dark theme's
  accent token collapses to a neutral gray — this app keeps the gold vivid
  in dark mode too, since every other token pair there stays purposeful and
  a gray accent read as an oversight rather than a choice.
- **Type**: Space Grotesk (500/600/700) for headings, section titles, money/stat
  figures, and button labels; DM Sans for body copy, labels, and inputs that
  want to move off the platform system font.
- **Hero cards** (`src/components/HeroCard.tsx`): the one solid-fill card per
  screen — always an inversion of the page (dark block on a light page,
  light block on a dark page) — reserved for the single most important
  figure. Every other card stays a bordered, page-colored surface.
- **Progress bars / chips** (`src/components/ProgressBar.tsx`,
  `Chip.tsx`): thin rounded-track comparisons (ticket-tier sell-through,
  revenue by event, drink sales) and pill filters (the organizer dashboard's
  event selector), matching the reference's language.
- The perforated "ticket stub" tear-line (`src/components/StubDivider.tsx`)
  is still this app's one extra signature device, kept on event cards
  specifically (it's an actual ticket, after all) rather than the balance
  hero, which now uses HeroCard's own divider treatment instead.
- **Status**: a dot + label, not a filled pill — restrained so gold stays the
  only "loud" color on the page.

## Project structure

```
app/
  _layout.tsx              # role-based route guards (Stack.Protected), splash-screen
                            #   hand-off, font loading
  (auth)/
    index.tsx               # sign-in — animated role picker: Organizer / Usher / Cashier
    organizer-login.tsx      # thin wrapper around LoginForm
    usher-login.tsx           # thin wrapper around LoginForm
    cashier-login.tsx          # thin wrapper around LoginForm
    forgot-password.tsx       # 3-step reset, shared by every role
    organizer-signup.tsx      # multi-step organizer sign-up + phone OTP (not linked anywhere today)
  organizer/
    (tabs)/
      index.tsx                # Dashboard — balance stub, event list
      tickets.tsx                # Tickets — sold tickets + top customers
      bar.tsx                     # Bar — drinks sold, gated on beverage eligibility
  cashier/
    (tabs)/
      index.tsx                # Dashboard — combined + per-stream (tickets/beverages) balance
      tickets.tsx                # Tickets — box-office sales
      bar.tsx                     # Bar — concessions catalog + sales
  usher/
    index.tsx                # My Events — every event this usher can scan for
    unlock.tsx                 # redeem a 6-character event code
    scanner/[eventId].tsx       # camera QR scanner, scoped to one event
  unsupported-role.tsx       # any other authenticated role lands here

src/
  api/        client.ts (fetch wrapper, error normalization, 401 handling)
              auth.ts (login, getCurrentUser, organizer OTP send/verify,
              forgot/verify/reset password, sendOtp, organizerSignUp)
              organizers.ts (getOrganizerDashboard, getTopCustomers)
              tickets.ts (getOrganizerTickets, validateTicketQr)
              beverages.ts (getBeverageEligibility, getOrganizerBeverageDashboard)
              cinema.ts (cashier's /api/cinemas/me/* calls)
              ushers.ts (getMyUsherEvents, unlockUsherEvent)
  components/ shared UI: Button, TextField, OtpInput, CodeInput, Banner, Screen,
              StubDivider, StatusBadge, EventCard, ListRow, StatTile, RoleCard,
              EmptyState, ...
  features/auth/  LoginForm.tsx (shared by every role's *-login.tsx screen), schemas.ts
  lib/        config.ts, theme.ts, fonts.ts, secureStorage.ts, queryClient.ts,
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

`EXPO_PUBLIC_API_URL` for production is set explicitly per-profile in
`eas.json` (`https://pazimo.com/api`), which EAS Build reads directly — no
extra setup needed for cloud builds.

For a local release build, create a `.env.production` (gitignored, same as
`.env` — see `.env.example`) with:

```
EXPO_PUBLIC_API_URL=https://pazimo.com/api
```

It's loaded automatically by any local build that bundles with
`NODE_ENV=production`.

### EAS Build (cloud)

```bash
npx eas build --platform android --profile preview     # signed, installable .apk for testing
npx eas build --platform android --profile production  # .aab for Play Store submission
```

EAS manages the Android signing keystore for you (created automatically on
first build). The project is linked via `extra.eas.projectId` in `app.json`.

### Local build (no EAS account needed)

```bash
npx expo prebuild --platform android   # (re)generates the android/ folder — gitignored, safe to delete/regenerate
cd android
./gradlew assembleRelease              # -> android/app/build/outputs/apk/release/app-release.apk
```

This is release-optimized but signed with the Android debug key (see the
`release` signing config in `android/app/build.gradle`), so it installs fine
for sideloading/testing but **is not suitable for a Play Store upload** —
generate and wire up a real release keystore first if you need that
(https://reactnative.dev/docs/signed-apk-android), or just use the EAS
`production` profile above, which handles signing for you.

## Authentication architecture

```
Sign-in screen — Organizer / Usher / Cashier (copy only, animated role picker)
  → organizer-login.tsx / usher-login.tsx / cashier-login.tsx (all render the same LoginForm)
  → POST /api/auth/login
  → organizer accounts: 200 { requiresOtp: true, data: { email, channel, maskedDestination } } — no token yet
      → POST /api/auth/organizer/verify-otp { email, code } → token
  → any other role (usher, cinema/"cashier", venue, customer): 200 { data: { user, token } } directly
  → token stored in Expo SecureStore
  → GET /api/auth/me to resolve the authoritative role (session restore only —
    login/verify-otp already return the user, so they skip this call)
  → Stack.Protected routes to organizer / cashier / usher / unsupported-role
```

`src/features/auth/LoginForm.tsx` is the one real implementation behind
every role's `*-login.tsx` screen — the backend decides the actual role and
whether 2FA applies (organizer accounts only, today), so each screen only
needs to differ in title/subtitle copy, not logic. Every
organizer login goes through a mandatory second factor
(`backend/src/controllers/authController.js` `login()`, added 2026-09-04) —
`LoginForm` handles this as an in-place step (`VerifyLoginOtp`) after the
password step returns `requiresOtp: true`, with both a same-channel resend
and an explicit "Email me a code instead" (SMS delivery to this OTP gateway
is documented as unreliable — see that file's comment). The code is
single-use, expires in 10 minutes, and the account locks out after 5 wrong
attempts (enforced server-side; the client just surfaces whatever the API
says).

Session restoration on app launch re-runs the `/auth/me` check rather than
trusting a cached role — an expired or revoked token clears the stored token
and drops the user back to the sign-in screen (`src/store/authStore.ts`,
`bootstrap()`). Any `401` from any API call clears the session globally
(`src/api/client.ts`'s `setUnauthorizedHandler`), not just in the screen that
happened to make the failing request.

### Forgot password

`app/(auth)/forgot-password.tsx` is a 3-step flow (request code by email or
phone → verify code → set new password) against the role-agnostic
`/api/auth/forgot-password` / `/verify-reset-code` / `/reset-password`, linked
from every login screen. A successful reset signs the account in
immediately, matching what the backend does.

### Organizer sign-up + phone verification

Not linked from the UI right now (removed per direction — the sign-in/login
screens no longer offer account creation, only sign-in). The screen and its
backend call still work if something links to `/organizer-signup` again.

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

## Organizer screens

`app/organizer/(tabs)/index.tsx` calls the one endpoint that has everything
the Dashboard tab needs: `GET /api/organizers/:organizerId/dashboard?currency=ETB`
(`backend/src/controllers/organizerController.js`) — an aggregation that
returns the organizer's events already joined with per-event ticket stats
and revenue, plus a balance summary. The balance card, the events stat
strip, and a pull-to-refresh event list are all built from that single
response — no separate calls per event. Currency is hardcoded to ETB for now
(this file's `CURRENCY` constant); a currency toggle is a natural next step
if organizers need USD.

This endpoint 500'd with `ReferenceError: Withdrawal is not defined` until
2026-09-04 — `organizerController.js` used the `Withdrawal` model in its
balance aggregation without importing it. Fixed with a one-line import;
worth knowing about if you see the same error again after a merge that
touches that file.

`app/organizer/(tabs)/tickets.tsx` combines two endpoints: a paginated
`GET /api/tickets/organizer/all` (every ticket sold across the organizer's
events, `useInfiniteQuery` + "load more on scroll") for the header stats and
the sale list, and `GET /api/organizers/:organizerId/top-customers` for the
ranked top-customers section beneath it.

`app/organizer/(tabs)/bar.tsx` always calls
`GET /api/beverages/organizer/eligibility` first — this is deliberately the
*only* beverage endpoint that never 403s, "so the organizer app can decide
whether to show the feature at all" (its own route comment). Only when that
comes back `"eligible"` does the screen call
`GET /api/beverages/organizer/dashboard` for the totals/by-drink/by-event/
recent-sales data; otherwise it shows a plain "not enabled yet" state
instead of surfacing the 403 as an error.

## Cashier (cinema) screens

"Cashier" is this app's name for the backend's `cinema` role — a login tied
to a `Cinema` business document, gated by `requireCinemaAccount` on every
`/api/cinemas/me/*` call (resolved from the account, never from a
client-supplied cinema id, so one cinema account can never reach another's
data). This surface required no backend work at all — it already had a
complete API before this app existed.

`app/cashier/(tabs)/index.tsx` calls `GET /api/cinemas/me` (profile) and
`GET /api/cinemas/me/finance` (combined balance +
`streams: { tickets, beverages }`, each its own available/pending/revenue —
see `cinemaFinanceService.calculateCinemaBalance` for the exact shape).
Tickets and Bar tabs are `GET /api/cinemas/me/ticket-sales(/summary)` and
`GET /api/cinemas/me/concessions` + `/concession-sales/summary`
respectively — the same box-office-sale and concessions-catalog views a
cinema's own admin panel would show, just read-only and mobile-shaped here.

Selling a ticket at the counter or ringing up a concessions sale from this
app is **not built yet** — this pass is the viewing/reporting half of the
role. See "Next steps".

## Usher screens

Ushers are admin-created `User` accounts (role `"usher"`, added to the
backend 2026-09-06 by a parallel effort — see "Backend limitations" for how
this was coordinated with this app's own work). There's no usher sign-up;
an admin creates the account, then grants scan access to one event by
generating a short code the usher redeems. An usher holds **at most one**
live grant at a time — redeeming a new code silently replaces whatever grant
they had before (a server-side behavior change on 2026-09-07;
`GET /api/ushers/my-events` still returns an array, but it's 0 or 1 items in
practice) — so the UI treats it as "my current event," not a picker over
several.

- `app/usher/(tabs)/index.tsx` — the current-event card (or an empty state
  + "Unlock an event" if there isn't one yet), with a "Switch to a different
  event" link that re-runs the unlock flow.
- `app/usher/unlock.tsx` — a 6-character code entry
  (`POST /api/ushers/unlock-event { code }`); invalidates the "my events"
  query on success so the new event replaces the old one immediately.
- `app/usher/scanner/[eventId].tsx` — a live camera QR scanner
  (`expo-camera`'s `CameraView`, `barcodeTypes: ["qr"]`) with a
  scan → review → confirm flow, not check-in-on-scan:
  1. Each scanned ticket QR (a bare `ticketId` string, no JSON envelope) is
     sent to `POST /api/tickets/validate-qr { qrData, scopeEventId }` —
     confirmed by reading the controller to be **read-only** (it never
     saves anything). Shows who the ticket belongs to and how many people
     it admits (`ticketCount`).
  2. The usher picks how many to admit right now via a stepper (defaults to
     the full count; useful for a group arriving in parts).
  3. Confirming calls `PATCH /api/tickets/:ticketId/check-in { count, scopeEventId }`,
     which is what actually commits the check-in and returns how many
     admissions remain.

  `scopeEventId` throughout is this screen's event — the backend checks the
  usher's access grant against the ticket's *real* event, never against
  whatever this screen claims. A wrong-event mismatch (either endpoint's
  several different backend wordings for it) is normalized client-side to
  one message, "Wrong ticket for this event," styled distinctly from a
  fatal error or an already-checked-in re-scan.

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
2. **~~No "usher" role or event-staff-assignment model~~ — resolved
   2026-09-06.** A separate Claude session working directly on
   `~/Documents/pazimo/backend` added this while this app's own sign-in/tabs
   work was in progress; the two sessions coordinated over a direct message
   exchange rather than guessing at each other's contract. Shipped: `"usher"`
   added to `User.js`'s role enum (admin-created only, `POST /api/ushers`,
   no self sign-up); `EventUsherCode` (one short code per event,
   generate/view via `POST`/`GET /api/ushers/events/:eventId/code`) and
   `UsherEventAccess` (the actual grant, created by
   `POST /api/ushers/unlock-event { code }`, revoked via
   `PATCH /api/ushers/events/:eventId/access/:usherId/revoke`) as the
   assignment model — code-based rather than a static admin-picks-the-usher
   join table. `PATCH /api/tickets/:ticketId/check-in` and
   `POST /api/tickets/validate-qr` both now accept `"usher"` in their
   `restrictTo(...)` list, checking the usher's grant against the ticket's
   real event rather than organizer-ownership. See "Usher screens" above
   for how this app uses it.

## Next steps

- Selling a ticket at the cinema box office / ringing up a concessions sale
  from the cashier app itself (`POST /api/cinemas/me/ticket-sales`,
  `/me/concession-sales` both already exist server-side) — this pass is
  read-only reporting for the cashier role.
- A manual ticketId + count check-in path for ushers as a fallback when a
  QR won't scan (damaged code, printed ticket) —
  `PATCH /api/tickets/:ticketId/check-in { count, scopeEventId }` already
  supports it; only the UI is missing.
- `assets/splash-icon.png` is still Expo's default template art and isn't
  currently referenced by `app.json` (the splash screen uses
  `logo-light.png`/`logo-dark.png` instead) — the app icon
  (`assets/icon.png` and the `android-icon-*.png` adaptive-icon layers) now
  uses the real Pazimo "P" wordmark. The splash screen and sign-in screen are
  intentionally typographic-only (a "Pazimo" wordmark, matching the rest of
  this design system).
- Wire up sign-up phone verification once it has a backend-checked path;
  until then, don't present the current sign-up OTP step as real
  verification to end users.
- Decide where organizer sign-up should be linked from again (or whether it
  moves elsewhere entirely) — it's currently unreachable from the UI.
- Event detail screen (tap an event card) — `GET /api/events/:id` has
  everything beyond what the dashboard's list view already shows.
- A currency toggle (ETB/USD) on the dashboard, if organizers need it.
- Generate a real release keystore for Android (the local `assembleRelease`
  build currently signs with the debug key — fine for sideloading, not for a
  Play Store upload). Not needed for EAS Build's `production` profile, which
  manages signing itself.

## GitHub

Not pushed yet. To create the remote and push:

```bash
cd pazimo-organizer-mobile
gh repo create pazimo-organizer-mobile --private --source=. --remote=origin
git push -u origin main
```
