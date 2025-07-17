// src/components/common/LoadingSpinner.js
// UBICACIÓN: /gym-frontend/src/components/common/LoadingSpinner.js
// FUNCIÓN: Componente de spinner de carga reutilizable
// USADO EN: Páginas con lazy loading, formularios, llamadas API


import React, { useState, useEffect } from 'react';
import { Loader2, Dumbbell, CheckCircle, XCircle, AlertTriangle, Eye, ExternalLink } from 'lucide-react';
import { useGymConfig } from '../../hooks/useGymConfig';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Cargando...', 
  fullScreen = false,
  type = 'spinner', // 'spinner', 'dots', 'gym'
  className = ''
}) => {
  // 📏 TAMAÑOS DEL SPINNER
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  // 🎯 TIPOS DE SPINNER
  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return <DotsSpinner size={size} />;
      case 'gym':
        return <GymSpinner size={size} />;
      case 'spinner':
      default:
        return (
          <Loader2 
            className={`${sizes[size]} animate-spin text-primary-600`}
            strokeWidth={2}
          />
        );
    }
  };
  
  // 🎯 SPINNER BÁSICO
  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {message && (
        <p className="text-sm text-slate-600 font-medium mt-3">
          {message}
        </p>
      )}
    </div>
  );
  
  // 📱 PANTALLA COMPLETA PROFESIONAL
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-sm mx-4 border border-slate-100">
          <div className="text-center">
            <LogoWithDebug />
            {renderSpinner()}
            {message && (
              <p className="text-slate-600 font-medium mt-4">
                {message}
              </p>
            )}
            <div className="mt-4">
              <div className="w-24 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div className="w-full h-full bg-elite-gradient rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return spinner;
};

