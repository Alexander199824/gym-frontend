// tailwind.config.js
// UBICACIÓN: /gym-frontend/tailwind.config.js
// FUNCIÓN: Configuración de Tailwind CSS para estilos del sistema

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Archivos que contienen clases de Tailwind
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Todos los archivos React
    "./public/index.html"         // HTML principal
  ],
  
  theme: {
    extend: {
      // 🎨 COLORES PERSONALIZADOS DEL GIMNASIO
      colors: {
        // Colores principales (basados en fitness/energía)
        primary: {
          50: '#fef2f2',   // Muy claro
          100: '#fee2e2',  // Claro
          200: '#fecaca',  // Medio claro
          300: '#fca5a5',  // Medio
          400: '#f87171',  // Medio oscuro
          500: '#ef4444',  // Base (rojo energético)
          600: '#dc2626',  // Oscuro
          700: '#b91c1c',  // Muy oscuro
          800: '#991b1b',  // Ultra oscuro
          900: '#7f1d1d'   // Negro
        },
        
        // Colores secundarios (basados en confianza/profesionalismo)
        secondary: {
          50: '#f8fafc',   // Muy claro
          100: '#f1f5f9',  // Claro  
          200: '#e2e8f0',  // Medio claro
          300: '#cbd5e1',  // Medio
          400: '#94a3b8',  // Medio oscuro
          500: '#64748b',  // Base (gris azulado)
          600: '#475569',  // Oscuro
          700: '#334155',  // Muy oscuro
          800: '#1e293b',  // Ultra oscuro
          900: '#0f172a'   // Negro
        },
        
        // Colores de estado
        success: {
          50: '#f0fdf4',
          500: '#22c55e',  // Verde éxito
          600: '#16a34a',
          700: '#15803d'
        },
        
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',  // Amarillo advertencia
          600: '#d97706',
          700: '#b45309'
        },
        
        danger: {
          50: '#fef2f2',
          500: '#ef4444',  // Rojo peligro
          600: '#dc2626',
          700: '#b91c1c'
        },
        
        // Colores específicos del gimnasio
        gym: {
          'dark': '#1a1a1a',      // Negro gimnasio
          'metal': '#6b7280',     // Gris metálico (equipos)
          'energy': '#ff6b35',    // Naranja energético
          'focus': '#3b82f6',     // Azul concentración
          'growth': '#10b981'     // Verde crecimiento
        }
      },
      
      // 📏 ESPACIADO PERSONALIZADO
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },
      
      // 🖼️ TAMAÑOS DE CONTENEDOR
      maxWidth: {
        '8xl': '88rem',   // 1408px
        '9xl': '96rem'    // 1536px
      },
      
      // 📱 BREAKPOINTS PERSONALIZADOS
      screens: {
        'xs': '475px',    // Extra small
        'sm': '640px',    // Small (móvil)
        'md': '768px',    // Medium (tablet)
        'lg': '1024px',   // Large (laptop)
        'xl': '1280px',   // Extra large (desktop)
        '2xl': '1536px'   // 2X Extra large (grandes pantallas)
      },
      
      // 🖋️ TIPOGRAFÍA
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'], // Para títulos
        'mono': ['JetBrains Mono', 'monospace']
      },
      
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
        '5xl': '3rem',       // 48px
        'huge': '4rem'       // 64px - Para pantallas de bienvenida
      },
      
      // 🎭 EFECTOS Y ANIMACIONES
      boxShadow: {
        'gym': '0 4px 20px rgba(239, 68, 68, 0.15)',        // Sombra temática
        'card': '0 2px 10px rgba(0, 0, 0, 0.1)',            // Tarjetas
        'modal': '0 20px 50px rgba(0, 0, 0, 0.3)',          // Modales
        'button': '0 2px 8px rgba(239, 68, 68, 0.2)'        // Botones
      },
      
      borderRadius: {
        'gym': '0.75rem',    // 12px - Bordes temáticos
        'card': '1rem',      // 16px - Tarjetas
        'button': '0.5rem'   // 8px - Botones
      },
      
      // ⏱️ ANIMACIONES PERSONALIZADAS
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pulse-slow': 'pulse 3s infinite'
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      }
    }
  },
  
  // 🔌 PLUGINS DE TAILWIND
  plugins: [
    // Plugin para formularios (opcional)
    // require('@tailwindcss/forms'),
    
    // Plugin para tipografía (opcional)
    // require('@tailwindcss/typography'),
  ],
  
  // 🌙 CONFIGURACIÓN DE MODO OSCURO (futuro)
  darkMode: 'class', // Activar con clase 'dark'
  
  // ⚡ OPTIMIZACIONES
  corePlugins: {
    // Deshabilitar características no usadas para reducir tamaño
    // backdropOpacity: false,
    // backdropSaturate: false,
  }
}