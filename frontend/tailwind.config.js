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
                    // VS Code Dark+ exact color palette
                    'bg': '#1e1e1e',
                    'surface': '#252526',
                    'surface-hover': '#2a2d2e',
                    'border': '#3c3c3c',
                    'border-light': '#474747',
                    'text': '#cccccc',
                    'text-muted': '#858585',
                    'accent': '#007acc',
                    'accent-hover': '#1a8ad4',
                    'success': '#4ec9b0',
                    'warning': '#cca700',
                    'error': '#f14c4c',
                    'info': '#3794ff',
                    'purple': '#c586c0',
                    'panel': '#1e1e1e',
                    'editor': '#1e1e1e',
                    'tab': '#2d2d2d',
                    'tab-active': '#1e1e1e',
                    'orange': '#ce9178',
                    'cyan': '#4ec9b0',
                    'pink': '#c586c0',
                    'titlebar': '#323233',
                    'activitybar': '#333333',
                    'activitybar-active': '#ffffff',
                    'activitybar-inactive': '#858585',
                    'statusbar': '#007acc',
                    'sidebar': '#252526',
                    'sidebar-title': '#bbbbbb',
                    'input-bg': '#3c3c3c',
                    'input-border': '#3c3c3c',
                    'selection': '#264f78',
                    'list-hover': '#2a2d2e',
                    'list-active': '#04395e',
                    'breadcrumb': '#a0a0a0',
                }
            },
            fontFamily: {
                'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
                'mono': ['Consolas', 'Courier New', 'monospace'],
            },
            fontSize: {
                'xxs': ['11px', '16px'],
                'ide': ['13px', '20px'],
            },
            animation: {
                'fade-in': 'fadeIn 0.15s ease-out',
                'slide-up': 'slideUp 0.2s ease-out',
                'slide-in-right': 'slideInRight 0.15s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(10px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [],
};
