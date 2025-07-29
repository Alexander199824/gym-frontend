// src/components/debug/CacheDebugPanel.js
// FUNCIÓN: Panel de debug para monitorear el rendimiento del cache en desarrollo
// MUESTRA: Estadísticas en tiempo real, hit rate, peticiones ahorradas

import React, { useState, useEffect } from 'react';
import { useCache } from '../../contexts/CacheContext';
import { 
  BarChart3, Activity, Clock, Database, 
  Zap, TrendingUp, RefreshCw, X 
} from 'lucide-react';

const CacheDebugPanel = ({ show = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState({});
  const { getCacheStats, data, pending, clearCache } = useCache();

  // 📊 Actualizar estadísticas cada segundo
  useEffect(() => {
    const updateStats = () => {
      const cacheStats = getCacheStats();
      setStats(cacheStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    
    return () => clearInterval(interval);
  }, [getCacheStats]);

  // 🎯 Calcular métricas avanzadas
  const calculateAdvancedMetrics = () => {
    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests * 100) : 0;
    const savedRequests = stats.hits;
    const cacheEfficiency = hitRate > 0 ? 'Excelente' : hitRate > 50 ? 'Buena' : 'Baja';
    
    return {
      hitRate: hitRate.toFixed(1),
      savedRequests,
      efficiency: cacheEfficiency,
      totalRequests,
      memoryUsage: Object.keys(data).length,
      activePending: Object.keys(pending).length
    };
  };

  const metrics = calculateAdvancedMetrics();

  // 📊 Obtener detalles de cada entrada del cache
  const getCacheEntries = () => {
    return Object.entries(data).map(([key, entry]) => {
      const age = Date.now() - entry.timestamp;
      const ageFormatted = age < 60000 
        ? `${Math.floor(age / 1000)}s` 
        : `${Math.floor(age / 60000)}m ${Math.floor((age % 60000) / 1000)}s`;
      
      const ttlRemaining = entry.ttl - age;
      const ttlFormatted = ttlRemaining > 0 
        ? `${Math.floor(ttlRemaining / 60000)}m ${Math.floor((ttlRemaining % 60000) / 1000)}s`
        : 'Expirado';
      
      return {
        key: key.replace('api_', ''),
        age: ageFormatted,
        ttl: ttlFormatted,
        size: JSON.stringify(entry.data).length,
        expired: ttlRemaining <= 0
      };
    });
  };

  if (!show || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* 🎯 INDICADOR MINIMALISTA */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
        >
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <div className="text-xs">
              <div className="font-semibold text-gray-900">
                Cache: {metrics.hitRate}%
              </div>
              <div className="text-gray-600">
                {metrics.savedRequests} peticiones ahorradas
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📊 PANEL EXPANDIDO */}
      {isExpanded && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <h3 className="font-semibold">Cache Performance</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Métricas principales */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.hitRate}%
                </div>
                <div className="text-xs text-gray-600">Hit Rate</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.savedRequests}
                </div>
                <div className="text-xs text-gray-600">Peticiones Ahorradas</div>
              </div>
              
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="font-semibold text-gray-900">
                  {metrics.totalRequests}
                </div>
                <div className="text-gray-600">Total Requests</div>
              </div>
              
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="font-semibold text-gray-900">
                  {metrics.memoryUsage}
                </div>
                <div className="text-gray-600">Cached Items</div>
              </div>
              
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="font-semibold text-gray-900">
                  {metrics.activePending}
                </div>
                <div className="text-gray-600">Pending</div>
              </div>
              
            </div>

            {/* Eficiencia del cache */}
            <div className="mt-3 flex items-center justify-center">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metrics.efficiency === 'Excelente' ? 'bg-green-100 text-green-800' :
                metrics.efficiency === 'Buena' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                <Zap className="w-3 h-3 inline mr-1" />
                Eficiencia: {metrics.efficiency}
              </div>
            </div>
          </div>

          {/* Entradas del cache */}
          <div className="p-4 max-h-48 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Cache Entries:
            </h4>

            {getCacheEntries().length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-xs">No cache entries</div>
              </div>
            ) : (
              <div className="space-y-2">
                {getCacheEntries().map((entry) => (
                  <div 
                    key={entry.key}
                    className={`p-2 rounded text-xs border ${
                      entry.expired ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium capitalize">
                        {entry.key}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        entry.expired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {entry.expired ? 'Expired' : 'Valid'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-gray-600">
                      <span>Age: {entry.age}</span>
                      <span>TTL: {entry.ttl}</span>
                    </div>
                    
                    <div className="text-gray-500 mt-1">
                      Size: {(entry.size / 1024).toFixed(1)}KB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="border-t border-gray-200 p-4 flex space-x-2">
            <button
              onClick={clearCache}
              className="flex-1 bg-red-500 text-white text-xs py-2 px-3 rounded hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Clear Cache
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Reload Page
            </button>
          </div>

          {/* Footer info */}
          <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 text-center">
            Cache inteligente activo • Solo en desarrollo
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheDebugPanel;