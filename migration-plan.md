# Migration Plan: HMS App → Polaris Architecture

**Status:** Draft
**Scope:** Migrate `hms-app` (Expo/React Native, single package, axios + AsyncStorage/SecureStore) into a Polaris-style monorepo: Nx workspace, module-federation host + microapp remotes, tRPC + Zod contracts, NestJS API layer.
**Backend constraint:** `hms-backend` (Express + Mongoose, hosted) stays as the system of record. It is wrapped by a NestJS gateway — not rewritten — for the duration of this plan.
**Date:** 2026-09-30

---

## 1. Current state (baseline)

| Layer | Today |
| --- | --- |
| App | Single Expo/RN app (`hms-app`), React Navigation (native-stack + bottom-tabs) |
| Screens | `login`, `signup`, `home`, `appointment`, `view-appointment`, `edit-appointment`, `profile`, `edit-profile`, `view-medical-record` |
| API client | `axios` instance in [interceptor.service.ts](src/services/interceptor.service.ts) — JWT attach + refresh + global error `Alert` |
| Auth storage | `expo-secure-store` (token) + `AsyncStorage` (email, patientId) |
| Services | `auth`, `user`, `appointment`, `medical-record`, `ui` — thin axios wrappers, no shared request/response schema |
| Backend | `hms-backend`: Express, Mongoose, route → controller → validation (Joi/express-validate style) per domain (`auth`, `user`, `admin`, `appointment`, `medical-record`, `node`, `ui`) |
| Backend auth | JWT + refresh-token endpoint, `auth.middleware.js` + `permission.middleware.js` |

There is currently **no monorepo, no shared type contracts between client and server, no design system, no multi-tenancy**. This plan builds all of that incrementally.

---

## 2. Target architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  mobile-host (shell)                                         │
│  auth session · MF host · theme · nav coordination            │
└───────────────┬───────────────────────────────┬──────────────┘
                │ loads remotes                  │
                ▼                                 ▼
     ┌──────────────────────┐          ┌──────────────────────┐
     │ apps/ui/authentication│          │ apps/ui/appointments  │
     └───────────┬───────────┘          └───────────┬───────────┘
                 │ tRPC client                       │
                 ▼                                   ▼
     ┌────────────────────────────────────────────────────────┐
     │ apps/api/<domain> (NestJS + tRPC)                       │
     │  sdk routers → service tokens → gateway implementations │
     └───────────────────────┬──────────────────────────────────┘
                              │ HTTP (existing REST contracts)
                              ▼
                   ┌──────────────────────┐
                   │ hms-backend (hosted) │  ← unchanged system of record
                   │ Express + Mongoose   │
                   └──────────────────────┘
