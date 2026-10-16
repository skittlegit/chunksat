---
name: chunksat
description: Orbital imaging scheduler console — monochrome instrument panel, aircraft-cockpit clarity.
colors:
  # Canvas
  bg: "#0a0a0a"
  bg-soft: "#131313"
  bg-lift: "#1c1c1c"
  bg-sunk: "#050505"
  # Hairlines
  line: "#242424"
  line-bright: "#353535"
  line-loud: "#4a4a4a"
  # Type
  fg: "#ededed"
  fg-mute: "#9a9a9a"
  fg-faint: "#6a6a6a"
  fg-ghost: "#444444"
  # Accent — the only non-neutral signal
  phos: "#ffffff"
  phos-deep: "#d4d4d4"
  phos-soft: "rgba(255,255,255,0.10)"
  phos-line: "rgba(255,255,255,0.28)"
  # Status (brightness ramp, no hue)
  status-danger: "#ffffff"
  status-warn: "#c8c8c8"
  status-go: "#ededed"
  status-info: "#8a8a8a"
  # Tile semantic (brightness ramp)
  tile-imaged: "#ffffff"
  tile-skipped-sat: "#9a9a9a"
  tile-skipped-time: "#555555"
  tile-unreachable: "#ededed"
  tile-pending: "#353535"
  # One hardcoded non-gray: experimental badge only
  experimental-label: "#d04a4a"
typography:
  display:
    fontFamily: "Funnel Display, Familjen Grotesk, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.022em"
  display-tight:
    fontFamily: "Funnel Display, Familjen Grotesk, system-ui, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.035em"
  numeric:
    fontFamily: "Funnel Display, Familjen Grotesk, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.04em"
    fontFeature: '"tnum" 1, "ss01" 1'
  body:
    fontFamily: "Funnel Sans, Familjen Grotesk, -apple-system, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.22em"
    fontFeature: '"tnum" 1'
  mono:
    fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace"
    fontFeature: '"tnum" 1'
  eyebrow:
    fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.22em"
rounded:
  none: "0px"
  sm: "2px"
  md: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.phos}"
    textColor: "{colors.bg}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "40px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.phos-deep}"
    textColor: "{colors.bg}"
  button-primary-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.fg-faint}"
  button-sm:
    backgroundColor: "{colors.phos}"
    textColor: "{colors.bg}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "32px"
  module:
    backgroundColor: "{colors.bg-soft}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
  module-on:
    backgroundColor: "{colors.bg-soft}"
    textColor: "{colors.fg}"
  strategy-option-active:
    backgroundColor: "{colors.phos-soft}"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
  strategy-option-idle:
    backgroundColor: "{colors.bg-sunk}"
    textColor: "{colors.fg}"
    rounded: "{rounded.none}"
---

## Overview: The Instrument Panel

chunksat is a scheduling console: the interface exists entirely to make an orbital imaging scheduler legible and controllable. The aesthetic is the Instrument Panel — monochrome data readout, aircraft-cockpit clarity, every value placed with intent.

**Color strategy: Restrained.** The entire surface is a grayscale ramp. White (`#ffffff`) is the only accent; it means "live," "selected," or "action." Status is communicated through brightness, weight, and pattern — never hue. The one exception is a dimmed red reserved for experimental badges.

**Density without noise.** This is a tool for engineers running orbital optimization passes. Tight line heights, hairlines, and precise spacing serve the data. Generous padding is withheld; readability comes from type contrast and separation, not breathing room.

**Stillness.** Only two animations exist in the system: `pulse-phos` (the live status dot) and `scan-sweep` (a loading sweep). Everything else is static. All animation is gated on `prefers-reduced-motion`.

The design should never look like a space visualization (no starfields, gradients, orbit-line drama) and never look like a legacy ops dashboard (no cramped widget grids, inconsistent scales, Grafana-style chrome).

## Colors: The Phosphor Ramp

The palette is a single axis: darkness to pure white.

