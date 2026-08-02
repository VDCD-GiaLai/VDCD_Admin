# ARCHITECT.md — VDCD Admin Panel Technical Architecture

> This file is the **single source of truth** for architecture.
> Any agent (human or AI) who needs to add a library / change a pattern must update this file first, never silently deviate from it.
> If what you need to do is not described here → stop, ask, don't decide on your own (see AGENT.md).

---

## 0. Context

- Backend already exists: NestJS REST API at `/api/v1` (see `docs/API_DESCRIPTION.md`).
- This admin panel is a **pure FE client**, containing no critical business logic — all important validation lives in the BE, FE only validates for UX (fail-fast, reduce round-trips).
- Target users: `superadmin`, `editor` (internal VDCD staff) — not public users. `viewer` role exists in DB but is not allowed to login to this admin panel.
- Priorities: **CRUD speed, consistency across modules, easy maintenance** over SEO/SSR (unlike the public site).

---

## 1. Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19 | Primarily uses Client Components for CRUD pages |
| Language | TypeScript (strict: true) | No `any`, no unexplained `@ts-ignore` |
| UI Kit | HeroUI + Tailwind CSS | Themed via `tailwind.config.ts` (see DESIGN.md) |
| Server state | TanStack Query v5 | All API data goes through here, NEVER manually fetch in `useEffect` |
| Client/UI state | Zustand | Only for non-server state: sidebar collapsed, modal open, local filter draft |
| Form | React Hook Form + Zod | Zod schema shared for validation + TS type generation |
| Rich text | Tiptap | Used for `content` in Program/Solution/Project/Article |
| Auth | HttpOnly cookie + Next.js Middleware + Route Handlers (BFF) | See details in section 4 |
| HTTP client | Axios | Used in `api-client.ts`; provides interceptors, auto JSON parse, better error handling vs raw `fetch` |
| Package manager | pnpm | |
| Lint/Format | ESLint (next/core-web-vitals + typescript) + Prettier | Mandatory in CI |
| CI/CD | GitHub Actions (lint/type-check/build) + Vercel (auto-deploy via Git integration) | |
| Testing | Not applied in early phase (lint + type-check only). Will add Vitest when PLAN.md reaches Phase 5 | Temporary decision — will be reviewed when codebase stabilizes |

---

## 2. Directory structure