```

**Non-goals:**
- Rewriting `hms-backend`'s business logic or database layer.
- Multi-tenancy (single hospital/tenant is fine — build tenant module shape, hardcode one tenant).
- Native module work beyond what already exists (no new camera/biometrics/etc.).

---

## 3. Domain → microapp mapping

| Domain | Screens moving in | Notes |
| --- | --- | --- |
| `authentication` | `login`, `signup` | Owns session; host consumes its output |
| `appointments` | `appointment`, `view-appointment`, `edit-appointment` | Uses `useAppointmentForm` hook today — becomes microapp-local hook |
| `medical-records` | `view-medical-record` | Read-only today — good first migration candidate (low risk) |
| `profile` | `profile`, `edit-profile`, `home` | `home` is the tab landing screen; keep with profile/dashboard domain unless it grows |

Reference order for migration (least → most risky): **medical-records → profile → appointments → authentication** (auth last because host session depends on it and everything else depends on host session existing first — see Phase 4 sequencing note).

---

## 4. Mapping: current code → Polaris concepts

| Today | Polaris equivalent |
| --- | --- |
| `App.tsx` + `AppNavigator` | `mobile-host` root nav + auth gate |
| `TabNavigator` | Host-level tab registry loading remotes |
| `src/screens/*.tsx` | `apps/ui/<domain>/src/app/screens/<screen>/<screen>.tsx` |
| `src/hooks/useAppointmentForm.ts` | `apps/ui/appointments/src/app/screens/appointment/useAppointment.ts` |
| `src/services/*.service.ts` (axios) | tRPC React Query hooks generated from `packages/platform-integration/sdk/<domain>` |
| `src/types/*.types.ts` | `packages/models/src/lib/<domain>/*.schema.ts` (Zod) — types inferred, not hand-written |
| `interceptor.service.ts` token/refresh logic | Host-owned session (`accessToken`/`refreshToken`), microapps never touch storage directly |
| Inline colors (`rgb(84, 20, 134)` in `TabNavigator`) | `@polaris/components` theme tokens |
| No content layer (strings inline in JSX) | `content/` maps per microapp |
| `hms-backend` routes/controllers | `apps/api/<domain>/src/app/tenants/default/gateways/*.gateway.ts` calling the same REST endpoints over HTTP |

---

## 5. Phased plan

### Phase 0 — Foundations & spike (1–2 weeks)

**Goals:** Prove host loads a remote; one authenticated round-trip through host → NestJS gateway → `hms-backend`.

**Work**
1. Create Nx workspace; scaffold `apps/ui/mobile-host` (RN + RN-Web target since `expo start --web` already exists today).
2. Scaffold `apps/api/medical-records` (NestJS) with **one** gateway procedure that proxies `GET /medical-record/:patientId` on `hms-backend`.
3. Adapter spike: exchange the existing JWT (from `auth.service.ts` login response) for a host session shape (`accessToken`, `refreshToken`, `patientId`, `email`).
4. Confirm CORS: `hms-backend`'s `FRONT_END_URL` env must include whatever origin the new host serves from locally (see prior conversation — this is the same CORS issue, now for the host's dev origin instead of the old Expo dev origin).

**Exit criteria**
- [ ] Host boots (web) locally.
- [ ] One protected call (`GET /medical-record/:patientId`) succeeds end-to-end through the NestJS gateway.
- [ ] ADR written: confirms gateway-first approach; confirms single microapp vs. per-domain split (recommended: per-domain, matching §3).

---

### Phase 1 — Scaffold remaining microapps (1 week)

**Work**
1. Scaffold `apps/ui/authentication`, `apps/ui/appointments`, `apps/ui/profile` as empty-but-wired remotes (landing screen only).
2. Register each in host's remote-loading config and tab/stack registry, mirroring today's `AppNavigator`/`TabNavigator` split:
   - `authentication` → pre-login stack (`login`, `signup`)
   - `profile`, `appointments`, `medical-records` → post-login tabs
3. Port `packages/models` skeletons for each domain from existing `src/types/*.types.ts` (these already define shapes — convert to Zod schemas 1:1, don't redesign).

**Exit criteria**
- [ ] All 4 microapps load inside host (empty screens ok).
- [ ] Existing `*.types.ts` files have Zod equivalents in `packages/models`.

---

### Phase 2 — Screen migration, domain by domain (3–6 weeks)

Follow the order from §3. **Per-screen recipe:**

1. Create `apps/ui/<domain>/src/app/screens/<screen>/` with `<screen>.tsx`, `use<Screen>.ts`, `<screen>.styles.ts`, `<screen>.stories.tsx`.
2. Replace direct axios calls (currently via `services/*.service.ts`) with tRPC hooks against the Phase 0/3 SDK.
3. Move inline strings to `content/` maps.
4. Wire into host navigator; remove the old screen from `hms-app`'s `AppNavigator`/`TabNavigator` once verified.

**Specific carry-overs to preserve behavior (don't lose these during migration):**
- `medical-records`: read-only fetch — straightforward, no mutation risk.
- `profile`: `edit-profile` is a mutation — needs idempotency/error-mapping considered in the gateway (see §7).
- `appointments`: `useAppointmentForm.ts` logic (create/edit) moves as-is into `useAppointment.ts`; validate against existing `appointment.validate.js` rules on the backend side so client/server validation stays consistent.
- `authentication`: token refresh logic in `interceptor.service.ts` (lines 37–60) becomes host-side session refresh, not per-microapp.

**Exit criteria**
- [ ] All 9 screens migrated and reachable from host.
- [ ] No microapp holds `SecureStore`/`AsyncStorage` token logic directly — host owns it.
- [ ] `hms-app` (old) no longer required for any in-scope journey.

---

### Phase 3 — Backend integration via NestJS gateway (parallel with Phase 2, 2–6 weeks)

**Goal:** Every domain has a real gateway, not just the Phase 0 spike one.

Per domain (`auth`, `user`, `appointment`, `medical-record`):
1. Add Zod schemas in `packages/models/src/lib/<domain>/` matching `hms-backend`'s existing validation (`src/validation/<domain>.validate.js`) — these should already agree since both describe the same payloads; reconcile any drift found (validation logic in Joi vs. Zod is a good place to catch discrepancies).
2. Add SDK router + service interface + injection token in `packages/platform-integration/sdk/<domain>/`.
3. Implement `apps/api/<domain>/.../gateways/<domain>.gateway.ts` — thin HTTP client calling `hms-backend`'s existing REST endpoints (`src/routes/<domain>.route.js`), forwarding `Authorization` header and any cookies used today.
4. Map errors: `hms-backend`'s `errorHandler.middleware.js` + `appError.utils.js` shape → tRPC error codes (don't leak raw Express error bodies to the client).

**Exit criteria**
- [ ] All UI network calls go through tRPC + gateway; zero direct axios calls to `hms-backend` from any microapp.
- [ ] `hms-backend` untouched except for CORS/env config to accept requests from the gateway's origin (likely same-origin/server-to-server, so CORS may become irrelevant for these calls — only the host's own browser-facing calls, if any, need CORS).

---

### Phase 4 — Auth, session, host ownership (overlaps Phase 2–3)

**Note on sequencing:** even though `authentication` screens migrate last per §3 (lowest UI risk first), the **host session mechanism** must exist before Phase 2 starts, because every other microapp depends on host-issued tokens. Practically: build host session handling in Phase 0/1, migrate the `login`/`signup` *screens* themselves last.

**Work**
1. Host calls the `authentication` gateway's `login`/`signup`/`refresh-token` procedures (wrapping `hms-backend`'s `/auth/login`, `/auth/patientSignUp`, `/auth/refresh-token`).
2. Host stores tokens (`SecureStore` equivalent at host level) and exposes session/member context to all microapps via props, not shared storage access.
3. Logout clears host session and calls `hms-backend` if it has server-side session invalidation; otherwise client-side clear is sufficient (confirm which applies — check `auth.controller.js`).

**Exit criteria**
- [ ] Cold start, token refresh, and expired-token paths all work through the host.
- [ ] No microapp imports `expo-secure-store` or `AsyncStorage` directly for auth.

---

### Phase 5 — Navigation & deep links (1–2 weeks)

Given this app has no existing deep-linking, this phase is lighter than the general template:
1. Recreate today's stack routes (`viewAppointment`, `editAppointment`, `editProfile`) as host-registered paths per microapp.
2. Recreate the bottom-tab set (`home`, `appointment`, `record`, `profile`) as host tab config pointing at the 4 microapps.
3. Skip external URL scheme work unless you actually need deep links (not present today — treat as optional/future).

---

### Phase 6 — Quality & CI (ongoing)

1. Nx targets: lint/typecheck/test/storybook per microapp and per API app.
2. Add tests where none exist today (`hms-app` currently has no test setup — confirm and add Jest config as part of scaffolding, not as an afterthought).
3. CI pipeline covering both `apps/ui/*` and `apps/api/*` plus existing `hms-backend` (unchanged pipeline, if one exists).

---

### Phase 7 — Cutover

1. Point Expo/web build config at the new host instead of `hms-app`'s `App.tsx`.
2. Freeze `hms-app` as-is once all 9 screens have Polaris equivalents in production use.
3. Keep `hms-backend` running unchanged — it remains the API for the indefinite future per the stated constraint.

---

## 6. Backend strategy (explicit, since hms-backend stays hosted)

`hms-backend` is **not** touched functionally. The only backend-adjacent changes are:

| Change | Where | Why |
| --- | --- | --- |
| CORS origin update | [app.js:14-19](../hms-backend/src/app.js#L14-L19) `FRONT_END_URL` | Must allow whatever origin the new host serves from (dev + prod), same class of issue as the earlier localhost CORS problem |
| None otherwise | — | Gateway calls it like any other REST client; no schema, route, or controller changes required |

Gateway adapter checklist per domain:
- [ ] Forward `Authorization` header as-is (JWT format unchanged)
- [ ] Map `hms-backend` error responses (`appError.utils.js` shape) to tRPC error codes
- [ ] Reconcile Joi validation (`src/validation/*.validate.js`) against new Zod schemas — flag any mismatch as a bug in one or the other, don't silently diverge
- [ ] Preserve refresh-token flow timing/semantics from `interceptor.service.ts` lines 37–60

---

## 7. Open questions (answer before Phase 0)

1. Is `hms-backend`'s hosting environment (`backend.fortrancer.in`) able to have its `FRONT_END_URL` env var updated for the new host's dev/prod origins, or is that env managed elsewhere/by someone else?
2. Is web support (`expo start --web`) required for the Polaris host, or is this mobile-only in practice?
3. Any plan to eventually rewrite `hms-backend` itself, or is "stays hosted" permanent? (Affects whether Phase 3 gateways are temporary or permanent.)
4. Single tenant confirmed (one hospital), or is multi-tenant on any roadmap?

---

## 8. Immediate next actions

1. Answer §7.
2. Stand up Nx workspace + `mobile-host` + one gateway (Phase 0) using `medical-records` as the pilot domain — it's read-only and lowest risk.
3. Update `hms-backend`'s `FRONT_END_URL` to include the new host's local dev origin once Phase 0 needs a live call.
4. Use the pilot domain as the template for the remaining 3 domains.

## 9. Folder structure

Here is the Polaris RN folder structure, focused on what you’d replicate.

---

## Top-level UI layout

```
apps/ui/
├── mobile-host/              # Shell binary (native + web host)
├── authentication/           # Feature remote
├── benefits/
├── claims/                   # Feature remote (canonical example)
├── claims-shared/            # Headless shared-component remote
├── dashboard/
├── documents/
├── engagement/
├── findcare/
├── idcard/
├── idcard-shared/
├── payments/
├── pharmacy/
├── profile/
├── profile-shared/
├── spending-accounts/
├── virtual-assistant/
├── tenant-assets/            # Web CSS / tenant static assets
├── tenant-manager/
└── mf-tools/                 # Shared MF/Rspack config for all remotes
```

```
packages/frontend/
├── components/               # Design system (@polaris/components)
├── core/                     # True MF singletons (@polaris/frontend-core)
├── shared/                   # Helpers, context, tRPC, themes (bundled per remote)
├── native-api/               # Contracts only — no native modules
├── testing/                  # Jest/MSW harness
├── devtools/                 # Storybook helpers
├── openui/
├── tenants/                  # Tenant-specific frontend bits
└── android-native-utils/
```

---

## 1. Host (`apps/ui/mobile-host`)

```
mobile-host/
├── android/                  # Native Android project
├── ios/                      # Native iOS project
├── e2e/                      # Detox/smoke
├── public/
├── src/
│   ├── main.tsx              # RN entry + Re.Pack ScriptManager
│   ├── main-web.tsx          # Web entry
│   ├── bootstrap.tsx         # Web custom element mount
│   ├── index.html
│   ├── assets/
│   ├── content/              # Host copy
│   ├── configs/
│   │   ├── config.default.ts
│   │   ├── configLoader.ts
│   │   └── <tenant>/         # elevance-commercial, medicaid, …
│   │       ├── config.common.ts
│   │       ├── config.dev.ts
│   │       └── …
│   └── app/
│       ├── app.tsx           # Outer provider tree
│       ├── appInnerChild.tsx # Auth + native providers + navigator
│       ├── authProviderWrapper.tsx
│       ├── trpc.ts
│       ├── routes.ts
│       ├── components/
│       │   ├── hostSlots/    # Host UI injected into remotes
│       │   ├── activityMonitor/
│       │   ├── shared/
│       │   └── webview/
│       ├── context/          # AppConfig, theme, host config, MF registries
│       ├── hooks/
│       ├── layouts/
│       ├── navigation/       # Root/public/secure nav + linking + handler
│       ├── screens/          # Thin remote loaders (NOT feature UI)
│       │   ├── claims/claims.tsx
│       │   ├── benefits/
│       │   ├── authentication/
│       │   └── …
│       ├── services/         # Native API implementations (+ .web stubs)
│       ├── storage/
│       └── utils/
│           ├── initiateMicroApps.ts
│           ├── loadRemote.tsx
│           ├── loadRemotePathConfig.ts
│           └── msw/
├── module-federation.config.ts
├── rspack.config.mjs
├── rspack.config.web.ts
├── metro.config.js
├── package.json
└── project.json
```

**Rule:** Host `screens/<feature>/` are wrappers that `loadRemote` and pass `MicroAppContext`. Real screens live in the remote.

---

## 2. Feature microapp (`apps/ui/claims`)

```
claims/
├── android/ / ios/           # Optional standalone for Storybook / local run
├── .storybook/               # Web Storybook
├── .rnstorybook/             # RN Storybook
├── public/
├── src/
│   ├── remote-entry.ts       # Exposes MicroApp + pathConfig to host
│   ├── trpc.ts               # Typed client for this feature
│   ├── main.tsx / main-web.tsx
│   ├── integration-entry.ts
│   ├── mocks/                # MSW handlers + fixture data
│   │   ├── handlers.ts
│   │   ├── server.ts
│   │   ├── data/
│   │   └── storybook/
│   ├── test-utils/
│   ├── assets/
│   └── app/
│       ├── microApp.tsx      # Host contract entry (MicroAppProperties)
│       ├── webIntegration.tsx
│       ├── providers/        # claimsProviders.tsx
│       ├── navigation/       # Internal stack only
│       │   ├── navigator.tsx
│       │   └── navigationTypes.ts
│       ├── screens/          # Routable screens (colocated stories)
│       │   ├── claimsLanding/
│       │   ├── claimSummary/
│       │   │   ├── claimsSummary.tsx
│       │   │   ├── claimsSummary.stories.tsx
│       │   │   ├── useClaimsSummary.ts
│       │   │   ├── components/
│       │   │   └── …
│       │   ├── claimsSubmission/
│       │   └── …
│       ├── components/       # Shared within this microapp only
│       ├── content/          # Translatable copy bag
│       ├── configs/          # Feature + per-tenant config
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── models/
│       ├── services/
│       └── utils/
├── module-federation.config.ts
├── rspack.config.mjs
├── rspack.config.web.ts
├── test-setup.ts
└── package.json              # polaris.hostCompatibility.minHostVersion
```

### Screen folder convention

```
screens/<screenName>/
├── <screenName>.tsx
├── <screenName>.styles.ts
├── <screenName>.stories.tsx
├── use<ScreenName>.ts
├── components/               # Screen-local UI
└── hooks/                    # Screen-local hooks
```

### Shared-component remotes (`claims-shared`, `idcard-shared`, …)

Same MF packaging, but **no** navigable `microApp.tsx` / host stack entry — they expose reusable UI modules only.

---

## 3. MF tooling (`apps/ui/mf-tools`)

```
mf-tools/
├── rspack.config.mobile.base.js
├── rspack.config.web.base.ts
├── webpack.eager.modules.js      # Web eager singletons
├── native.dependencies.json      # Native shared dep allowlist
├── native.shared.mjs
├── native.shared.policy.json
└── code-signing/
```

All remotes plug into these base configs via `getConfig({ appName, exposes: { './MicroApp': './src/remote-entry' } })`.

---

## 4. Shared packages (what goes where)

| Package | Path | Put here |
|--------|------|----------|
| Design system | `packages/frontend/components/src/components/` | Button, Alert, Portal, … |
| Core singletons | `packages/frontend/core/src/` | Language, analytics types, handlers |
| Shared helpers | `packages/frontend/shared/src/lib/` | `microappContext`, tRPC factories, themes, QueryBoundary, auth store |
| Native contracts | `packages/frontend/native-api/src/` | camera, geolocation, file-picker APIs |
| Testing | `packages/frontend/testing/src/` | render helpers, MSW |

Important `frontend-shared` folders:

```
packages/frontend/shared/src/lib/
├── microappContext.ts
├── trpc/createTrpcClient.ts
├── themes/generated/
├── theme/
├── authStore/
├── navigation-contract/
├── hostSlots/
├── queryClientProvider.tsx
└── components/queryBoundary/
```

---

## 5. Minimal structure for *your* migration

If you only need RN + keep Node backend:

```
apps/
  mobile-host/                 # Phase 1 shell
    src/app/{components,context,hooks,navigation,screens,services,utils}
    android/  ios/
  <first-feature>/             # Phase 4 first remote
    src/
      remote-entry.ts
      app/{microApp,providers,navigation,screens,components,content}
packages/
  frontend-core/
  frontend-shared/
  components/                  # or consume @polaris/components
  frontend-native-api/
tools/                         # optional: host-compat, rspack base
```

Skip Polaris-only pieces until needed: `tenants/`, `*-shared` remotes, `tenant-assets`, multi-tenant `configs/<tenant>/` trees.

---

## Ownership cheat-sheet

| Folder | Lives in | Owns |
|--------|----------|------|
| `screens/<feature>/` (thin loader) | host | `loadRemote` + context injection |
| `screens/<feature>/` (real UI) | remote | Feature screens |
| `services/` (camera, maps, …) | host | Native implementations |
| `native-api` | package | Contracts/hooks only |
| `navigation/` (root + linking) | host | Cross-feature + deep links |
| `navigation/` (stack) | remote | Internal routes only |
| `content/` | remote (or host for shell copy) | User-visible strings |
| `trpc.ts` / API client | remote (+ shared factories) | Calls existing Node APIs |

If you want, I can next map this 1:1 onto a “Day-1 scaffold checklist” (exact files to create empty first).
