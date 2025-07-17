// src/components/common/GymLogo.js
// UBICACIÓN: /gym-frontend/src/components/common/GymLogo.js
// FUNCIÓN: Componente de logo personalizable para Elite Fitness Club
// CONECTA CON: Configuración global del gym

import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';

const GymLogo = ({ 
  size = 'md',           // xs, sm, md, lg, xl, 2xl
  variant = 'gradient',  // gradient, solid-teal, solid-magenta, white, dark
  showText = true,       // Mostrar nombre del gym
  textSize = 'auto',     // auto, sm, md, lg, xl
  className = '',
  logoUrl = null,        // URL de la imagen del logo (puedes configurar aquí)
  gymName = "Elite Fitness Club"  // Nombre del gym (configurable)
}) => {
  const [imageError, setImageError] = useState(false);
  
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
    gradient: {
      container: 'bg-elite-gradient',
      icon: 'text-white',
      text: 'text-gray-800'
    },
    'solid-teal': {
      container: 'bg-primary-500',
      icon: 'text-white',
      text: 'text-gray-800'
    },
    'solid-magenta': {
      container: 'bg-secondary-500',
      icon: 'text-white',
      text: 'text-gray-800'
    },
    white: {
      container: 'bg-white border-2 border-gray-200',
      icon: 'text-primary-600',
      text: 'text-gray-800'
    },
    dark: {
      container: 'bg-gray-800',
      icon: 'text-primary-400',
      text: 'text-white'
    }
  };
  
  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];
  
  // 📝 TEXTO DEL LOGO
  const getTextSize = () => {
    if (textSize !== 'auto') return textSize;
    return currentSize.text;
  };
  
  // 🖼️ RENDERIZAR LOGO
  const renderLogoContent = () => {
    // Si hay una imagen del logo y no ha fallado, mostrarla
    if (logoUrl && !imageError) {
      return (
        <img 
          src={logoUrl}
          alt={`${gymName} Logo`}
          className={`${currentSize.container} object-contain`}
          onError={() => setImageError(true)}
        />
      );
    }
    
    // Fallback: Icono de mancuernas con el estilo del gym
    return (
      <div className={`
        ${currentSize.container} ${currentVariant.container} 
        rounded-xl flex items-center justify-center shadow-elite
      `}>
        <Dumbbell className={`${currentSize.icon} ${currentVariant.icon}`} />
      </div>
    );
  };

  return (
    <div className={`flex items-center ${showText ? currentSize.spacing : ''} ${className}`}>
      {renderLogoContent()}
      
      {showText && (
        <span className={`
          font-display font-bold ${getTextSize()} ${currentVariant.text}
          whitespace-nowrap
        `}>
          {gymName}
        </span>
      )}
    </div>
  );
};

// 🎯 VARIANTES ESPECÍFICAS PARA USO COMÚN

// Logo para navbar
export const NavbarLogo = ({ logoUrl, gymName = "Elite Fitness Club" }) => (
  <GymLogo 
    size="md" 
    variant="gradient" 
    showText={true}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

// Logo para footer
export const FooterLogo = ({ logoUrl, gymName = "Elite Fitness Club" }) => (
  <GymLogo 
    size="lg" 
    variant="white" 
    showText={true}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

// Logo para páginas de auth
export const AuthLogo = ({ logoUrl, gymName = "Elite Fitness Club" }) => (
  <GymLogo 
    size="xl" 
    variant="gradient" 
    showText={false}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

// Logo para móvil (más pequeño)
export const MobileLogo = ({ logoUrl, gymName = "Elite Fitness Club" }) => (
  <GymLogo 
    size="sm" 
    variant="gradient" 
    showText={false}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

// Logo para dashboard
export const DashboardLogo = ({ logoUrl, gymName = "Elite Fitness Club" }) => (
  <GymLogo 
    size="md" 
    variant="gradient" 
    showText={true}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

// Logo grande para hero sections
export const HeroLogo = ({ logoUrl, gymName = "Elite Fitness Club" }) => (
  <GymLogo 
    size="2xl" 
    variant="gradient" 
    showText={false}
    logoUrl={logoUrl}
    gymName={gymName}
  />
);

export default GymLogo;