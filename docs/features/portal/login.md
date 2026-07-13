# Login (sign in)

- **Route:** `/login` — `app/login/page.tsx` (standalone, no marketing/portal chrome)
- **Section:** Auth · **Access:** public
- **Source:** design screenshot `screenshots/login-mobile.png` (mobile mockup); built on the Wesley design system
- **Render:** thin RSC page (`Suspense` boundary) → client `LoginView`

## Purpose
Mobile-first entry point to the portal. One screen for both **Staff** and **Family**; the audience toggle changes only the destination and helper copy. Backed by **Supabase Auth** (email/password) — a successful sign-in sets the session cookie and redirects into the app.

## Layout
Full-height `cream` screen, centered `max-w-[400px]` column:
1. Brand — `56px` navy "W" tile (gold, Newsreader) + "Welcome back" (serif `30px`) + sub.
2. Audience toggle — segmented Staff / Family pill (`toggle-track`), active = `cream-2` + shadow.
3. Form — Email, Password (with show/hide via `lock`/`close` icon), "Forgot password?" (inert), disabled-until-filled **Sign in** (navy).
4. Contextual helper line (Family → "Contact the home"; Staff → "Ask your manager") + "← Back to website".

## Variants & states (client)
- `audience` ∈ {staff, family} — preselect from `?as=family` (used by the marketing "Family login" CTA).
- `email` / `password` controlled; `showPw` toggles field type.
- **Submit gating:** button disabled (50% opacity) until both fields non-empty, or while a sign-in request is in flight ("Signing in…").
- Submit → `supabase.auth.signInWithPassword`. On error: inline alert (`bg-high-tint`). On success: redirect to `?next=` (when it targets `/portal`), else `/portal` (staff) or `/portal/family` (family).

## Interactions
- Audience toggle, show/hide password, submit-navigates. "Forgot password?" and the helper links to `/contact` are the only outbound links besides submit + "Back to website".
- Reached from marketing `SiteNav`: **Staff portal** → `/login`, **Family login** → `/login?as=family`.

## Responsive
Mobile-first by construction (single `400px` column, large tap targets); scales cleanly to desktop centered on `cream`.

## Auth wiring (Supabase)
- Clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (RSC/actions), `lib/supabase/middleware.ts` (`updateSession`).
- `src/middleware.ts` (matcher `/portal/:path*`, `/login`): refreshes the session, redirects unauthenticated `/portal*` → `/login?next=…`, and bounces signed-in users off `/login`.
- Sign-out lives in `PortalTopbar` (`supabase.auth.signOut()` → `/login`).
- Requires a Supabase Auth user to exist (create in Studio → Authentication, or invite).
- **Access gating:** after sign-in, `PortalLayout` resolves the user's `app_users` row (`lib/supabase/current-user.ts`); only an active assignment enters the portal (else the "access not provisioned" screen), and the portal role derives from `app_users.role_id`. Fails open until the schema is applied. See `docs/components/portal-shell.md`.

## Out of scope (this phase)
Password reset, SSO, sign-up/self-registration, email-confirmation UX, validation beyond non-empty.

## Definition of Done
`/login` renders standalone; toggle swaps destination + helper copy; `?as=family` preselects Family; Sign in disabled until filled / while pending; valid credentials set a Supabase session and route to the correct portal (or `?next=`); bad credentials show an inline error; `/portal*` is unreachable while signed out (307 → `/login`); `tsc`/`lint`/`build` clean.
