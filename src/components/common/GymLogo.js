// src/components/common/GymLogo.js
// CONECTA CON: useGymConfig hook
// MEJORAS: Optimizado para móvil, mejor responsive, lazy loading

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
  priority = 'normal', // 'high', 'normal', 'low' para lazy loading
  breakpoint = 'md' // 'xs', 'sm', 'md', 'lg', 'xl' para responsive
}) => {
  const { config, isLoaded } = useGymConfig();
  const [imageState, setImageState] = useState({
    error: false,
    loaded: false,
    attempted: false
  });
  
  // 🔧 Memoizar URL de imagen para evitar recálculos
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
  
  // 🔍 Verificar imagen solo UNA VEZ cuando cambie la URL
  const verifyImage = useCallback((url) => {
    if (!url || imageState.attempted) return;
    
    console.group('🖼️ GymLogo Image Check');
    console.log('📁 Image URL from backend:', url);
    
    setImageState(prev => ({ ...prev, attempted: true }));
    
    const img = new Image();
    
    img.onload = () => {
      console.log('✅ Logo loaded successfully from backend');
      console.groupEnd();
      setImageState(prev => ({ ...prev, loaded: true, error: false }));
    };
    
    img.onerror = () => {
      console.warn('❌ Failed to load logo from backend');
      console.log('🔧 Solution: Check if the image exists at:', url);
      console.log('💡 Fallback: Using dumbbell icon instead');
      console.groupEnd();
      setImageState(prev => ({ ...prev, loaded: false, error: true }));
    };
    
    // 🚀 Lazy loading basado en prioridad
    if (priority === 'high') {
      img.src = url; // Cargar inmediatamente
    } else if (priority === 'normal') {
      // Pequeño delay para dar prioridad a contenido crítico
      setTimeout(() => {
        img.src = url;
      }, 100);
    } else {
      // Low priority - cargar después de que todo lo demás esté listo
      setTimeout(() => {
        img.src = url;
      }, 500);
    }
  }, [imageState.attempted, priority]);
  
  // 🔍 Efecto para verificar imagen (solo cuando sea necesario)
  useEffect(() => {
    if (isLoaded && imageUrl && !imageState.attempted) {
      verifyImage(imageUrl);
    }
  }, [isLoaded, imageUrl, imageState.attempted, verifyImage]);
  
  // 📏 CONFIGURACIÓN DE TAMAÑOS RESPONSIVA (Mejorada para móvil)
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
  
  // 🎨 CONFIGURACIÓN DE VARIANTES (Memoizada)
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
    // 🆕 Nuevas variantes para móvil
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
  
  // 📱 Detectar si estamos en móvil (simplificado)
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // md breakpoint
  }, []);
  
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentVariant = variantConfig[variant] || variantConfig.professional;
  
  // 📱 Función para obtener el tamaño correcto según el dispositivo
  const getResponsiveSize = useCallback((property) => {
    if (isMobile && currentSize.mobile && property === 'container') {
      return currentSize.mobile;
    }
    return currentSize[property];
  }, [isMobile, currentSize]);
  
  const getTextSize = () => textSize !== 'auto' ? textSize : currentSize.text;
  
  // 🖼️ RENDERIZAR LOGO (Memoizado y optimizado)
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
            onError={() => setImageState(prev => ({ ...prev, error: true }))}
            loading={priority === 'high' ? 'eager' : 'lazy'}
            decoding="async"
            // 🔧 Optimizaciones adicionales para móvil
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
    priority
  ]);

  // 🎭 Texto del logo (Memoizado y responsive)
  const logoText = useMemo(() => {
    if (!showText) return null;
    
    const text = config?.name || 'Elite Fitness Club';
    
    // 📱 Texto más compacto en móvil si es necesario
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

  // 📱 Skeleton optimizado para móvil
  if (!isLoaded) {
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
      // 🔧 Optimizaciones de accesibilidad
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

// 🚀 VARIANTES ESPECÍFICAS OPTIMIZADAS PARA MÓVIL
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

// 🆕 Nuevas variantes específicas para móvil
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

// 📝 CAMBIOS REALIZADOS PARA OPTIMIZACIÓN MÓVIL:
// ✅ Tamaños responsivos específicos para móvil
// ✅ Lazy loading con prioridades (high, normal, low)
// ✅ Texto truncado automáticamente en móvil para nombres largos  
// ✅ Variantes específicas para móvil (minimal, compact)
// ✅ Hooks de resize para detectar cambios de pantalla
// ✅ Optimizaciones de imagen (loading lazy, decoding async)
// ✅ Mejores animaciones y transiciones
// ✅ Accesibilidad mejorada (ARIA labels, keyboard navigation)
// ✅ Skeleton loading optimizado para móvil
// ✅ Componentes específicos responsivos (NavbarLogo, HeroLogo, etc.)
// ✅ Mantiene TODA la funcionalidad original