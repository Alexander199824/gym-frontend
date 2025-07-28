// src/components/common/ConnectionIndicator.js
// FUNCIÓN: Indicador discreto de conexión al backend (punto verde/rojo)
// UBICACIÓN: Esquina inferior derecha, solo visible si hay problemas

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import apiService from '../../services/apiService';

const ConnectionIndicator = ({ show = true }) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showDetails, setShowDetails] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  // ⏰ Verificar conexión periódicamente
  useEffect(() => {
    if (!show) return;

    // Verificación inicial
    checkConnection();

    // Verificar cada 30 segundos
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [show]);

  // 🔍 Función para verificar conexión
  const checkConnection = async () => {
    try {
      const result = await apiService.checkBackendConnection();
      
      if (result.connected) {
        setConnectionStatus('connected');
        setResponseTime(result.responseTime);
        setErrorDetails(null);
      } else {
        setConnectionStatus('disconnected');
        setErrorDetails({
          type: result.errorType || 'unknown',
          message: result.error || 'Error desconocido',
          suggestion: result.suggestion || 'Verifica la conexión'
        });
      }
      
      setLastCheck(new Date());
    } catch (error) {
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
          icon: CheckCircle,
          text: 'Conectado',
          description: `Conectado al backend${responseTime ? ` (${responseTime}ms)` : ''}`,
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
        
      case 'disconnected':
        return {
          color: 'bg-red-500',
          icon: WifiOff,
          text: 'Desconectado',
          description: 'Sin conexión al backend',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
        
      case 'error':
        return {
          color: 'bg-orange-500',
          icon: AlertTriangle,
          text: 'Error',
          description: 'Error de conexión',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
        
      case 'checking':
      default:
        return {
          color: 'bg-blue-500',
          icon: Loader,
          text: 'Verificando...',
          description: 'Verificando conexión...',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
    }
  };

  const config = getIndicatorConfig();

  // 🔍 Solo mostrar el indicador si hay problemas o en desarrollo
  const shouldShow = () => {
    // En desarrollo, siempre mostrar
    if (process.env.NODE_ENV === 'development') return true;
    
    // En producción, solo mostrar si hay problemas
    return connectionStatus !== 'connected';
  };

  if (!show || !shouldShow()) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* 🔴 Punto indicador */}
      <div
        className="relative cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
        title={config.description}
      >
        <div className={`w-3 h-3 rounded-full ${config.color} transition-all duration-300 ${
          connectionStatus === 'checking' ? 'animate-pulse' : ''
        } ${
          connectionStatus !== 'connected' ? 'animate-bounce' : ''
        }`} />
        
        {/* 🔔 Indicador de problema */}
        {connectionStatus !== 'connected' && connectionStatus !== 'checking' && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        )}
      </div>

      {/* 📋 Panel de detalles */}
      {showDetails && (
        <div className={`absolute bottom-6 right-0 w-80 ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4 transform transition-all duration-200`}>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <config.icon className={`w-4 h-4 ${config.textColor} mr-2 ${
                connectionStatus === 'checking' ? 'animate-spin' : ''
              }`} />
              <span className={`text-sm font-medium ${config.textColor}`}>
                {config.text}
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
              <span className={config.textColor}>{config.description}</span>
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
                <span className={`${responseTime < 500 ? 'text-green-600' : 
                                   responseTime < 1000 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {responseTime}ms
                </span>
              </div>
            )}
          </div>

          {/* Detalles del error */}
          {errorDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-gray-600">Tipo de error:</span>
                  <span className="ml-1 text-gray-700 font-mono">
                    {errorDetails.type}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Mensaje:</span>
                  <span className="ml-1 text-gray-700">
                    {errorDetails.message}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Sugerencia:</span>
                  <span className="ml-1 text-gray-700">
                    {errorDetails.suggestion}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-2">
            <button
              onClick={checkConnection}
              disabled={connectionStatus === 'checking'}
              className="flex-1 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {connectionStatus === 'checking' ? 'Verificando...' : 'Verificar'}
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => {
                  console.log('🔧 Estado de conexión:', {
                    status: connectionStatus,
                    lastCheck,
                    responseTime,
                    errorDetails,
                    backendUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000'
                  });
                }}
                className="flex-1 text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded hover:bg-blue-300"
              >
                Debug
              </button>
            )}
          </div>

          {/* Info de desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
              <div>Backend: {process.env.REACT_APP_API_URL || 'localhost:5000'}</div>
              <div>Modo: Desarrollo</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 🎯 VARIANTE SIMPLE - Solo el punto sin detalles
export const SimpleConnectionIndicator = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await apiService.checkBackendConnection();
        setConnectionStatus(result.connected ? 'connected' : 'disconnected');
      } catch (error) {
        setConnectionStatus('error');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const getColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  // Solo mostrar si hay problemas
  if (connectionStatus === 'connected' && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`w-3 h-3 rounded-full ${getColor()} ${
        connectionStatus === 'checking' ? 'animate-pulse' : 
        connectionStatus !== 'connected' ? 'animate-bounce' : ''
      }`} />
    </div>
  );
};

export default ConnectionIndicator;