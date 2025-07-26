// src/components/common/GymLogo.js
// FUNCIÓN: Logo que obtiene datos SOLO del backend (sin .env)
// CONECTA CON: useGymConfig hook

import React, { useState, useEffect } from 'react';
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
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 🔧 Función para obtener URL de imagen desde el backend
  const getImageUrl = () => {
    if (!config?.logo?.url) {
      console.log('❌ No hay URL de logo en la configuración del backend');
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
    const finalUrl = `${baseUrl}${cleanPath}`;
    
    console.log('🔍 Logo URL desde backend:');
    console.log('  📁 URL configurada:', logoUrl);
    console.log('  🌐 URL final:', finalUrl);
    
    return finalUrl;
  };
  
  // 🔍 Efecto para probar carga de imagen
  useEffect(() => {
    if (!isLoaded) return;
    
    const imageUrl = getImageUrl();
    
    if (!imageUrl) {
      setImageError(true);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      console.log('✅ Logo cargado correctamente desde backend!');
      setImageLoaded(true);
      setImageError(false);
    };
    
    img.onerror = () => {
      console.error('❌ Error al cargar logo desde backend');
      console.error('🔍 URL que falló:', imageUrl);
      setImageError(true);
      setImageLoaded(false);
    };
    
    img.src = imageUrl;
  }, [isLoaded, config?.logo?.url]);
  
  // 📏 CONFIGURACIÓN DE TAMAÑOS
  const sizeConfig = {
    xs: { container: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-xs', spacing: 'space-x-1' },
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm', spacing: 'space-x-2' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base', spacing: 'space-x-2' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-lg', spacing: 'space-x-3' },
    xl: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-xl', spacing: 'space-x-3' },
    '2xl': { container: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-2xl', spacing: 'space-x-4' }
  };
  
  // 🎨 CONFIGURACIÓN DE VARIANTES
  const variantConfig = {
    professional: { container: 'bg-primary-600', icon: 'text-white', text: 'text-primary-600' },
    dark: { container: 'bg-slate-800', icon: 'text-slate-100', text: 'text-slate-800' },
    light: { container: 'bg-slate-100 border-2 border-slate-200', icon: 'text-slate-600', text: 'text-slate-700' },
    white: { container: 'bg-white border-2 border-slate-200 shadow-sm', icon: 'text-primary-600', text: 'text-slate-800' },
    gradient: { container: 'bg-gradient-to-br from-primary-600 to-secondary-600', icon: 'text-white', text: 'text-primary-600' }
  };
  
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentVariant = variantConfig[variant] || variantConfig.professional;
  
  const getTextSize = () => textSize !== 'auto' ? textSize : currentSize.text;
  
  // 🖼️ RENDERIZAR LOGO
  const renderLogoContent = () => {
    const imageUrl = getImageUrl();
    
    // Si tenemos imagen y se cargó correctamente, mostrarla
    if (imageUrl && imageLoaded && !imageError && isLoaded) {
      return (
        <div className={`${currentSize.container} rounded-xl overflow-hidden shadow-sm`}>
          <img 
            src={imageUrl}
            alt={config?.logo?.alt || config?.name || 'Logo'}
            className={`${currentSize.container} object-contain`}
            onError={() => setImageError(true)}
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
  };

  // Si aún no se ha cargado la configuración, mostrar icono por defecto
  if (!isLoaded) {
    return (
      <div className={`flex items-center ${showText ? currentSize.spacing : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <div className={`
          ${currentSize.container} ${currentVariant.container} 
          rounded-xl flex items-center justify-center shadow-sm animate-pulse
        `}>
          <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
        </div>
        
        {showText && (
          <span className={`
            font-semibold ${getTextSize()} ${currentVariant.text}
            whitespace-nowrap
          `}>
            Cargando...
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center ${showText ? currentSize.spacing : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {renderLogoContent()}
      
      {showText && (
        <span className={`
          font-semibold ${getTextSize()} ${currentVariant.text}
          whitespace-nowrap
        `}>
          {config?.name || 'Elite Fitness Club'}
        </span>
      )}
    </div>
  );
};

// Exportar variantes específicas con configuración del backend
export const NavbarLogo = () => <GymLogo size="md" variant="professional" showText={true} />;
export const FooterLogo = () => <GymLogo size="lg" variant="white" showText={true} />;
export const AuthLogo = () => <GymLogo size="xl" variant="gradient" showText={false} />;
export const MobileLogo = () => <GymLogo size="sm" variant="professional" showText={false} />;
export const DashboardLogo = () => <GymLogo size="md" variant="professional" showText={true} />;
export const HeroLogo = () => <GymLogo size="2xl" variant="gradient" showText={false} />;

export default GymLogo;

// 📝 CAMBIOS REALIZADOS:
// ✅ Eliminadas todas las referencias a process.env
// ✅ Logo obtenido 100% desde backend via useGymConfig
// ✅ Manejo de loading state mientras carga la configuración
// ✅ Fallback a icono de mancuernas si no hay logo
// ✅ Compatible con URLs completas o rutas relativas
// ✅ Logs para debug de la carga del logo
// ✅ Nombre del gimnasio desde backend