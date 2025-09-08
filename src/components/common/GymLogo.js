// Autor: Alexander Echeverria
// src/components/common/GymLogo.js
// CONECTA CON: useGymConfig hook


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dumbbell } from 'lucide-react';
import useGymConfig from '../../hooks/useGymConfig';

const GymLogo = ({ 
  size = 'md',
  variant = 'professional',
  showText = true,
  textSize = 'auto',
  className = '',
  onClick = null,
  priority = 'normal',
  breakpoint = 'md'
}) => {
  const { config, isLoaded } = useGymConfig();
  const [imageState, setImageState] = useState({
    error: false,
    loaded: false,
    loading: false
  });
  
  // Memoizar URL de imagen para evitar recálculos
  const imageUrl = useMemo(() => {
    if (!config?.logo?.url) {
      return null;
    }
    
    const logoUrl = config.logo.url;
    
    // Si es una URL completa, usarla directamente
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // Si es una ruta relativa, construir URL completa
    const baseUrl = window.location.origin;
    const cleanPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    return `${baseUrl}${cleanPath}`;
  }, [config?.logo?.url]);
  
  // Cache de imágenes en sessionStorage para persistir entre navegaciones
  const getCachedImageStatus = useCallback((url) => {
    if (!url) return null;
    try {
      const cached = sessionStorage.getItem(`gym_logo_${url}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }, []);
  
  const setCachedImageStatus = useCallback((url, status) => {
    if (!url) return;
    try {
      sessionStorage.setItem(`gym_logo_${url}`, JSON.stringify({
        status,
        timestamp: Date.now()
      }));
    } catch {
      // Ignorar errores de storage
    }
  }, []);
  
  // Verificar imagen con cache y re-intentos
  const verifyImage = useCallback((url) => {
    if (!url || imageState.loading) return;
    
    // Verificar cache primero
    const cached = getCachedImageStatus(url);
    if (cached && cached.status === 'loaded') {
      // Cache hit - imagen ya verificada
      console.log('GymLogo: Using cached image status');
      setImageState({ loaded: true, error: false, loading: false });
      return;
    }
    
    console.group('GymLogo Image Verification');
    console.log('Image URL:', url);
    console.log('Cache status:', cached ? 'miss' : 'empty');
    
    setImageState(prev => ({ ...prev, loading: true, error: false }));
    
    const img = new Image();
    
    img.onload = () => {
      console.log('Logo loaded successfully');
      console.groupEnd();
      
      const newState = { loaded: true, error: false, loading: false };
      setImageState(newState);
      setCachedImageStatus(url, 'loaded');
    };
    
    img.onerror = () => {
      console.warn('Failed to load logo');
      console.log('Solution: Check if the image exists at:', url);
      console.log('Fallback: Using dumbbell icon instead');
      console.groupEnd();
      
      const newState = { loaded: false, error: true, loading: false };
      setImageState(newState);
      setCachedImageStatus(url, 'error');
      
      // Re-intentar después de 5 segundos si es alta prioridad
      if (priority === 'high') {
        setTimeout(() => {
          console.log('Retrying logo load...');
          setImageState(prev => ({ ...prev, error: false }));
          verifyImage(url);
        }, 5000);
      }
    };
    
    // Cargar basado en prioridad
    if (priority === 'high') {
      img.src = url; // Cargar inmediatamente
    } else if (priority === 'normal') {
      setTimeout(() => {
        img.src = url;
      }, 100);
    } else {
      setTimeout(() => {
        img.src = url;
      }, 500);
    }
  }, [imageState.loading, priority, getCachedImageStatus, setCachedImageStatus]);
  
  // Efecto para verificar imagen cuando sea necesario
  useEffect(() => {
    if (isLoaded && imageUrl && !imageState.loading) {
      verifyImage(imageUrl);
    }
  }, [isLoaded, imageUrl, imageState.loading, verifyImage]);
  
  // Re-verificar imagen cuando se regresa a la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && imageUrl && imageState.error) {
        console.log('Page became visible, retrying logo load...');
        setTimeout(() => {
          verifyImage(imageUrl);
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [imageUrl, imageState.error, verifyImage]);
  
  // CONFIGURACIÓN DE TAMAÑOS RESPONSIVA
  const sizeConfig = useMemo(() => ({
    xs: { 
      container: 'w-6 h-6', 
      icon: 'w-3 h-3', 
      text: 'text-xs', 
      spacing: 'space-x-1',
      mobile: 'w-5 h-5'
    },
    sm: { 
      container: 'w-8 h-8', 
      icon: 'w-4 h-4', 
      text: 'text-sm', 
      spacing: 'space-x-2',
      mobile: 'w-7 h-7'
    },
    md: { 
      container: 'w-10 h-10', 
      icon: 'w-5 h-5', 
      text: 'text-base', 
      spacing: 'space-x-2',
      mobile: 'w-8 h-8'
    },
    lg: { 
      container: 'w-12 h-12', 
      icon: 'w-6 h-6', 
      text: 'text-lg', 
      spacing: 'space-x-3',
      mobile: 'w-10 h-10'
    },
    xl: { 
      container: 'w-16 h-16', 
      icon: 'w-8 h-8', 
      text: 'text-xl', 
      spacing: 'space-x-3',
      mobile: 'w-12 h-12'
    },
    '2xl': { 
      container: 'w-20 h-20', 
      icon: 'w-10 h-10', 
      text: 'text-2xl', 
      spacing: 'space-x-4',
      mobile: 'w-16 h-16'
    }
  }), []);
  
  // CONFIGURACIÓN DE VARIANTES
  const variantConfig = useMemo(() => ({
    professional: { 
      container: 'bg-primary-600', 
      icon: 'text-white', 
      text: 'text-primary-600',
      shadow: 'shadow-lg'
    },
    dark: { 
      container: 'bg-slate-800', 
      icon: 'text-slate-100', 
      text: 'text-slate-800',
      shadow: 'shadow-lg'
    },
    light: { 
      container: 'bg-slate-100 border-2 border-slate-200', 
      icon: 'text-slate-600', 
      text: 'text-slate-700',
      shadow: 'shadow-sm'
    },
    white: { 
      container: 'bg-white border-2 border-slate-200', 
      icon: 'text-primary-600', 
      text: 'text-slate-800',
      shadow: 'shadow-lg'
    },
    gradient: { 
      container: 'bg-gradient-to-br from-primary-600 to-secondary-600', 
      icon: 'text-white', 
      text: 'text-primary-600',
      shadow: 'shadow-xl'
    },
    minimal: {
      container: 'bg-transparent',
      icon: 'text-primary-600',
      text: 'text-primary-600',
      shadow: ''
    },
    compact: {
      container: 'bg-primary-50',
      icon: 'text-primary-700',
      text: 'text-primary-700',
      shadow: 'shadow-sm'
    }
  }), []);
  
  // Detectar si estamos en móvil
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);
  
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentVariant = variantConfig[variant] || variantConfig.professional;
  
  // Función para obtener el tamaño correcto según el dispositivo
  const getResponsiveSize = useCallback((property) => {
    if (isMobile && currentSize.mobile && property === 'container') {
      return currentSize.mobile;
    }
    return currentSize[property];
  }, [isMobile, currentSize]);
  
  const getTextSize = () => textSize !== 'auto' ? textSize : currentSize.text;
  
  // RENDERIZAR LOGO - Optimizado para persistencia
  const logoContent = useMemo(() => {
    const containerClasses = `
      ${getResponsiveSize('container')} 
      rounded-xl overflow-hidden 
      ${currentVariant.shadow}
      transition-all duration-300 ease-in-out
      ${onClick ? 'hover:scale-105 cursor-pointer' : ''}
    `;
    
    // Si tenemos imagen cargada exitosamente, mostrarla
    if (imageUrl && imageState.loaded && !imageState.error && isLoaded) {
      return (
        <div className={containerClasses}>
          <img 
            src={imageUrl}
            alt={config?.logo?.alt || config?.name || 'Logo'}
            className={`${getResponsiveSize('container')} object-contain`}
            onError={() => {
              console.log('Image error during render, retrying...');
              setImageState(prev => ({ ...prev, error: true, loaded: false }));
              // Re-intentar inmediatamente
              setTimeout(() => verifyImage(imageUrl), 100);
            }}
            onLoad={() => {
              // Confirmar carga exitosa
              if (!imageState.loaded) {
                setImageState(prev => ({ ...prev, loaded: true, error: false }));
                setCachedImageStatus(imageUrl, 'loaded');
              }
            }}
            loading={priority === 'high' ? 'eager' : 'lazy'}
            decoding="async"
            style={{
              imageRendering: 'crisp-edges',
              WebkitOptimizedLegibility: 'optimizeSpeed'
            }}
          />
        </div>
      );
    }
    
    // Fallback: Icono de mancuernas
    return (
      <div className={`
        ${containerClasses}
        ${currentVariant.container} 
        flex items-center justify-center
      `}>
        <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
      </div>
    );
  }, [
    imageUrl, 
    imageState, 
    isLoaded, 
    config, 
    getResponsiveSize, 
    currentVariant, 
    currentSize, 
    onClick,
    priority,
    verifyImage,
    setCachedImageStatus
  ]);

  // Texto del logo con persistencia
  const logoText = useMemo(() => {
    if (!showText) return null;
    
    const text = config?.name || 'Elite Fitness Club';
    
    // Texto compacto en móvil si es necesario
    const displayText = isMobile && text.length > 15 
      ? text.substring(0, 12) + '...' 
      : text;
    
    return (
      <span className={`
        font-semibold ${getTextSize()} ${currentVariant.text}
        whitespace-nowrap transition-all duration-300
        ${isMobile ? 'tracking-tight' : ''}
      `}>
        {displayText}
      </span>
    );
  }, [showText, config?.name, currentVariant.text, getTextSize, isMobile]);

  // Skeleton mejorado con retry
  if (!isLoaded || imageState.loading) {
    const skeletonClasses = `
      ${getResponsiveSize('container')} 
      ${currentVariant.container} 
      rounded-xl flex items-center justify-center 
      animate-pulse opacity-70
      transition-all duration-300
    `;
    
    return (
      <div className={`flex items-center ${showText ? currentSize.spacing : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <div className={skeletonClasses}>
          <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
        </div>
        
        {showText && (
          <div className="animate-pulse">
            <div 
              className={`h-4 bg-gray-300 rounded ${getTextSize()}`} 
              style={{ 
                width: isMobile ? '80px' : '120px',
                height: isMobile ? '12px' : '16px'
              }}
            ></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`
        flex items-center 
        ${showText ? currentSize.spacing : ''} 
        ${onClick ? 'cursor-pointer group' : ''} 
        ${className}
        transition-all duration-300 ease-in-out
      `}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={config?.name || 'Logo del gimnasio'}
    >
      {logoContent}
      {logoText}
    </div>
  );
};

// VARIANTES ESPECÍFICAS MEJORADAS
export const NavbarLogo = React.memo(() => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <GymLogo 
      size={isMobile ? "sm" : "md"} 
      variant="professional" 
      showText={!isMobile} 
      priority="high"
    />
  );
});

export const FooterLogo = React.memo(() => (
  <GymLogo 
    size="lg" 
    variant="white" 
    showText={true} 
    priority="low"
  />
));

export const AuthLogo = React.memo(() => (
  <GymLogo 
    size="xl" 
    variant="gradient" 
    showText={false} 
    priority="high"
  />
));

export const MobileLogo = React.memo(() => (
  <GymLogo 
    size="sm" 
    variant="minimal" 
    showText={false} 
    priority="high"
  />
));

export const DashboardLogo = React.memo(() => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <GymLogo 
      size={isMobile ? "sm" : "md"} 
      variant="professional" 
      showText={true} 
      priority="high"
    />
  );
});

export const HeroLogo = React.memo(() => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <GymLogo 
      size={isMobile ? "xl" : "2xl"} 
      variant="gradient" 
      showText={false} 
      priority="high"
    />
  );
});

