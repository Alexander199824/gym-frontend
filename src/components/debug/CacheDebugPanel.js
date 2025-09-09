// Autor: Alexander Echeverria
// src/components/debug/CacheDebugPanel.js
// FUNCIÓN: Panel de debug para monitorear el rendimiento del cache en desarrollo
// MUESTRA: Estadísticas en tiempo real, tasa de aciertos, peticiones ahorradas

import React, { useState, useEffect } from 'react';
import { useCache } from '../../contexts/CacheContext';
import { 
  BarChart3, Activity, Clock, Database, 
  Zap, TrendingUp, RefreshCw, X, Bird 
} from 'lucide-react';

const CacheDebugPanel = ({ show = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState({});
  const { getCacheStats, data, pending, clearCache } = useCache();

  // Actualizar estadísticas cada segundo
  useEffect(() => {
    const updateStats = () => {
      const cacheStats = getCacheStats();
      setStats(cacheStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    
    return () => clearInterval(interval);
  }, [getCacheStats]);

  // Calcular métricas avanzadas
  const calculateAdvancedMetrics = () => {
    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests * 100) : 0;
    const savedRequests = stats.hits;
    const cacheEfficiency = hitRate > 70 ? 'Excelente' : hitRate > 50 ? 'Buena' : 'Baja';
    
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

  // Obtener detalles de cada entrada del cache
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
      {/* INDICADOR MINIMALISTA */}
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

      {/* PANEL EXPANDIDO */}
      {isExpanded && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <h3 className="font-semibold">Rendimiento de Cache</h3>
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
                <div className="text-xs text-gray-600">Tasa de Aciertos</div>
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
                <div className="text-gray-600">Total de Peticiones</div>
              </div>
              
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="font-semibold text-gray-900">
                  {metrics.memoryUsage}
                </div>
                <div className="text-gray-600">Elementos en Cache</div>
              </div>
              
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="font-semibold text-gray-900">
                  {metrics.activePending}
                </div>
                <div className="text-gray-600">Pendientes</div>
              </div>
              
            </div>

            {/* Eficiencia del cache */}
            <div className="mt-3 flex items-center justify-center">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                metrics.efficiency === 'Excelente' ? 'bg-green-100 text-green-800' :
                metrics.efficiency === 'Buena' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                <Bird className="w-3 h-3 inline mr-1" />
                Eficiencia: {metrics.efficiency}
              </div>
            </div>
          </div>

          {/* Entradas del cache */}
          <div className="p-4 max-h-48 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Entradas de Cache:
            </h4>

            {getCacheEntries().length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-xs">No hay entradas en cache</div>
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
                        {entry.expired ? 'Expirado' : 'Válido'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-gray-600">
                      <span>Antigüedad: {entry.age}</span>
                      <span>TTL: {entry.ttl}</span>
                    </div>
                    
                    <div className="text-gray-500 mt-1">
                      Tamaño: {(entry.size / 1024).toFixed(1)}KB
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
              Limpiar Cache
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Recargar Página
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

/*
DOCUMENTACIÓN DEL COMPONENTE CacheDebugPanel

PROPÓSITO:
Este componente proporciona una herramienta de debugging visual para monitorear
el rendimiento del sistema de cache en tiempo real durante el desarrollo de la
aplicación del gimnasio. Permite optimizar el rendimiento y diagnosticar problemas
de caching de manera eficiente.

FUNCIONALIDADES PRINCIPALES:
- Monitoreo en tiempo real de estadísticas de cache
- Indicador compacto con métricas clave (tasa de aciertos, peticiones ahorradas)
- Panel expandible con información detallada
- Visualización de entradas individuales del cache
- Métricas de eficiencia y rendimiento
- Controles para limpiar cache y recargar página
- Cálculo automático de TTL y edad de entradas

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTS REQUERIDOS:
- CacheContext (../../contexts/CacheContext): Sistema de cache de la aplicación
  - getCacheStats(): Obtiene estadísticas del cache
  - data: Datos almacenados en cache
  - pending: Peticiones pendientes
  - clearCache(): Limpia el cache completamente

COMPONENTES IMPORTADOS:
- Iconos de Lucide React: BarChart3, Activity, Clock, Database, Zap, TrendingUp, RefreshCw, X, Bird

UBICACIÓN EN LA APLICACIÓN:
- Esquina inferior izquierda (fixed bottom-4 left-4)
- Solo visible en modo desarrollo (NODE_ENV === 'development')
- Z-index alto para visibilidad sobre otros elementos

QUE MUESTRA AL USUARIO:
- Indicador minimalista: Porcentaje de cache y peticiones ahorradas
- Panel expandido con título "Rendimiento de Cache"
- Tasa de Aciertos en porcentaje con color verde
- Peticiones Ahorradas con color azul
- Total de Peticiones, Elementos en Cache y Pendientes
- Nivel de eficiencia (Excelente/Buena/Baja) con icono de quetzal
- Lista detallada de entradas de cache mostrando:
  - Nombre de la entrada
  - Estado (Válido/Expirado)
  - Antigüedad desde creación
  - TTL restante
  - Tamaño en KB
- Botones de acción: "Limpiar Cache" y "Recargar Página"
- Mensaje informativo: "Cache inteligente activo • Solo en desarrollo"

MÉTRICAS MONITOREADAS:
- Tasa de Aciertos: Porcentaje de aciertos del cache
- Peticiones Ahorradas: Número de requests evitados
- Total de Peticiones: Suma de hits y misses
- Elementos en Cache: Número de elementos en memoria
- Peticiones Pendientes: Peticiones en progreso
- Eficiencia General: Evaluación cualitativa del rendimiento

INFORMACIÓN DE ENTRADAS DE CACHE:
- Clave de identificación (sin prefijo 'api_')
- Antigüedad desde la creación
- TTL (Time To Live) restante
- Tamaño en KB
- Estado (válido/expirado)

ESTADOS VISUALES:
- Indicador compacto: Muestra tasa de aciertos y peticiones ahorradas
- Panel expandido: Información completa y detallada
- Entradas válidas: Fondo gris claro, borde gris
- Entradas expiradas: Fondo rojo claro, borde rojo

MÉTRICAS DE EFICIENCIA:
- Excelente: Tasa de aciertos > 70% (verde) con icono de quetzal
- Buena: Tasa de aciertos 50-70% (amarillo) con icono de quetzal
- Baja: Tasa de aciertos < 50% (rojo) con icono de quetzal

CASOS DE USO EN EL GIMNASIO:
- Optimización de carga de datos de membresías
- Monitoreo de cache de información de usuarios
- Análisis de rendimiento de APIs del gimnasio
- Debugging de problemas de datos obsoletos
- Optimización de consultas de estadísticas
- Mejora de experiencia de usuario en dashboards
- Monitoreo de transacciones en quetzales

CARACTERÍSTICAS TÉCNICAS:
- Actualización automática cada segundo
- Cálculos de métricas en tiempo real
- Formateo inteligente de tiempo (segundos/minutos)
- Cálculo automático de tamaños de datos
- Detección automática de entradas expiradas
- Limpieza de memoria y recarga de página

BENEFICIOS PARA DESARROLLO:
- Identificación rápida de problemas de cache
- Optimización de estrategias de TTL
- Monitoreo de uso de memoria
- Validación de políticas de cache
- Debugging de datos obsoletos
- Mejora de rendimiento general

CONTROLES DISPONIBLES:
- Expandir/colapsar panel principal
- Limpiar cache completamente
- Recargar página para reiniciar
- Cerrar panel expandido

RESTRICCIONES:
- Solo funciona en entorno de desarrollo
- Requiere CacheContext activo
- Depende de estadísticas del cache

INTEGRACIÓN CON EL SISTEMA:
- Monitorea cache de datos del gimnasio
- Incluye información de transacciones en quetzales
- Supervisa datos de usuarios y membresías
- Analiza rendimiento de APIs críticas

PERSONALIZACIÓN:
- Intervalos de actualización configurables
- Métricas mostradas ajustables
- Umbrales de eficiencia personalizables
- Posición y tamaño adaptables

Este componente es esencial para desarrolladores que necesitan optimizar
el rendimiento del cache en la aplicación del gimnasio, proporcionando
insights valiosos sobre el comportamiento del sistema de caching y
facilitando la identificación de oportunidades de mejora.
*/