/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:    '#F4F0EE',
        ink:      '#323642',
        navy:     '#424B63',
        bluegrey: '#B7C1CB',
        sage:     '#BABEAF',
        blush:    '#ECD6CE',
        background: '#F4F0EE',
        foreground: '#323642',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#323642',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#323642',
        },
        primary: {
          DEFAULT: '#424B63',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#B7C1CB',
          foreground: '#323642',
        },
        muted: {
          DEFAULT: '#F4F0EE',
          foreground: '#6B7485',
        },
        accent: {
          DEFAULT: '#BABEAF',
          foreground: '#323642',
        },
        destructive: {
          DEFAULT: '#C0392B',
          foreground: '#FFFFFF',
        },
        border: '#D1D8DE',
        input:  '#D1D8DE',
        ring:   '#424B63',
      },
      fontFamily: {
        sans:    ['"Atkinson Hyperlegible Next"', 'system-ui', 'sans-serif'],
        body:    ['"Atkinson Hyperlegible Next"', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(50,54,66,0.04), 0 4px 16px rgba(50,54,66,0.06)',
      },
    },
  },
  plugins: [],
}