export const CompactLogo = React.memo(() => (
  <GymLogo 
    size="xs" 
    variant="compact" 
    showText={false} 
    priority="normal"
  />
));

export const MinimalLogo = React.memo(() => (
  <GymLogo 
    size="sm" 
    variant="minimal" 
    showText={true} 
    priority="normal"
  />
));

export default React.memo(GymLogo);

/*
DOCUMENTACIÓN DEL COMPONENTE GymLogo

PROPÓSITO:
Este componente proporciona un logo flexible y optimizado del gimnasio que puede mostrar
tanto una imagen personalizada como un icono de respaldo. Incluye sistema de cache,
reintentos automáticos, múltiples variantes y optimizaciones para móvil.

FUNCIONALIDADES PRINCIPALES:
- Carga dinámica de logo desde configuración del gimnasio
- Sistema de cache en sessionStorage para persistencia
- Reintentos automáticos en caso de fallo de carga
- Múltiples tamaños y variantes visuales
- Diseño responsivo optimizado para móvil
- Fallback automático a icono de mancuernas
- Lazy loading con prioridades configurables
- Texto truncado automático en pantallas pequeñas

CONEXIONES CON OTROS ARCHIVOS:

HOOKS REQUERIDOS:
- useGymConfig (../../hooks/useGymConfig): Obtiene configuración del gimnasio

COMPONENTES IMPORTADOS:
- Dumbbell (lucide-react): Icono de respaldo

CONFIGURACIÓN UTILIZADA:
- config.logo.url: URL de la imagen del logo
- config.logo.alt: Texto alternativo de la imagen
- config.name: Nombre del gimnasio

ARCHIVOS QUE USAN ESTE COMPONENTE:
- Layout principal: Navbar y footer
- Páginas de autenticación: Login, registro
- Dashboards: Administración, personal, clientes
- Páginas públicas: Homepage, servicios
- Componentes de navegación móvil

VARIANTES ESPECIALIZADAS EXPORTADAS:
- NavbarLogo: Para barra de navegación (responsive)
- FooterLogo: Para pie de página
- AuthLogo: Para páginas de autenticación
- MobileLogo: Específico para móvil
- DashboardLogo: Para paneles de administración
- HeroLogo: Para secciones hero principales
- CompactLogo: Versión muy pequeña
- MinimalLogo: Versión minimalista

PROPS DEL COMPONENTE BASE:
- size: Tamaño ('xs', 'sm', 'md', 'lg', 'xl', '2xl')
- variant: Estilo visual ('professional', 'dark', 'light', 'white', 'gradient', 'minimal', 'compact')
- showText: Mostrar nombre del gimnasio
- textSize: Tamaño personalizado del texto
- className: Clases CSS adicionales
- onClick: Función de click
- priority: Prioridad de carga ('high', 'normal', 'low')
- breakpoint: Punto de quiebre responsivo

CONFIGURACIÓN DE TAMAÑOS:
Cada tamaño incluye configuración para:
- Contenedor principal
- Icono de respaldo
- Texto
- Espaciado
- Versión móvil específica

CONFIGURACIÓN DE VARIANTES:
- professional: Colores primarios, formal
- dark: Fondo oscuro para headers oscuros
- light: Fondo claro con bordes
- white: Fondo blanco para contraste
- gradient: Degradado atractivo
- minimal: Transparente, minimalista
- compact: Compacto con fondo sutil

SISTEMA DE CACHE:
- Utiliza sessionStorage para persistir estado de imágenes
- Evita recargas innecesarias entre navegaciones
- Incluye timestamp para invalidación

OPTIMIZACIONES DE RENDIMIENTO:
- Lazy loading con prioridades
- Memoización de contenido pesado
- Cache de verificación de imágenes
- Detección de cambios de visibilidad
- Reintentos inteligentes

CARACTERÍSTICAS RESPONSIVAS:
- Tamaños específicos para móvil
- Texto truncado automático
- Detección de resize de ventana
- Adaptación de espaciado
- Optimización de carga de imágenes

ACCESIBILIDAD:
- ARIA labels apropiados
- Navegación por teclado
- Roles semánticos
- Texto alternativo
- Estados de focus visibles

ESTADOS MANEJADOS:
- Carga inicial con skeleton
- Error con fallback a icono
- Carga exitosa con imagen
- Reintentos automáticos
- Cache hit/miss

INTEGRACIÓN CON EL SISTEMA:
Este componente es fundamental para la identidad visual del gimnasio en toda la aplicación,
proporcionando consistencia de marca y experiencia de usuario optimizada tanto en desktop
como en dispositivos móviles.
*/