// 🏋️ COMPONENTE: Logo con debug de imagen
const LogoWithDebug = () => {
  const gymConfig = useGymConfig();
  const [imageStatus, setImageStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [finalImageUrl, setFinalImageUrl] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  useEffect(() => {
    const testImageLoad = async () => {
      console.log('🔍 TESTING LOGO IMAGE LOAD...');
      
      if (!gymConfig.logo.url) {
        const info = {
          status: 'error',
          message: 'No hay URL de logo configurada en .env',
          configuredUrl: null,
          finalUrl: null,
          suggestion: 'Agrega REACT_APP_LOGO_URL=/assets/images/image.png al archivo .env'
        };
        setDebugInfo(info);
        setImageStatus('error');
        console.log('❌ No hay URL de logo configurada');
        return;
      }
      
      // Construir URL final
      let imageUrl = '';
      if (gymConfig.logo.url.startsWith('http')) {
        imageUrl = gymConfig.logo.url;
      } else {
        const baseUrl = window.location.origin;
        const cleanPath = gymConfig.logo.url.startsWith('/') ? gymConfig.logo.url : `/${gymConfig.logo.url}`;
        imageUrl = `${baseUrl}${cleanPath}`;
      }
      
      setFinalImageUrl(imageUrl);
      
      const info = {
        status: 'testing',
        configuredUrl: gymConfig.logo.url,
        finalUrl: imageUrl,
        baseUrl: window.location.origin,
        publicPath: 'public' + gymConfig.logo.url
      };
      setDebugInfo(info);
      
      console.log('🔍 Información de debug del logo:');
      console.log('  📁 URL configurada en .env:', gymConfig.logo.url);
      console.log('  🌐 URL final construida:', imageUrl);
      console.log('  📂 Ruta del archivo:', 'public' + gymConfig.logo.url);
      
      // Probar carga de imagen
      try {
        const img = new Image();
        
        img.onload = () => {
          console.log('✅ ¡IMAGEN CARGADA EXITOSAMENTE!');
          setImageStatus('success');
          setDebugInfo(prev => ({ ...prev, status: 'success', message: '¡Imagen encontrada y cargada exitosamente!' }));
        };
        
        img.onerror = () => {
          console.error('❌ ERROR AL CARGAR LA IMAGEN');
          console.error('🔍 URL que falló:', imageUrl);
          console.error('');
          console.error('🛠️ SOLUCIONES POSIBLES:');
          console.error('   1. Verifica que el archivo existe en:', 'public' + gymConfig.logo.url);
          console.error('   2. Verifica que el .env tiene:', 'REACT_APP_LOGO_URL=' + gymConfig.logo.url);
          console.error('   3. Reinicia el servidor con: npm start');
          console.error('   4. Verifica los permisos del archivo');
          
          setImageStatus('error');
          setDebugInfo(prev => ({ 
            ...prev, 
            status: 'error', 
            message: 'No se pudo cargar la imagen',
            solutions: [
              `Verifica que el archivo existe en: public${gymConfig.logo.url}`,
              `Verifica el .env: REACT_APP_LOGO_URL=${gymConfig.logo.url}`,
              'Reinicia el servidor: npm start',
              'Verifica permisos del archivo'
            ]
          }));
        };
        
        // Iniciar carga
        img.src = imageUrl;
        
      } catch (error) {
        console.error('❌ Error al probar la imagen:', error);
        setImageStatus('error');
        setDebugInfo(prev => ({ 
          ...prev, 
          status: 'error', 
          message: `Error al probar la imagen: ${error.message}` 
        }));
      }
    };
    
    testImageLoad();
  }, [gymConfig.logo.url]);
  
  const renderLogo = () => {
    if (imageStatus === 'success' && finalImageUrl) {
      return (
        <div className="relative">
          <img 
            src={finalImageUrl}
            alt="Elite Fitness Logo"
            className="w-16 h-16 object-contain rounded-xl mb-6"
          />
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute -top-2 -right-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          )}
        </div>
      );
    }
    
    // Fallback con estado visual
    return (
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-elite-gradient rounded-xl flex items-center justify-center">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        
        {/* Indicador de estado */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute -top-2 -right-2">
            {imageStatus === 'loading' && (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            )}
            {imageStatus === 'error' && (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="relative">
      {renderLogo()}
      
      {/* Debug Panel Toggle - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="mt-4">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              imageStatus === 'success' 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {imageStatus === 'success' ? (
              <>
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Logo OK
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Logo Error
              </>
            )}
          </button>
          
          {/* Panel de Debug */}
          {showDebugPanel && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 w-80 text-left">
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                🔍 Debug del Logo
              </h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-medium text-slate-700">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded ${
                    imageStatus === 'success' ? 'bg-green-100 text-green-700' :
                    imageStatus === 'loading' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {imageStatus === 'success' ? '✅ Éxito' :
                     imageStatus === 'loading' ? '⏳ Cargando' :
                     '❌ Error'}
                  </span>
                </div>
                
                {debugInfo.configuredUrl && (
                  <div>
                    <span className="font-medium text-slate-700">URL en .env:</span>
                    <div className="mt-1 p-2 bg-slate-50 rounded text-slate-600 font-mono">
                      {debugInfo.configuredUrl}
                    </div>
                  </div>
                )}
                
                {debugInfo.finalUrl && (
                  <div>
                    <span className="font-medium text-slate-700">URL final:</span>
                    <div className="mt-1 p-2 bg-slate-50 rounded text-slate-600 font-mono break-all">
                      {debugInfo.finalUrl}
                    </div>
                    <button
                      onClick={() => window.open(debugInfo.finalUrl, '_blank')}
                      className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Abrir en nueva pestaña
                    </button>
                  </div>
                )}
                
                {debugInfo.publicPath && (
                  <div>
                    <span className="font-medium text-slate-700">Ruta del archivo:</span>
                    <div className="mt-1 p-2 bg-slate-50 rounded text-slate-600 font-mono">
                      {debugInfo.publicPath}
                    </div>
                  </div>
                )}
                
                {debugInfo.message && (
                  <div className="border-t border-slate-200 pt-3">
                    <span className="font-medium text-slate-700">Mensaje:</span>
                    <div className="mt-1 text-slate-600">
                      {debugInfo.message}
                    </div>
                  </div>
                )}
                
                {debugInfo.solutions && (
                  <div className="border-t border-slate-200 pt-3">
                    <span className="font-medium text-slate-700">Soluciones:</span>
                    <ul className="mt-1 space-y-1 text-slate-600">
                      {debugInfo.solutions.map((solution, index) => (
                        <li key={index} className="text-xs">
                          • {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 🎨 SPINNER DE PUNTOS
const DotsSpinner = ({ size }) => {
  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };
  
  const dotSize = dotSizes[size] || dotSizes.md;
  
  return (
    <div className="flex space-x-1">
      <div className={`${dotSize} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`${dotSize} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`${dotSize} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

// 🏋️ SPINNER DEL GIMNASIO
const GymSpinner = ({ size }) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  const iconSize = iconSizes[size] || iconSizes.md;
  
  return (
    <div className="relative">
      <div className={`${iconSize} animate-spin text-primary-600`}>
        <Dumbbell className="w-full h-full" />
      </div>
      <div className="absolute inset-0 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div>
    </div>
  );
};

// 🎨 VARIANTES ESPECIALIZADAS
export const ButtonSpinner = ({ size = 'sm', color = 'white' }) => (
  <Loader2 className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} animate-spin text-${color}`} />
);

export const TableSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="md" message="Cargando datos..." type="dots" />
  </div>
);

export const CardSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <LoadingSpinner size="lg" message="Procesando..." type="gym" />
  </div>
);

export const InlineSpinner = ({ text = 'Procesando' }) => (
  <div className="flex items-center space-x-2">
    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
    <span className="text-sm text-slate-600">{text}...</span>
  </div>
);

// 📱 SPINNER DE PÁGINA INICIAL CON DEBUG
export const InitialLoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <div className="text-center">
      
      {/* Logo con debug */}
      <LogoWithDebug />
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">
          Elite Fitness Club
        </h2>
        <p className="text-slate-600">
          Cargando tu experiencia fitness...
        </p>
      </div>
      
      <div className="flex justify-center mb-6">
        <DotsSpinner size="lg" />
      </div>
      
      <div className="w-32 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
        <div className="w-full h-full bg-elite-gradient rounded-full animate-pulse"></div>
      </div>
      
      {/* Info adicional en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 text-xs text-slate-500">
          Modo desarrollo - Debug de logo habilitado
        </div>
      )}
    </div>
  </div>
);

export default LoadingSpinner;