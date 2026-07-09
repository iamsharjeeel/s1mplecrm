# S1mpleCRM Design Spec

**Status:** Locked 2026-07-09  
**Source:** Stitch export (Northline shell + Ledger Light accent)  
**Canonical accent:** deep forest green `#1F4D3A` (`primary-container`)

Agents and humans must follow this file. Do not invent a new palette, switch to dark mode, or replace fonts without an explicit user request.

## Metaphor

Quiet Scandinavian productivity desk with a linen canvas and forest-green ink for actions. Editorial serif for titles; Inter for UI. Top navigation, not a left sidebar.

## Do / Don't

| Do | Don't |
|---|---|
| Use tokens from `app/globals.css` (`--crm-*` / theme colors below) | Hardcode random hex outside this spec |
| Libre Caslon Text for headlines + brand wordmark | Inter/Roboto/Arial/Geist for brand or page titles |
| Inter for body, labels, tables | Purple gradients, glow, glassmorphism |
| Light theme only (`#fcf9f8` linen canvas) | Dark mode by default |
| Cards only for interactive containers (auth form, table, deal ticket) | Decorative card grids in empty states |
| Square stage markers (`w-2.5 h-2.5 rounded-none`) | Rounded-full status pills |
| Top nav, max width 1200px, gutter 24px | Left sidebar shell |
| Primary CTA = `primary-container` `#1F4D3A` | Cobalt / terracotta / purple accents |

## Color tokens

| Token | Hex | Use |
|---|---|---|
| `background` / `surface` | `#fcf9f8` | App canvas |
| `surface-container-lowest` | `#ffffff` | Cards, inputs, tickets |
| `surface-container-low` | `#f6f3f2` | Hover rows, soft fills |
| `surface-container` | `#f0eded` | Icon wells, table header |
| `surface-variant` | `#e5e2e1` | Dividers soft |
| `secondary-container` | `#dee0df` | Borders on cards/inputs |
| `outline-variant` | `#c0c9c2` | Nav border, subtle lines |
| `outline` | `#717973` | Muted chrome |
| `on-surface` | `#1c1b1b` | Body text |
| `on-surface-variant` | `#414944` | Secondary body |
| `secondary` | `#5c5f5e` | Nav inactive, captions |
| `primary` | `#023625` | Brand wordmark, active nav underline |
| `primary-container` | `#1F4D3A` | **Main accent / primary buttons** |
| `surface-tint` | `#3a6753` | Hover on primary buttons |
| `on-primary` | `#ffffff` | Text on primary buttons |
| `on-primary-container` | `#8dbda4` | Soft green on dark green |
| `primary-fixed` | `#bceed3` | Avatar fills |
| `error` | `#ba1a1a` | Destructive / lost |
| `error-container` | `#ffdad6` | Error soft bg |
| `tertiary` | `#273037` | Negotiation marker |
| `tertiary-container` | `#3d464d` | Attention marker |

## Typography

| Role | Family | Size / weight |
|---|---|---|
| Brand wordmark (auth) | Libre Caslon Text | 24px / 400, `tracking-widest` uppercase |
| Brand (nav) | Libre Caslon Text or Inter bold tracking | 18px / 700, letter-spacing ~0.1em |
| `headline-xl` | Libre Caslon Text | 48px / 400 |
| `headline-lg` | Libre Caslon Text | 32px / 400 |
| `headline-md` | Libre Caslon Text | 24px / 400 |
| `body-lg` | Inter | 18px / 400, lh 1.6 |
| `body-md` | Inter | 16px / 400, lh 1.5 |
| `label-md` | Inter | 14px / 600, tracking 0.05em |
| `label-sm` | Inter | 12px / 500 |

Load via `next/font/google`: `Libre_Caslon_Text`, `Inter`.

## Radius & elevation

- Default radius: `2px` (`0.125rem`)
- `lg`: `4px` — buttons, inputs
- `xl`: `8px` — auth card, table shell
- Shadow (confidence): `0px 4px 12px rgba(0,0,0,0.05)` on auth card / selected deal only
- No multi-layer glow shadows

## Spacing

- Unit: 8px
- Gutter: 24px
- Desktop margin: 64px
- Container max: 1200px
- Mobile margin: 20px

## Background texture

Linen on body (light theme):

```css
background-color: #fcf9f8;
background-image: repeating-linear-gradient(
  transparent,
  transparent 2px,
  rgba(0, 0, 0, 0.02) 2px,
  rgba(0, 0, 0, 0.02) 4px
);
```

Auth page may use a slightly stronger linen on white.

## Layout patterns

### Auth (sign-in / sign-up)

1. Centered column `max-w-md`
2. Brand wordmark above card (uppercase, tracking-widest, `primary`)
3. White card, border `secondary-container`, radius `lg`/`xl`, confidence shadow, padding ~48px
4. Title `Welcome back` / create account in Libre Caslon
5. Floating labels on email/password (focus label color `#1F4D3A`)
6. Primary button: `bg-primary-container` → hover `bg-primary`
7. Divider “Or”
8. Google outline button
9. Footer link under card

### App shell

- Sticky top nav height 64px, `bg-surface`, bottom border `outline-variant`
- Brand left; links center/left: Dashboard, Contacts, Pipeline, Activity
- Active link: `text-primary` + `border-b-2 border-primary`
- Trailing: notifications, settings, avatar
- Main: `max-w-[1200px] mx-auto px-6` (gutter)

### Empty dashboard

- Centered empty state, tonal circular icon well
- Headline + one supporting sentence
- Single CTA `Add your first lead` in `primary-container`

### Contacts table / Pipeline / Contact detail

Match Stitch HTML structure when those features ship (Phase 2+). Stage markers are **squares**, not pills. Selected deal: left border `primary-container` + confidence shadow.

## Icons

Material Symbols Outlined (or lucide equivalents matching the same metaphors). Weight ~300–400 for empty-state icons.

## Implementation map

| Spec | Code |
|---|---|
| Tokens | `app/globals.css` |
| Fonts | `app/layout.tsx` |
| Auth UI | `components/auth/*`, `app/(auth)/*` |
| Shell | `components/dashboard/top-nav.tsx`, `app/(dashboard)/*` |
| Agent rule | `.cursor/rules/design-system.mdc` |

## Open questions

None for v1 shell. Phase 2+ screens must reuse these tokens without introducing a second accent.
