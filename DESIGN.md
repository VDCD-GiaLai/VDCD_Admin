# DESIGN.md — VDCD Admin Panel Design System

> Unlike the public site (marketing, needs "wow moments"), the admin panel is an **internal work tool**.
> The winning criteria here are: **consistency, reasonable information density, fast operations, no eye strain during all-day use**.
> Do not apply the "signature element for impression" mindset from marketing pages here — the difference in an admin panel lies in *every screen behaving the same way*, not each page having its own unique highlight.

## Principles

1. **One pattern, reused everywhere.** The DataTable for Program must have the exact same structure as the DataTable for Job. Users learn once, use across all modules.
2. **Information density > decorative whitespace.** This is a data table, not a landing page — prioritize displaying all necessary columns, use whitespace intentionally rather than filling space to look "nice".
3. **Each screen has one clear primary action** (Create/Save button is most prominent), secondary actions (Delete, Export) are smaller/neutral-colored to prevent accidental clicks.
4. **Status is always clearly visible:** published/draft, active/inactive, read/unread — use `StatusBadge` with consistent colors (see tokens).
5. Respect the tokens below — **do not choose colors/fonts outside this list**. If a screen needs a new color not in the tokens → ask before adding.

## System tokens (based on Vyzor admin template)

Color palette sourced from the [Vyzor Bootstrap 5 Admin Template](https://preview.sprukomarket.com/html/bootstrap/vyzor/). Declared via CSS variables so they can be changed in one place:

```css
:root {
  /* ── Core ── */
  --color-primary: #ca2a30;      /* red — primary action color, sidebar active */
  --color-primary-fg: #FFFFFF;
  --color-secondary: #FF49CD;    /* pink — secondary actions, accents */
  --color-secondary-fg: #FFFFFF;

  /* ── Surfaces ── */
  --color-surface: #FFFFFF;
  --color-surface-muted: #F9F7FC; /* light purple-gray — page background, table stripe */
  --color-body-bg: #F8F9FD;      /* default body background */
  --color-border: #E2E8EE;
  --color-menu-bg: #FFFFFF;
  --color-menu-border: #E2E8EE;

  /* ── Text ── */
  --color-text: #011A42;          /* dark navy — primary text */
  --color-text-muted: #6C7E96;   /* muted — secondary text, icons */
  --color-menu-text: #302D36;    /* sidebar menu text */

  /* ── Status ── */
  --color-success: #32D484;       /* published, active */
  --color-warning: #FDAF22;       /* draft, unprocessed */
  --color-danger: #FF6757;        /* delete, error */
  --color-info: #00C9FF;          /* links, supplementary info */

  /* ── Extended palette ── */
  --color-orange: #FA8128;        /* badges, highlights */
  --color-pink: #FF69B4;          /* tags, labels */
  --color-teal: #35B5AA;          /* alternative success, charts */
  --color-purple: #BE2BEB;        /* alternative accent, charts */
  --color-green: #00C9A7;         /* alternative status, charts */
  --color-dark: #0A0A0A;          /* dark mode elements */
}
```

- **Typography:** Single font for the entire system — **Space Grotesk** (matching Vyzor) for Latin characters, **Be Vietnam Pro** fallback for Vietnamese diacritics support. Scale: `text-xs` (secondary labels) → `text-sm` (default body in tables/forms) → `text-base` (page headings) → `text-lg/xl` (section headings).
- **Spacing:** Use default Tailwind scale (4px base), do not define custom spacing.
- **Border radius:** Small, consistent (`rounded-md` HeroUI default) — avoid large rounded corners like marketing sites.
- **Actual configuration:** Declare these variables in `tailwind.config.ts` via HeroUI theme override, do not hardcode hex colors scattered across components.

## Mandatory shared component patterns (`src/components/shared/`)

| Component | Used for | Notes |
|---|---|---|
| `DataTable` | All list pages (Program, Solution, Project, Article, Job, Lead, Partner...) | Consistent sort, filter, pagination; column config passed via props, do not rewrite tables for each module |
| `FormLayout` + field wrapper | All create/edit forms | Wraps RHF + Zod + HeroUI input, consistent validation error display |
| `RichTextEditor` | content for Program/Solution/Project/Article | Tiptap wrapper, fixed toolbar |
| `ImageUpload` / `GalleryUpload` | Slide, Partner logo, Project gallery | Preview, progress, clearly displayed format/size limits |
| `PublishToggle` | Program/Solution/Project/Article | Switch + status label, confirmation when unpublishing if needed |
| `StatusBadge` | is_active, is_published, is_read, is_urgent | Colors follow status tokens above, do not invent new colors |
| `ConfirmDialog` | All Delete actions | Mandatory confirmation before permanent deletion (per use cases: many UCs explicitly require "Confirm" before delete) |
| `EmptyState` | Empty lists | Clear call-to-action message (e.g., "No projects yet — Create your first project"), not just "No data" |
| `Pagination` | All paginated lists per API (`page`, `limit`, `total`) | |

## Microcopy writing (Vietnamese)

Apply the principle of "proactive, specific" from standard design guidelines, adapted to Vietnamese for the admin panel:

- **Name buttons by the exact action, avoid generic terms:** "Lưu thay đổi" (Save changes) instead of "Xác nhận" (Confirm); "Xuất bản" (Publish) instead of "OK"; "Xoá vĩnh viễn" (Delete permanently) instead of "Xoá" (Delete) when the action is irreversible.
- **Success messages match the action name:** "Xuất bản" (Publish) button → toast "Đã xuất bản chương trình" (Program published) (not a generic "Thành công" / "Success").
- **Errors must be specific, no apologies:** "Email đã tồn tại trong hệ thống" (Email already exists in the system) instead of "Có lỗi xảy ra, vui lòng thử lại" (An error occurred, please try again). Only use generic messages + retry suggestion for actual system errors (500).
- **Empty states are invitations to act**, not negative notifications.
- All form field labels match exactly with field names in `docs/DB_SCHEMA.md` to avoid confusion during debugging (e.g., field `meta_description` → label "Mô tả SEO (≤ 160 ký tự)", with character counter).

## Accessibility (minimum, non-negotiable)

- Contrast meets WCAG AA for text/background per the tokens above (ratio verified when choosing `--color-primary` / `--color-text`).
- All inputs and buttons have clearly visible focus states (HeroUI supports this by default — do not override and lose focus ring).
- DataTable: keyboard navigable for row actions (Edit/Delete).
- Uploaded image previews have an editable `alt` text (matches accessibility requirements in original VDCD documentation).

## Self-review before merging new UI

Before considering a UI screen complete, ask yourself:

- [ ] Am I reusing the existing `DataTable`/`FormLayout`, or writing a custom table/form unnecessarily?
- [ ] Are the colors used within the tokens, or am I hardcoding new hex values?
- [ ] Does the responsive layout break on mobile? (admin still needs to be usable on tablet at minimum)
- [ ] Have I handled all 3 states — loading/error/empty — or only the happy path?
- [ ] If I remove one decorative detail, would the screen be clearer? (the "remove one accessory before leaving" principle)