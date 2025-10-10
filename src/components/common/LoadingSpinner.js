// src/components/common/LoadingSpinner.js
// COMPONENTE: Spinners y estados de carga reutilizables
// ✅ Exporta todos los componentes necesarios

import React from 'react';
import { Loader2, Dumbbell } from 'lucide-react';

// ============================================================================
// SPINNER PRINCIPAL - Para páginas completas
// ============================================================================
const LoadingSpinner = ({ size = 'md', message = 'Cargando...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin text-primary-600`}>
          <Loader2 className="w-full h-full" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Dumbbell className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-12 h-12'} text-primary-600 animate-pulse`} />
        </div>
      </div>
      {message && (
        <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// BUTTON SPINNER - Para botones de carga
// ============================================================================
export const ButtonSpinner = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
};

// ============================================================================
// PROFILE LOADER - Para sección de perfil
// ============================================================================
export const ProfileLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 animate-spin text-primary-600">
          <Loader2 className="w-full h-full" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Dumbbell className="w-8 h-8 text-primary-600 animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-gray-600 font-medium animate-pulse">
          Cargando perfil...
        </p>
        <div className="flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INLINE SPINNER - Spinner pequeño inline
// ============================================================================
export const InlineSpinner = ({ className = '' }) => {
  return (
    <Loader2 className={`w-4 h-4 animate-spin inline-block ${className}`} />
  );
};

// ============================================================================
// CARD LOADER - Para tarjetas con skeleton
// ============================================================================
export const CardLoader = ({ count = 1 }) => {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// TABLE LOADER - Para tablas con skeleton
// ============================================================================
export const TableLoader = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-200 p-4">
          <div className="flex space-x-4">
            {[...Array(columns)].map((_, index) => (
              <div key={index} className="flex-1">
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-200 p-4">
            <div className="flex space-x-4">
              {[...Array(columns)].map((_, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// FULL PAGE LOADER - Para pantallas completas de carga
// ============================================================================
export const FullPageLoader = ({ message = 'Cargando...' }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 animate-spin text-primary-600">
            <Loader2 className="w-full h-full" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-primary-600 animate-pulse" />
          </div>
        </div>
        {message && (
          <p className="mt-6 text-gray-600 text-lg font-medium animate-pulse">
            {message}
          </p>
        )}
        <div className="flex space-x-2 justify-center mt-4">
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SECTION LOADER - Para secciones de página
// ============================================================================
export const SectionLoader = ({ height = '200px', message = '' }) => {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: height }}>
      <div className="relative">
        <div className="w-12 h-12 animate-spin text-primary-600">
          <Loader2 className="w-full h-full" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-primary-600 animate-pulse" />
        </div>
      </div>
      {message && (
        <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// OVERLAY LOADER - Loader que cubre un contenedor
// ============================================================================
export const OverlayLoader = ({ message = 'Cargando...' }) => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-16 h-16 animate-spin text-primary-600">
            <Loader2 className="w-full h-full" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-primary-600 animate-pulse" />
          </div>
        </div>
        {message && (
          <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// DOTS LOADER - Loader con puntos animados
// ============================================================================
export const DotsLoader = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  return (
    <div className={`flex space-x-1.5 ${className}`}>
      <div className={`${sizeClasses[size]} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`${sizeClasses[size]} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`${sizeClasses[size]} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

// ============================================================================
// SPINNER WITH TEXT - Spinner con texto al lado
// ============================================================================
export const SpinnerWithText = ({ text = 'Cargando...', size = 'sm' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
      <span className="text-gray-600 text-sm">{text}</span>
    </div>
  );
};

// Export default
export default LoadingSpinner;