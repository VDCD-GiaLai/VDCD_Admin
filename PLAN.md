# PLAN.md — VDCD Admin Panel Roadmap

> Agents may only work on tasks belonging to the current Phase. If the user requests jumping to a task in a later Phase — remind them of the order in this file before proceeding, to avoid breaking dependencies (e.g., building Program before OperationField exists means no data to select the field).

Phase status: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0 — Bootstrap (infrastructure, no business logic)

- [ ] Scaffold Next.js + TypeScript + Tailwind (see specific commands at end of file)
- [ ] Install & configure HeroUI
- [ ] Install TanStack Query, Zustand, RHF + Zod, Tiptap
- [ ] Setup ESLint + Prettier per `ARCHITECT.md`
- [ ] Setup `.env.example`, `lib/api-client.ts` (no real auth yet, mock base URL)
- [ ] Setup GitHub Actions CI (`.github/workflows/ci.yml`)
- [ ] Connect Vercel (import repo, set env `API_BASE_URL`)
- [ ] Copy 3 source documents into `docs/` (`API_DESCRIPTION.md`, `USE_CASE.md`, `DB_SCHEMA.md`)

**Must confirm before closing Phase 0:**
- Actual NestJS API URL (dev/staging/production) for setting `API_BASE_URL`.
- Do FE and BE share the same root domain? (affects how cookies `SameSite`/`Secure` are set and whether proxy/rewrite is needed).

**Definition of Done:** `pnpm dev` runs with an empty layout page, CI passes on the first PR, Vercel preview deploy succeeds.

---

## Phase 1 — Auth & skeleton (foundation for all subsequent modules)

Related: UC-AUTH-01→04.

- [ ] Route Handlers `app/api/auth/{login,refresh,logout}/route.ts`
- [ ] `middleware.ts`: guard route `(dashboard)/**`, redirect to `/login` if not authenticated
- [ ] `/login` page (form + HeroUI + RHF/Zod)
- [ ] Layout `(dashboard)`: Sidebar (menu by role), Header (avatar, logout button), Breadcrumb
- [ ] `lib/permissions.ts` + hook `usePermission()`
- [ ] Profile page (`UC-AUTH-04`)

**Definition of Done:** Login/logout works end-to-end with real BE, sidebar shows/hides menu items correctly per test role (superadmin/editor/viewer).

---

## Phase 2 — Master data (foundational data for content modules)

Related: Module 3 (Organization), Module 5 (Slide), Module 6 (Partner), Module 7 (Operation Field), Module 5 map use case (Province).

- [ ] Organization (UC-ORG-01, 02) — single-record form
- [ ] Operation Field (UC-FLD-01→04) — simple CRUD, needed first since Program/Solution/Project depend on this
- [ ] Province (UC-MAP-01, 02) — only needs a table to update `has_project`/`center_count`, **no need to build interactive SVG map at this phase** (interactive map belongs to the public site, not admin — confirm scope if admin also needs map preview)
- [ ] Partner (UC-PTN-01→07) — CRUD + drag-and-drop reorder
- [ ] Slide (UC-SLD-01→07) — CRUD + reorder + image upload

**Must confirm:** Image upload storage provider (`/upload/image`) — S3, Cloudinary, or BE's own VPS storage? Doesn't significantly affect FE (just one upload endpoint) but need to know size/format limits to display correct error messages.

**Definition of Done:** Admin can manage all master data, drag-and-drop reordering works, image uploads succeed.

---

## Phase 3 — Main content (largest modules, shared pattern)

Related: Module 8 (Program), Module 9 (Solution), Module 10 (Project + gallery), Module 11 (Article).

- [x] Program: list (filter by field/status) + form (Tiptap) + publish toggle (UC-PRG-01→07)
- [x] Solution: **copy the exact same pattern as Program**, swap entity (UC-SLT-01→07)
- [x] Project: similar pattern + `ProjectGallery` component (multi-image upload, captions, drag-and-drop reorder) (UC-PRJ-01→08)
- [x] Article: similar pattern + link to Project/Program/Solution selector (dropdown) (UC-ART-01→08)

**Definition of Done:** All 4 modules have full CRUD, publish/unpublish works, forms share the `RichTextEditor` component, filtering by operation field works correctly.

---

## Phase 4 — Job & Lead

Related: Module 12 (Job), Module 13 (Lead).

- [ ] Job: CRUD + "Urgent" badge + toggle active (UC-JOB-04→08)
- [ ] Lead: list + mark read/unread + export CSV (UC-LED-02→06)

**Must confirm:** Is real-time notification needed (unread lead count badge updates live) or is refetch on page visit sufficient for the initial version? (determines whether polling/websocket is needed).

**Definition of Done:** Viewer can see leads but cannot delete (correct RBAC); CSV export downloads file with the correct selected time range.

---

## Phase 5 — System administration & refinement

Related: Module 2 (Admin User, superadmin only).

- [ ] Admin User CRUD (UC-ADM-01→05)
- [ ] Dashboard overview (quick stats: unread leads, published projects, active jobs...)
- [ ] Review RBAC across the entire application per "Use Case Summary by Actor" table
- [ ] Revisit the "no tests yet" decision in `ARCHITECT.md` — decide whether to add Vitest for critical logic functions (permissions, api-client) or not
- [ ] Review basic accessibility (contrast, focus visible) per `DESIGN.md`

**Definition of Done:** Superadmin can manage all accounts; no action is visible to roles without sufficient permissions; all modules have gone through at least one round of self-review per `DESIGN.md`.

---

## Phase 6 — Production hardening & handoff

- [ ] CI adds real production build step with production env
- [ ] Vercel: configure real domain, verify cookies work correctly cross-domain (if FE/BE are on different domains)
- [ ] Write `README.md` with local setup instructions + required environment variables
- [ ] Re-check all outstanding "Must confirm" items from previous Phases

---

## Specific scaffold commands for Phase 0

```bash
# 1. Create project
pnpm create next-app@latest vdcd-admin --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd vdcd-admin

# 2. Install UI kit
pnpm add @heroui/react framer-motion

# 3. Data & state
pnpm add @tanstack/react-query @tanstack/react-query-devtools zustand

# 4. Form & validation
pnpm add react-hook-form zod @hookform/resolvers

# 5. Rich text
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link

# 6. Utility
pnpm add clsx date-fns

# 7. Formatting
pnpm add -D prettier eslint-config-prettier prettier-plugin-tailwindcss

# 8. Create directory structure per ARCHITECT.md section 2
mkdir -p src/{components/{ui,layout,shared},features,lib,stores,hooks,types}
```

> After this step, agent creates `tailwind.config.ts` using tokens from `DESIGN.md`, NOT using the `create-next-app` default theme.