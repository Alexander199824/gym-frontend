// src/components/common/GymLogo.js
// FUNCIÓN: Logo COMPLETAMENTE CORREGIDO con mejor manejo de errores

import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { useGymConfig } from '../../hooks/useGymConfig';

const GymLogo = ({ 
  size = 'md',
  variant = 'professional',
  showText = true,
  textSize = 'auto',
  className = '',
  onClick = null
}) => {
  const gymConfig = useGymConfig();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔍 Construir URL de la imagen y verificar que existe
  useEffect(() => {
    const loadImage = async () => {
      if (!gymConfig.logo.url) {
        console.log('❌ No hay URL de logo configurada en .env');
        setIsLoading(false);
        setImageError(true);
        return;
      }
      
      let finalUrl = '';
      
      // Si la URL ya es completa (http/https), usarla directamente
      if (gymConfig.logo.url.startsWith('http')) {
        finalUrl = gymConfig.logo.url;
      } else {
        // Si es una ruta relativa, construir la URL completa
        const baseUrl = window.location.origin;
        const cleanPath = gymConfig.logo.url.startsWith('/') ? gymConfig.logo.url : `/${gymConfig.logo.url}`;
        finalUrl = `${baseUrl}${cleanPath}`;
      }
      
      console.log('🔍 Intentando cargar logo:');
      console.log('  📁 Ruta configurada:', gymConfig.logo.url);
      console.log('  🌐 URL final:', finalUrl);
      
      // Verificar si la imagen existe antes de asignarla
      try {
        const response = await fetch(finalUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ Imagen encontrada, cargando...');
          setImageUrl(finalUrl);
          setImageError(false);
        } else {
          console.error('❌ Imagen no encontrada (HTTP ' + response.status + ')');
          setImageError(true);
        }
      } catch (error) {
        console.error('❌ Error al verificar la imagen:', error);
        setImageError(true);
      }
      
      setIsLoading(false);
    };
    
    loadImage();
  }, [gymConfig.logo.url]);
  
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
  
  // 🎨 CONFIGURACIÓN DE VARIANTES
  const variantConfig = {
    professional: {
      container: 'bg-slate-800',
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
    gradient: {
      container: 'bg-elite-gradient',
      icon: 'text-white',
      text: 'text-slate-800'
    }
  };
  
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentVariant = variantConfig[variant] || variantConfig.professional;
  
  // 📝 Obtener tamaño del texto
  const getTextSize = () => {
    if (textSize !== 'auto') return textSize;
    return currentSize.text;
  };
  
  // 🚨 Manejar error de imagen
  const handleImageError = (e) => {
    console.error('❌ Error al cargar la imagen del logo');
    console.error('🔍 URL que falló:', imageUrl);
    console.error('🔍 Mensaje de error:', e.type);
    setImageError(true);
    setImageLoaded(false);
  };
  
  // ✅ Manejar carga exitosa de imagen
  const handleImageLoad = () => {
    console.log('✅ Logo cargado exitosamente:', imageUrl);
    setImageLoaded(true);
    setImageError(false);
  };
  
  // 🖼️ RENDERIZAR LOGO
  const renderLogoContent = () => {
    // Si está cargando, mostrar placeholder
    if (isLoading) {
      return (
        <div className={`
          ${currentSize.container} ${currentVariant.container} 
          rounded-xl flex items-center justify-center animate-pulse
        `}>
          <Dumbbell className={`${currentSize.icon} ${currentVariant.icon} opacity-50`} />
        </div>
      );
    }
    
    // Si hay imagen configurada y no ha fallado, intentar mostrarla
    if (imageUrl && !imageError) {
      return (
        <div className={`${currentSize.container} relative overflow-hidden rounded-xl`}>
          {/* Imagen principal */}
          <img 
            src={imageUrl}
            alt={gymConfig.logo.alt}
            className={`${currentSize.container} object-contain transition-opacity duration-300`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{
              opacity: imageLoaded ? 1 : 0,
              display: imageError ? 'none' : 'block'
            }}
          />
          
          {/* Fallback mientras carga o si falla */}
          {(!imageLoaded || imageError) && (
            <div className={`
              absolute inset-0 ${currentVariant.container} 
              flex items-center justify-center
              ${!imageLoaded && !imageError ? 'animate-pulse' : ''}
            `}>
              <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
            </div>
          )}
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

  return (
    <div 
      className={`flex items-center ${showText ? currentSize.spacing : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {renderLogoContent()}
      
      {showText && (
        <span className={`
          font-bold ${getTextSize()} ${currentVariant.text}
          whitespace-nowrap
        `}>
          {gymConfig.name}
        </span>
      )}
    </div>
  );
};

// 🎯 VARIANTES ESPECÍFICAS
export const NavbarLogo = () => (
  <GymLogo 
    size="md" 
    variant="professional" 
    showText={true}
  />
);

export const FooterLogo = () => (
  <GymLogo 
    size="lg" 
    variant="white" 
    showText={true}
  />
);

export const AuthLogo = () => (
  <GymLogo 
    size="xl" 
    variant="gradient" 
    showText={false}
  />
);

export const MobileLogo = () => (
  <GymLogo 
    size="sm" 
    variant="professional" 
    showText={false}
  />
);

export const DashboardLogo = () => (
  <GymLogo 
    size="md" 
    variant="professional" 
    showText={true}
  />
);

export const HeroLogo = () => (
  <GymLogo 
    size="2xl" 
    variant="gradient" 
    showText={false}
  />
);

export default GymLogo;