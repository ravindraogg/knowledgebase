# Recalix — Design System

> **Design Philosophy:** Spatial UI meets Glassmorphism. Every surface has depth, every panel floats with intention. No flat utility screens — this is a product that feels like you're navigating a three-dimensional knowledge space.

> **Hard Rules:**
> - No emojis anywhere in the UI. Use Material UI icons exclusively.
> - No component without both light and dark theme support.
> - No ad-hoc colors, radii, shadows, or spacing — use tokens only.

---

## 1. Design Pillars

### Spatial UI
Spatial UI treats the interface as layered planes in Z-space. Elements exist at different elevations, cast real shadows, and respond to interaction by shifting their depth. This creates a sense of physical space — panels slide, cards lift, modals emerge from behind content.

**Principles:**
- Every element has an explicit **elevation level** (0–5)
- Higher elevation = stronger shadow + slight scale increase on hover
- Transitions between states use **easing curves** that mimic physical movement
- Layered panels create visual hierarchy without relying on font size alone
- Parallax-like depth cues on scroll (subtle, not distracting)

### Glassmorphism
Frosted glass surfaces with background blur, semi-transparent fills, and subtle luminous borders. Glass panels let the background context bleed through — the user always feels connected to the spatial environment behind the active surface.

**Principles:**
- Background blur (`backdrop-filter: blur`) on all elevated surfaces
- Semi-transparent backgrounds with noise texture overlay
- 1px luminous borders (white at low opacity in dark mode, dark at low opacity in light mode)
- Inner glow on active/focused states
- Never fully opaque panels except at elevation 0 (the base layer)

---

## 2. Component Library

**Material UI (MUI) v6** — primary component library.

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

MUI provides the component primitives (Button, TextField, Select, Dialog, etc.). All components are wrapped with Recalix's custom theme (see Section 6) to enforce spatial + glass aesthetics. Tailwind CSS handles layout utilities (flex, grid, spacing, responsive breakpoints) — it does **not** handle component styling.

**Icon System:** `@mui/icons-material` exclusively. No emoji, no custom SVG unless MUI lacks the glyph. Icon style: **Outlined** variant as default, **Filled** for active/selected states.

---

## 3. Color System

All colors are defined as CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark). No hardcoded hex values in components.

### 3.1 Core Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--color-bg-base` | `#F4F5F7` | `#0B0D11` | Page background (elevation 0) |
| `--color-bg-elevated` | `rgba(255, 255, 255, 0.72)` | `rgba(22, 27, 34, 0.72)` | Glass panels (elevation 1–3) |
| `--color-bg-surface` | `rgba(255, 255, 255, 0.55)` | `rgba(30, 37, 48, 0.55)` | Cards, popovers |
| `--color-bg-overlay` | `rgba(255, 255, 255, 0.40)` | `rgba(40, 48, 62, 0.40)` | Modals, drawers |
| `--color-bg-input` | `rgba(255, 255, 255, 0.60)` | `rgba(22, 27, 34, 0.60)` | Text fields, selects |
| `--color-bg-solid` | `#FFFFFF` | `#161B22` | Non-glass surfaces (tables, code blocks) |

### 3.2 Brand / Accent

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--color-primary` | `#4F46E5` | `#818CF8` | Primary buttons, active nav, links |
| `--color-primary-hover` | `#4338CA` | `#A5B4FC` | Hover state |
| `--color-primary-subtle` | `rgba(79, 70, 229, 0.10)` | `rgba(129, 140, 248, 0.12)` | Selected row, active tab bg |
| `--color-secondary` | `#0EA5E9` | `#38BDF8` | Secondary actions, info badges |
| `--color-accent` | `#8B5CF6` | `#A78BFA` | Graph nodes (highlight), special UI |

### 3.3 Semantic

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--color-success` | `#16A34A` | `#4ADE80` | Completed, healthy, connected |
| `--color-warning` | `#D97706` | `#FBBF24` | In progress, caution |
| `--color-error` | `#DC2626` | `#F87171` | Failed, error, disconnected |
| `--color-info` | `#2563EB` | `#60A5FA` | Informational badges |

