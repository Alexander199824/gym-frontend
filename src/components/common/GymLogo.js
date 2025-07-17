// src/components/common/GymLogo.js
// FUNCIÓN: Logo CORREGIDO - funciona correctamente con public folder

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
  
  // 🔧 CORRECCIÓN: Construcción correcta de URL para public folder
  const getImageUrl = () => {
    if (!gymConfig.logo.url) {
      console.log('❌ No hay URL de logo configurada en .env');
      return null;
    }
    
    // ✅ FORMA CORRECTA: usar process.env.PUBLIC_URL para archivos en public
    let imageUrl = '';
    
    if (gymConfig.logo.url.startsWith('http')) {
      // URL completa externa
      imageUrl = gymConfig.logo.url;
    } else {
      // ✅ CORRECCIÓN: Para archivos en public folder
      // Usar process.env.PUBLIC_URL + ruta limpia
      const cleanPath = gymConfig.logo.url.startsWith('/') 
        ? gymConfig.logo.url 
        : `/${gymConfig.logo.url}`;
      imageUrl = process.env.PUBLIC_URL + cleanPath;
    }
    
    console.log('🔍 Logo URL construida:');
    console.log('  📁 Configurada:', gymConfig.logo.url);
    console.log('  🌐 URL final:', imageUrl);
    console.log('  📂 PUBLIC_URL:', process.env.PUBLIC_URL);
    
    return imageUrl;
  };
  
  // 🔍 Probar carga de imagen
  useEffect(() => {
    const imageUrl = getImageUrl();
    
    if (!imageUrl) {
      setImageError(true);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      console.log('✅ Imagen cargada correctamente!');
      setImageLoaded(true);
      setImageError(false);
    };
    
    img.onerror = () => {
      console.error('❌ Error al cargar la imagen');
      console.error('🔍 URL que falló:', imageUrl);
      console.error('');
      console.error('🛠️ SOLUCIONES:');
      console.error('   1. Verifica que el archivo existe en: public' + gymConfig.logo.url);
      console.error('   2. Verifica que el .env tiene: REACT_APP_LOGO_URL=' + gymConfig.logo.url);
      console.error('   3. Reinicia el servidor: npm start');
      console.error('   4. Prueba accediendo directamente: http://localhost:3000' + gymConfig.logo.url);
      setImageError(true);
      setImageLoaded(false);
    };
    
    img.src = imageUrl;
  }, [gymConfig.logo.url]);
  
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
    gradient: { container: 'bg-elite-gradient', icon: 'text-white', text: 'text-primary-600' }
  };
  
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentVariant = variantConfig[variant] || variantConfig.professional;
  
  const getTextSize = () => textSize !== 'auto' ? textSize : currentSize.text;
  
  // 🖼️ RENDERIZAR LOGO
  const renderLogoContent = () => {
    const imageUrl = getImageUrl();
    
    // Si tenemos imagen y se cargó correctamente, mostrarla
    if (imageUrl && imageLoaded && !imageError) {
      return (
        <div className={`${currentSize.container} rounded-xl overflow-hidden shadow-sm`}>
          <img 
            src={imageUrl}
            alt={gymConfig.logo.alt}
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

// Exportar variantes específicas...
export const NavbarLogo = () => <GymLogo size="md" variant="professional" showText={true} />;
export const FooterLogo = () => <GymLogo size="lg" variant="white" showText={true} />;
export const AuthLogo = () => <GymLogo size="xl" variant="gradient" showText={false} />;
export const MobileLogo = () => <GymLogo size="sm" variant="professional" showText={false} />;
export const DashboardLogo = () => <GymLogo size="md" variant="professional" showText={true} />;
export const HeroLogo = () => <GymLogo size="2xl" variant="gradient" showText={false} />;

export default GymLogo;