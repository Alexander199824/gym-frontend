// tailwind.config.js
// FUNCIÓN: Configuración SERIA Y PROFESIONAL para Elite Fitness Club

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  
  theme: {
    extend: {
      // 🎨 PALETA PROFESIONAL ELITE FITNESS CLUB
      colors: {
        // Colores principales - GRISES PROFESIONALES
        primary: {
          50: '#f8fafc',   // Gris muy claro
          100: '#f1f5f9',  // Gris claro
          200: '#e2e8f0',  // Gris medio claro
          300: '#cbd5e1',  // Gris medio
          400: '#94a3b8',  // Gris medio oscuro
          500: '#64748b',  // BASE - Gris profesional
          600: '#475569',  // Gris oscuro
          700: '#334155',  // Gris muy oscuro
          800: '#1e293b',  // Gris ultra oscuro
          900: '#0f172a'   // Negro elegante
        },
        
        // Color secundario - AZUL CORPORATIVO
        secondary: {
          50: '#f0f9ff',   // Azul muy claro
          100: '#e0f2fe',  // Azul claro
          200: '#bae6fd',  // Azul medio claro
          300: '#7dd3fc',  // Azul medio
          400: '#38bdf8',  // Azul medio oscuro
          500: '#0ea5e9',  // BASE - Azul corporativo
          600: '#0284c7',  // Azul oscuro
          700: '#0369a1',  // Azul muy oscuro
          800: '#075985',  // Azul ultra oscuro
          900: '#0c4a6e'   // Azul negro
        },
        
        // Grises profesionales
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
        
        // Colores de estado (más sobrios)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',  // Verde corporativo
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d'
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',  // Ámbar profesional
          600: '#d97706',
          700: '#b45309',
          900: '#78350f'
        },
        
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',  // Rojo sobrio
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d'
        },
        
        // Colores de la marca - PROFESIONALES
        elite: {
          slate: '#334155',     // Gris principal
          blue: '#0ea5e9',      // Azul corporativo
          dark: '#0f172a',      // Negro elegante
          light: '#f8fafc',     // Blanco suave
          gradient: {
            from: '#334155',    // Degradado gris
            to: '#0ea5e9'       // Degradado azul
          }
        }
      },
      
      // 🎨 GRADIENTES PROFESIONALES
      backgroundImage: {
        'elite-gradient': 'linear-gradient(135deg, #334155 0%, #0ea5e9 100%)',
        'elite-gradient-reverse': 'linear-gradient(135deg, #0ea5e9 0%, #334155 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'professional-gradient': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        'hero-pattern': 'linear-gradient(135deg, rgba(51, 65, 85, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
      },
      
      // 📱 FUENTES PROFESIONALES
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'], // Cambié Poppins por Inter más serio
      },
      
      // 🎯 SOMBRAS ELEGANTES
      boxShadow: {
        'elite': '0 4px 20px rgba(51, 65, 85, 0.15)',
        'elite-lg': '0 8px 30px rgba(51, 65, 85, 0.2)',
        'professional': '0 4px 20px rgba(14, 165, 233, 0.15)',
        'professional-lg': '0 8px 30px rgba(14, 165, 233, 0.2)',
        'dark': '0 4px 20px rgba(15, 23, 42, 0.3)',
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
        'pulse-elite': 'pulseElite 2s infinite',
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
            boxShadow: '0 0 0 0 rgba(51, 65, 85, 0.7)' 
          },
          '70%': { 
            boxShadow: '0 0 0 10px rgba(51, 65, 85, 0)' 
          },
        },
      }
    },
  },
  
  plugins: [],
}