/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':     'fadeIn 0.25s ease-out',
        'slide-down':  'slideDown 0.25s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'spin-slow':   'spin 3s linear infinite',
        'scan-ring':   'scanRing 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideDown:{ '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scanRing: {
          '0%,100%': { transform: 'scale(1)',    opacity: '0.6' },
          '50%':     { transform: 'scale(1.08)', opacity: '1'   },
        },
      },
      boxShadow: {
        'card':     '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-md':  '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg':  '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
        'sidebar':  '2px 0 8px 0 rgba(0,0,0,0.15)',
        'glow-sky': '0 0 20px rgba(2,132,199,0.25)',
        'glow-red': '0 0 20px rgba(239,68,68,0.25)',
      },
    },
  },
  plugins: [],
};
