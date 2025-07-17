// src/components/common/GymLogo.js

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
  const [finalImageUrl, setFinalImageUrl] = useState(null);
  
  // 🔍 Construir URL de la imagen y verificar que existe
  useEffect(() => {
    const loadImage = async () => {
      if (!gymConfig.logo.url) {
        console.log('❌ No hay URL de logo configurada en .env');
        setImageError(true);
        return;
      }
      
      let imageUrl = '';
      
      // Si la URL ya es completa (http/https), usarla directamente
      if (gymConfig.logo.url.startsWith('http')) {
        imageUrl = gymConfig.logo.url;
      } else {
        // Si es una ruta relativa, construir la URL completa
        const baseUrl = window.location.origin;
        const cleanPath = gymConfig.logo.url.startsWith('/') ? gymConfig.logo.url : `/${gymConfig.logo.url}`;
        imageUrl = `${baseUrl}${cleanPath}`;
      }
      
      console.log('🔍 Intentando cargar logo:');
      console.log('  📁 Ruta configurada:', gymConfig.logo.url);
      console.log('  🌐 URL final:', imageUrl);
      
      // Verificar si la imagen existe
      try {
        // Crear una nueva imagen para probar la carga
        const img = new Image();
        
        img.onload = () => {
          console.log('✅ Imagen cargada correctamente!');
          setFinalImageUrl(imageUrl);
          setImageError(false);
          setImageLoaded(true);
        };
        
        img.onerror = () => {
          console.error('❌ Error al cargar la imagen');
          console.error('🔍 URL que falló:', imageUrl);
          console.error('🛠️ SOLUCIONES:');
          console.error('   1. Verifica que el archivo existe en: public' + gymConfig.logo.url);
          console.error('   2. Verifica que el .env tiene: REACT_APP_LOGO_URL=' + gymConfig.logo.url);
          console.error('   3. Reinicia el servidor: npm start');
          setImageError(true);
          setImageLoaded(false);
        };
        
        // Establecer la fuente de la imagen para iniciar la carga
        img.src = imageUrl;
        
      } catch (error) {
        console.error('❌ Error al verificar la imagen:', error);
        setImageError(true);
        setImageLoaded(false);
      }
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
  
  // 🎨 CONFIGURACIÓN DE VARIANTES SUAVES
  const variantConfig = {
    professional: {
      container: 'bg-primary-600',
      icon: 'text-white',
      text: 'text-primary-600'
    },
    dark: {
      container: 'bg-slate-800',
      icon: 'text-slate-100',
      text: 'text-slate-800'
    },
    light: {
      container: 'bg-slate-100 border-2 border-slate-200',
      icon: 'text-slate-600',
      text: 'text-slate-700'
    },
    white: {
      container: 'bg-white border-2 border-slate-200 shadow-sm',
      icon: 'text-primary-600',
      text: 'text-slate-800'
    },
    gradient: {
      container: 'bg-elite-gradient',
      icon: 'text-white',
      text: 'text-primary-600'
    }
  };
  
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentVariant = variantConfig[variant] || variantConfig.professional;
  
  // 📝 Obtener tamaño del texto
  const getTextSize = () => {
    if (textSize !== 'auto') return textSize;
    return currentSize.text;
  };
  
  // 🖼️ RENDERIZAR LOGO
  const renderLogoContent = () => {
    // Si tenemos imagen y se cargó correctamente, mostrarla
    if (finalImageUrl && imageLoaded && !imageError) {
      return (
        <div className={`${currentSize.container} rounded-xl overflow-hidden shadow-sm`}>
          <img 
            src={finalImageUrl}
            alt={gymConfig.logo.alt}
            className={`${currentSize.container} object-contain`}
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