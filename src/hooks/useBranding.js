// src/hooks/useBranding.js
// FUNCIÓN: Hook para branding, colores, logos y diseño
// CONECTA CON: GET /api/gym/branding

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useBranding = () => {
  // 🏗️ Estados
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 🎨 Configuración de branding por defecto mientras carga
  const defaultBranding = {
    colors: {
      primary: '#14b8a6',      // teal-500
      secondary: '#ec4899',    // pink-500
      success: '#22c55e',      // green-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      info: '#3b82f6',         // blue-500
      dark: '#1f2937',         // gray-800
      light: '#f9fafb'         // gray-50
    },
    fonts: {
      primary: 'Inter',
      headings: 'Inter',
      monospace: 'Fira Code'
    },
    logo_variants: {
      main: '/favicon.ico',
      white: '/favicon.ico',
      dark: '/favicon.ico',
      icon: '/favicon.ico'
    },
    favicons: {
      ico: '/favicon.ico',
      png: '/favicon.ico'
    },
    theme: {
      borderRadius: '0.75rem',
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      }
    }
  };

  // 🚀 Función para obtener configuración de branding
  const fetchBranding = async (force = false) => {
    // Cache de 60 minutos (branding no cambia frecuentemente)
    if (branding && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 60 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🎨 Obteniendo configuración de branding desde backend...');
      
      const response = await apiService.getBranding();
      
      if (response.success && response.data) {
        console.log('✅ Branding obtenido:', response.data);
        
        // Fusionar con valores por defecto para asegurar completitud
        const completeBranding = {
          colors: { ...defaultBranding.colors, ...response.data.colors },
          fonts: { ...defaultBranding.fonts, ...response.data.fonts },
          logo_variants: { ...defaultBranding.logo_variants, ...response.data.logo_variants },
          favicons: { ...defaultBranding.favicons, ...response.data.favicons },
          theme: { ...defaultBranding.theme, ...response.data.theme }
        };
        
        setBranding(completeBranding);
        setLastFetch(Date.now());
        
        // Aplicar variables CSS personalizadas
        applyBrandingToCSS(completeBranding);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al obtener branding:', error);
      setError(error.message);
      
      // En caso de error, usar branding por defecto
      if (!branding) {
        setBranding(defaultBranding);
        applyBrandingToCSS(defaultBranding);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Función para aplicar branding al CSS
  const applyBrandingToCSS = (brandingData) => {
    const root = document.documentElement;
    
    // Aplicar colores como variables CSS
    if (brandingData.colors) {
      Object.entries(brandingData.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
        
        // También crear variantes con opacidad
        if (value.startsWith('#')) {
          const rgb = hexToRgb(value);
          if (rgb) {
            root.style.setProperty(`--color-${key}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
          }
        }
      });
    }
    
    // Aplicar fuentes
    if (brandingData.fonts) {
      if (brandingData.fonts.primary) {
        root.style.setProperty('--font-primary', brandingData.fonts.primary);
      }
      if (brandingData.fonts.headings) {
        root.style.setProperty('--font-headings', brandingData.fonts.headings);
      }
    }
    
    // Aplicar tema (border radius, etc.)
    if (brandingData.theme) {
      if (brandingData.theme.borderRadius) {
        root.style.setProperty('--border-radius', brandingData.theme.borderRadius);
      }
    }
    
    console.log('🎨 Variables CSS de branding aplicadas');
  };

  // 🔧 Función auxiliar para convertir hex a RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // 🔄 Efecto para cargar branding al montar
  useEffect(() => {
    fetchBranding();
  }, []);

  // 🎯 Función para refrescar branding
  const refresh = () => {
    fetchBranding(true);
  };

  // 🎨 Función para obtener color específico
  const getColor = (colorName, opacity = 1) => {
    const color = branding?.colors?.[colorName] || defaultBranding.colors[colorName];
    
    if (opacity < 1 && color?.startsWith('#')) {
      const rgb = hexToRgb(color);
      if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      }
    }
    
    return color;
  };

  // 🖼️ Función para obtener logo específico
  const getLogo = (variant = 'main') => {
    return branding?.logo_variants?.[variant] || 
           defaultBranding.logo_variants[variant] || 
           defaultBranding.logo_variants.main;
  };

  // 📱 Función para obtener favicon
  const getFavicon = (type = 'ico') => {
    return branding?.favicons?.[type] || defaultBranding.favicons[type];
  };

  // 🔤 Función para obtener fuente
  const getFont = (type = 'primary') => {
    return branding?.fonts?.[type] || defaultBranding.fonts[type];
  };

  // 🎭 Función para generar gradiente
  const createGradient = (color1, color2, direction = 'to right') => {
    const c1 = getColor(color1);
    const c2 = getColor(color2);
    return `linear-gradient(${direction}, ${c1}, ${c2})`;
  };

  // 🌈 Función para obtener paleta de colores completa
  const getColorPalette = () => {
    return branding?.colors || defaultBranding.colors;
  };

  // 🎨 Función para generar clases CSS dinámicas
  const getButtonClass = (variant = 'primary', size = 'md') => {
    const baseClass = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: `bg-[${getColor('primary')}] text-white hover:opacity-90 focus:ring-[${getColor('primary')}]`,
      secondary: `bg-[${getColor('secondary')}] text-white hover:opacity-90 focus:ring-[${getColor('secondary')}]`,
      outline: `border-2 border-[${getColor('primary')}] text-[${getColor('primary')}] hover:bg-[${getColor('primary')}] hover:text-white`,
      ghost: `text-[${getColor('primary')}] hover:bg-[${getColor('primary')}] hover:bg-opacity-10`
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    return `${baseClass} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md}`;
  };

  // 🎨 Función para verificar si el branding está personalizado
  const hasCustomBranding = () => {
    return branding && branding !== defaultBranding;
  };

  // 🌙 Función para obtener configuración de tema oscuro
  const getDarkModeColors = () => {
    return {
      primary: getColor('primary'),
      background: '#1f2937',
      surface: '#374151',
      text: '#f9fafb',
      textSecondary: '#d1d5db'
    };
  };

  // 🏠 Retornar branding y funciones
  return {
    // Estado
    branding: branding || defaultBranding,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getColor,
    getLogo,
    getFavicon,
    getFont,
    createGradient,
    getColorPalette,
    getButtonClass,
    getDarkModeColors,
    
    // Verificaciones
    hasCustomBranding,
    
    // Acceso directo (para compatibilidad)
    colors: getColorPalette(),
    logos: branding?.logo_variants || defaultBranding.logo_variants,
    fonts: branding?.fonts || defaultBranding.fonts,
    
    // Colores específicos más usados
    primaryColor: getColor('primary'),
    secondaryColor: getColor('secondary'),
    successColor: getColor('success'),
    errorColor: getColor('error'),
    
    // Gradientes predefinidos
    primaryGradient: createGradient('primary', 'secondary'),
    heroGradient: createGradient('primary', 'secondary', 'to bottom right'),
    
    // Estado útil
    isLoaded: !loading && !!branding && !error,
    hasError: !!error,
    isEmpty: !branding || !branding.colors
  };
};

export default useBranding;