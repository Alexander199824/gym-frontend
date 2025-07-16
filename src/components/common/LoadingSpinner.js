// src/components/common/LoadingSpinner.js
// UBICACIÓN: /gym-frontend/src/components/common/LoadingSpinner.js
// FUNCIÓN: Componente de spinner de carga reutilizable
// USADO EN: Páginas con lazy loading, formularios, llamadas API

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Cargando...', 
  fullScreen = false,
  className = ''
}) => {
  // 📏 TAMAÑOS DEL SPINNER
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  // 🎯 SPINNER BÁSICO
  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 
        className={`${sizes[size]} animate-spin text-primary-500 mb-2`}
        strokeWidth={2}
      />
      {message && (
        <p className="text-sm text-secondary-600 font-medium">
          {message}
        </p>
      )}
    </div>
  );
  
  // 📱 PANTALLA COMPLETA
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-4">
          {spinner}
        </div>
      </div>
    );
  }
  
  return spinner;
};

// 🎨 VARIANTES ESPECIALIZADAS
export const ButtonSpinner = ({ size = 'sm' }) => (
  <Loader2 className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
);

export const TableSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="md" message="Cargando datos..." />
  </div>
);

export const CardSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <LoadingSpinner size="lg" message="Procesando..." />
  </div>
);

export const InlineSpinner = ({ text = 'Procesando' }) => (
  <div className="flex items-center space-x-2">
    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
    <span className="text-sm text-secondary-600">{text}...</span>
  </div>
);

export default LoadingSpinner;