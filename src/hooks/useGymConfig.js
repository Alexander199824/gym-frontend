// src/hooks/useGymConfig.js
// FUNCIÓN: Hook 100% OPTIMIZADO para configuración del gimnasio
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useGymConfig = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 10 * 60 * 1000, // 10 minutos - config casi nunca cambia
  } = options;

  // Estados
  const [config, setConfig] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`gymConfig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🚀 useGymConfig [${instanceId.current}] initialized`);

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchConfig = useCallback(async (attempt = 1, forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useGymConfig [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh && attempt === 1) {
      console.log(`⏸️ useGymConfig [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos (solo en attempt 1)
    if (!forceRefresh && attempt === 1 && config && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useGymConfig [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`🏢 useGymConfig [${instanceId.current}] Loading Gym Config - Attempt ${attempt}${forceRefresh ? ' (forced)' : ''}`);
      
      // Cancelar petición anterior si existe
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      // Crear nuevo AbortController
      fetchAbortController.current = new AbortController();

      if (attempt === 1) {
        setIsLoading(true);
        setError(null);
      }

      console.log('📡 Making request to /api/gym/config...');

      // 🎯 USAR REQUEST MANAGER - Evita peticiones duplicadas automáticamente
      const response = await requestManager.executeRequest(
        '/api/gym/config',
        () => apiService.getGymConfig(),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'high' // Config es crítico
        }
      );

      console.log('✅ Config response received:', response);

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useGymConfig [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let configData = null;
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: { name: "...", ... } }
        configData = response.data;
        console.log('📋 Config data structure:');
        console.log('  - Name:', configData.name);
        console.log('  - Description:', configData.description);
        console.log('  - Logo URL:', configData.logo?.url || '❌ MISSING');
        console.log('  - Contact info:', configData.contact ? '✅ Present' : '❌ MISSING');
        console.log('  - Social media:', configData.social ? `✅ ${Object.keys(configData.social).length} platforms` : '❌ MISSING');
        console.log('  - Hours:', configData.hours?.full || '❌ MISSING');
        console.log('  - Tagline:', configData.tagline || '❌ MISSING');
      } else if (response && response.name) {
        // Si el response ya es la data directamente
        configData = response;
        console.log('📋 Config data (direct):', configData.name);
      } else {
        console.warn('⚠️ Invalid config response structure:', response);
        throw new Error('Invalid response structure');
      }

      if (configData && configData.name) {
        setConfig(configData); // ✅ Guardamos solo la data, no el wrapper
        setIsLoaded(true);
        setError(null);
        setRetryCount(0);
        setLastFetch(Date.now());
        hasInitialLoad.current = true;
        console.log('🎉 Gym config loaded successfully!');
      } else {
        throw new Error('Config data missing required fields');
      }

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ Error loading config (attempt ${attempt}):`, err.message);
        
        setError(err);
        
        // Reintentar hasta 3 veces con backoff exponencial
        if (attempt < 3) {
          const delay = attempt * 1000; // 1s, 2s, 3s
          console.log(`🔄 Retrying in ${delay}ms...`);
          setTimeout(() => {
            if (mountedRef.current) {
              setRetryCount(prev => prev + 1);
              fetchConfig(attempt + 1, forceRefresh);
            }
          }, delay);
        } else {
          console.log('💥 Max retry attempts reached');
          setIsLoaded(true); // Marcar como cargado aunque falle
          hasInitialLoad.current = true;
        }
      }
    } finally {
      // Solo actualizar loading si es el último intento o éxito
      if (mountedRef.current && (attempt >= 3 || config)) {
        setIsLoading(false);
      }
      
      // Limpiar AbortController
      fetchAbortController.current = null;
    }
  }, [enabled, isLoading, config, lastFetch, staleTime]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const reload = useCallback(() => {
    console.log(`🔄 useGymConfig [${instanceId.current}] manual reload requested`);
    setRetryCount(0);
    return fetchConfig(1, true); // Forzar refresh
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
        hasInitialLoad.current = true;
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

  // Logs de estado cuando cambie config
  useEffect(() => {
    if (config) {
      console.log('🏢 Gym Config State Update:', {
        hasName: !!config.name,
        hasLogo: !!config.logo?.url,
        hasContact: !!config.contact,
        hasSocial: !!(config.social && Object.keys(config.social).length > 0),
        hasHours: !!config.hours,
        cacheAge: lastFetch ? Math.round((Date.now() - lastFetch) / 1000) + 's' : 'N/A'
      });
    }
  }, [config, lastFetch]);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Boolean(config && config.name);
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    config,          // ✅ Solo la data: { name: "...", description: "...", ... }
    isLoaded,        // true cuando terminó de cargar (exitoso o fallo)
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    retryCount,      // Número de reintentos
    
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