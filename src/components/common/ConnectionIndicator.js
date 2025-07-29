// src/components/common/ConnectionIndicator.js
// FUNCIÓN: Indicador MINIMALISTA - Solo punto verde/rojo en esquina
// OPTIMIZADO: No hacer peticiones innecesarias, mejor cache

import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/apiService';

const ConnectionIndicator = ({ show = true }) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showDetails, setShowDetails] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  
  // Referencias para evitar memory leaks
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // ⏰ Verificar conexión con cache inteligente
  useEffect(() => {
    if (!show) return;

    // Verificación inicial
    checkConnection();

    // Verificar cada 60 segundos (reducido de 30s)
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        checkConnection();
      }
    }, 60000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show]);

  // 🔍 Función optimizada para verificar conexión
  const checkConnection = async () => {
    if (!isMountedRef.current) return;
    
    try {
      console.group('🔌 Connection Check');
      console.log('⏱️ Checking backend connection...');
      
      const result = await apiService.checkBackendConnection();
      
      if (!isMountedRef.current) return;
      
      if (result.connected) {
        console.log('✅ Backend is online');
        console.log(`⚡ Response time: ${result.responseTime}ms`);
        
        setConnectionStatus('connected');
        setResponseTime(result.responseTime);
        setErrorDetails(null);
      } else {
        console.warn('⚠️ Backend connection failed');
        console.log('🔍 Error type:', result.errorType);
        console.log('💡 Suggestion:', result.suggestion);
        
        setConnectionStatus('disconnected');
        setErrorDetails({
          type: result.errorType || 'unknown',
          message: result.error || 'Error desconocido',
          suggestion: result.suggestion || 'Verifica la conexión'
        });
      }
      
      setLastCheck(new Date());
      console.groupEnd();
      
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.group('❌ Connection Check Failed');
      console.error('Error during connection check:', error);
      console.groupEnd();
      
      setConnectionStatus('error');
      setErrorDetails({
        type: 'connection_failed',
        message: error.message,
        suggestion: 'No se pudo verificar la conexión'
      });
      setLastCheck(new Date());
    }
  };

  // 🎨 Obtener configuración del indicador según el estado
  const getIndicatorConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'bg-green-500',
          title: 'Conectado al backend',
          description: `Conectado${responseTime ? ` (${responseTime}ms)` : ''}`,
          pulse: false
        };
        
      case 'disconnected':
        return {
          color: 'bg-red-500',
          title: 'Sin conexión al backend',
          description: 'Sin conexión',
          pulse: true
        };
        
      case 'error':
        return {
          color: 'bg-orange-500',
          title: 'Error de conexión',
          description: 'Error',
          pulse: true
        };
        
      case 'checking':
      default:
        return {
          color: 'bg-blue-500',
          title: 'Verificando conexión...',
          description: 'Verificando...',
          pulse: true
        };
    }
  };

  const config = getIndicatorConfig();

  // 🔍 Solo mostrar si está configurado para mostrarse
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* 🔴 PUNTO INDICADOR MINIMALISTA */}
      <div
        className="relative cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
        title={config.title}
      >
        <div className={`w-3 h-3 rounded-full ${config.color} transition-all duration-300 ${
          config.pulse ? 'animate-pulse' : ''
        } hover:scale-125`} />
      </div>

      {/* 📋 PANEL DE DETALLES (Solo se muestra al hacer click) */}
      {showDetails && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          
          {/* Panel */}
          <div className="absolute bottom-6 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${config.color} mr-2`} />
                <span className="text-sm font-medium text-gray-900">
                  Estado de Conexión
                </span>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Estado actual */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className={`font-medium ${
                  connectionStatus === 'connected' ? 'text-green-600' :
                  connectionStatus === 'disconnected' ? 'text-red-600' :
                  connectionStatus === 'error' ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {config.description}
                </span>
              </div>
              
              {lastCheck && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Última verificación:</span>
                  <span className="text-gray-700">
                    {lastCheck.toLocaleTimeString()}
                  </span>
                </div>
              )}

              {responseTime && connectionStatus === 'connected' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Latencia:</span>
                  <span className={`${
                    responseTime < 500 ? 'text-green-600' : 
                    responseTime < 1000 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {responseTime}ms
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Backend URL:</span>
                <span className="text-gray-700 text-xs">
                  {process.env.REACT_APP_API_URL || 'localhost:5000'}
                </span>
              </div>
            </div>

            {/* Detalles del error */}
            {errorDetails && connectionStatus !== 'connected' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-gray-600">Problema:</span>
                    <span className="ml-1 text-red-600 font-medium">
                      {errorDetails.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Detalle:</span>
                    <span className="ml-1 text-gray-700 text-xs">
                      {errorDetails.message}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Solución:</span>
                    <span className="ml-1 text-blue-600 text-xs">
                      {errorDetails.suggestion}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={checkConnection}
                disabled={connectionStatus === 'checking'}
                className="w-full text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {connectionStatus === 'checking' ? 'Verificando...' : 'Verificar Conexión'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionIndicator;