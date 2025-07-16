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
        }
      }
    }
  },
  
  plugins: []
}