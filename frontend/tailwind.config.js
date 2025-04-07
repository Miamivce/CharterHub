/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fdba6c',    // Orange
        secondary: '#000029',  // Navy
        accent: '#22C55E',     // Green
        background: '#F8FAFC', // Light Gray
        text: {
          primary: '#1E293B',
          secondary: '#64748B',
          light: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        'h1': ['2.5rem', { lineHeight: '1.2' }],    // 40px
        'h2': ['2rem', { lineHeight: '1.3' }],      // 32px
        'h3': ['1.5rem', { lineHeight: '1.4' }],    // 24px
        'h4': ['1.25rem', { lineHeight: '1.5' }],   // 20px
        'body': ['1rem', { lineHeight: '1.5' }],    // 16px
        'small': ['0.875rem', { lineHeight: '1.5' }] // 14px
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px'
      },
      borderRadius: {
        DEFAULT: '6px',
        'lg': '8px',
      },
      maxWidth: {
        'content': '1280px',
      },
      height: {
        'header': '64px',
      },
      width: {
        'sidebar': '256px',
      },
      screens: {
        'mobile': '640px',
        'tablet': '1024px',
        'desktop': '1280px',
      },
      animation: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
} 