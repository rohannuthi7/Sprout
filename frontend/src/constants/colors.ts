// Design tokens — "Succulent Garden" palette
// Never use gradients. Solid colors only.
export const COLORS = {
  cream: '#FDF1DB',
  sageTan: '#CFC49D',
  terracotta: '#D89684',
  lightGreen: '#96AB88',
  midGreen: '#597B60',
  deepGreen: '#40534D',

  // Semantic aliases
  background: '#FDF1DB',
  surface: '#FFFFFF',
  primary: '#597B60',
  primaryDark: '#40534D',
  accent: '#D89684',
  muted: '#CFC49D',
  textPrimary: '#40534D',
  textSecondary: '#597B60',
  textMuted: '#8A9E8E',

  // Status colors (stay within palette spirit)
  danger: '#C0504D',
  warning: '#D89684',
  success: '#597B60',
  info: '#96AB88',

  // UI utilities
  border: '#E8DFC8',
  divider: '#EDE5D0',
  overlay: 'rgba(64, 83, 77, 0.4)',
  cardShadow: 'rgba(64, 83, 77, 0.08)',
} as const;

export type ColorKey = keyof typeof COLORS;
