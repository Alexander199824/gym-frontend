// src/components/common/LoadingSpinner.js
// FUNCIÓN: Componente de loading spinner CORREGIDO
// IMPORTACIÓN CORREGIDA: useGymConfig como default export

import React from 'react';
import { Dumbbell, Loader } from 'lucide-react';
import useGymConfig from '../../hooks/useGymConfig'; // ✅ IMPORTACIÓN CORREGIDA

const LoadingSpinner = ({ 
  fullScreen = false, 
  message = 'Cargando...', 
  size = 'md',
  showLogo = true,
  className = ''
}) => {
  const { config } = useGymConfig(); // ✅ CORRECTO: destructuring del hook default

  // 📏 Configuración de tamaños
  const sizeConfig = {
    sm: { spinner: 'w-8 h-8', logo: 'w-6 h-6', text: 'text-sm' },
    md: { spinner: 'w-12 h-12', logo: 'w-8 h-8', text: 'text-base' },
    lg: { spinner: 'w-16 h-16', logo: 'w-12 h-12', text: 'text-lg' },
    xl: { spinner: 'w-24 h-24', logo: 'w-16 h-16', text: 'text-xl' }
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Logo + Spinner */}
      <div className="relative">
        {/* Spinner */}
        <div className={`${currentSize.spinner} animate-spin`}>
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
        
        {/* Logo en el centro */}
        {showLogo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Dumbbell className={`${currentSize.logo} text-primary-600`} />
          </div>
        )}
      </div>

      {/* Mensaje */}
      <div className="text-center space-y-2">
        <p className={`${currentSize.text} font-medium text-gray-900`}>
          {message}
        </p>
        {config?.name && (
          <p className="text-sm text-gray-500">
            {config.name}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
        <LoadingContent />
      </div>
    );
  }

  return <LoadingContent />;
};

// Variantes específicas
export const FullScreenLoader = ({ message = 'Cargando Elite Fitness...' }) => (
  <LoadingSpinner fullScreen={true} message={message} size="lg" />
);

export const InlineLoader = ({ message = 'Cargando...', size = 'sm' }) => (
  <LoadingSpinner fullScreen={false} message={message} size={size} showLogo={false} />
);

export const CardLoader = ({ message = 'Cargando...', size = 'md' }) => (
  <div className="bg-white rounded-lg shadow p-8">
    <LoadingSpinner fullScreen={false} message={message} size={size} />
  </div>
);

export default LoadingSpinner;