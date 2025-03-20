const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8accff',
          400: '#50b2ff',
          500: '#2b90ff',
          600: '#1a70ff',
          700: '#1657e6',
          800: '#1747ba',
          900: '#193d93',
        },
        accent: {
          100: '#fef1f7',
          200: '#fee5f2',
          300: '#feccea',
          400: '#fea4da',
          500: '#fd74c5',
          600: '#f840aa',
          700: '#e91f88',
          800: '#c31a6d',
          900: '#991958',
        }
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'bounce-slow': 'bounce 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      boxShadow: {
        'glow': '0 0 15px -3px rgba(0, 0, 0, 0.1), 0 0 6px -2px rgba(0, 0, 0, 0.05)',
        'glow-lg': '0 0 25px -5px rgba(0, 0, 0, 0.1), 0 0 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}