// tailwind.config.js
// FUNCIÓN: Configuración ATRACTIVA Y VIBRANTE para Elite Fitness Club

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  
  theme: {
    extend: {
      // 🎨 PALETA ATRACTIVA Y VIBRANTE ELITE FITNESS CLUB
      colors: {
        // Colores principales - TURQUESA Y MAGENTA VIBRANTES
        primary: {
          50: '#f0fdfa',   // Turquesa muy claro
          100: '#ccfbf1',  // Turquesa claro
          200: '#99f6e4',  // Turquesa medio claro
          300: '#5eead4',  // Turquesa medio
          400: '#2dd4bf',  // Turquesa medio oscuro
          500: '#14b8a6',  // BASE - Turquesa vibrante
          600: '#0d9488',  // Turquesa oscuro
          700: '#0f766e',  // Turquesa muy oscuro
          800: '#115e59',  // Turquesa ultra oscuro
          900: '#134e4a'   // Turquesa negro
        },
        
        // Color secundario - MAGENTA VIBRANTE
        secondary: {
          50: '#fdf2f8',   // Magenta muy claro
          100: '#fce7f3',  // Magenta claro
          200: '#fbcfe8',  // Magenta medio claro
          300: '#f9a8d4',  // Magenta medio
          400: '#f472b6',  // Magenta medio oscuro
          500: '#ec4899',  // BASE - Magenta vibrante
          600: '#db2777',  // Magenta oscuro
          700: '#be185d',  // Magenta muy oscuro
          800: '#9d174d',  // Magenta ultra oscuro
          900: '#831843'   // Magenta negro
        },
        
        // Grises modernos (menos serios)
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
        
        // Colores de estado (más vibrantes)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',  // Verde vibrante
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d'
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',  // Ámbar vibrante
          600: '#d97706',
          700: '#b45309',
          900: '#78350f'
        },
        
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',  // Rojo vibrante
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d'
        },
        
        // Colores de la marca - VIBRANTES
        elite: {
          turquoise: '#14b8a6',  // Turquesa principal
          magenta: '#ec4899',    // Magenta secundario
          dark: '#1e293b',       // Gris oscuro
          light: '#f8fafc',      // Blanco suave
          gradient: {
            from: '#14b8a6',     // Degradado turquesa
            to: '#ec4899'        // Degradado magenta
          }
        }
      },
      
      // 🎨 GRADIENTES VIBRANTES
      backgroundImage: {
        'elite-gradient': 'linear-gradient(135deg, #14b8a6 0%, #ec4899 100%)',
        'elite-gradient-reverse': 'linear-gradient(135deg, #ec4899 0%, #14b8a6 100%)',
        'primary-gradient': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        'hero-pattern': 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
      },
      
      // 📱 FUENTES MODERNAS
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // 🎯 SOMBRAS VIBRANTES
      boxShadow: {
        'elite': '0 4px 20px rgba(20, 184, 166, 0.25)',
        'elite-lg': '0 8px 30px rgba(20, 184, 166, 0.3)',
        'magenta': '0 4px 20px rgba(236, 72, 153, 0.25)',
        'magenta-lg': '0 8px 30px rgba(236, 72, 153, 0.3)',
        'vibrant': '0 4px 20px rgba(20, 184, 166, 0.2), 0 4px 20px rgba(236, 72, 153, 0.2)',
      },
      
      // 📐 ESPACIADO ADICIONAL
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // 🎨 ANIMACIONES VIBRANTES
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-elite': 'pulseElite 2s infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
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
        pulseElite: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(20, 184, 166, 0.7)' 
          },
          '70%': { 
            boxShadow: '0 0 0 10px rgba(20, 184, 166, 0)' 
          },
        },
        bounceSoft: {
          '0%, 100%': { 
            transform: 'translateY(0)' 
          },
          '50%': { 
            transform: 'translateY(-5px)' 
          },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(20, 184, 166, 0.5)' 
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(236, 72, 153, 0.5)' 
          },
        },
      }
    },
  },
  
  plugins: [],
}