```
vdcd-admin/
├── .github/workflows/ci.yml
├── docs/
│   ├── API_DESCRIPTION.md        # copied from BE docs, DO NOT edit manually, only sync when BE changes
│   ├── USE_CASE.md
│   └── DB_SCHEMA.md
├── AGENT.md
├── ARCHITECT.md
├── PLAN.md
├── DESIGN.md
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Sidebar + Header, wraps RBAC guard
│   │   │   ├── page.tsx                  # Dashboard overview
│   │   │   ├── organization/page.tsx
│   │   │   ├── admin-users/page.tsx
│   │   │   ├── slides/page.tsx
│   │   │   ├── page-banners/page.tsx
│   │   │   ├── provinces/page.tsx
│   │   │   ├── partners/page.tsx
│   │   │   ├── operation-fields/page.tsx
│   │   │   ├── programs/
│   │   │   │   ├── page.tsx              # list
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx         # edit
│   │   │   ├── solutions/...             # same pattern as programs
│   │   │   ├── projects/...              # same pattern + /images sub-section
│   │   │   ├── articles/...              # same pattern
│   │   │   ├── jobs/...                  # same pattern
│   │   │   └── leads/
│   │   │       ├── page.tsx
│   │   │       └── [id]/page.tsx
│   │   │   ├── contacts/
│   │   │       ├── page.tsx
│   │   │       └── [id]/page.tsx
│   │   └── api/auth/                     # Route Handlers (BFF) — see section 4
│   │       ├── login/route.ts
│   │       ├── refresh/route.ts
│   │       └── logout/route.ts
│   ├── components/
│   │   ├── ui/                           # wrappers around HeroUI (if custom defaults needed)
│   │   ├── layout/                       # Sidebar, Header, Breadcrumb
│   │   └── shared/                       # DataTable, FormField, RichTextEditor,
│   │                                       # ImageUpload, ConfirmDialog, PublishToggle,
│   │                                       # StatusBadge, EmptyState, Pagination
│   ├── features/                         # 1 directory per business module (follows API docs)
│   │   ├── auth/
│   │   ├── organization/
│   │   ├── admin-users/
│   │   ├── slides/
│   │   ├── page-banners/
│   │   ├── provinces/
│   │   ├── partners/
│   │   ├── operation-fields/
│   │   ├── programs/
│   │   │   ├── api.ts                    # TanStack Query hooks: usePrograms, useProgram,
│   │   │   │                             # useCreateProgram, useUpdateProgram, usePublishProgram...
│   │   │   ├── schema.ts                 # Zod schema + inferred type
│   │   │   ├── components/
│   │   │   │   ├── ProgramTable.tsx
│   │   │   │   ├── ProgramForm.tsx
│   │   │   │   └── ProgramFilters.tsx
│   │   │   └── constants.ts
│   │   ├── solutions/                    # same structure as programs (2 nearly twin modules per DB)
│   │   ├── projects/                     # + components/ProjectGallery.tsx
│   │   ├── articles/
│   │   ├── jobs/
│   │   ├── leads/
│   │   └── contacts/
│   ├── lib/
│   │   ├── api-client.ts                 # fetch wrapper: base URL, credentials, error mapping
│   │   ├── query-client.ts               # QueryClient config (staleTime, retry...)
│   │   ├── permissions.ts                # RBAC matrix — see section 5
│   │   └── utils.ts
│   ├── stores/                           # Zustand stores (ui-store, sidebar-store...)
│   ├── hooks/                            # shared hooks not belonging to any feature
│   ├── types/                            # types matching DB schema: Program, Solution, Project,
│   │                                       # Article, Job, Lead, Contact, Partner, Province,
│   │                                       # OperationField, Organization, AdminUser, Slide, PageBanner
│   └── middleware.ts                     # auth guard + refresh token
├── .env.example
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

**Rule:** Program/Solution/Project/Article/Job are 5 nearly twin modules in terms of CRUD pattern (per `DB_SCHEMA.md` + `API_DESCRIPTION.md`). When building 1 module, the remaining modules copy the pattern — DO NOT invent a new structure for each module.

---

## 3. Data flow

- Pages in `app/(dashboard)/**/page.tsx` are **Client Components** (`"use client"`), calling hooks from `features/<module>/api.ts`.
- `features/<module>/api.ts` uses TanStack Query, calling through `lib/api-client.ts` → NestJS.
- **NEVER** call `fetch` directly in components. All API calls go through `api-client.ts` + the corresponding TanStack Query hook.
- Mutations (create/update/delete/publish) → `useMutation` + `queryClient.invalidateQueries` with standardized query keys (see naming convention in section 6).
- Optimistic updates: only applied for quick toggles (publish, is_active) — not applied for complex forms.

---

## 4. Auth flow (HttpOnly cookie + BFF)

**Rationale:** access/refresh tokens never touch `localStorage`/client-side JS → reduces XSS token theft risk.

```
[Browser] --login form--> [Next.js Route Handler /api/auth/login]
                                   |
                                   v
                         [POST NestJS /auth/login]
                                   |
                    accessToken + refreshToken returned
                                   |
                                   v
        Route Handler sets 2 HttpOnly, Secure, SameSite=Lax cookies:
        - vdcd_at (accessToken, maxAge short per JWT exp)
        - vdcd_rt (refreshToken, maxAge longer)