### 3.4 Text

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--color-text-primary` | `#111827` | `#F1F5F9` | Headings, body text |
| `--color-text-secondary` | `#4B5563` | `#94A3B8` | Descriptions, labels |
| `--color-text-tertiary` | `#9CA3AF` | `#64748B` | Placeholders, timestamps |
| `--color-text-inverse` | `#FFFFFF` | `#0B0D11` | Text on primary buttons |
| `--color-text-link` | `var(--color-primary)` | `var(--color-primary)` | Clickable links |

### 3.5 Borders

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--color-border-default` | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.08)` | Standard dividers |
| `--color-border-glass` | `rgba(255, 255, 255, 0.30)` | `rgba(255, 255, 255, 0.10)` | Glass panel luminous edge |
| `--color-border-focus` | `var(--color-primary)` | `var(--color-primary)` | Input focus ring |
| `--color-border-subtle` | `rgba(0, 0, 0, 0.04)` | `rgba(255, 255, 255, 0.04)` | Subtle separators |

---

## 4. Typography

**Font Family:** `Inter` (Google Fonts) — clean, modern, excellent at small sizes.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `--font-display` | 28px | 700 | 1.2 | -0.02em | Page titles |
| `--font-heading-lg` | 22px | 600 | 1.3 | -0.015em | Section headers |
| `--font-heading-md` | 18px | 600 | 1.35 | -0.01em | Card titles, panel headers |
| `--font-heading-sm` | 15px | 600 | 1.4 | 0 | Sub-section headers |
| `--font-body` | 14px | 400 | 1.6 | 0 | Default body text |
| `--font-body-sm` | 13px | 400 | 1.5 | 0 | Secondary descriptions |
| `--font-caption` | 12px | 500 | 1.4 | 0.01em | Labels, badges, timestamps |
| `--font-code` | 13px | 400 | 1.6 | 0 | Code, paths, Cypher queries |

**Code font:** `JetBrains Mono` for all monospace contexts (code blocks, file paths, query results, Cypher).

---

## 5. Spacing & Layout

### 5.1 Spacing Scale

Base unit: **4px**. All spacing is a multiple of this base.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Tight internal padding (icon-to-text gap) |
| `--space-2` | 8px | Compact padding, gap between badges |
| `--space-3` | 12px | Default internal card padding |
| `--space-4` | 16px | Standard element spacing |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Card padding, panel padding |
| `--space-8` | 32px | Major section gaps |
| `--space-10` | 40px | Page-level vertical spacing |
| `--space-12` | 48px | Large section separators |
| `--space-16` | 64px | Page top/bottom margins |

### 5.2 Layout Grid

| Context | Structure |
|---|---|
| **App Shell** | Fixed sidebar (260px collapsed: 72px) + scrollable main content area |
| **Dashboard** | CSS Grid, `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`, gap: `--space-6` |
| **Detail Pages** | Single column, max-width: `960px`, centered |
| **Graph Explorer** | Full-bleed canvas, floating filter panel (glass, absolute positioned) |
| **Tables** | Full width within parent, sticky header |

### 5.3 Breakpoints

| Name | Value | Layout Change |
|---|---|---|
| `sm` | 640px | Stack cards vertically |
| `md` | 768px | Sidebar collapses to icon-only |
| `lg` | 1024px | Full sidebar, 2-column grids |
| `xl` | 1280px | 3-column grids, wider panels |
| `2xl` | 1536px | Max content width applies |

---

## 6. Elevation & Glass System

This is the core of the spatial + glass aesthetic. Every UI element maps to an elevation level.

### 6.1 Elevation Levels

| Level | Usage | Shadow (Light) | Shadow (Dark) | Blur | Opacity |
|---|---|---|---|---|---|
| **0** | Page background | none | none | none | 100% (solid) |
| **1** | Sidebar, topbar | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | `0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20)` | 12px | 72% |
| **2** | Cards, panels | `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | `0 4px 12px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.24)` | 16px | 55–65% |
| **3** | Dropdowns, popovers | `0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)` | `0 8px 24px rgba(0,0,0,0.50), 0 4px 8px rgba(0,0,0,0.30)` | 20px | 50% |
| **4** | Modals, dialogs | `0 16px 48px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)` | `0 16px 48px rgba(0,0,0,0.60), 0 8px 16px rgba(0,0,0,0.36)` | 24px | 45% |
| **5** | Command palette | `0 24px 64px rgba(0,0,0,0.20), 0 12px 24px rgba(0,0,0,0.10)` | `0 24px 64px rgba(0,0,0,0.70), 0 12px 24px rgba(0,0,0,0.40)` | 32px | 40% |

### 6.2 Glass Panel CSS Pattern

```css
.glass-panel {
  background: var(--color-bg-elevated);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--color-border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevation-2);

  /* Noise texture overlay for depth */
  position: relative;
}

.glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: url('/noise.svg') repeat;
  opacity: 0.03;
  pointer-events: none;
}
```

### 6.3 Hover Elevation Shift

Interactive elements shift up one elevation level on hover with a smooth transition:

```css
.card-interactive {
  transition: box-shadow 200ms var(--ease-out),
              transform 200ms var(--ease-out),
              background 200ms var(--ease-out);
}

.card-interactive:hover {
  box-shadow: var(--shadow-elevation-3);
  transform: translateY(-2px);
  background: var(--color-bg-surface);
}

.card-interactive:active {
  transform: translateY(0px);
  box-shadow: var(--shadow-elevation-1);
}
```

---

## 7. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Badges, chips, small buttons |
| `--radius-md` | 10px | Inputs, small cards |
| `--radius-lg` | 14px | Standard cards, panels |
| `--radius-xl` | 20px | Modals, large cards |
| `--radius-2xl` | 28px | Command palette, onboarding cards |
| `--radius-full` | 9999px | Avatars, pill buttons, toggles |

---

## 8. Motion & Animation

### 8.1 Easing Curves

| Token | Value | Usage |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default exit/settle motion |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetric transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy micro-interactions |
| `--ease-glass` | `cubic-bezier(0.4, 0, 0.2, 1)` | Glass panel entrance/exit |

### 8.2 Duration Scale

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | 120ms | Hover color changes, icon swaps |
| `--duration-normal` | 200ms | Card hover lift, button press |
| `--duration-slow` | 350ms | Panel slide, modal enter/exit |
| `--duration-slower` | 500ms | Page transitions, large layout shifts |

### 8.3 Standard Animations

**Panel Entrance (slide up + fade in):**
```css
@keyframes panelEnter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    backdrop-filter: blur(var(--glass-blur));
  }
}

.panel-enter {
  animation: panelEnter var(--duration-slow) var(--ease-glass) forwards;
}
```

**Card Hover Glow (inner light on hover):**
```css
.card-glow:hover {
  box-shadow:
    var(--shadow-elevation-3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

**Skeleton Loading Shimmer:**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-surface) 25%,
    var(--color-bg-elevated) 50%,
    var(--color-bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: var(--radius-md);
}
```

---

## 9. Component Specifications

All components use MUI as the base, with theme overrides applied via `createTheme()`. Below are the Recalix-specific specs.

### 9.1 Buttons

| Variant | Background | Border | Text | Hover | Active |
|---|---|---|---|---|---|
| **Primary** | `var(--color-primary)` | none | `var(--color-text-inverse)` | `var(--color-primary-hover)`, lift 1px | scale(0.98) |
| **Secondary** | `var(--color-bg-surface)` | `1px solid var(--color-border-glass)` | `var(--color-text-primary)` | bg brightens, glass glow | scale(0.98) |
| **Ghost** | transparent | none | `var(--color-text-secondary)` | `var(--color-primary-subtle)` bg | bg darkens slightly |
| **Danger** | `var(--color-error)` | none | white | darken 10% | scale(0.98) |

All buttons:
- Height: 36px (small), 40px (medium), 48px (large)
- Padding: `0 var(--space-4)` (medium)
- Border-radius: `var(--radius-md)`
- Font: `--font-body`, weight 500
- Icon-only: square aspect, same height
- Disabled: 40% opacity, no pointer events

### 9.2 Inputs / Text Fields

```
┌─────────────────────────────────────┐
│  Label (caption, secondary color)   │
│ ┌─────────────────────────────────┐ │
│ │ [Icon]  Placeholder text...     │ │
│ └─────────────────────────────────┘ │
│  Helper text (caption, tertiary)    │
└─────────────────────────────────────┘
```

- Background: `var(--color-bg-input)`
- Border: `1px solid var(--color-border-default)`
- Focus: border becomes `var(--color-border-focus)`, add `0 0 0 3px var(--color-primary-subtle)` ring
- Border-radius: `var(--radius-md)`
- Height: 40px (single line)
- Padding: `0 var(--space-3)`
- Backdrop-filter: `blur(8px)` (glass input effect)

### 9.3 Cards

Standard content container. Always glass.

```
┌──────────────────────────────────────────┐
│  [Icon]  Card Title                 [...]│  <- header row
│──────────────────────────────────────────│  <- subtle divider
│                                          │
│  Card body content. Stats, text,         │
│  graphs, tables, etc.                    │
│                                          │
│──────────────────────────────────────────│
│  Footer: metadata, timestamps, actions   │
└──────────────────────────────────────────┘
```

- Background: `var(--color-bg-elevated)` + blur
- Border: `1px solid var(--color-border-glass)`
- Border-radius: `var(--radius-lg)`
- Padding: `var(--space-6)`
- Shadow: `var(--shadow-elevation-2)`
- Hover (if interactive): elevation shift to 3, `translateY(-2px)`

### 9.4 Sidebar

Fixed left panel, full viewport height. Glass surface.

```
┌──────────┐
│  RECALIX  │  <- brand mark (text logo, no emoji)
│           │
│  [icon] Dashboard    │  <- nav items
│  [icon] Query        │
│  [icon] Graph        │
│  [icon] Repos        │
│  [icon] Integrations │
│  [icon] Ingestion    │
│           │
│  ─────── │  <- divider
│           │
│  [icon] Settings     │
│  [av] User Name      │  <- avatar + name
└──────────┘
```

- Width: 260px expanded, 72px collapsed
- Background: `var(--color-bg-elevated)` + `blur(16px)`
- Border-right: `1px solid var(--color-border-glass)`
- Active nav item: `var(--color-primary-subtle)` background, `var(--color-primary)` text + left accent bar (3px, border-radius full)
- Hover nav item: `var(--color-bg-surface)` background
- Collapse/expand: animated with `var(--duration-slow)`, icons remain centered
- Nav icons: MUI Outlined, 20px

### 9.5 Topbar

Horizontal bar above main content. Glass surface, sticky.

```
┌─────────────────────────────────────────────────────┐
│  Page Title          [SearchIcon] Search...  [ThemeToggle] [Avatar] │
└─────────────────────────────────────────────────────┘
```

- Height: 64px
- Background: `var(--color-bg-elevated)` + `blur(16px)`
- Border-bottom: `1px solid var(--color-border-glass)`
- Position: sticky, top: 0, z-index: 40

### 9.6 Tables

For data-heavy views (ingestion runs, query history, repos).

| Property | Value |
|---|---|
| Header bg | `var(--color-bg-surface)` |
| Header text | `--font-caption`, `var(--color-text-secondary)`, uppercase |
| Row bg | transparent |
| Row hover | `var(--color-primary-subtle)` |
| Row border | `1px solid var(--color-border-subtle)` bottom |
| Cell padding | `var(--space-3) var(--space-4)` |
| Border-radius | `var(--radius-lg)` on outer container |

### 9.7 Status Badges

Pill-shaped indicators for ingestion status, connection health, etc.

| Status | Background | Text | Icon (MUI) |
|---|---|---|---|
| Completed | `rgba(22,163,74,0.12)` / `rgba(74,222,128,0.15)` | `var(--color-success)` | `CheckCircleOutlined` |
| Running | `rgba(217,119,6,0.12)` / `rgba(251,191,36,0.15)` | `var(--color-warning)` | `SyncOutlined` (animated spin) |
| Failed | `rgba(220,38,38,0.12)` / `rgba(248,113,113,0.15)` | `var(--color-error)` | `ErrorOutlined` |
| Queued | `rgba(37,99,235,0.12)` / `rgba(96,165,250,0.15)` | `var(--color-info)` | `ScheduleOutlined` |
| Connected | success style | `var(--color-success)` | `LinkOutlined` |
| Disconnected | error style | `var(--color-error)` | `LinkOffOutlined` |

- Height: 24px
- Padding: `0 var(--space-2)`
- Border-radius: `var(--radius-full)`
- Font: `--font-caption`

### 9.8 Modals / Dialogs

Floating glass panel at elevation 4, centered with backdrop overlay.

- Backdrop: `rgba(0,0,0,0.40)` (light), `rgba(0,0,0,0.60)` (dark)
- Panel: `var(--color-bg-overlay)` + `blur(24px)`
- Border: `1px solid var(--color-border-glass)`
- Border-radius: `var(--radius-xl)`
- Max-width: 560px
- Entrance: `panelEnter` animation
- Exit: reverse with opacity fade

### 9.9 Graph Explorer

The graph canvas is the hero view. Full-bleed, dark-biased even in light mode for readability.

| Element | Style |
|---|---|
| Canvas bg | `#0B0D11` (always dark, regardless of theme) |
| Node: CodeEntity | Circle, `var(--color-primary)` fill, white label |
| Node: Commit | Diamond shape, `var(--color-secondary)` fill |
| Node: Ticket | Rounded square, `var(--color-accent)` fill |
| Node: Discussion | Hexagon, `var(--color-warning)` fill |
| Edges | `rgba(255,255,255,0.15)`, 1.5px, animated dash on hover |
| Selected node | Glow ring (`0 0 20px var(--color-primary)`) |
| Tooltip | Glass panel (elevation 3), positioned near node |
| Filter panel | Glass overlay, positioned top-right, collapsible |
| Minimap | Bottom-right corner, 160x120px, semi-transparent |

### 9.10 Query Interface

The flagship interaction. Search bar is prominent, results appear as stacked source cards.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     ┌─────────────────────────────────────────┐     │
│     │ [SearchIcon]  Why does this function... │     │  <- glass input, large
│     └─────────────────────────────────────────┘     │
│                                                     │
│     ┌──── Answer Card (glass, elevation 2) ───────┐ │
│     │  Answer text with highlighted entities...    │ │
│     │                                              │ │
│     │  Sources:                                    │ │
│     │  ┌─ Source Card ──────────────────────────┐  │ │
│     │  │ [CommitIcon] abc1234 — "Refactored..." │  │ │
│     │  │ Author: Jane   Date: 2024-03-15       │  │ │
│     │  └────────────────────────────────────────┘  │ │
│     │  ┌─ Source Card ──────────────────────────┐  │ │
│     │  │ [TicketIcon] PROJ-42 — "Auth rework"  │  │ │
│     │  └────────────────────────────────────────┘  │ │
│     │                                              │ │
│     │  [View in Graph]  [Copy Answer]              │ │
│     └──────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Query input: height 56px, `--font-heading-md`, centered, glass background
- Answer card: `var(--color-bg-elevated)`, max-width 720px
- Source cards: nested at elevation 1, compact layout
- Entity mentions in answers: highlighted with `var(--color-primary-subtle)` bg, clickable

---

## 10. Theme Implementation

### 10.1 CSS Variables (globals.css)

```css
:root {
  /* === Colors === */
  --color-bg-base: #F4F5F7;
  --color-bg-elevated: rgba(255, 255, 255, 0.72);
  --color-bg-surface: rgba(255, 255, 255, 0.55);
  --color-bg-overlay: rgba(255, 255, 255, 0.40);
  --color-bg-input: rgba(255, 255, 255, 0.60);
  --color-bg-solid: #FFFFFF;

  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-primary-subtle: rgba(79, 70, 229, 0.10);
  --color-secondary: #0EA5E9;
  --color-accent: #8B5CF6;

  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #2563EB;

  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-tertiary: #9CA3AF;
  --color-text-inverse: #FFFFFF;

  --color-border-default: rgba(0, 0, 0, 0.08);
  --color-border-glass: rgba(255, 255, 255, 0.30);
  --color-border-focus: var(--color-primary);
  --color-border-subtle: rgba(0, 0, 0, 0.04);

  /* === Glass === */
  --glass-blur: 16px;

  /* === Shadows (Light) === */
  --shadow-elevation-1: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-elevation-2: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-elevation-3: 0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);
  --shadow-elevation-4: 0 16px 48px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08);
  --shadow-elevation-5: 0 24px 64px rgba(0,0,0,0.20), 0 12px 24px rgba(0,0,0,0.10);

  /* === Radius === */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-2xl: 28px;
  --radius-full: 9999px;

  /* === Spacing === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* === Motion === */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-glass: cubic-bezier(0.4, 0, 0.2, 1);

  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;

  /* === Typography === */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* === Layout === */
  --sidebar-width: 260px;
  --sidebar-collapsed: 72px;
  --topbar-height: 64px;
}

[data-theme="dark"] {
  --color-bg-base: #0B0D11;
  --color-bg-elevated: rgba(22, 27, 34, 0.72);
  --color-bg-surface: rgba(30, 37, 48, 0.55);
  --color-bg-overlay: rgba(40, 48, 62, 0.40);
  --color-bg-input: rgba(22, 27, 34, 0.60);
  --color-bg-solid: #161B22;

  --color-primary: #818CF8;
  --color-primary-hover: #A5B4FC;
  --color-primary-subtle: rgba(129, 140, 248, 0.12);
  --color-secondary: #38BDF8;
  --color-accent: #A78BFA;

  --color-success: #4ADE80;
  --color-warning: #FBBF24;
  --color-error: #F87171;
  --color-info: #60A5FA;

  --color-text-primary: #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-tertiary: #64748B;
  --color-text-inverse: #0B0D11;

  --color-border-default: rgba(255, 255, 255, 0.08);
  --color-border-glass: rgba(255, 255, 255, 0.10);
  --color-border-subtle: rgba(255, 255, 255, 0.04);

  --shadow-elevation-1: 0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20);
  --shadow-elevation-2: 0 4px 12px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.24);
  --shadow-elevation-3: 0 8px 24px rgba(0,0,0,0.50), 0 4px 8px rgba(0,0,0,0.30);
  --shadow-elevation-4: 0 16px 48px rgba(0,0,0,0.60), 0 8px 16px rgba(0,0,0,0.36);
  --shadow-elevation-5: 0 24px 64px rgba(0,0,0,0.70), 0 12px 24px rgba(0,0,0,0.40);
}
```

### 10.2 MUI Theme Override (lib/theme.ts)

```typescript
import { createTheme } from '@mui/material/styles';

// Build the MUI theme dynamically from CSS variables at runtime
// This is the shape — actual implementation reads CSS vars via getComputedStyle

export const recalixTheme = createTheme({
  palette: {
    mode: 'dark', // or 'light' — toggled by ThemeProvider
    primary: { main: '#818CF8' },
    secondary: { main: '#38BDF8' },
    error: { main: '#F87171' },
    warning: { main: '#FBBF24' },
    success: { main: '#4ADE80' },
    background: {
      default: '#0B0D11',
      paper: 'rgba(22, 27, 34, 0.72)',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 10,
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 14,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backdropFilter: 'blur(8px)',
            borderRadius: 10,
          },
        },
      },
    },
  },
});
```

### 10.3 Theme Toggle

Use `data-theme` attribute on `<html>` element. Store preference in `localStorage`.

```typescript
// hooks/useTheme.ts
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return { theme, toggle };
}
```

Toggle button in topbar: MUI `LightModeOutlined` / `DarkModeOutlined` icon, ghost button style.

---

## 11. Background Treatments

### 11.1 Base Layer (behind all glass panels)

**Light mode:**
```css
body {
  background-color: var(--color-bg-base);
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(79, 70, 229, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(14, 165, 233, 0.05) 0%, transparent 40%);
}
```

**Dark mode:**
```css
[data-theme="dark"] body {
  background-color: var(--color-bg-base);
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(129, 140, 248, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(56, 189, 248, 0.06) 0%, transparent 40%);
}
```

Subtle colored radial gradients in the background create a sense of ambient light, making glass panels feel like they exist in a lit environment.

### 11.2 Mesh / Dot Grid (optional, for graph page)

```css
.bg-dot-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

---

## 12. Noise Texture

Generate a `noise.svg` for the glass texture overlay:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noise)" opacity="0.5"/>
</svg>
```

Place at `frontend/public/noise.svg`. Used at 2–4% opacity as a `::before` pseudo-element on glass panels.

---

## 13. Iconography Rules

**Library:** `@mui/icons-material`

| Context | Icon Variant | Size |
|---|---|---|
| Sidebar navigation | Outlined (default), Filled (active) | 22px |
| Card headers | Outlined | 20px |
| Buttons (with text) | Outlined | 18px |
| Status badges | Outlined | 16px |
| Table actions | Outlined | 18px |
| Topbar actions | Outlined | 22px |
| Empty states | Outlined | 48px, `var(--color-text-tertiary)` |

**Specific icon mappings:**

| UI Element | MUI Icon |
|---|---|
| Dashboard | `DashboardOutlined` |
| Query | `SearchOutlined` |
| Graph Explorer | `AccountTreeOutlined` |
| Repos | `FolderOutlined` |
| Integrations | `ExtensionOutlined` |
| Ingestion | `SyncOutlined` |
| Settings | `SettingsOutlined` |
| GitHub | Custom SVG (MUI doesn't include brand icons) |
| Jira | Custom SVG |
| Slack | Custom SVG |
| Light mode | `LightModeOutlined` |
| Dark mode | `DarkModeOutlined` |
| Expand sidebar | `MenuOpenOutlined` |
| Collapse sidebar | `MenuOutlined` |
| User avatar | MUI `Avatar` component |
| Close | `CloseOutlined` |
| Error | `ErrorOutlined` |
| Success | `CheckCircleOutlined` |
| Warning | `WarningAmberOutlined` |
| Info | `InfoOutlined` |
| Copy | `ContentCopyOutlined` |
| External link | `OpenInNewOutlined` |
| Filter | `FilterListOutlined` |
| Sort | `SwapVertOutlined` |
| Refresh | `RefreshOutlined` |
| Delete | `DeleteOutlined` |
| Edit | `EditOutlined` |
| Add | `AddOutlined` |
| Back | `ArrowBackOutlined` |
| Commit (graph) | `CommitOutlined` |
| Code entity | `CodeOutlined` |
| Ticket | `ConfirmationNumberOutlined` |
| Discussion | `ChatBubbleOutlineOutlined` |

---

## 14. Empty States

Every list/table/page must have a designed empty state — never a blank white screen.

Pattern:
```
┌──────────────────────────────────────────┐
│                                          │
│        [Large outlined icon, 48px]       │
│                                          │
│         No repositories connected        │  <- heading-md, text-primary
│    Connect a GitHub repo to start        │  <- body-sm, text-secondary
│    building your knowledge graph.        │
│                                          │
│         [ Connect Repository ]           │  <- primary button
│                                          │
└──────────────────────────────────────────┘
```

- Centered vertically and horizontally
- Max-width: 400px
- Icon: `var(--color-text-tertiary)`, 48px
- No emojis

---

## 15. Loading States

### Skeleton Screens (preferred over spinners)

Use skeleton placeholders that match the shape of the content being loaded. Apply the `shimmer` animation from Section 8.3.

- Cards: rectangle skeleton matching card dimensions
- Tables: row-shaped skeleton blocks
- Text: rounded pill skeletons at line height

### Spinner (for inline loading indicators)

Use MUI `CircularProgress`, size 20px, color `var(--color-primary)`. Only for button loading states and inline status indicators.

---

## 16. Accessibility

- All interactive elements must have focus-visible outlines: `0 0 0 3px var(--color-primary-subtle)`
- Color contrast must meet WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text)
- Glass panel text must remain readable — minimum contrast enforced by using semi-opaque backgrounds, not fully transparent
- All MUI icons used as buttons must have `aria-label`
- Theme toggle must announce change via `aria-live="polite"`
- Sidebar collapse must not trap focus

---

## 17. Do Not List

These are explicit anti-patterns. Any agent building the UI must avoid:

- No emojis in any UI text, label, button, or status indicator
- No hardcoded hex colors in component files — use CSS variables only
- No fully opaque panels above elevation 0 (except tables and code blocks)
- No default MUI theming — every component must use the Recalix theme override
- No browser-default fonts — always load Inter and JetBrains Mono
- No plain `alert()` or `confirm()` dialogs — use glass modals
- No sudden layout shifts — all dynamic content must have skeleton placeholders
- No unstyled scrollbars — use thin custom scrollbar styling:
  ```css
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--color-border-default);
    border-radius: var(--radius-full);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-tertiary);
  }
  ```

---

*Last updated: 2026-07-13*
