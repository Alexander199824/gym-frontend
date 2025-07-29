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
  onClick = null
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
    
    img.src = url;
  }, [imageState.attempted]);
  
  // 🔍 Efecto para verificar imagen (solo cuando sea necesario)
  useEffect(() => {
    if (isLoaded && imageUrl && !imageState.attempted) {
      verifyImage(imageUrl);
    }
  }, [isLoaded, imageUrl, imageState.attempted, verifyImage]);
  
  // 📏 CONFIGURACIÓN DE TAMAÑOS (Memoizada)
  const sizeConfig = useMemo(() => ({
    xs: { container: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-xs', spacing: 'space-x-1' },
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm', spacing: 'space-x-2' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base', spacing: 'space-x-2' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-lg', spacing: 'space-x-3' },
    xl: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-xl', spacing: 'space-x-3' },
    '2xl': { container: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-2xl', spacing: 'space-x-4' }
  }), []);
  
  // 🎨 CONFIGURACIÓN DE VARIANTES (Memoizada)
  const variantConfig = useMemo(() => ({
    professional: { container: 'bg-primary-600', icon: 'text-white', text: 'text-primary-600' },
    dark: { container: 'bg-slate-800', icon: 'text-slate-100', text: 'text-slate-800' },
    light: { container: 'bg-slate-100 border-2 border-slate-200', icon: 'text-slate-600', text: 'text-slate-700' },
    white: { container: 'bg-white border-2 border-slate-200 shadow-sm', icon: 'text-primary-600', text: 'text-slate-800' },
    gradient: { container: 'bg-gradient-to-br from-primary-600 to-secondary-600', icon: 'text-white', text: 'text-primary-600' }
  }), []);
  
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentVariant = variantConfig[variant] || variantConfig.professional;
  
  const getTextSize = () => textSize !== 'auto' ? textSize : currentSize.text;
  
  // 🖼️ RENDERIZAR LOGO (Memoizado)
  const logoContent = useMemo(() => {
    // Si tenemos imagen cargada exitosamente, mostrarla
    if (imageUrl && imageState.loaded && !imageState.error && isLoaded) {
      return (
        <div className={`${currentSize.container} rounded-xl overflow-hidden shadow-sm`}>
          <img 
            src={imageUrl}
            alt={config?.logo?.alt || config?.name || 'Logo'}
            className={`${currentSize.container} object-contain`}
            onError={() => setImageState(prev => ({ ...prev, error: true }))}
          />
        </div>
      );
    }
    
    // Fallback: Icono de mancuernas
    return (
      <div className={`
        ${currentSize.container} ${currentVariant.container} 
        rounded-xl flex items-center justify-center shadow-sm
      `}>
        <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
      </div>
    );
  }, [imageUrl, imageState, isLoaded, config, currentSize, currentVariant]);

  // 🎭 Texto del logo (Memoizado)
  const logoText = useMemo(() => {
    if (!showText) return null;
    
    const text = config?.name || 'Elite Fitness Club';
    
    return (
      <span className={`
        font-semibold ${getTextSize()} ${currentVariant.text}
        whitespace-nowrap
      `}>
        {text}
      </span>
    );
  }, [showText, config?.name, currentVariant.text, getTextSize]);

  // Si aún no se ha cargado la configuración, mostrar skeleton
  if (!isLoaded) {
    return (
      <div className={`flex items-center ${showText ? currentSize.spacing : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <div className={`
          ${currentSize.container} ${currentVariant.container} 
          rounded-xl flex items-center justify-center shadow-sm animate-pulse opacity-70
        `}>
          <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
        </div>
        
        {showText && (
          <div className="animate-pulse">
            <div className={`h-4 bg-gray-300 rounded ${getTextSize()}`} style={{ width: '120px' }}></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center ${showText ? currentSize.spacing : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {logoContent}
      {logoText}
    </div>
  );
};

// Exportar variantes específicas optimizadas
export const NavbarLogo = React.memo(() => <GymLogo size="md" variant="professional" showText={true} />);
export const FooterLogo = React.memo(() => <GymLogo size="lg" variant="white" showText={true} />);
export const AuthLogo = React.memo(() => <GymLogo size="xl" variant="gradient" showText={false} />);
export const MobileLogo = React.memo(() => <GymLogo size="sm" variant="professional" showText={false} />);
export const DashboardLogo = React.memo(() => <GymLogo size="md" variant="professional" showText={true} />);
export const HeroLogo = React.memo(() => <GymLogo size="2xl" variant="gradient" showText={false} />);

export default React.memo(GymLogo);



// 📝 CAMBIOS REALIZADOS:
// ✅ Eliminadas todas las referencias a process.env
// ✅ Logo obtenido 100% desde backend via useGymConfig
// ✅ Manejo de loading state mientras carga la configuración
// ✅ Fallback a icono de mancuernas si no hay logo
// ✅ Compatible con URLs completas o rutas relativas
// ✅ Logs para debug de la carga del logo
// ✅ Nombre del gimnasio desde backend