/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                golf: {
                    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
                    400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
                    800: '#166534', 900: '#14532d',
                    'glass': 'rgba(220, 252, 231, 0.4)', // Glassmorphism accent
                },
                trust: {
                    slate: '#64748b',
                    navy: '#0f172a',
                    'navy-light': '#1e293b', // Lighter navy for cards
                    white: '#ffffff',
                    platinum: '#e2e8f0',
                    'glass-dark': 'rgba(15, 23, 42, 0.7)', // Dark glass
                    'glass-light': 'rgba(255, 255, 255, 0.8)', // Light glass
                }
            },
            fontFamily: {
                sans: ['Noto Sans JP', 'sans-serif'],
                eng: ['Montserrat', 'sans-serif'],
            },
            animation: {
                'fadeIn': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'slideIn': 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'spin-slow': 'spin 3s linear infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
