/**
 * Preset Tailwind dla design systemu Splot.
 * Kolory wskazują na zmienne CSS z tokens.css, więc tryb wysokiego kontrastu
 * (<html data-contrast="high">) działa bez osobnych klas.
 *
 * Użycie (tailwind.config.js):
 *   module.exports = { presets: [require('./design-system/tailwind.preset.js')], content: [...] }
 * oraz zaimportuj design-system/tokens.css w globalnym arkuszu stylów.
 */
const v = (name) => `var(--${name})`;

module.exports = {
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: v('surface'), muted: v('surface-muted'), sunken: v('surface-sunken') },
        line: { DEFAULT: v('line'), strong: v('line-strong') },
        ink: { DEFAULT: v('ink'), muted: v('ink-muted') },
        navy: { DEFAULT: v('navy'), on: v('on-navy') },
        accent: { DEFAULT: v('accent'), on: v('on-accent') },
        focus: v('focus'),
        stripe: {
          magenta: v('stripe-magenta'), blue: v('stripe-blue'), overlap: v('stripe-overlap'),
          cyan: v('stripe-cyan'), green: v('stripe-green'), yellow: v('stripe-yellow'),
        },
        violet: v('violet'),
        cat: {
          magenta: v('cat-magenta'), blue: v('cat-blue'), cyan: v('cat-cyan'),
          green: v('cat-green'), yellow: v('cat-yellow'),
        },
        soft: {
          magenta: v('soft-magenta'), blue: v('soft-blue'), cyan: v('soft-cyan'),
          green: v('soft-green'), yellow: v('soft-yellow'), violet: v('soft-violet'),
        },
        danger: v('danger'), success: v('success'), warning: v('warning'), info: v('info'),
      },
      fontFamily: { sans: ['"Atkinson Hyperlegible Next"', '"Atkinson Hyperlegible"', '"Segoe UI"', 'system-ui', 'sans-serif'] },
      fontSize: {
        display: ['40px', { lineHeight: '48px', fontWeight: '700' }],
        h1: ['32px', { lineHeight: '40px', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '28px', fontWeight: '700' }],
        nav: ['18px', { lineHeight: '26px', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        body: ['16px', { lineHeight: '24px' }],
        label: ['14px', { lineHeight: '20px', fontWeight: '700' }],
        small: ['14px', { lineHeight: '20px' }],
      },
      spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px', 12: '48px', 16: '64px' },
      borderRadius: { sm: '4px', md: '6px', lg: '12px', pill: '999px' },
      boxShadow: { header: v('shadow-header'), card: v('shadow-card') },
    },
  },
};
