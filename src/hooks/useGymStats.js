// src/hooks/useGymStats.js
// FUNCIÓN: Hook optimizado para estadísticas del gym - Cache inteligente
// EVITA: Múltiples peticiones innecesarias al mismo endpoint

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// 🏠 CACHE GLOBAL para estadísticas
const globalStatsCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  error: null,
  subscribers: new Set()
};

// ⏰ TTL del cache: 5 minutos (las estadísticas cambian poco)
const CACHE_TTL = 5 * 60 * 1000;

const useGymStats = () => {
  const { setCacheData, getCacheData } = useApp();
  const [state, setState] = useState({
    stats: null,
    isLoaded: false,
    isLoading: false,
    error: null
  });
  
  const subscriberIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const isMountedRef = useRef(true);
  
  // 🔧 Función para actualizar estado de forma segura
  const safeSetState = (newState) => {
    if (isMountedRef.current) {
      setState(prevState => ({ ...prevState, ...newState }));
    }
  };
  
  // 🔧 Notificar a todos los subscribers
  const notifySubscribers = (data) => {
    globalStatsCache.subscribers.forEach(callback => {
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  };
  
  // 🔧 Obtener datos del cache
  const getFromCache = () => {
    // Verificar cache de AppContext primero
    const appCacheData = getCacheData('gymStats');
    if (appCacheData) {
      console.log('📦 Using AppContext cache for gym stats');
      return appCacheData;
    }
    
    // Verificar cache global
    if (globalStatsCache.data && globalStatsCache.timestamp) {
      const age = Date.now() - globalStatsCache.timestamp;
      if (age < CACHE_TTL) {
        console.log('📦 Using global cache for gym stats');
        return globalStatsCache.data;
      }
    }
    
    return null;
  };
  
  // 🔧 Guardar en cache
  const saveToCache = (data) => {
    globalStatsCache.data = data;
    globalStatsCache.timestamp = Date.now();
    globalStatsCache.error = null;
    
    setCacheData('gymStats', data);
    console.log('💾 Gym stats saved to cache');
  };
  
  // 🚀 Función principal para obtener estadísticas
  const fetchGymStats = async (force = false) => {
    // Si ya hay una petición en curso y no es forzada, esperar
    if (globalStatsCache.isLoading && !force) {
      console.log('⏳ Gym stats fetch already in progress, waiting...');
      return;
    }
    
    // Verificar cache primero (solo si no es forzada)
    if (!force) {
      const cachedData = getFromCache();
      if (cachedData) {
        safeSetState({
          stats: cachedData,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        return;
      }
    }
    
    // Marcar como cargando
    globalStatsCache.isLoading = true;
    safeSetState({ isLoading: true, error: null });
    
    try {
      console.group('📊 Fetching Gym Statistics');
      console.log('📡 Making API request to /api/gym/stats');
      
      const response = await apiService.getGymStats();
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, aborting update');
        console.groupEnd();
        return;
      }
      
      if (response.success && response.data) {
        console.log('✅ Gym stats received successfully');
        console.log('📋 Stats contains:', {
          members: response.data.members || 0,
          trainers: response.data.trainers || 0,
          experience: response.data.experience || 0,
          satisfaction: response.data.satisfaction || 0,
          customStats: response.data.customStats ? `✅ (${response.data.customStats.length})` : '❌'
        });
        
        // Guardar en cache
        saveToCache(response.data);
        
        // Actualizar estado
        const newState = {
          stats: response.data,
          isLoaded: true,
          isLoading: false,
          error: null
        };
        
        safeSetState(newState);
        notifySubscribers(newState);
        console.groupEnd();
        
      } else {
        throw new Error('Invalid response format from backend');
      }
      
    } catch (error) {
      console.group('❌ Gym Stats Fetch Failed');
      console.log('🔍 Error details:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📍 PROBLEM: /api/gym/stats endpoint not found');
        console.log('🔧 SOLUTION: Implement gym stats endpoint in backend');
        console.log('📋 EXPECTED RESPONSE:');
        console.log(`   {
     "success": true,
     "data": {
       "members": 150,
       "trainers": 12,
       "experience": 5,
       "satisfaction": 98
     }
   }`);
      } else if (error.response?.status === 500) {
        console.log('📍 PROBLEM: Backend internal error in stats calculation');
        console.log('🔧 SOLUTION: Check backend logs for database errors');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('📍 PROBLEM: Cannot connect to backend');
        console.log('🔧 SOLUTION: Verify backend is running');
      }
      
      console.groupEnd();
      
      const errorState = {
        stats: null,
        isLoaded: true,
        isLoading: false,
        error: error.message
      };
      
      safeSetState(errorState);
      globalStatsCache.error = error.message;
      globalStatsCache.isLoading = false;
      notifySubscribers(errorState);
    }
    
    globalStatsCache.isLoading = false;
  };
  
  // 🔧 Suscribirse a cambios en el cache global
  useEffect(() => {
    // Función de callback para recibir actualizaciones
    const handleCacheUpdate = (newState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    };
    
    // Suscribirse
    globalStatsCache.subscribers.add(handleCacheUpdate);
    
    // Verificar cache existente
    const cachedData = getFromCache();
    if (cachedData) {
      console.log('📦 Loading gym stats from existing cache');
      safeSetState({
        stats: cachedData,
        isLoaded: true,
        isLoading: false,
        error: null
      });
    } else if (!globalStatsCache.isLoading) {
      // Solo hacer fetch si no hay cache y no hay petición en curso
      fetchGymStats();
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      globalStatsCache.subscribers.delete(handleCacheUpdate);
    };
  }, []);
  
  // 🔄 Función para refrescar datos
  const refetch = () => {
    console.log('🔄 Force refreshing gym stats...');
    fetchGymStats(true);
  };
  
  // 🧹 Función para limpiar cache
  const clearCache = () => {
    console.log('🧹 Clearing gym stats cache...');
    globalStatsCache.data = null;
    globalStatsCache.timestamp = null;
    globalStatsCache.error = null;
    
    safeSetState({
      stats: null,
      isLoaded: false,
      isLoading: false,
      error: null
    });
  };
  
  return {
    stats: state.stats,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    clearCache,
    
    // Funciones de utilidad
    hasValidStats: !!state.stats,
    cacheAge: globalStatsCache.timestamp ? Date.now() - globalStatsCache.timestamp : null,
    isCacheValid: globalStatsCache.timestamp ? (Date.now() - globalStatsCache.timestamp) < CACHE_TTL : false
  };
};

export default useGymStats;