---
name: vdcd-design-taste
description: Design taste and visual style guide for the VDCD Admin Panel, based on Vyzor Bootstrap 5 admin template. Triggers when building UI components, creating pages, choosing colors, styling elements, or making design decisions for this project.
---

# VDCD Admin Panel — Design Taste

## Visual Reference

This project's visual taste is based on the **Vyzor Bootstrap 5 Premium Admin Template** ([preview](https://preview.sprukomarket.com/html/bootstrap/vyzor/)).

## Color Palette

### Core Colors
| Name | Hex | RGB | Usage |
|---|---|---|---|
| **Primary** | `#985FFD` | 152, 95, 253 | Primary actions, sidebar active state, main CTA buttons |
| **Secondary** | `#FF49CD` | 255, 73, 205 | Secondary actions, accents, hover highlights |

### Status Colors
| Name | Hex | RGB | Usage |
|---|---|---|---|
| **Success** | `#32D484` | 50, 212, 132 | Published, active, completed states |
| **Warning** | `#FDAF22` | 253, 175, 34 | Draft, pending, unprocessed states |
| **Danger** | `#FF6757` | 255, 103, 87 | Delete actions, errors, destructive states |
| **Info** | `#00C9FF` | 0, 201, 255 | Links, supplementary info, notifications |

### Surface & Text Colors
| Name | Hex | Usage |
|---|---|---|
| **Body BG** | `#F8F9FD` | Main page background |
| **Surface** | `#FFFFFF` | Cards, modals, content areas |
| **Surface Muted** | `#F9F7FC` | Table stripes, subtle backgrounds |
| **Border** | `#E2E8EE` | Dividers, card borders, input borders |
| **Text** | `#011A42` | Primary text (dark navy) |
| **Text Muted** | `#6C7E96` | Secondary text, placeholders, icons |
| **Menu Text** | `#302D36` | Sidebar menu items |

### Extended Palette (for charts, tags, badges)
| Name | Hex | Usage |
|---|---|---|
| **Orange** | `#FA8128` | Badges, highlights |
| **Pink** | `#FF69B4` | Tags, labels |
| **Teal** | `#35B5AA` | Alternative success, charts |
| **Purple** | `#BE2BEB` | Alternative accent, charts |
| **Green** | `#00C9A7` | Alternative status, charts |
| **Dark** | `#0A0A0A` | Dark elements |

## Typography

- **Primary Font:** Space Grotesk (weights 300–700)
- **Fallback for Vietnamese:** Be Vietnam Pro
- **Font Import:** `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap');`

### Type Scale
| Token | Size | Usage |
|---|---|---|
| `text-xs` | 12px | Secondary labels, timestamps |
| `text-sm` | 14px | Default body in tables/forms |
| `text-base` | 16px | Page headings, primary content |
| `text-lg` | 18px | Section headings |
| `text-xl` | 20px | Major section headings |

## Visual Style Rules

1. **Soft & Vibrant** — Use the purple-pink gradient palette. Avoid muted/corporate grays for primary actions. Status colors should be vibrant but not harsh.

2. **Light Mode First** — Default body background is near-white (`#F8F9FD`), cards are white, with subtle purple-gray tint (`#F9F7FC`) for differentiation.

3. **Rounded but Not Bubbly** — Use `rounded-md` (6px) for inputs, cards, buttons. Use `rounded-lg` (8px) for larger containers. Avoid pill shapes except for badges/tags.

4. **Shadows are Subtle** — Prefer `shadow-sm` for cards. No heavy drop shadows. Use border + subtle shadow combo for elevation.

5. **Spacing is Consistent** — Follow Tailwind 4px base grid. Common spacings: `p-4` for cards, `gap-3` for form fields, `p-6` for page content areas.

6. **Buttons Follow a Hierarchy:**
   - Primary action: Solid purple (`#985FFD`) with white text
   - Secondary action: Outline or light purple background
   - Destructive: Solid red (`#FF6757`) or outline red
   - Neutral: Light gray background

7. **Data Tables:**
   - Header: Slightly darker background
   - Rows: Alternating white / `#F9F7FC`
   - Hover: Light purple tint
   - Actions column: Icon buttons, not text links

8. **Forms:**
   - Labels above inputs, `text-sm` weight medium
   - Input borders: `#E2E8EE`, focus ring: primary purple
   - Error states: Red border + red text below
   - Help text: `text-xs text-muted`

9. **Status Badges:**
   - Published/Active: Green background light + green text
   - Draft/Pending: Yellow/amber background light + dark text
   - Inactive/Disabled: Gray background + gray text
   - Urgent: Red background light + red text

10. **Sidebar:**
    - Background: White (`#FFFFFF`)
    - Active item: Purple background with white text
    - Hover: Light purple tint
    - Icons: Muted color (`#6C7E96`), active: white

## Anti-Patterns (DO NOT)

- ❌ Do not use raw Bootstrap colors — use the Vyzor palette above
- ❌ Do not use black (`#000`) for text — use `#011A42`
- ❌ Do not use pure gray backgrounds — use the purple-tinted grays
- ❌ Do not use large border-radius (pill) for regular buttons/cards
- ❌ Do not hardcode hex values in components — use CSS variables
- ❌ Do not add decorative gradients or glassmorphism — this is a work tool, not a landing page
- ❌ Do not use multiple fonts — only Space Grotesk + Be Vietnam Pro fallback
