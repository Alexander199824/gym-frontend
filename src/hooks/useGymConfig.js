// src/hooks/useGymConfig.js
// FUNCIÓN: Hook optimizado para configuración del gym - SIN peticiones múltiples
// CACHE INTELIGENTE: Evita refetch innecesario

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// 🏠 CACHE GLOBAL para evitar múltiples peticiones de la misma data
const globalCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  error: null,
  subscribers: new Set()
};

// ⏰ TTL del cache: 10 minutos
const CACHE_TTL = 10 * 60 * 1000;

const useGymConfig = () => {
  const { setCacheData, getCacheData, isCacheValid } = useApp();
  const [state, setState] = useState({
    config: null,
    isLoaded: false,
    isLoading: false,
    error: null
  });
  
  const subscriberIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const isMountedRef = useRef(true);
  
  // 🔧 Función para actualizar estado solo si el componente está montado
  const safeSetState = (newState) => {
    if (isMountedRef.current) {
      setState(prevState => ({ ...prevState, ...newState }));
    }
  };
  
  // 🔧 Función para notificar a todos los subscribers
  const notifySubscribers = (data) => {
    globalCache.subscribers.forEach(callback => {
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  };
  
  // 🔧 Función para obtener datos del cache
  const getFromCache = () => {
    // Verificar cache de AppContext primero
    const appCacheData = getCacheData('gymConfig');
    if (appCacheData) {
      console.log('📦 Using AppContext cache for gym config');
      return appCacheData;
    }
    
    // Verificar cache global
    if (globalCache.data && globalCache.timestamp) {
      const age = Date.now() - globalCache.timestamp;
      if (age < CACHE_TTL) {
        console.log('📦 Using global cache for gym config');
        return globalCache.data;
      }
    }
    
    return null;
  };
  
  // 🔧 Función para guardar en cache
  const saveToCache = (data) => {
    // Guardar en cache global
    globalCache.data = data;
    globalCache.timestamp = Date.now();
    globalCache.error = null;
    
    // Guardar en AppContext cache
    setCacheData('gymConfig', data);
    
    console.log('💾 Gym config saved to cache');
  };
  
  // 🚀 Función principal para obtener configuración
  const fetchGymConfig = async (force = false) => {
    const subscriberId = subscriberIdRef.current;
    
    // Si ya hay una petición en curso y no es forzada, esperar
    if (globalCache.isLoading && !force) {
      console.log('⏳ Gym config fetch already in progress, waiting...');
      return;
    }
    
    // Verificar cache primero (solo si no es forzada)
    if (!force) {
      const cachedData = getFromCache();
      if (cachedData) {
        safeSetState({
          config: cachedData,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        return;
      }
    }
    
    // Marcar como cargando
    globalCache.isLoading = true;
    safeSetState({ isLoading: true, error: null });
    
    try {
      console.group('🏢 Fetching Gym Configuration');
      console.log('📡 Making API request to /api/gym/config');
      
      const response = await apiService.getGymConfig();
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, aborting update');
        console.groupEnd();
        return;
      }
      
      if (response.success && response.data) {
        console.log('✅ Gym config received successfully');
        console.log('📋 Config contains:', {
          name: response.data.name ? '✅' : '❌',
          logo: response.data.logo ? '✅' : '❌',
          contact: response.data.contact ? '✅' : '❌',
          social: response.data.social ? `✅ (${Object.keys(response.data.social).length} platforms)` : '❌',
          hours: response.data.hours ? '✅' : '❌'
        });
        
        // Guardar en cache
        saveToCache(response.data);
        
        // Actualizar estado
        const newState = {
          config: response.data,
          isLoaded: true,
          isLoading: false,
          error: null
        };
        
        safeSetState(newState);
        
        // Notificar a otros subscribers
        notifySubscribers(newState);
        
        console.groupEnd();
        
      } else {
        throw new Error('Invalid response format from backend');
      }
      
    } catch (error) {
      console.group('❌ Gym Config Fetch Failed');
      console.log('🔍 Error details:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📍 PROBLEM: /api/gym/config endpoint not found');
        console.log('🔧 SOLUTION: Implement gym config endpoint in backend');
        console.log('📋 EXPECTED RESPONSE:');
        console.log(`   {
     "success": true,
     "data": {
       "name": "Gym Name",
       "logo": { "url": "logo.png" },
       "contact": { "phone": "123", "address": "..." }
     }
   }`);
      } else if (error.response?.status === 500) {
        console.log('📍 PROBLEM: Backend internal error');
        console.log('🔧 SOLUTION: Check backend logs for details');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('📍 PROBLEM: Cannot connect to backend');
        console.log('🔧 SOLUTION: Start backend server');
      }
      
      console.groupEnd();
      
      const errorState = {
        config: null,
        isLoaded: true, // Marcamos como cargado para no mostrar loading infinito
        isLoading: false,
        error: error.message
      };
      
      safeSetState(errorState);
      
      // Actualizar cache global con error
      globalCache.error = error.message;
      globalCache.isLoading = false;
      
      // Notificar error a subscribers
      notifySubscribers(errorState);
    }
    
    globalCache.isLoading = false;
  };
  
  // 🔧 Suscribirse a cambios en el cache global
  useEffect(() => {
    const subscriberId = subscriberIdRef.current;
    
    // Función de callback para recibir actualizaciones
    const handleCacheUpdate = (newState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    };
    
    // Suscribirse a cambios
    globalCache.subscribers.add(handleCacheUpdate);
    
    // Verificar si ya hay datos en cache
    const cachedData = getFromCache();
    if (cachedData) {
      console.log('📦 Loading gym config from existing cache');
      safeSetState({
        config: cachedData,
        isLoaded: true,
        isLoading: false,
        error: null
      });
    } else if (!globalCache.isLoading) {
      // Solo hacer fetch si no hay cache y no hay petición en curso
      fetchGymConfig();
    }
    
    // Cleanup al desmontar
    return () => {
      isMountedRef.current = false;
      globalCache.subscribers.delete(handleCacheUpdate);
    };
  }, []); // Empty dependency array - solo ejecutar una vez
  
  // 🔄 Función para refrescar datos (force reload)
  const refetch = () => {
    console.log('🔄 Force refreshing gym config...');
    fetchGymConfig(true);
  };
  
  // 🧹 Función para limpiar cache
  const clearCache = () => {
    console.log('🧹 Clearing gym config cache...');
    globalCache.data = null;
    globalCache.timestamp = null;
    globalCache.error = null;
    
    safeSetState({
      config: null,
      isLoaded: false,
      isLoading: false,
      error: null
    });
  };
  
  return {
    config: state.config,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    clearCache,
    
    // Funciones de utilidad
    hasValidConfig: !!state.config,
    configAge: globalCache.timestamp ? Date.now() - globalCache.timestamp : null,
    isCacheValid: globalCache.timestamp ? (Date.now() - globalCache.timestamp) < CACHE_TTL : false
  };
};

export default useGymConfig;

// 📝 OPTIMIZACIONES APLICADAS:
// ✅ Cache global compartido entre instancias del hook
// ✅ Evita peticiones múltiples simultáneas
// ✅ Sistema de suscriptores para sincronizar estado
// ✅ Verificación de componente montado antes de actualizar estado
// ✅ Cache con TTL de 10 minutos
// ✅ Logs informativos y agrupados
// ✅ Mejor manejo de errores con contexto
// ✅ Función refetch para force reload
// ✅ Función clearCache para limpiar datos
// ✅ Integración con AppContext cache