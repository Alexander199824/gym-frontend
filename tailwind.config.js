// tailwind.config.js - VERSIÓN TURQUESA Y ROSA
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  
  theme: {
    extend: {
      // 🎨 PALETA TURQUESA Y ROSA (como en la imagen)
      colors: {
        // Colores principales - TURQUESA/TEAL VIBRANTE
        primary: {
          50: '#f0fdfa',   // Turquesa muy claro
          100: '#ccfbf1',  // Turquesa claro
          200: '#99f6e4',  // Turquesa medio claro
          300: '#5eead4',  // Turquesa medio
          400: '#2dd4bf',  // Turquesa medio oscuro
          500: '#14b8a6',  // BASE - Turquesa principal
          600: '#0d9488',  // Turquesa oscuro
          700: '#0f766e',  // Turquesa muy oscuro
          800: '#115e59',  // Turquesa ultra oscuro
          900: '#134e4a'   // Turquesa negro
        },
        
        // Color secundario - ROSA/MAGENTA VIBRANTE
        secondary: {
          50: '#fdf2f8',   // Rosa muy claro
          100: '#fce7f3',  // Rosa claro
          200: '#fbcfe8',  // Rosa medio claro
          300: '#f9a8d4',  // Rosa medio
          400: '#f472b6',  // Rosa medio oscuro
          500: '#ec4899',  // BASE - Rosa principal
          600: '#db2777',  // Rosa oscuro
          700: '#be185d',  // Rosa muy oscuro
          800: '#9d174d',  // Rosa ultra oscuro
          900: '#831843'   // Rosa negro
        },
        
        // Acento - VERDE VIBRANTE
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Verde vibrante
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        
        // Grises suaves
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        
        // Colores de estado (mantenemos los actuales)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d'
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          900: '#78350f'
        },
        
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d'
        },
        
        // Colores de la marca - TURQUESA Y ROSA
        elite: {
          teal: '#14b8a6',      // Turquesa principal
          pink: '#ec4899',      // Rosa secundario
          green: '#22c55e',     // Verde acento
          light: '#f8fafc',     // Blanco suave
          dark: '#134e4a',      // Turquesa oscuro
        }
      },
      
      // 🎨 GRADIENTES TURQUESA Y ROSA
      backgroundImage: {
        'elite-gradient': 'linear-gradient(135deg, #14b8a6 0%, #ec4899 100%)',
        'elite-gradient-reverse': 'linear-gradient(135deg, #ec4899 0%, #14b8a6 100%)',
        'primary-gradient': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        'hero-pattern': 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
      },
      
      // 📱 FUENTES MODERNAS
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // 🎯 SOMBRAS TURQUESA Y ROSA
      boxShadow: {
        'elite': '0 4px 20px rgba(20, 184, 166, 0.15)',
        'elite-lg': '0 8px 30px rgba(20, 184, 166, 0.2)',
        'soft': '0 4px 20px rgba(236, 72, 153, 0.15)',
        'soft-lg': '0 8px 30px rgba(236, 72, 153, 0.2)',
      },
      
      // 📐 ESPACIADO ADICIONAL
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // 🎨 ANIMACIONES SUAVES
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(20, 184, 166, 0.4)' 
          },
          '70%': { 
            boxShadow: '0 0 0 8px rgba(20, 184, 166, 0)' 
          },
        },
        bounceSoft: {
          '0%, 100%': { 
            transform: 'translateY(0)' 
          },
          '50%': { 
            transform: 'translateY(-3px)' 
          },
        },
      }
    },
  },
  
  plugins: [],
}