// tailwind.config.js
// FUNCIÓN: Configuración PROFESIONAL para Elite Fitness Club

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  
  theme: {
    extend: {
      // 🎨 PALETA PROFESIONAL Y ELEGANTE
      colors: {
        // Colores principales - AZUL PROFESIONAL
        primary: {
          50: '#eff6ff',   // Azul muy claro
          100: '#dbeafe',  // Azul claro
          200: '#bfdbfe',  // Azul medio claro
          300: '#93c5fd',  // Azul medio
          400: '#60a5fa',  // Azul medio oscuro
          500: '#3b82f6',  // BASE - Azul profesional
          600: '#2563eb',  // Azul oscuro
          700: '#1d4ed8',  // Azul muy oscuro
          800: '#1e40af',  // Azul ultra oscuro
          900: '#1e3a8a'   // Azul negro
        },
        
        // Color secundario - GRIS ELEGANTE
        secondary: {
          50: '#f8fafc',   // Gris muy claro
          100: '#f1f5f9',  // Gris claro
          200: '#e2e8f0',  // Gris medio claro
          300: '#cbd5e1',  // Gris medio
          400: '#94a3b8',  // Gris medio oscuro
          500: '#64748b',  // BASE - Gris profesional
          600: '#475569',  // Gris oscuro
          700: '#334155',  // Gris muy oscuro
          800: '#1e293b',  // Gris ultra oscuro
          900: '#0f172a'   // Gris negro
        },
        
        // Acento - VERDE SUAVE
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Verde suave
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        
        // Grises modernos
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
        
        // Colores de estado (suaves)
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
        
        // Colores de la marca - PROFESIONALES
        elite: {
          blue: '#3b82f6',      // Azul principal
          gray: '#64748b',      // Gris secundario
          green: '#22c55e',     // Verde acento
          dark: '#1e293b',      // Gris oscuro
          light: '#f8fafc',     // Blanco suave
        }
      },
      
      // 🎨 GRADIENTES SUAVES
      backgroundImage: {
        'elite-gradient': 'linear-gradient(135deg, #3b82f6 0%, #64748b 100%)',
        'elite-gradient-reverse': 'linear-gradient(135deg, #64748b 0%, #3b82f6 100%)',
        'primary-gradient': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        'hero-pattern': 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(100, 116, 139, 0.05) 100%)',
      },
      
      // 📱 FUENTES MODERNAS
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // 🎯 SOMBRAS SUAVES
      boxShadow: {
        'elite': '0 4px 20px rgba(59, 130, 246, 0.15)',
        'elite-lg': '0 8px 30px rgba(59, 130, 246, 0.2)',
        'soft': '0 4px 20px rgba(100, 116, 139, 0.15)',
        'soft-lg': '0 8px 30px rgba(100, 116, 139, 0.2)',
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
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' 
          },
          '70%': { 
            boxShadow: '0 0 0 8px rgba(59, 130, 246, 0)' 
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