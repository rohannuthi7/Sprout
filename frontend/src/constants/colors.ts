// Design tokens — "Conservatory Night" palette
// Never use gradients. Solid colors only.

// ── Raw primitives ──────────────────────────────────────────────────────────
export const PRIMITIVES = {
  forest:        '#1E2A1A',  // page background (dominant)
  palm:          '#3A4A30',  // card / surface background
  canopy:        '#2C3D24',  // modals, bottom sheets
  wood:          '#5C4126',  // borders, dividers
  fern:          '#4A6040',  // pressed / hover, active-tab indicator bg
  parchment:     '#F2E8D5',  // primary text (warm, light)
  sage:          '#B8C2A8',  // secondary / muted text
  terracotta:    '#E07856',  // alert, allergy emphasis, danger
  mustard:       '#E8B84E',  // pop accent: badges, urgency, bloom stage
  bougainvillea: '#E085A8',  // rare high-attention accent
  scrim:         'rgba(10,18,8,0.72)',
  cardShadow:    'rgba(10,18,8,0.55)',
} as const;

// ── Background tokens ───────────────────────────────────────────────────────
export const BG = {
  page:         PRIMITIVES.forest,
  card:         PRIMITIVES.palm,
  modal:        PRIMITIVES.canopy,
  overlay:      PRIMITIVES.scrim,
  input:        PRIMITIVES.palm,
  inputFocused: PRIMITIVES.fern,
  danger:       PRIMITIVES.forest, // allergy strip must use this so terracotta text passes AA
  warning:      PRIMITIVES.canopy,
  badge:        PRIMITIVES.wood,
  badgeAccent:  PRIMITIVES.mustard,
  tab:          PRIMITIVES.forest,
} as const;

// ── Text tokens ─────────────────────────────────────────────────────────────
export const TEXT = {
  primary:   PRIMITIVES.parchment,
  secondary: PRIMITIVES.sage,
  muted:     PRIMITIVES.sage,   // consumers can apply opacity 0.6 when extra-muted desired
  onAccent:  PRIMITIVES.forest,
  danger:    PRIMITIVES.terracotta, // only valid on forest bg (4.74:1 contrast ratio)
  warning:   PRIMITIVES.mustard,
  link:      PRIMITIVES.mustard,
} as const;

// ── Interactive tokens ───────────────────────────────────────────────────────
export const INTERACTIVE = {
  primary:          PRIMITIVES.mustard,  // fill color; text = forest
  secondary:        PRIMITIVES.palm,     // fill; border = wood; text = parchment
  destructive:      PRIMITIVES.terracotta, // fill; text = parchment
  tabActive:        PRIMITIVES.mustard,
  tabInactive:      PRIMITIVES.sage,
  swipeRight:       PRIMITIVES.mustard,
  swipeLeft:        PRIMITIVES.sage,
  swipeUp:          PRIMITIVES.terracotta,
} as const;

// ── Border tokens ────────────────────────────────────────────────────────────
export const BORDER = {
  default: PRIMITIVES.wood,
  subtle:  PRIMITIVES.wood,  // consumers apply opacity 0.4
  focus:   PRIMITIVES.mustard,
  danger:  PRIMITIVES.terracotta,
} as const;

// ── Growth-stage accent map ──────────────────────────────────────────────────
// Maps order stage → accent color for badges, icons, indicators
export const STAGE_COLORS = {
  seed:       PRIMITIVES.sage,        // inquiry
  sprout:     PRIMITIVES.fern,        // quoted
  youngPlant: PRIMITIVES.parchment,   // confirming
  bud:        PRIMITIVES.terracotta,  // confirmed
  bloom:      PRIMITIVES.mustard,     // completed
} as const;

export type StageKey = keyof typeof STAGE_COLORS;

// ── Flat COLORS alias ────────────────────────────────────────────────────────
// Kept for drop-in compatibility; prefer typed BG/TEXT/INTERACTIVE above in new code.
export const COLORS = {
  // Primitives (direct hex)
  forest:        PRIMITIVES.forest,
  palm:          PRIMITIVES.palm,
  canopy:        PRIMITIVES.canopy,
  wood:          PRIMITIVES.wood,
  fern:          PRIMITIVES.fern,
  parchment:     PRIMITIVES.parchment,
  sage:          PRIMITIVES.sage,
  terracotta:    PRIMITIVES.terracotta,
  mustard:       PRIMITIVES.mustard,
  bougainvillea: PRIMITIVES.bougainvillea,
  scrim:         PRIMITIVES.scrim,
  cardShadow:    PRIMITIVES.cardShadow,

  // Semantic aliases (maps to flat values for StyleSheet consumers)
  background:   PRIMITIVES.forest,
  surface:      PRIMITIVES.palm,
  card:         PRIMITIVES.palm,
  modal:        PRIMITIVES.canopy,
  overlay:      PRIMITIVES.scrim,

  primary:      PRIMITIVES.mustard,   // CTA fill
  primaryText:  PRIMITIVES.forest,    // text on mustard bg
  secondary:    PRIMITIVES.palm,
  accent:       PRIMITIVES.mustard,

  textPrimary:   PRIMITIVES.parchment,
  textSecondary: PRIMITIVES.sage,
  textMuted:     PRIMITIVES.sage,
  textOnAccent:  PRIMITIVES.forest,

  danger:   PRIMITIVES.terracotta,
  warning:  PRIMITIVES.mustard,
  success:  PRIMITIVES.fern,
  info:     PRIMITIVES.sage,

  border:  PRIMITIVES.wood,
  divider: PRIMITIVES.wood,

  // Legacy names referenced in old screens (kept for zero-diff safety)
  cream:      PRIMITIVES.parchment,
  deepGreen:  PRIMITIVES.forest,
  midGreen:   PRIMITIVES.fern,
  lightGreen: PRIMITIVES.sage,
  sageTan:    PRIMITIVES.sage,
} as const;

export type ColorKey = keyof typeof COLORS;
