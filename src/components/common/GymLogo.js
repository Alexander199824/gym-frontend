// src/components/common/GymLogo.js
// FUNCIÓN: Logo CORREGIDO para Elite Fitness Club

import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';

const GymLogo = ({ 
  size = 'md',
  variant = 'professional',  // Nuevo variant por defecto más serio
  showText = true,
  textSize = 'auto',
  className = '',
  logoUrl = null,
  gymName = null,
  fallbackToIcon = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // 🔧 Obtener configuración desde .env
  const defaultLogoUrl = process.env.REACT_APP_LOGO_URL;
  const defaultGymName = process.env.REACT_APP_GYM_NAME || "Elite Fitness Club";
  
  // 🎯 URLs y nombres finales
  const finalLogoUrl = logoUrl || defaultLogoUrl;
  const finalGymName = gymName || defaultGymName;
  
  // 🔍 Debug para ver si la imagen se está cargando
  useEffect(() => {
    if (finalLogoUrl) {
      console.log('🖼️ Intentando cargar logo desde:', finalLogoUrl);
    }
  }, [finalLogoUrl]);
  
  // 📏 CONFIGURACIÓN DE TAMAÑOS
  const sizeConfig = {
    xs: {
      container: 'w-6 h-6',
      icon: 'w-3 h-3',
      text: 'text-xs',
      spacing: 'space-x-1'
    },
    sm: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-sm',
      spacing: 'space-x-2'
    },
    md: {
      container: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-base',
      spacing: 'space-x-2'
    },
    lg: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-lg',
      spacing: 'space-x-3'
    },
    xl: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-xl',
      spacing: 'space-x-3'
    },
    '2xl': {
      container: 'w-20 h-20',
      icon: 'w-10 h-10',
      text: 'text-2xl',
      spacing: 'space-x-4'
    }
  };
  
  // 🎨 CONFIGURACIÓN DE VARIANTES - COLORES SERIOS
  const variantConfig = {
    professional: {
      container: 'bg-slate-800',  // Gris oscuro profesional
      icon: 'text-white',
      text: 'text-slate-800'
    },
    dark: {
      container: 'bg-slate-900',
      icon: 'text-slate-300',
      text: 'text-slate-900'
    },
    light: {
      container: 'bg-slate-100 border-2 border-slate-300',
      icon: 'text-slate-700',
      text: 'text-slate-800'
    },
    white: {
      container: 'bg-white border-2 border-slate-200 shadow-sm',
      icon: 'text-slate-600',
      text: 'text-slate-800'
    },
    minimal: {
      container: 'bg-slate-700',
      icon: 'text-slate-200',
      text: 'text-slate-700'
    }
  };
  
  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];
  
  // 📝 Obtener tamaño del texto
  const getTextSize = () => {
    if (textSize !== 'auto') return textSize;
    return currentSize.text;
  };
  
  // 🚨 Manejar error de imagen
  const handleImageError = (e) => {
    console.error('❌ Error al cargar logo:', finalLogoUrl);
    console.error('Error details:', e);
    setImageError(true);
  };
  
  // ✅ Manejar carga exitosa de imagen
  const handleImageLoad = () => {
    console.log('✅ Logo cargado exitosamente:', finalLogoUrl);
    setImageLoaded(true);
  };
  
  // 🖼️ RENDERIZAR LOGO
  const renderLogoContent = () => {
    // Si hay una imagen del logo configurada y no ha fallado
    if (finalLogoUrl && !imageError) {
      return (
        <div className={`${currentSize.container} relative overflow-hidden rounded-xl`}>
          {/* Imagen principal */}
          <img 
            src={finalLogoUrl}
            alt={`${finalGymName} Logo`}
            className={`${currentSize.container} object-contain`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{
              display: imageLoaded ? 'block' : 'none'
            }}
          />
          
          {/* Loading placeholder mientras carga */}
          {!imageLoaded && !imageError && (
            <div className={`
              ${currentSize.container} ${currentVariant.container} 
              flex items-center justify-center animate-pulse
            `}>
              <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
            </div>
          )}
        </div>
      );
    }
    
    // Fallback: Icono de mancuernas (con colores serios)
    if (fallbackToIcon) {
      return (
        <div className={`
          ${currentSize.container} ${currentVariant.container} 
          rounded-xl flex items-center justify-center shadow-sm
        `}>
          <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`flex items-center ${showText ? currentSize.spacing : ''} ${className}`}>
      {renderLogoContent()}
      
      {showText && (
        <span className={`
          font-display font-bold ${getTextSize()} ${currentVariant.text}
          whitespace-nowrap
        `}>
          {finalGymName}
        </span>
      )}
    </div>
  );
};

// 🎯 VARIANTES ESPECÍFICAS ACTUALIZADAS - COLORES SERIOS

export const NavbarLogo = ({ logoUrl, gymName }) => (
  <GymLogo 
    size="md" 
    variant="professional" 
    showText={true}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

export const FooterLogo = ({ logoUrl, gymName }) => (
  <GymLogo 
    size="lg" 
    variant="white" 
    showText={true}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

export const AuthLogo = ({ logoUrl, gymName }) => (
  <GymLogo 
    size="xl" 
    variant="professional" 
    showText={false}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

export const MobileLogo = ({ logoUrl, gymName }) => (
  <GymLogo 
    size="sm" 
    variant="professional" 
    showText={false}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

export const DashboardLogo = ({ logoUrl, gymName }) => (
  <GymLogo 
    size="md" 
    variant="professional" 
    showText={true}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

export const HeroLogo = ({ logoUrl, gymName }) => (
  <GymLogo 
    size="2xl" 
    variant="dark" 
    showText={false}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

export default GymLogo;