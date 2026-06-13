/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind does not support 'class' darkMode strategy — use 'media' or omit
  darkMode: 'media',
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Sprout "Conservatory Night" brand tokens ─────────────────────
        sprout: {
          forest:        '#1E2A1A',
          palm:          '#3A4A30',
          canopy:        '#2C3D24',
          wood:          '#5C4126',
          fern:          '#4A6040',
          parchment:     '#F2E8D5',
          sage:          '#B8C2A8',
          terracotta:    '#E07856',
          mustard:       '#E8B84E',
          bougainvillea: '#E085A8',
        },

        // ── Semantic surface/text/interactive shorthands ─────────────────
        background: '#1E2A1A',
        foreground: '#F2E8D5',

        border:  '#5C4126',
        input:   '#3A4A30',
        ring:    '#E8B84E',

        primary: {
          DEFAULT:    '#E8B84E',
          foreground: '#1E2A1A',
        },
        secondary: {
          DEFAULT:    '#3A4A30',
          foreground: '#F2E8D5',
        },
        destructive: {
          DEFAULT:    '#E07856',
          foreground: '#F2E8D5',
        },
        muted: {
          DEFAULT:    '#2C3D24',
          foreground: '#B8C2A8',
        },
        accent: {
          DEFAULT:    '#E8B84E',
          foreground: '#1E2A1A',
        },
        popover: {
          DEFAULT:    '#2C3D24',
          foreground: '#F2E8D5',
        },
        card: {
          DEFAULT:    '#3A4A30',
          foreground: '#F2E8D5',
        },
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
      },
      fontFamily: {
        display: ['Fraunces_700Bold', 'serif'],
        'display-xb': ['Fraunces_800ExtraBold', 'serif'],
        body: ['DMSans_400Regular', 'sans-serif'],
        'body-md': ['DMSans_500Medium', 'sans-serif'],
        'body-sb': ['DMSans_600SemiBold', 'sans-serif'],
        'body-bold': ['DMSans_700Bold', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
