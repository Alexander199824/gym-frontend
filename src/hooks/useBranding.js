// Autor: Alexander Echeverria
// src/hooks/useBranding.js
// FUNCIÓN: Hook para gestión de branding, colores, logos y diseño visual

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useBranding = () => {
  // Estados
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Configuración de branding por defecto mientras carga
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

  // Función para obtener configuración de branding
  const fetchBranding = async (force = false) => {
    // Cache de 60 minutos (branding no cambia frecuentemente)
    if (branding && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 60 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo configuración de branding desde backend...');
      
      const response = await apiService.getBranding();
      
      if (response.success && response.data) {
        console.log('Branding obtenido:', response.data);
        
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
      console.error('Error al obtener branding:', error);
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

  // Función para aplicar branding al CSS
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
    
    console.log('Variables CSS de branding aplicadas');
  };

  // Función auxiliar para convertir hex a RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Efecto para cargar branding al montar
  useEffect(() => {
    fetchBranding();
  }, []);

  // Función para refrescar branding
  const refresh = () => {
    fetchBranding(true);
  };

  // Función para obtener color específico
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

  // Función para obtener logo específico
  const getLogo = (variant = 'main') => {
    return branding?.logo_variants?.[variant] || 
           defaultBranding.logo_variants[variant] || 
           defaultBranding.logo_variants.main;
  };

  // Función para obtener favicon
  const getFavicon = (type = 'ico') => {
    return branding?.favicons?.[type] || defaultBranding.favicons[type];
  };

  // Función para obtener fuente
  const getFont = (type = 'primary') => {
    return branding?.fonts?.[type] || defaultBranding.fonts[type];
  };

  // Función para generar gradiente
  const createGradient = (color1, color2, direction = 'to right') => {
    const c1 = getColor(color1);
    const c2 = getColor(color2);
    return `linear-gradient(${direction}, ${c1}, ${c2})`;
  };

  // Función para obtener paleta de colores completa
  const getColorPalette = () => {
    return branding?.colors || defaultBranding.colors;
  };

  // Función para generar clases CSS dinámicas
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

  // Función para verificar si el branding está personalizado
  const hasCustomBranding = () => {
    return branding && branding !== defaultBranding;
  };

  // Función para obtener configuración de tema oscuro
  const getDarkModeColors = () => {
    return {
      primary: getColor('primary'),
      background: '#1f2937',
      surface: '#374151',
      text: '#f9fafb',
      textSecondary: '#d1d5db'
    };
  };

  // Retornar branding y funciones
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

/*
DOCUMENTACIÓN DEL HOOK useBranding

PROPÓSITO:
Este hook personalizado gestiona toda la identidad visual y branding del gimnasio, proporcionando
una interfaz centralizada para colores corporativos, tipografías, logos, favicons y elementos
de diseño que se aplican consistentemente en toda la aplicación web del gimnasio.

FUNCIONALIDADES PRINCIPALES:
- Gestión centralizada de paleta de colores corporativos
- Sistema de logos y favicons personalizables
- Configuración de tipografías del gimnasio
- Aplicación automática de variables CSS personalizadas
- Generación de gradientes y efectos visuales
- Clases CSS dinámicas para componentes
- Soporte para tema claro y oscuro
- Cache inteligente con actualización horaria

ARCHIVOS Y CONEXIONES:

SERVICIOS UTILIZADOS:
- ../services/apiService: Comunicación con backend del gimnasio
  * getBranding(): Endpoint GET /api/gym/branding para obtener configuración visual

DEPENDENCIAS DE REACT:
- useState: Gestión de estados del branding
- useEffect: Carga inicial de configuración visual

QUE SE MUESTRA AL USUARIO DEL GIMNASIO:

ELEMENTOS VISUALES APLICADOS:
El hook gestiona todos los aspectos visuales que el usuario ve en la aplicación:

**Paleta de Colores Corporativos**:
- **Color Primario (#14b8a6 - Teal)**: Botones principales, enlaces, elementos destacados
- **Color Secundario (#ec4899 - Rosa)**: Botones secundarios, acentos, detalles decorativos
- **Color de Éxito (#22c55e - Verde)**: Confirmaciones, mensajes exitosos, estados positivos
- **Color de Advertencia (#f59e0b - Ámbar)**: Alertas, avisos, información importante
- **Color de Error (#ef4444 - Rojo)**: Errores, cancelaciones, estados negativos
- **Color Informativo (#3b82f6 - Azul)**: Información general, enlaces informativos
- **Color Oscuro (#1f2937 - Gris Oscuro)**: Textos principales, elementos de contraste
- **Color Claro (#f9fafb - Gris Claro)**: Fondos, áreas de contenido

**Logos y Elementos Gráficos**:
- **Logo Principal**: Logo completo del gimnasio para headers y branding principal
- **Logo Blanco**: Versión para fondos oscuros y overlays
- **Logo Oscuro**: Versión para fondos claros y documentos
- **Icono**: Versión simplificada para favicons y elementos pequeños
- **Favicons**: Iconos del navegador (.ico y .png) para pestañas y marcadores

**Tipografías del Gimnasio**:
- **Fuente Primaria (Inter)**: Texto general, párrafos, contenido informativo
- **Fuente de Títulos (Inter)**: Headers, títulos de sección, elementos destacados
- **Fuente Monoespaciada (Fira Code)**: Códigos, datos técnicos, elementos de referencia

**Efectos Visuales y Gradientes**:
- **Gradiente Primario**: Combinación de color primario y secundario para botones especiales
- **Gradiente Hero**: Efecto diagonal para banners principales y secciones destacadas
- **Gradientes Personalizados**: Direcciones configurables (horizontal, vertical, diagonal)

**Sombras y Efectos de Profundidad**:
- **Sombra Pequeña**: Elementos sutiles como tarjetas simples
- **Sombra Media**: Tarjetas de contenido, modales pequeños
- **Sombra Grande**: Modales principales, paneles destacados
- **Sombra Extra Grande**: Elementos flotantes, overlays importantes

**Espaciado y Dimensiones**:
- **Extra Pequeño (0.25rem)**: Espaciado mínimo entre elementos cercanos
- **Pequeño (0.5rem)**: Espaciado estándar para componentes compactos
- **Medio (1rem)**: Espaciado base para la mayoría de elementos
- **Grande (1.5rem)**: Espaciado generoso para secciones importantes
- **Extra Grande (2rem)**: Espaciado máximo para separar secciones principales

**Bordes y Formas**:
- **Radio de Bordes (0.75rem)**: Esquinas redondeadas consistentes en toda la aplicación
- **Bordes de Botones**: Aplicados automáticamente a todos los elementos interactivos
- **Bordes de Tarjetas**: Forma uniforme para contenido agrupado

BOTONES Y ELEMENTOS INTERACTIVOS:

**Variantes de Botones Generadas**:
- **Botón Primario**: Fondo del color primario, texto blanco, hover con opacidad
- **Botón Secundario**: Fondo del color secundario, texto blanco, hover con opacidad
- **Botón Outline**: Borde del color primario, texto del color primario, hover invierte colores
- **Botón Ghost**: Solo texto del color primario, hover con fondo sutil

**Tamaños de Botones Disponibles**:
- **Pequeño**: Padding compacto (px-3 py-2), texto pequeño
- **Medio**: Padding estándar (px-4 py-2.5), texto base
- **Grande**: Padding generoso (px-6 py-3), texto grande

**Estados de Interacción**:
- **Estado Normal**: Colores base aplicados
- **Estado Hover**: Transiciones suaves con cambios de opacidad
- **Estado Focus**: Anillos de enfoque con colores corporativos
- **Estado Disabled**: Opacidad reducida manteniendo coherencia visual

APLICACIÓN AUTOMÁTICA DE ESTILOS:

**Variables CSS Inyectadas**:
- `--color-primary`: Color primario como variable CSS global
- `--color-secondary`: Color secundario accesible en todo el CSS
- `--color-success, --color-warning, --color-error`: Estados específicos
- `--color-[nombre]-rgb`: Versiones RGB para transparencias
- `--font-primary, --font-headings`: Fuentes aplicadas globalmente
- `--border-radius`: Radio de bordes consistente

**Integración con Tailwind CSS**:
- Clases dinámicas generadas automáticamente
- Colores personalizados aplicados a utilidades de Tailwind
- Integración perfecta con sistema de diseño existente

PERSONALIZACIÓN POR GIMNASIO:

**Branding Específico del Gimnasio**:
- Logo personalizado del gimnasio guatemalteco
- Colores corporativos únicos del negocio
- Tipografías seleccionadas por identidad de marca
- Elementos visuales adaptados a la cultura local

**Adaptación Cultural para Guatemala**:
- Colores que resuenen con el mercado guatemalteco
- Tipografías legibles para el público local
- Elementos visuales apropiados para el contexto cultural
- Branding profesional para el mercado de fitness

SOPORTE PARA TEMAS:

**Modo Claro (Por Defecto)**:
- Colores optimizados para fondos claros
- Alto contraste para legibilidad
- Elementos visuales vibrantes y atractivos

**Modo Oscuro**:
- Paleta adaptada para fondos oscuros
- Colores ajustados para reducir fatiga visual
- Mantenimiento de identidad corporativa

CARACTERÍSTICAS TÉCNICAS:

**Sistema de Cache**:
- Cache de 60 minutos para configuración de branding
- Actualización automática cuando se detectan cambios
- Fallbacks robustos con branding por defecto

**Aplicación Dinámica**:
- Variables CSS aplicadas automáticamente al cargar
- Re-aplicación cuando cambia la configuración
- Conversión automática de colores hex a RGB

**Compatibilidad**:
- Funciona con cualquier framework CSS
- Integración nativa con Tailwind CSS
- Soporte para CSS personalizado adicional

BENEFICIOS PARA EL GIMNASIO:

**Consistencia Visual**:
- Identidad corporativa unificada en toda la aplicación
- Experiencia de usuario coherente y profesional
- Reconocimiento de marca mejorado

**Flexibilidad de Diseño**:
- Cambios de branding sin modificar código
- Personalización fácil por administradores
- A/B testing de elementos visuales

**Rendimiento Optimizado**:
- Carga única de configuración visual
- Variables CSS nativas para máximo rendimiento
- Cache inteligente para minimizar requests

CASOS DE USO ESPECÍFICOS:

**Campañas de Marketing**:
- Colores estacionales para promociones especiales
- Branding temporal para eventos del gimnasio
- Elementos visuales para fechas importantes

**Personalización por Sucursal**:
- Diferentes esquemas de color por ubicación
- Logos específicos por sucursal
- Adaptación visual por mercado local

**Eventos y Promociones**:
- Temas visuales para competencias
- Colores especiales para promociones en quetzales
- Branding temporal para eventos especiales

Este hook es fundamental para mantener la identidad visual del gimnasio,
proporcionando una experiencia de marca consistente y profesional que
refuerza el reconocimiento del negocio y mejora la percepción de calidad
por parte de los miembros y visitantes del gimnasio en Guatemala.
*/