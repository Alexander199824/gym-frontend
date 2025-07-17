// tailwind.config.js
// UBICACIÓN: /gym-frontend/tailwind.config.js
// FUNCIÓN: Configuración de Tailwind CSS - Paleta ELITE FITNESS CLUB (Sin dependencias externas)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  
  theme: {
    extend: {
      // 🎨 PALETA ELITE FITNESS CLUB
      colors: {
        // Colores principales basados en el logo
        primary: {
          50: '#f0fdfa',   // Teal muy claro
          100: '#ccfbf1',  // Teal claro
          200: '#99f6e4',  // Teal medio claro
          300: '#5eead4',  // Teal medio
          400: '#2dd4bf',  // Teal medio oscuro
          500: '#14b8a6',  // BASE - Teal principal del logo
          600: '#0d9488',  // Teal oscuro
          700: '#0f766e',  // Teal muy oscuro
          800: '#115e59',  // Teal ultra oscuro
          900: '#134e4a'   // Teal negro
        },
        
        // Color secundario (magenta del logo)
        secondary: {
          50: '#fdf2f8',   // Rosa muy claro
          100: '#fce7f3',  // Rosa claro
          200: '#fbcfe8',  // Rosa medio claro
          300: '#f9a8d4',  // Rosa medio
          400: '#f472b6',  // Rosa medio oscuro
          500: '#ec4899',  // BASE - Magenta principal del logo
          600: '#db2777',  // Magenta oscuro
          700: '#be185d',  // Magenta muy oscuro
          800: '#9d174d',  // Magenta ultra oscuro
          900: '#831843'   // Magenta negro
        },
        
        // Grises elegantes (para textos y fondos)
        gray: {
          50: '#f9fafb',   // Blanco suave
          100: '#f3f4f6',  // Gris muy claro
          200: '#e5e7eb',  // Gris claro
          300: '#d1d5db',  // Gris medio claro
          400: '#9ca3af',  // Gris medio
          500: '#6b7280',  // Gris base
          600: '#4b5563',  // Gris oscuro
          700: '#374151',  // Gris muy oscuro
          800: '#1f2937',  // Gris ultra oscuro (negro del logo)
          900: '#111827'   // Negro profundo
        },
        
        // Colores de estado (manteniendo armonía)
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',  // Verde esmeralda
          600: '#059669',
          700: '#047857',
          900: '#064e3b'
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',  // Ámbar
          600: '#d97706',
          700: '#b45309',
          900: '#78350f'
        },
        
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',  // Rojo coral
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d'
        },
        
        // Colores adicionales para la marca
        elite: {
          teal: '#14b8a6',      // Teal principal
          magenta: '#ec4899',   // Magenta principal  
          dark: '#1f2937',      // Negro elegante
          light: '#f9fafb',     // Blanco suave
          gradient: {
            from: '#14b8a6',    // Degradado teal
            to: '#ec4899'       // Degradado magenta
          }
        }
      },
      
      // 🎨 GRADIENTES PERSONALIZADOS
      backgroundImage: {
        'elite-gradient': 'linear-gradient(135deg, #14b8a6 0%, #ec4899 100%)',
        'elite-gradient-reverse': 'linear-gradient(135deg, #ec4899 0%, #14b8a6 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        'hero-pattern': 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
      },
      
      // 📱 FUENTES PERSONALIZADAS
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      
      // 🎯 SOMBRAS ELEGANTES
      boxShadow: {
        'elite': '0 4px 20px rgba(20, 184, 166, 0.15)',
        'elite-lg': '0 8px 30px rgba(20, 184, 166, 0.2)',
        'magenta': '0 4px 20px rgba(236, 72, 153, 0.15)',
        'magenta-lg': '0 8px 30px rgba(236, 72, 153, 0.2)',
        'dark': '0 4px 20px rgba(31, 41, 55, 0.3)',
      },
      
      // 📐 ESPACIADO ADICIONAL
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // 🎨 ANIMACIONES
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
            boxShadow: '0 0 0 0 rgba(20, 184, 166, 0.7)' 
          },
          '70%': { 
            boxShadow: '0 0 0 10px rgba(20, 184, 166, 0)' 
          },
        },
      }
    },
  },
  
  plugins: [
    // ✅ SIN DEPENDENCIAS EXTERNAS - Todo incluido
  ],
}