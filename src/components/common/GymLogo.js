// Autor: Alexander Echeverria
// src/components/common/GymLogo.js

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
      // Ignorar errores de almacenamiento
    }
  }, []);
  
  // Verificar imagen con cache y re-intentos
  const verifyImage = useCallback((url) => {
    if (!url || imageState.loading) return;
    
    // Verificar cache primero
    const cached = getCachedImageStatus(url);
    if (cached && cached.status === 'loaded') {
      // Cache encontrado - imagen ya verificada
      console.log('GymLogo: Usando estado de imagen desde cache');
      setImageState({ loaded: true, error: false, loading: false });
      return;
    }
    
    console.group('Verificación de Imagen del Logo');
    console.log('URL de imagen:', url);
    console.log('Estado del cache:', cached ? 'no encontrado' : 'vacío');
    
    setImageState(prev => ({ ...prev, loading: true, error: false }));
    
    const img = new Image();
    
    img.onload = () => {
      console.log('Logo cargado exitosamente');
      console.groupEnd();
      
      const newState = { loaded: true, error: false, loading: false };
      setImageState(newState);
      setCachedImageStatus(url, 'loaded');
    };
    
    img.onerror = () => {
      console.warn('Error al cargar el logo');
      console.log('Solución: Verificar si la imagen existe en:', url);
      console.log('Respaldo: Usando icono de mancuernas en su lugar');
      console.groupEnd();
      
      const newState = { loaded: false, error: true, loading: false };
      setImageState(newState);
      setCachedImageStatus(url, 'error');
      
      // Re-intentar después de 5 segundos si es alta prioridad
      if (priority === 'high') {
        setTimeout(() => {
          console.log('Reintentando cargar logo...');
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
        console.log('Página visible nuevamente, reintentando cargar logo...');
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
  
  // CONFIGURACIÓN DE VARIANTES VISUALES
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
            alt={config?.logo?.alt || config?.name || 'Logo del gimnasio'}
            className={`${getResponsiveSize('container')} object-contain`}
            onError={() => {
              console.log('Error de imagen durante renderizado, reintentando...');
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
    
    // Respaldo: Icono de mancuernas
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
    
    const text = config?.name || 'Gimnasio Elite Fitness';
    
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

// VARIANTES ESPECÍFICAS MEJORADAS PARA DIFERENTES SECCIONES
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
==========================================
DOCUMENTACIÓN DEL COMPONENTE GymLogo
==========================================

PROPÓSITO GENERAL:
Este componente proporciona el logo oficial del gimnasio de forma flexible y optimizada,
con capacidad de mostrar tanto una imagen personalizada como un icono de respaldo (mancuernas).
Incluye sistema de cache inteligente, reintentos automáticos, múltiples variantes visuales
y optimizaciones específicas para dispositivos móviles.

QUÉ MUESTRA AL USUARIO:
El componente presenta el logo del gimnasio de diferentes maneras según el contexto:
- Logo personalizado del gimnasio (imagen) cuando está disponible y carga correctamente
- Icono de mancuernas como respaldo elegante cuando la imagen no está disponible
- Nombre del gimnasio junto al logo (configurable)
- Diferentes tamaños según la sección: navbar, footer, autenticación, dashboard
- Animaciones suaves durante la carga y al hacer hover
- Versión responsive que se adapta automáticamente a móvil y escritorio
- Estado de carga con skeleton animado mientras se verifica la imagen

VARIANTES DISPONIBLES PARA EL USUARIO:
1. NavbarLogo: Para la barra de navegación superior (responsive)
2. FooterLogo: Para el pie de página (tamaño grande, fondo blanco)
3. AuthLogo: Para páginas de login/registro (tamaño extra grande, degradado)
4. MobileLogo: Específico para navegación móvil (pequeño, minimalista)
5. DashboardLogo: Para paneles de administración (profesional, con texto)
6. HeroLogo: Para secciones principales (muy grande, impactante)
7. CompactLogo: Para espacios muy reducidos (extra pequeño)
8. MinimalLogo: Versión simple y limpia

ARCHIVOS A LOS QUE SE CONECTA:

HOOKS REQUERIDOS:
- ../../hooks/useGymConfig: Hook personalizado para obtener configuración del gimnasio
  * Proporciona config.logo.url (URL de la imagen del logo)
  * Proporciona config.logo.alt (texto alternativo)
  * Proporciona config.name (nombre del gimnasio)
  * Proporciona isLoaded (estado de carga de la configuración)

COMPONENTES IMPORTADOS:
- 'lucide-react': Biblioteca de iconos
  * Dumbbell: Icono de mancuernas usado como respaldo visual

SERVICIOS Y CONTEXTOS RELACIONADOS:
- src/contexts/GymContext.js: Contexto que maneja la configuración del gimnasio
- src/services/configService.js: Servicio que obtiene configuración desde el backend
- src/hooks/useGymConfig.js: Hook que centraliza el acceso a la configuración

ARCHIVOS QUE UTILIZAN ESTE COMPONENTE:
- src/components/layout/Navbar.js: Navegación principal
- src/components/layout/Footer.js: Pie de página
- src/components/layout/MobileNav.js: Navegación móvil
- src/pages/auth/Login.js: Página de inicio de sesión
- src/pages/auth/Register.js: Página de registro
- src/pages/admin/AdminDashboard.js: Panel de administración
- src/pages/client/ClientDashboard.js: Panel del cliente
- src/pages/staff/StaffDashboard.js: Panel del personal
- src/pages/public/HomePage.js: Página principal pública
- src/components/common/LoadingPage.js: Páginas de carga

CONFIGURACIÓN DE TAMAÑOS DISPONIBLES:
- xs: 24x24px (6x6) - Para elementos muy pequeños
- sm: 32x32px (8x8) - Para elementos compactos
- md: 40x40px (10x10) - Tamaño estándar
- lg: 48x48px (12x12) - Para destacar
- xl: 64x64px (16x16) - Para páginas importantes
- 2xl: 80x80px (20x20) - Para secciones hero

CONFIGURACIÓN DE VARIANTES VISUALES:
- professional: Fondo azul primario, formal y elegante
- dark: Fondo oscuro para headers con tema oscuro
- light: Fondo claro con bordes suaves
- white: Fondo blanco para máximo contraste
- gradient: Degradado atractivo para páginas especiales
- minimal: Transparente y minimalista
- compact: Fondo sutil para espacios reducidos

FUNCIONALIDADES TÉCNICAS AVANZADAS:
- Sistema de cache en sessionStorage para evitar recargas innecesarias
- Reintentos automáticos en caso de fallo de carga de imagen
- Detección de cambios de visibilidad para recargar automáticamente
- Lazy loading con diferentes prioridades (high, normal, low)
- Memoización React para optimizar renderizado
- Responsive design con detección automática de móvil
- Texto truncado automático en pantallas pequeñas

SISTEMA DE PRIORIDADES DE CARGA:
- high: Carga inmediata, ideal para navbar y elementos críticos
- normal: Carga con 100ms de delay, para elementos importantes
- low: Carga con 500ms de delay, para elementos no críticos

CARACTERÍSTICAS DE ACCESIBILIDAD:
- ARIA labels descriptivos para lectores de pantalla
- Navegación por teclado (Enter y Space) cuando es clickeable
- Roles semánticos apropiados (button o img)
- Texto alternativo configurable para la imagen
- Estados de focus visuales

OPTIMIZACIONES DE RENDIMIENTO:
- Cache inteligente que persiste entre navegaciones
- Verificación previa de imágenes antes de mostrarlas
- Memoización de contenido pesado para evitar re-renderizados
- Lazy loading configurable según importancia
- Cleanup automático de event listeners
- Detección eficiente de cambios de tamaño de ventana

MANEJO DE ERRORES Y RESPALDOS:
- Fallback automático a icono de mancuernas si la imagen falla
- Reintentos automáticos con diferentes estrategias según prioridad
- Logging detallado para debugging en desarrollo
- Estado de carga visible mientras se verifica la imagen
- Cache de errores para evitar reintentos innecesarios

INTEGRACIÓN CON LA IDENTIDAD DEL GIMNASIO:
Este componente es fundamental para mantener la coherencia visual del gimnasio en toda
la aplicación. Se adapta automáticamente al logo personalizado del gimnasio cuando está
disponible, o proporciona un respaldo profesional con el icono de mancuernas. Es el
elemento central de la identidad de marca que los usuarios ven en cada página.

CONFIGURACIÓN POR DEFECTO:
- Nombre del gimnasio: "Gimnasio Elite Fitness" (cuando no hay configuración)
- Icono de respaldo: Mancuernas (Dumbbell) de Lucide React
- Tamaño por defecto: md (40x40px)
- Variante por defecto: professional (azul primario)
- Prioridad por defecto: normal (100ms delay)

El componente garantiza que el gimnasio siempre tenga una representación visual
profesional y consistente, independientemente de si tienen un logo personalizado
configurado o no.
*/