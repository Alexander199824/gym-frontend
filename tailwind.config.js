// tailwind.config.js - COLORES EXACTOS ELITE FITNESS CLUB
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  
  theme: {
    extend: {
      // 🎨 COLORES EXACTOS DE ELITE FITNESS CLUB
      colors: {
        // TURQUESA PRINCIPAL (como en la imagen)
        primary: {
          50: '#f0fdfa',   // Turquesa ultra claro
          100: '#ccfbf1',  // Turquesa muy claro  
          200: '#99f6e4',  // Turquesa claro
          300: '#5eead4',  // Turquesa medio claro
          400: '#2dd4bf',  // Turquesa medio
          500: '#14b8a6',  // 🎯 BASE - Turquesa exacto de la imagen
          600: '#0d9488',  // Turquesa oscuro
          700: '#0f766e',  // Turquesa muy oscuro
          800: '#115e59',  // Turquesa ultra oscuro
          900: '#134e4a'   // Turquesa negro
        },
        
        // ROSA/MAGENTA SECUNDARIO (como en la imagen)
        secondary: {
          50: '#fdf2f8',   // Rosa ultra claro
          100: '#fce7f3',  // Rosa muy claro
          200: '#fbcfe8',  // Rosa claro
          300: '#f9a8d4',  // Rosa medio claro
          400: '#f472b6',  // Rosa medio
          500: '#ec4899',  // 🎯 BASE - Rosa exacto de la imagen
          600: '#db2777',  // Rosa oscuro
          700: '#be185d',  // Rosa muy oscuro
          800: '#9d174d',  // Rosa ultra oscuro
          900: '#831843'   // Rosa negro
        },
        
        // VERDE PARA ÉXITO (checkmarks, etc.)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // 🎯 Verde para checks y success
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        
        // GRISES NEUTROS
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
        
        // COLORES DE ESTADO (sin naranja)
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // Amarillo en lugar de naranja
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12'
        },
        
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        
        // COLORES DE MARCA ELITE FITNESS
        elite: {
          turquoise: '#14b8a6',    // Turquesa principal
          pink: '#ec4899',         // Rosa principal  
          green: '#22c55e',        // Verde éxito
          light: '#f9fafb',        // Blanco suave
          dark: '#134e4a',         // Turquesa muy oscuro
        }
      },
      
      // 🎨 GRADIENTES ELITE FITNESS CLUB
      backgroundImage: {
        // Gradiente principal (turquesa a rosa como en la imagen)
        'elite-gradient': 'linear-gradient(135deg, #14b8a6 0%, #ec4899 100%)',
        'elite-gradient-reverse': 'linear-gradient(135deg, #ec4899 0%, #14b8a6 100%)',
        
        // Gradientes individuales
        'turquoise-gradient': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'pink-gradient': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        
        // Fondos sutiles
        'hero-pattern': 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
        'section-pattern': 'linear-gradient(135deg, rgba(20, 184, 166, 0.02) 0%, rgba(236, 72, 153, 0.02) 100%)',
      },
      
      // 📱 FUENTES (Inter como en la imagen)
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        'display': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      
      // 🎯 SOMBRAS ELITE
      boxShadow: {
        // Sombras turquesa
        'elite': '0 4px 20px rgba(20, 184, 166, 0.15)',
        'elite-lg': '0 8px 30px rgba(20, 184, 166, 0.2)',
        'elite-xl': '0 12px 40px rgba(20, 184, 166, 0.25)',
        
        // Sombras rosa
        'pink': '0 4px 20px rgba(236, 72, 153, 0.15)',
        'pink-lg': '0 8px 30px rgba(236, 72, 153, 0.2)',
        
        // Sombras suaves
        'soft': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 4px 20px rgba(0, 0, 0, 0.1)',
      },
      
      // 📐 ESPACIADO ADICIONAL
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // 🎨 ANIMACIONES ELITE
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-elite': 'pulseElite 2s infinite',
        'bounce-soft': 'bounceSoft 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseElite: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(20, 184, 166, 0.4)' 
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
            transform: 'translateY(-4px)' 
          },
        },
        float: {
          '0%, 100%': { 
            transform: 'translateY(0px)' 
          },
          '50%': { 
            transform: 'translateY(-6px)' 
          },
        },
      },
      
      // 🎯 BORDER RADIUS MODERNOS
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  
  plugins: [],
}