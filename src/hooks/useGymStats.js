// src/hooks/useGymStats.js
// FUNCIÓN: Hook 100% OPTIMIZADO para estadísticas del gimnasio
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useGymStats = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 3 * 60 * 1000, // 3 minutos - stats pueden cambiar
  } = options;

  // Estados
  const [stats, setStats] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`gymStats-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`📊 useGymStats [${instanceId.current}] hook initialized`);

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchStats = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useGymStats [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ useGymStats [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && stats && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useGymStats [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`📊 useGymStats [${instanceId.current}] Fetching Gym Statistics${forceRefresh ? ' (forced)' : ''}`);
      console.log('📡 Making API request to /api/gym/stats');
      
      // Cancelar petición anterior si existe
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      // Crear nuevo AbortController
      fetchAbortController.current = new AbortController();

      setIsLoading(true);
      setError(null);

      // 🎯 USAR REQUEST MANAGER - Evita peticiones duplicadas automáticamente
      const response = await requestManager.executeRequest(
        '/api/gym/stats',
        () => apiService.getGymStats(),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'normal'
        }
      );

      console.log('✅ Stats response received:', response);

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useGymStats [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let statsData = null;
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: { members: 2000, ... } }
        statsData = response.data;
        console.log('📊 Stats data extracted:');
        console.log('  - Members:', statsData.members);
        console.log('  - Trainers:', statsData.trainers);
        console.log('  - Experience:', statsData.experience);
        console.log('  - Satisfaction:', statsData.satisfaction);
        console.log('  - Facilities:', statsData.facilities);
        if (statsData.customStats) {
          console.log('  - Custom Stats:', statsData.customStats.length);
        }
      } else if (response && response.members) {
        // Si el response ya es la data directamente
        statsData = response;
        console.log('📊 Stats data (direct):', statsData);
      } else {
        console.warn('⚠️ Invalid stats response structure:', response);
        throw new Error('Invalid response structure');
      }

      if (statsData) {
        setStats(statsData); // ✅ Guardamos solo la data, no el wrapper
        setIsLoaded(true);
        setError(null);
        setLastFetch(Date.now());
        hasInitialLoad.current = true;
        console.log('✅ Gym stats loaded successfully!');
      } else {
        throw new Error('Stats data is empty');
      }

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ useGymStats [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // No limpiar stats anterior en caso de error, mantener datos previos
        if (!stats) {
          setStats(null);
        }
        
        setIsLoaded(true); // Marcar como cargado aunque falle
        hasInitialLoad.current = true;
      }
    } finally {
      // Solo actualizar loading si el componente sigue montado
      if (mountedRef.current) {
        setIsLoading(false);
      }
      
      // Limpiar AbortController
      fetchAbortController.current = null;
    }
  }, [enabled, isLoading, stats, lastFetch, staleTime]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const reload = useCallback(() => {
    console.log(`🔄 useGymStats [${instanceId.current}] manual reload requested`);
    return fetchStats(true);
  }, [fetchStats]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useGymStats [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/gym/stats');
    setLastFetch(null);
  }, []);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      !stats ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 useGymStats [${instanceId.current}] initial fetch triggered`);
      fetchStats();
    } else {
      console.log(`⏸️ useGymStats [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (stats && !isLoaded) {
        setIsLoaded(true);
        hasInitialLoad.current = true;
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useGymStats [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useGymStats [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Boolean(stats && typeof stats.members === 'number');
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    stats,           // ✅ Solo la data: { members: 2000, trainers: 50, ... }
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    
    // Funciones de control
    reload,          // Función para recargar manualmente
    invalidate,      // Función para invalidar cache
    
    // Información de estado
    hasValidData,
    isStale,
    lastFetch,
    cacheAge,
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        dataStructure: stats ? {
          hasMembers: !!stats.members,
          hasTrainers: !!stats.trainers,
          hasExperience: !!stats.experience,
          hasSatisfaction: !!stats.satisfaction
        } : null
      }
    })
  };
};

export default useGymStats;