import { Config } from 'tailwindcss'
// @ts-ignore
import mystTheme from '@myst-theme/styles'

const tailwindConfig: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      ...mystTheme.themeExtensions,
      borderRadius: {
        '3xl': '90px',
      },
      colors: {
        yellow: {
          200: '#FFF189',
          300: '#FFDE33',
          400: '#FDCD12',
        },
        blue: {
          50: '#EBF4FF',
          300: '#97BBFF',
          400: '#6E92FF',
          600: '#3347FF',
          700: '#3B01E0',
          800: '#1D2CB6',
        },
        gray: {
          25: '#FCFCFD',
          600: '#475569',
          700: '#334155',
          950: '#0C111D',
        },
        darkBlue: '#0C111D80',
        checkboxBlue: '#3b82f6',
        checkboxYello: '#fde047',
      },
      boxShadow: {
        custom: '0 4px 16px 0 rgba(87, 87, 87, 0.1)',
      },
      flex: {
        2: '2 2 0%',
        3: '3 3 0%',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        epilogue: ['Epilogue', 'sans-serif'],
      },
    },
  },
}

export default tailwindConfig
