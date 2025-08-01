// src/components/debug/RateLimitDebug.js
// FUNCIÓN: Componente de debugging para visualizar el rate limiting
// SOLO PARA DESARROLLO - Muestra estado de peticiones

import React, { useState, useEffect } from 'react';
import { useRequestCoordinatorStatus } from '../../hooks/useDebounced';
import { Activity, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';

const RateLimitDebug = ({ show = process.env.REACT_APP_DEBUG_MODE === 'true' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [requestLog, setRequestLog] = useState([]);
  const coordinatorStatus = useRequestCoordinatorStatus();

  // Estado del API service (si está disponible)
  const [apiServiceStatus, setApiServiceStatus] = useState(null);

  // Interceptar logs de consola para mostrar requests
  useEffect(() => {
    if (!show) return;

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addToLog = (type, message) => {
      const timestamp = new Date().toLocaleTimeString();
      setRequestLog(prev => [...prev.slice(-20), { // Solo últimos 20
        id: Date.now(),
        type,
        message,
        timestamp
      }]);
    };

    // Interceptar logs relevantes
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('API Request') || message.includes('Petición') || message.includes('Cache hit')) {
        addToLog('info', message);
      }
      originalLog(...args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('Rate limit') || message.includes('429') || message.includes('Error en')) {
        addToLog('warning', message);
      }
      originalWarn(...args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('API Error') || message.includes('Error en petición')) {
        addToLog('error', message);
      }
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [show]);

  // Obtener estado del apiService si está disponible
  useEffect(() => {
    const checkApiServiceStatus = async () => {
      try {
        const apiService = await import('../../services/apiService');
        if (apiService.default.getRateLimiterStatus) {
          setApiServiceStatus(apiService.default.getRateLimiterStatus());
        }
      } catch (error) {
        // ApiService no disponible o no tiene el método
      }
    };

    if (show && isVisible) {
      checkApiServiceStatus();
      const interval = setInterval(checkApiServiceStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [show, isVisible]);

  if (!show) return null;

  return (
    <>
      {/* Botón flotante para abrir/cerrar */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full shadow-lg transition-all duration-300 ${
          coordinatorStatus.activeRequests > 0 
            ? 'bg-yellow-500 text-white animate-pulse' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
        title="Debug Rate Limiting"
      >
        <Activity className="w-6 h-6 mx-auto" />
      </button>

      {/* Panel de debugging */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-40 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Rate Limit Debug
              </h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Estado del Coordinador */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Coordinador de Peticiones
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  coordinatorStatus.activeRequests > 0 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {coordinatorStatus.activeRequests}
                </div>
                <div className="text-gray-600">Activas</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  coordinatorStatus.queuedRequests > 0 ? 'text-orange-600' : 'text-gray-400'
                }`}>
                  {coordinatorStatus.queuedRequests}
                </div>
                <div className="text-gray-600">En Cola</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  coordinatorStatus.processing ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {coordinatorStatus.processing ? '🟢' : '⏸️'}
                </div>
                <div className="text-gray-600">Estado</div>
              </div>
            </div>
          </div>

          {/* Estado del API Service */}
          {apiServiceStatus && (
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                API Service
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    apiServiceStatus.queueLength > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {apiServiceStatus.queueLength}
                  </div>
                  <div className="text-gray-600">Cola API</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    apiServiceStatus.globalRequests > 50 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {apiServiceStatus.globalRequests}
                  </div>
                  <div className="text-gray-600">Globales</div>
                </div>
              </div>
            </div>
          )}

          {/* Log de Peticiones */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Log de Peticiones
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {requestLog.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-2">
                  No hay actividad reciente
                </div>
              ) : (
                requestLog.slice(-10).reverse().map(log => (
                  <div
                    key={log.id}
                    className={`text-xs p-2 rounded ${
                      log.type === 'error' ? 'bg-red-50 text-red-700' :
                      log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      {log.type === 'error' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : log.type === 'warning' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                    </div>
                    <div className="mt-1 font-mono text-xs">
                      {log.message.length > 80 
                        ? log.message.substring(0, 80) + '...' 
                        : log.message
                      }
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setRequestLog([])}
                className="flex-1 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
              >
                Limpiar Log
              </button>
              <button
                onClick={() => {
                  // Forzar refresco de todos los hooks
                  window.location.reload();
                }}
                className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Refresh All
              </button>
            </div>
          </div>

          {/* Footer con estado general */}
          <div className={`p-2 text-center text-xs ${
            coordinatorStatus.activeRequests > 5 ? 'bg-red-100 text-red-700' :
            coordinatorStatus.activeRequests > 0 ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {coordinatorStatus.activeRequests > 5 ? (
              '🔴 Alto tráfico - Posible rate limiting'
            ) : coordinatorStatus.activeRequests > 0 ? (
              '🟡 Peticiones en progreso'
            ) : (
              '🟢 Sistema estable'
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Versión simplificada para mostrar solo en consola
export const LogRateLimitStatus = () => {
  const status = useRequestCoordinatorStatus();

  useEffect(() => {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log('🚦 Rate Limit Status:', {
        activeRequests: status.activeRequests,
        queuedRequests: status.queuedRequests,
        processing: status.processing,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  }, [status]);

  return null;
};

export default RateLimitDebug;