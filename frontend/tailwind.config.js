/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'studio': {
                    'bg': '#07080a',
                    'surface': '#111218',
                    'surface-hover': '#1a1d27',
                    'border': '#272a38',
                    'border-light': '#3b4055',
                    'text': '#f4f5f8',
                    'text-muted': '#9ba1b4',
                    'accent': '#3b82f6',
                    'accent-hover': '#60a5fa',
                    'success': '#10b981',
                    'warning': '#f59e0b',
                    'error': '#ef4444',
                    'info': '#3b82f6',
                    'purple': '#8b5cf6',
                    'panel': '#0b0d13',
                    'editor': '#1e1e1e', // VS Code classic editor color
                    'tab': '#0b0d13',
                    'tab-active': '#1e1e1e',
                    'orange': '#f97316',
                    'cyan': '#06b6d4',
                    'pink': '#ec4899',
                }
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(88,166,255,0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(88,166,255,0.6)' },
                },
            },
        },
    },
    plugins: [],
};
