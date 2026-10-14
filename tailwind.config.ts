import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'Inter', 'sans-serif'],
        body: ['Manrope', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.5) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'aurora':
          'linear-gradient(115deg, hsl(var(--primary)), hsl(var(--accent)), #22d3ee, hsl(var(--primary)))',
      },
      boxShadow: {
        glow: '0 0 0 1px hsl(var(--border)), 0 8px 40px -8px hsl(var(--primary) / 0.35)',
        'glow-lg': '0 0 80px -20px hsl(var(--primary) / 0.55)',
        elevated:
          '0 1px 2px hsl(0 0% 0% / 0.2), 0 8px 24px -8px hsl(0 0% 0% / 0.35)',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'infinite-slider-x': {
          from: { transform: 'translate3d(0, 0, 0)' },
          to: { transform: 'translate3d(-50%, 0, 0)' },
        },
        'infinite-slider-y': {
          from: { transform: 'translate3d(0, 0, 0)' },
          to: { transform: 'translate3d(0, -50%, 0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        aurora: 'aurora 12s ease infinite',
        marquee: 'marquee 30s linear infinite',
        // InfiniteSlider runs on the compositor as a CSS animation; the
        // component measures its content and sets the duration variable.
        'infinite-slider-x':
          'infinite-slider-x var(--infinite-slider-duration) linear infinite',
        'infinite-slider-y':
          'infinite-slider-y var(--infinite-slider-duration) linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [
    animate,
    /* WHAT THIS DEVICE CAN AFFORD, as a variant: `rich:`, `lite:`, `still:`.

       Matches `<html data-motion="...">`, which the `motion-budget` starter
       pack writes (`npm run pack:add motion-budget`). A blur, a shadow or a
       sticky layer costs nothing to declare and a great deal to paint, so
       those are gated in CSS: `rich:backdrop-blur-xl` paints only where it is
       affordable and the base class is what every phone gets. Without the
       pack the attribute is absent and these variants simply never match.

       `:where()` holds the variant at zero specificity, so it composes with
       hover, focus and the breakpoints in either order. */
    plugin(({ addVariant }) => {
      addVariant('rich', ':where(html[data-motion="full"]) &');
      addVariant('lite', ':where(html[data-motion="lite"]) &');
      addVariant('still', ':where(html[data-motion="still"]) &');
    }),
  ],
};

export default config;