**Canvas layers** (page surfaces, darkest to lightest):
- `--bg` `#0a0a0a` — page background with a subtle 22px dot-grid overlay
- `--bg-sunk` `#050505` — recessed inputs, inset panels
- `--bg-soft` `#131313` — module/card surfaces
- `--bg-lift` `#1c1c1c` — hover states, elevated popovers

**Hairlines** (structure without weight):
- `--line` `#242424` — default 1px rule
- `--line-bright` `#353535` — hover / slider tracks
- `--line-loud` `#4a4a4a` — selected / corner marks

**Type scale** (brightness = hierarchy):
- `--fg` `#ededed` — primary text
- `--fg-mute` `#9a9a9a` — secondary labels, hints
- `--fg-faint` `#6a6a6a` — tertiary, coordinates
- `--fg-ghost` `#444444` — placeholder text

**Phosphor accent** (white = the only signal):
- `--phos` `#ffffff` — active states, the primary button fill, selected borders
- `--phos-deep` `#d4d4d4` — button hover
- `--phos-soft` `rgba(255,255,255,0.10)` — selected option background, focus rings
- `--phos-line` `rgba(255,255,255,0.28)` — the top-rule on live modules

**Status (brightness differentiation, no hue)**:
- Danger `#ffffff` — full white, reserved for errors
- Warn `#c8c8c8` — lighter gray
- Go `#ededed` — near-white, success
- Info `#8a8a8a` — mid gray

**Tile semantic (brightness ramp for map overlays)**:
Imaged → skipped-saturation → skipped-time → unreachable → pending maps to white → mid → dim → near-white (dashed) → very dim.

Do not introduce hue into status signaling. The one exception — `#d04a4a` dimmed red on the experimental badge — is hardcoded and not part of the status system.

## Typography: Three Families, Three Roles

**Three stacks, strict roles:**

| Stack | CSS var | Role |
|---|---|---|
| Funnel Display | `--font-display` | Display headings, numeric values, score readouts |
| Funnel Sans | `--font-sans` | Body copy, nav labels, descriptions |
| JetBrains Mono | `--font-mono` | Coordinates, identifiers, eyebrow caps, status labels |

**Type utilities** (defined as CSS classes):

- `.display` — Funnel Display, 700, `−0.022em` — section headings
- `.display-tight` — Funnel Display, 800, `−0.035em` — hero numbers, large labels
- `.numeric` — Funnel Display, 700, `−0.04em`, tabular-nums — score values, counts
- `.mono` — JetBrains Mono, `tnum` — coordinates, tags, any raw value
- `.eyebrow` — JetBrains Mono 10px, 500, `+0.22em`, uppercase — module labels
- `.kbd` — JetBrains Mono 10px, 500, `+0.14em`, uppercase — secondary caps labels

**Scale** (body 14px base):
- Module headers, body copy: 14px Funnel Sans
- Captions / hints: 12px Funnel Sans, italic for hints
- Eyebrow / kbd: 10px JetBrains Mono, uppercase
- Micro labels (attribution, version): 9–10px mono

No italics for data. Italics are reserved for the one hint-style sub-caption inside Module headers. No bold for Funnel Sans in running copy — weight contrast comes from switching to Funnel Display or mono.

## Elevation

**No shadows.** The system uses tonal layering exclusively. Depth is expressed as background color steps:

`bg-sunk` → `bg` → `bg-soft` → `bg-lift`

Each step is a roughly +8–10 luminance increment. The map canvas (`bg-sunk`) is the lowest surface; modals and popovers (`bg-lift`) are the highest.

**Structural signals** beyond background:
- **Border** `1px solid var(--line)` on all module surfaces; brightens to `line-bright` on hover, `line-loud` on active/selected.
- **Phosphor edge** — the Module component supports `variant="live"` (inset 12px hairline at the top using `phos-line`) and `variant="on"` (full-bleed phosphor `phos` top-rule + `line-bright` border). This is the only "glow" in the system — a 1px line, not a shadow or blur.
- **Dot-grid** — `body` carries a static `radial-gradient` dot overlay at 22px intervals. It is a single paint layer, not a repeating background image. Never use fixed-attached backgrounds.
- **Corner marks** — the `.coord` class places 8×8px bracket marks (top-left / bottom-right) in `line-loud` on module coordinate headers.

