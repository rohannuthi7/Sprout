/**
 * GrowthStageIcon
 *
 * Five-stage botanical SVG illustrations mapping order stages onto a
 * seed → sprout → youngPlant → bud → bloom growth metaphor.
 *
 * Props:
 *   stage  — 'seed' | 'sprout' | 'youngPlant' | 'bud' | 'bloom'
 *            Also accepts raw order stage strings: 'inquiry' | 'quoted' |
 *            'confirming' | 'confirmed' | 'completed'
 *   size   — overall bounding box size in logical points (default 40)
 *   color  — SVG stroke/fill color; defaults to the canonical stage accent
 */

import React from 'react';
import Svg, { Path, Circle, Ellipse, Line } from 'react-native-svg';
import { STAGE_COLORS, PRIMITIVES } from '../../constants/colors';

export type GrowthStage = 'seed' | 'sprout' | 'youngPlant' | 'bud' | 'bloom';

// Map raw order-stage strings to growth-stage keys
const ORDER_STAGE_MAP: Record<string, GrowthStage> = {
  inquiry:    'seed',
  quoted:     'sprout',
  confirming: 'youngPlant',
  confirmed:  'bud',
  completed:  'bloom',
  declined:   'seed',
  archived:   'seed',
};

function resolveStage(stage: string): GrowthStage {
  if (stage in ORDER_STAGE_MAP) return ORDER_STAGE_MAP[stage];
  if (['seed', 'sprout', 'youngPlant', 'bud', 'bloom'].includes(stage)) {
    return stage as GrowthStage;
  }
  return 'seed';
}

// Default accent color per stage
function defaultColor(stage: GrowthStage): string {
  const map: Record<GrowthStage, string> = {
    seed:       STAGE_COLORS.seed,
    sprout:     STAGE_COLORS.sprout,
    youngPlant: STAGE_COLORS.youngPlant,
    bud:        STAGE_COLORS.bud,
    bloom:      STAGE_COLORS.bloom,
  };
  return map[stage];
}

interface Props {
  stage: GrowthStage | string;
  size?: number;
  color?: string;
}

// ── Stage SVG renderers ──────────────────────────────────────────────────────
// All paths drawn on a 40×40 viewBox for crisp rendering at any scale.

function SeedIcon({ c, s }: { c: string; s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      {/* Soil line */}
      <Line x1="6" y1="28" x2="34" y2="28" stroke={c} strokeWidth="2" strokeLinecap="round" opacity={0.45} />
      {/* Seed oval */}
      <Ellipse cx="20" cy="23" rx="6" ry="4.5" fill={c} opacity={0.9} />
      {/* Root tendril */}
      <Path
        d="M20 27.5 Q18 31 16 33"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
    </Svg>
  );
}

function SproutIcon({ c, s }: { c: string; s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      {/* Soil line */}
      <Line x1="6" y1="30" x2="34" y2="30" stroke={c} strokeWidth="2" strokeLinecap="round" opacity={0.45} />
      {/* Stem */}
      <Path
        d="M20 30 Q20 24 20 18"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left leaf */}
      <Path
        d="M20 22 Q14 18 12 12 Q17 14 20 18"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill={c}
        opacity={0.5}
      />
      {/* Right leaf */}
      <Path
        d="M20 20 Q26 16 28 10 Q23 13 20 18"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill={c}
        opacity={0.5}
      />
    </Svg>
  );
}

function YoungPlantIcon({ c, s }: { c: string; s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      {/* Soil line */}
      <Line x1="4" y1="32" x2="36" y2="32" stroke={c} strokeWidth="2" strokeLinecap="round" opacity={0.45} />
      {/* Stem */}
      <Path
        d="M20 32 Q20 26 20 14"
        stroke={c}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Large left leaf */}
      <Path
        d="M20 24 Q10 20 8 10 Q16 13 20 20"
        fill={c}
        opacity={0.65}
        stroke={c}
        strokeWidth="1"
      />
      {/* Large right leaf */}
      <Path
        d="M20 20 Q30 16 32 8 Q24 12 20 18"
        fill={c}
        opacity={0.65}
        stroke={c}
        strokeWidth="1"
      />
      {/* Top bud nub */}
      <Circle cx="20" cy="13" r="2.5" fill={c} opacity={0.8} />
    </Svg>
  );
}

function BudIcon({ c, s }: { c: string; s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      {/* Soil line */}
      <Line x1="4" y1="34" x2="36" y2="34" stroke={c} strokeWidth="2" strokeLinecap="round" opacity={0.45} />
      {/* Stem */}
      <Path
        d="M20 34 L20 22"
        stroke={c}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left leaf */}
      <Path
        d="M20 28 Q12 25 10 18 Q17 21 20 26"
        fill={c}
        opacity={0.6}
        stroke={c}
        strokeWidth="1"
      />
      {/* Right leaf */}
      <Path
        d="M20 26 Q28 23 30 16 Q23 20 20 24"
        fill={c}
        opacity={0.6}
        stroke={c}
        strokeWidth="1"
      />
      {/* Bud — closed petals */}
      <Ellipse cx="20" cy="16" rx="5" ry="7" fill={c} opacity={0.85} />
      <Path
        d="M16 16 Q20 10 24 16"
        stroke={PRIMITIVES.forest}
        strokeWidth="1"
        fill="none"
        opacity={0.4}
      />
    </Svg>
  );
}

function BloomIcon({ c, s }: { c: string; s: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      {/* Soil line */}
      <Line x1="4" y1="36" x2="36" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round" opacity={0.45} />
      {/* Stem */}
      <Path
        d="M20 36 L20 26"
        stroke={c}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Small leaf */}
      <Path
        d="M20 30 Q14 28 12 22 Q18 25 20 28"
        fill={c}
        opacity={0.5}
        stroke={c}
        strokeWidth="1"
      />
      {/* Open petals — 5 ellipses rotated around center */}
      <Ellipse cx="20" cy="15" rx="4" ry="6.5" fill={c} opacity={0.9} />
      <Ellipse cx="20" cy="15" rx="4" ry="6.5" fill={c} opacity={0.9}
        rotation="72" originX="20" originY="20" />
      <Ellipse cx="20" cy="15" rx="4" ry="6.5" fill={c} opacity={0.9}
        rotation="144" originX="20" originY="20" />
      <Ellipse cx="20" cy="15" rx="4" ry="6.5" fill={c} opacity={0.9}
        rotation="216" originX="20" originY="20" />
      <Ellipse cx="20" cy="15" rx="4" ry="6.5" fill={c} opacity={0.9}
        rotation="288" originX="20" originY="20" />
      {/* Center */}
      <Circle cx="20" cy="20" r="4" fill={PRIMITIVES.forest} opacity={0.9} />
      <Circle cx="20" cy="20" r="2" fill={c} />
    </Svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function GrowthStageIcon({ stage, size = 40, color }: Props) {
  const resolved = resolveStage(String(stage));
  const c = color ?? defaultColor(resolved);
  const props = { c, s: size };

  switch (resolved) {
    case 'seed':       return <SeedIcon {...props} />;
    case 'sprout':     return <SproutIcon {...props} />;
    case 'youngPlant': return <YoungPlantIcon {...props} />;
    case 'bud':        return <BudIcon {...props} />;
    case 'bloom':      return <BloomIcon {...props} />;
  }
}
