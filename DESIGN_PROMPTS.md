# S1mpleCRM — Stitch design prompts (5 variations)

Use these at [stitch.withgoogle.com](https://stitch.withgoogle.com). Generate each variation as a **separate project/chat**. Export screens you like; reply with which variation (A–E) to implement.

## How to run in Stitch

1. Open Stitch → new project named `S1mpleCRM — Variation X`.
2. Paste the **System constraints** block once, then the variation prompt.
3. Ask for these screens in order: **Sign in**, **Dashboard home**, **Contacts list**, **Deal pipeline (kanban)**, **Contact detail**.
4. After each screen: “Tighten spacing; remove decorative cards that aren’t interactive; keep brand name dominant on auth.”
5. Export PNGs or Figma; pick one variation to approve.

## System constraints (paste before every variation)

```
Product: S1mpleCRM — multi-tenant B2B CRM for small sales teams.
Platform: Web app, desktop-first (1440px) + mobile (390px) for auth and lists.
Brand: Wordmark "S1mpleCRM" must be the strongest text on auth screens. No generic Inter/Roboto/Arial. No purple gradients, no cream+terracotta, no dark-mode-by-default, no glow, no emoji, no floating badges on heroes.
Layout: One job per section. Cards only for interactive containers. Empty states required for lists. Sidebar navigation for app shell.
Screens needed: Sign in (Google + email), empty dashboard, contacts table, pipeline kanban, contact detail with activity timeline.
Output: High-fidelity UI mockups, light theme, production-ready spacing, real-looking sample data (names, deal values, stages).
```

---

## Variation A — “Ledger Light”

**Feel:** Quiet editorial CRM. Paper-adjacent surfaces, strong typography hierarchy, almost no chrome.

```
Design S1mpleCRM Variation A "Ledger Light".
Visual direction: warm off-white canvas (#F7F5F1), ink black text, single accent in deep forest green (#1F4D3A) for primary actions only. Display font: sharp modern serif for brand + page titles; body in a humanist sans (not Inter). Hairline borders, 0–4px radius, no shadows except a 1px separator language.
Auth: full-bleed soft paper texture background (subtle fiber, not photo). Brand wordmark large top-left of the form column. Google button first, then email. No marketing copy wall.
App shell: left rail 220px, wordmark top, nav as plain text links with a 2px green left bar for active. Main canvas open, generous whitespace.
Contacts: dense but readable table, tag chips as underlined text not pills. Pipeline: columns as ruled lanes, deal tiles are flat bordered blocks (interactive), drag affordance subtle.
Avoid: cards stacked in hero, purple, neon, glassmorphism, rounded-full pills.
```

---

## Variation B — “Signal Desk”

**Feel:** Operator console for sales — crisp, high-contrast, instrumental.

```
Design S1mpleCRM Variation B "Signal Desk".
Visual direction: cool gray canvas (#EEF1F4), near-black UI, accent electric teal (#0B8F8C) used sparingly for focus rings and primary CTA. Typography: condensed grotesque for brand ("S1mpleCRM"), clean neo-grotesk for UI. 6px radius max. Thin structural grid.
Auth: split layout — left 40% solid charcoal panel with only the brand wordmark and one short line "Pipeline without the noise." Right side form on light gray. Google button outlined on light.
Dashboard: no KPI card grid. One primary empty state: "Create your first pipeline" with a single CTA. Secondary muted list of recent activity (empty).
Kanban: stage headers as monospace labels with count. Deal tiles show title, value, owner avatar initial — no stickers.
Avoid: dashboard widget soup, gradients, soft pastel blobs, illustration mascots.
```

---

## Variation C — "Atelier CRM"

**Feel:** Boutique studio tool — tactile, crafted, slightly unexpected color.

```
Design S1mpleCRM Variation C "Atelier CRM".
Visual direction: chalk white background with a muted clay accent (#C45C26) and slate ink (#2A2E35). Secondary surface: pale blue-gray (#E8EEF2). Typography: distinctive geometric sans for brand (think Futura-adjacent, not Inter); readable text sans for body. Soft 8px radius on interactive controls only.
Auth: centered narrow column, brand oversized above. Background is a large abstract architectural photo of a quiet office window (desaturated), full-bleed, with a translucent light panel for the form (not a heavy card shadow).
App: sidebar with clay active state. Contacts use a split view — list left, detail right on desktop.
Pipeline: stages as soft tinted columns (very light clay / slate / blue-gray), deals as bordered interactive surfaces.
Avoid: stock "AI SaaS" purple, floating badges, 3D icons, dark mode.
```

---

## Variation D — "Northline"

**Feel:** Scandinavian productivity — airy, precise, calm confidence.

```
Design S1mpleCRM Variation D "Northline".
Visual direction: pure white + soft stone (#F3F1EC), accent cobalt (#2557D6) for links/buttons only. Typography: elegant contemporary sans with slightly wide tracking on the brand; never use Inter/Roboto. Large margins, 12-column mental grid, 4px baseline rhythm.
Auth: brand centered large; form below with Google primary outline, email secondary. Background: subtle horizontal linen lines (very faint), not a photo.
Shell: top bar instead of left sidebar (exception for this variation) — brand left, nav center, user right. Content full width with max 1200px.
Contacts: spreadsheet-like clarity, zebra optional but light. Kanban: white columns separated by stone gutters; deal rows feel like tickets with left cobalt tick when selected.
Avoid: heavy sidebars, neon, glass, rounded-full status pills (use small square status marks).
```

---

## Variation E — "Forge Ops"

**Feel:** Industrial modern — durable, bold type, restrained metal palette.

```
Design S1mpleCRM Variation E "Forge Ops".
Visual direction: light graphite canvas (#E6E7EA), charcoal text, accent burnt amber (#D97706) for primary actions. Typography: sturdy slab or industrial sans for brand; neutral sans for UI. 2px borders, 0 radius on tables, 4px on buttons.
Auth: brand as stamped wordmark top. Form in a bordered panel (no drop shadow). Google button solid charcoal with white text; email fields with thick bottom borders only (underline inputs).
App shell: compact left icon+label nav. Dashboard empty state uses a single large amber CTA "Add contact".
Pipeline: stage columns with amber count badges as small squares (not pills). Deal tiles show value prominently in tabular figures.
Avoid: playful illustration, gradients, purple, soft UI fluff, emoji.
```

---

## After you generate

Reply with:
1. Preferred variation letter (A–E)
2. Any screen you want changed
3. Optional: export links / screenshots

I will then lock tokens into the codebase (CSS variables + shell) before Phase 1 UI work.