Glassmorphism (`backdrop-filter: blur`) is banned. No box shadows, not even `0 1px 2px`.

## Components

### Module (Panel)

The primary layout unit. A `section` with class `.module`: `bg-soft` fill, 1px `line` border, 6px radius.

- **Header**: flex row — `.eyebrow` label, `.kbd` tag (tabular-nums), italic hint, right-aligned actions. `border-b` hairline separates header from content. Internal padding: `px-4 py-3` (sm: `px-5`).
- **Content**: `p-4` (sm: `p-5`).
- **variant="live"**: inset phosphor hairline at top (`phos-line`).
- **variant="on"**: full-bleed phosphor top-rule + `line-bright` border.
- Nested modules are prohibited. A Module's content area may contain data components, but not another Module.

### Run Button

Primary action. Sharp corners (`border-radius: 2px`). Two states:

- **Idle**: `phos` fill, `bg` text, Play icon (11px filled). Hover: `phos-deep` fill.
- **Disabled / loading**: transparent, `line` border, `fg-faint` text, spinning loader icon. `cursor-not-allowed`.

Typography: `.mono` 10px uppercase `+0.22em` tracking. Height: 40px (md), 32px (sm).

No rounded corners on this component. Ever.

### Strategy Picker (Radio Group)

Full-width button list. Each option: `border-radius: 2px`, flex row with a square radio indicator + label + ordinal.

- **Active**: `phos-soft` background, `phos` border, filled radio (`phos` fill with `bg` center dot).
- **Idle**: `bg-sunk` background, `line` border, empty radio. Hover: `line-bright` border, `bg-lift` background.
- Ordinal tag (`.kbd`, `fg-faint` → `phos` when active).
- Experimental badge: 8px mono uppercase `+0.18em`, `#d04a4a`. This is the only use of this color.

### Status Dot

8×8px filled circle, `border-radius: 9999px`. Color from status map (phos / go / warn / danger / info / idle). Supports `pulse-phos` animation for `warn` / in-progress states. Always decorative (`aria-hidden`).

### Status Bar (Footer)

`h-9`, `border-t line`, `bg`. Horizontally scrollable cells, each separated by `border-r line`. Cell content: `.kbd` key, `.kbd` value pair in `fg-mute`. API status cell includes a StatusDot.

### Slider (`input[type="range"]`)

Custom track: 2px `line-bright`. Custom thumb: 14×14px square (no radius), `phos` fill, `bg` inset ring. Focus ring: `phos-soft` outer ring.

### Map (Leaflet)

Tiles: `grayscale(1) contrast(1.05) brightness(0.92)` filter — forces every tile provider to monochrome. Canvas background: `bg-sunk`. All Leaflet chrome (zoom controls, attribution, tooltips, popups) uses system tokens. Zero border radius on popups and tooltips.

## Do's and Don'ts

**Do:**
- Use `.eyebrow` (mono caps) for all module labels.
- Use `.numeric` or `.mono` for every score value, coordinate, count, or timestamp shown in data panels.
- Use `variant="live"` on a Module when it is receiving real-time data; `variant="on"` when the user has it actively selected.
- Communicate status through brightness steps alone — no hue, no icons unless they add genuine information.
- Apply `border-radius: 2px` (not 0, not md) to interactive controls (buttons, pickers).
- Apply 6px radius (`rounded.md`) to module containers only.
- Gate all animations on `prefers-reduced-motion`.

**Don't:**
- Add hue to the status system. Danger is `#ffffff` (full white), not red.
- Use `box-shadow` or `backdrop-filter: blur` anywhere.
- Round button corners beyond 2px.
- Nest Module inside Module.
- Use italic Funnel Sans for anything other than hint sub-captions in Module headers.
- Add starfields, orbit-line glow effects, or gradient backgrounds. This is a tool, not a space visualization.
- Use the `#d04a4a` red for anything other than the experimental strategy badge.
- Introduce new animation sequences. Extend `pulse-phos` or `scan-sweep` only.
