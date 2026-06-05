/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0F',
          secondary: '#111118',
          elevated: '#1A1A24',
        },
        border: {
          DEFAULT: '#2A2A38',
          hover: '#3A3A52',
          active: '#38BDF8',
        },
        sky: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
          muted: 'rgba(56, 189, 248, 0.10)',
          deep: '#0C4A6E',
        },
        text: {
          primary: '#F0F4F8',
          secondary: '#94A3B8',
          tertiary: '#475569',
          inverse: '#0A0A0F',
        },
        success: '#22D3EE',
        warning: '#F59E0B',
        error: '#F87171',
        amber: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        pill: '9999px',
      },
      boxShadow: {
        none: 'none',
        glow: '0 0 20px rgba(56, 189, 248, 0.15)',
        'glow-sm': '0 0 10px rgba(56, 189, 248, 0.10)',
      },
      animation: {
        'scan-line': 'scanLine 1.8s ease-in-out infinite',
        'pulse-border': 'pulseBorder 2s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        scanLine: {
          '0%': { top: '0%', opacity: 0 },
          '10%': { opacity: 1 },
          '90%': { opacity: 1 },
          '100%': { top: '100%', opacity: 0 },
        },
        pulseBorder: {
          '0%, 100%': { borderColor: '#2A2A38' },
          '50%': { borderColor: '#38BDF8' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
