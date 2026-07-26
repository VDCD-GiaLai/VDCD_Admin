# AGENT.md — Rules for AI Agents (Claude Code / Gemini CLI)

> This file applies to ALL AI agents working in this repo (Claude Code reads `AGENT.md` directly;
> Gemini CLI reads via `GEMINI.md` — that file is just a single line pointing to this file, see bottom of page).

## Mandatory reading order before coding

1. `ARCHITECT.md` — architecture, stack, conventions. These are hard constraints.
2. `PLAN.md` — which Phase we're in, which tasks are allowed now.
3. `DESIGN.md` — must read if the task involves UI/new components.
4. Similar files already in `src/features/` — copy the pattern, don't invent a new approach.

## Rule #1: DO NOT MAKE DECISIONS WITHOUT CONTEXT

This is the highest-priority rule, overriding everything else including speed:

- If a field in the requirements doesn't match `docs/DB_SCHEMA.md` / `docs/API_DESCRIPTION.md` → **stop, ask the user**, don't invent fields/endpoints.
- If you need a library NOT listed in `ARCHITECT.md` section 1 → **stop, ask**, don't `pnpm add` first and report later.
- If a business rule (e.g., who can delete what) is not found in the RBAC table in `ARCHITECT.md` section 5 → **stop, ask**, don't assume based on "usually".
- If a previous decision in `ARCHITECT.md` (Decision log) seems suboptimal → you may propose a change, but must ask first and log the reason in the Decision log AFTER confirmation, don't change it silently.
- When in doubt, asking one short question is better than writing wrong code that requires fixing across many modules that already copied the pattern.

## Mandatory code conventions

- TypeScript strict, no `any`, no `@ts-ignore` without a comment explaining the reason.
- Components: functional, named export, 1 main component per file.
- Never fetch API directly in components — always go through hooks in `features/<module>/api.ts` (see ARCHITECT.md section 3).
- Styling: only use Tailwind + HeroUI with tokens defined in `DESIGN.md`. No standalone CSS modules unless truly necessary.
- Forms: React Hook Form + Zod, schema defined once in `features/<module>/schema.ts`, reused for both create/update.
- All user-facing text: Vietnamese, following the writing tone in `DESIGN.md` (proactive, specific, no apologies in error messages).

## Process for adding a new module (e.g., adding "Program")

1. Read the corresponding endpoints in `docs/API_DESCRIPTION.md`.
2. Read the corresponding entity in `docs/DB_SCHEMA.md`.
3. Create `src/types/program.ts` matching DB fields.
4. Create `src/features/programs/schema.ts` (Zod).
5. Create `src/features/programs/api.ts` (query key + TanStack Query hooks).
6. Create `src/features/programs/components/{Table,Form,Filters}.tsx`.
7. Create route `src/app/(dashboard)/programs/{page,new/page,[id]/page}.tsx`.
8. Apply RBAC via `usePermission()` for Create/Edit/Delete/Publish buttons.
9. Self-check: `pnpm lint && pnpm type-check` must pass before reporting completion.
10. Compare with the closest twin module (Solution if just built Program) — if a pattern mismatch is found, report to the user instead of fixing both sides yourself.

## Commit convention

Conventional Commits: `feat(programs): add create form`, `fix(auth): refresh token race condition`, `chore:`, `refactor:`, `docs:`.

## Checklist before considering a task "done"

- [ ] `pnpm lint` pass
- [ ] `pnpm type-check` pass
- [ ] `pnpm build` pass (if routing/config changed)
- [ ] Fields/endpoints verified against `docs/API_DESCRIPTION.md` and `docs/DB_SCHEMA.md`
- [ ] RBAC applied correctly per `ARCHITECT.md` section 5 (if the task involves write operations)
- [ ] UI follows `DESIGN.md` (no custom colors/spacing outside of tokens)
- [ ] No new dependencies added outside the approved list

---

### GEMINI.md (create as a separate file, single content line)

```
See AGENT.md at the repo root — all agent rules for both Claude and Gemini are there.
```