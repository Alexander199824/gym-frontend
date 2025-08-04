// src/components/common/LoadingSpinner.js
// FUNCIÓN: Componente de loading spinner COMPLETO Y CORREGIDO
// MANTIENE: Funcionalidad existente + compatibilidad con ProfileManager

import React from 'react';
import { Dumbbell, Loader } from 'lucide-react';
import useGymConfig from '../../hooks/useGymConfig'; // ✅ IMPORTACIÓN CORRECTA

const LoadingSpinner = ({ 
  fullScreen = false, 
  message = 'Cargando...', 
  size = 'md',
  showLogo = true,
  className = '',
  // 🆕 NUEVAS PROPS para compatibilidad con ProfileManager
  color = 'primary'
}) => {
  const { config } = useGymConfig(); // ✅ CORRECTO: destructuring del hook default

  // 📏 Configuración de tamaños
  const sizeConfig = {
    sm: { spinner: 'w-8 h-8', logo: 'w-6 h-6', text: 'text-sm' },
    md: { spinner: 'w-12 h-12', logo: 'w-8 h-8', text: 'text-base' },
    lg: { spinner: 'w-16 h-16', logo: 'w-12 h-12', text: 'text-lg' },
    xl: { spinner: 'w-24 h-24', logo: 'w-16 w-16', text: 'text-xl' }
  };

  // 🎨 Configuración de colores
  const colorConfig = {
    primary: 'border-primary-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600',
    indigo: 'border-indigo-600'
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentColor = colorConfig[color] || colorConfig.primary;

  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Logo + Spinner */}
      <div className="relative">
        {/* Spinner */}
        <div className={`${currentSize.spinner} animate-spin`}>
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className={`absolute inset-0 border-4 ${currentColor} border-t-transparent rounded-full`}></div>
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
        {config?.name && showLogo && (
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

// 🔄 ButtonSpinner para botones
export const ButtonSpinner = ({ size = 'sm', className = '', color = 'white' }) => {
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    white: 'border-white border-opacity-30',
    primary: 'border-primary-600 border-opacity-30',
    gray: 'border-gray-600 border-opacity-30'
  };

  const borderColor = colorClasses[color] || colorClasses.white;

  return (
    <div className={`${spinnerSizes[size]} animate-spin relative ${className}`}>
      <div className={`absolute inset-0 border-2 ${borderColor} rounded-full`}></div>
      <div className={`absolute inset-0 border-2 ${color === 'white' ? 'border-white' : `border-${color}-600`} border-t-transparent rounded-full`}></div>
    </div>
  );
};

// 🆕 NUEVO: SimpleSpinner para casos simples (compatibilidad con ProfileManager)
export const SimpleSpinner = ({ 
  size = 'medium', 
  color = 'primary',
  message = '',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-indigo-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="text-center">
        <Loader className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin mx-auto mb-2`} />
        {message && (
          <p className="text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};

// Variantes específicas MEJORADAS
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

// 🆕 NUEVO: ProfileLoader específico para el ProfileManager
export const ProfileLoader = ({ message = 'Cargando información del perfil...' }) => (
  <div className="flex items-center justify-center min-h-96">
    <LoadingSpinner 
      fullScreen={false} 
      message={message} 
      size="lg"
      showLogo={false}
      color="indigo"
    />
  </div>
);

export default LoadingSpinner;