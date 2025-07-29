// src/hooks/useGymConfig.js
// FUNCIÓN: Hook 100% OPTIMIZADO - Sin peticiones duplicadas
// MEJORAS: RequestManager + memoización + cleanup inteligente

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useGymConfig = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 10 * 60 * 1000, // 10 minutos
  } = options;

  // Estados
  const [config, setConfig] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);

  // ID único para este hook instance (para logs)
  const instanceId = useRef(`gymConfig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🚀 useGymConfig [${instanceId.current}] initialized`);

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA - Usa RequestManager
  const fetchConfig = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useGymConfig [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ useGymConfig [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && config && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useGymConfig [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`🏢 useGymConfig [${instanceId.current}] fetching${forceRefresh ? ' (forced)' : ''}...`);
      
      // Cancelar petición anterior si existe
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      // Crear nuevo AbortController
      fetchAbortController.current = new AbortController();

      setIsLoading(true);
      setError(null);

      // 🎯 USAR REQUEST MANAGER - Evita peticiones duplicadas automáticamente
      const result = await requestManager.executeRequest(
        '/api/gym/config',
        () => apiService.getGymConfig(),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'high' // Config es crítico
        }
      );

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useGymConfig [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // Extraer datos del response
      let configData = null;
      
      if (result && result.success && result.data) {
        configData = result.data;
      } else if (result && result.name) {
        // Si el response ya es la data directamente
        configData = result;
      }

      if (configData && configData.name) {
        console.log(`✅ useGymConfig [${instanceId.current}] data loaded:`, {
          name: configData.name,
          hasLogo: !!configData.logo?.url,
          hasContact: !!configData.contact,
          hasSocial: !!(configData.social && Object.keys(configData.social).length > 0)
        });

        setConfig(configData);
        setError(null);
        setLastFetch(Date.now());
      } else {
        throw new Error('Invalid config data structure');
      }

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ useGymConfig [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // No limpiar config anterior en caso de error, mantener datos previos
        if (!config) {
          setConfig(null);
        }
      }
    } finally {
      // Solo actualizar loading si el componente sigue montado
      if (mountedRef.current) {
        setIsLoading(false);
        setIsLoaded(true);
        hasInitialLoad.current = true;
      }
      
      // Limpiar AbortController
      fetchAbortController.current = null;
    }
  }, [enabled, isLoading, config, lastFetch, staleTime]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const refetch = useCallback(() => {
    console.log(`🔄 useGymConfig [${instanceId.current}] manual refetch requested`);
    return fetchConfig(true);
  }, [fetchConfig]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useGymConfig [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/gym/config');
    setLastFetch(null);
  }, []);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    // Solo hacer fetch inicial si:
    // 1. Está habilitado
    // 2. No hemos hecho el fetch inicial O refetchOnMount está activo
    // 3. No tenemos datos O los datos están stale
    
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      !config ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 useGymConfig [${instanceId.current}] initial fetch triggered`);
      fetchConfig();
    } else {
      console.log(`⏸️ useGymConfig [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (config && !isLoaded) {
        setIsLoaded(true);
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useGymConfig [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas para evitar re-runs

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useGymConfig [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Boolean(config && config.name);
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    config,
    isLoaded,
    isLoading,
    error,
    
    // Funciones de control
    refetch,
    invalidate,
    
    // Información de estado
    hasValidData,
    isStale,
    lastFetch,
    cacheAge,
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      mountedRef: mountedRef.current,
      staleTime,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        cacheAge: Math.round(cacheAge / 1000) + 's'
      }
    })
  };
};

export default useGymConfig;