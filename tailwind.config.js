/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk color palette
        'cyber-black': 'var(--color-cyber-black)',
        'cyber-black-light': 'var(--color-cyber-black-light)',
        'cyber-black-soft': 'var(--color-cyber-black-soft)',
        'cyber-purple': 'var(--color-cyber-purple)',
        'cyber-purple-light': 'var(--color-cyber-purple-light)',
        'cyber-purple-glow': 'var(--color-cyber-purple-glow)',
        'cyber-purple-dark': 'var(--color-cyber-purple-dark)',
        'cyber-jade': 'var(--color-cyber-jade)',
        'cyber-jade-light': 'var(--color-cyber-jade-light)',
        'cyber-jade-glow': 'var(--color-cyber-jade-glow)',
        'cyber-jade-dark': 'var(--color-cyber-jade-dark)',
        'cyber-pink': 'var(--color-cyber-pink)',
        'cyber-blue': 'var(--color-cyber-blue)',
        'cyber-yellow': 'var(--color-cyber-yellow)',
        'cyber-red': 'var(--color-cyber-red)',
        'cyber-gray': {
          50: 'var(--color-cyber-gray-50)',
          100: 'var(--color-cyber-gray-100)',
          200: 'var(--color-cyber-gray-200)',
          300: 'var(--color-cyber-gray-300)',
          400: 'var(--color-cyber-gray-400)',
          500: 'var(--color-cyber-gray-500)',
          600: 'var(--color-cyber-gray-600)',
          700: 'var(--color-cyber-gray-700)',
          800: 'var(--color-cyber-gray-800)',
          900: 'var(--color-cyber-gray-900)',
        },
        // Map to CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'display': ['Orbitron', 'Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}