```

- **Middleware (`src/middleware.ts`):** runs on every route `(dashboard)/**`. Reads cookie `vdcd_at`:
  - Missing / expired → redirect to `/login`.
  - Present → decode JWT (no signature verification at edge, only read `role`/`exp`) to apply route-level RBAC (section 5). Real verification is still done by NestJS on each API call.
- **API calls from Client Components:** do not call NestJS directly. Call through Route Handler proxy `app/api/**` (or `api-client.ts` automatically attaches cookies if FE/BE share the same domain via rewrite) — **the specific domain/proxy decision will be finalized in Phase 0 when the real BE domain is known** (see PLAN.md, "Must confirm" section).
- **Refresh:** when API returns 401, `api-client.ts` calls `POST /api/auth/refresh` (Route Handler) → route handler uses `vdcd_rt` to call NestJS `/auth/refresh` → sets new `vdcd_at` → retries the original request once. If still 401 → logout, redirect to `/login`.
- **Logout:** Route Handler `/api/auth/logout` calls NestJS `/auth/logout` then clears both cookies.

---

## 5. RBAC (Role-Based Access Control)

Follows the "Use Case Summary by Actor" table in `USE_CASE.md`. Defined in `src/lib/permissions.ts` as:

```ts
export const PERMISSIONS = {
  superadmin: ["*"], // full access
  editor: [
    "organization:update",
    "slides:*", "page-banners:*", "partners:*", "operation-fields:create", "operation-fields:update",
    "programs:*:except-delete", "solutions:*:except-delete", "projects:*:except-delete",
    "articles:*:except-delete", "jobs:*:except-delete",
    "leads:read", "leads:update-status",
    "contacts:read", "contacts:update-status",
  ],
  // viewer role is NOT allowed to login to admin panel — excluded from RBAC
} as const;
```

- Route-level: Middleware blocks page access (e.g., non-superadmin visiting `/admin-users` → redirect 403).
- `viewer` role exists in DB but is rejected at login — only `superadmin` and `editor` can access the admin panel.
- Action-level: Components use hook `usePermission("programs:delete")` to hide/disable buttons — **do not invent new permissions**, every permission must be traceable to the actor table in `USE_CASE.md`. If a permission is missing for a specific action → ask, don't guess.

---

## 6. Naming convention

- Components: `PascalCase.tsx`, 1 main component per file, named export.
- Hooks: `useXxx.ts`.
- TanStack Query keys: structured arrays `[module, "list", filters]` / `[module, "detail", id]`, centrally defined in `features/<module>/api.ts` via `programKeys.list(filters)` — avoid scattered string keys.
- Zod schema: `xxxSchema`, inferred type: `type Xxx = z.infer<typeof xxxSchema>`.
- Routes matched 1:1 with API paths (e.g., feature `programs` ↔ endpoint `/programs`).

---

## 7. Environment variables (`.env.example`)

```
NEXT_PUBLIC_APP_NAME=VDCD Admin
API_BASE_URL=https://api.vdcd.vn/api/v1        # used server-side (Route Handler)
COOKIE_DOMAIN=                                  # leave empty if same domain
NODE_ENV=development
```

> Actual value of `API_BASE_URL` (staging/production) — **must confirm** before setting up Vercel env (see PLAN.md).

---

## 8. Decision log

| Date | Decision | Rationale |
|---|---|---|
| Init | Single repo Next.js, no monorepo | BE already has a separate repo, admin panel doesn't need additional apps in the short term |
| Init | HeroUI instead of shadcn/Ant Design | Per requester's choice |
| Init | TanStack Query + Zustand, separate server state / UI state | Avoid anti-pattern of stuffing API data into Zustand |
| Init | Auth via HttpOnly cookie + BFF instead of localStorage | Prioritize security over setup speed |
| Init | No automated tests yet, only lint + type-check in CI | Prioritize speed in early phase — **will be reviewed in Phase 5**, not a permanent decision |
| 2026-07-28 | Axios instead of raw `fetch` in `api-client.ts` | Better error handling (auto-throw on non-2xx), auto JSON parse, interceptor support, cleaner code — confirmed by user |
| 2026-07-29 | Remove `viewer` role from admin panel | Viewer will not be allowed to login to this admin panel. Role still exists in DB but is excluded from FE type/RBAC — confirmed by user |
| 2026-07-29 | Add `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | Drag-and-drop reorder for Partner/Slide ordering. Lightweight, accessible, React-first — approved by user |
| 2026-07-29 | Generic catch-all BFF proxy `[...path]/route.ts` | One route file for all non-auth API proxy instead of dozens of per-endpoint files. Auth routes remain separate — approved by user |

> Any future architecture changes must add a row to this table with rationale.