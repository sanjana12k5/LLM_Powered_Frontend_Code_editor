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
                    'bg': '#0d1117',
                    'surface': '#161b22',
                    'surface-hover': '#1c2333',
                    'border': '#30363d',
                    'border-light': '#484f58',
                    'text': '#e6edf3',
                    'text-muted': '#8b949e',
                    'accent': '#58a6ff',
                    'accent-hover': '#79c0ff',
                    'success': '#3fb950',
                    'warning': '#d29922',
                    'error': '#f85149',
                    'info': '#58a6ff',
                    'purple': '#bc8cff',
                    'panel': '#0d1117',
                    'editor': '#0d1117',
                    'tab': '#161b22',
                    'tab-active': '#0d1117',
                    'orange': '#f0883e',
                    'cyan': '#39c5cf',
                    'pink': '#db61a2',
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
