// src/hooks/useGymConfig.js
// FUNCIÓN: Hook 100% OPTIMIZADO con cache persistente del AppContext
// INTEGRA: RequestManager + AppContext cache + persistencia entre navegaciones

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

const useGymConfig = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 30 * 60 * 1000, // 30 minutos (aumentado para persistencia)
    priority = 'high' // Config es crítico
  } = options;

  // 🎯 Usar cache del AppContext
  const { 
    getCacheData, 
    setCacheData, 
    isCacheValid, 
    setDataLoading,
    clearCacheItem 
  } = useApp();

  // Estados locales
  const [config, setConfig] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`gymConfig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🚀 useGymConfig [${instanceId.current}] initialized with AppContext cache`);

  // 🔍 Verificar cache al inicializar
  useEffect(() => {
    const cachedData = getCacheData('gymConfig');
    if (cachedData) {
      console.log(`✅ useGymConfig [${instanceId.current}] restored from cache:`, {
        name: cachedData.name,
        hasLogo: !!cachedData.logo?.url,
        hasContact: !!cachedData.contact
      });
      setConfig(cachedData);
      setIsLoaded(true);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;
    }
  }, [getCacheData]);

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con cache integrado
  const fetchConfig = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useGymConfig [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Verificar cache válido primero (excepto si es force refresh)
    if (!forceRefresh && isCacheValid('gymConfig')) {
      const cachedData = getCacheData('gymConfig');
      if (cachedData) {
        console.log(`✅ useGymConfig [${instanceId.current}] using valid cache`);
        setConfig(cachedData);
        setIsLoaded(true);
        setLastFetch(Date.now());
        return;
      }
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ useGymConfig [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    try {
      console.log(`🏢 useGymConfig [${instanceId.current}] fetching${forceRefresh ? ' (forced)' : ''}...`);
      
      // Cancelar petición anterior si existe
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      fetchAbortController.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setDataLoading({ gymConfig: true });

      // 🎯 USAR REQUEST MANAGER con cache del AppContext
      const result = await requestManager.executeRequest(
        '/api/gym/config',
        () => apiService.getGymConfig(),
        {
          forceRefresh,
          ttl: staleTime,
          priority,
          signal: fetchAbortController.current.signal
        }
      );

      if (!mountedRef.current) {
        console.log(`⚠️ useGymConfig [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // Extraer datos del response
      let configData = null;
      
      if (result && result.success && result.data) {
        configData = result.data;
      } else if (result && result.name) {
        configData = result;
      }

      if (configData && configData.name) {
        console.log(`✅ useGymConfig [${instanceId.current}] data loaded:`, {
          name: configData.name,
          hasLogo: !!configData.logo?.url,
          hasContact: !!configData.contact,
          hasSocial: !!(configData.social && Object.keys(configData.social).length > 0),
          hasHero: !!configData.hero,
          hasVideo: !!(configData.hero?.videoUrl || configData.videoUrl)
        });

        // 💾 Guardar en cache del AppContext
        setCacheData('gymConfig', configData);

        setConfig(configData);
        setError(null);
        setLastFetch(Date.now());
        hasInitialLoad.current = true;

        console.log(`💾 useGymConfig [${instanceId.current}] saved to AppContext cache`);
      } else {
        throw new Error('Invalid config data structure');
      }

    } catch (err) {
      if (mountedRef.current && err.name !== 'AbortError') {
        console.error(`❌ useGymConfig [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // En caso de error, intentar usar cache aunque esté expirado
        const expiredCache = getCacheData('gymConfig');
        if (expiredCache && !config) {
          console.log(`🔄 useGymConfig [${instanceId.current}] using expired cache as fallback`);
          setConfig(expiredCache);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsLoaded(true);
        setDataLoading({ gymConfig: false });
      }
      
      fetchAbortController.current = null;
    }
  }, [enabled, isLoading, config, lastFetch, staleTime, priority, getCacheData, setCacheData, isCacheValid, setDataLoading]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const refetch = useCallback(() => {
    console.log(`🔄 useGymConfig [${instanceId.current}] manual refetch requested`);
    return fetchConfig(true);
  }, [fetchConfig]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useGymConfig [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/gym/config');
    clearCacheItem('gymConfig');
    setLastFetch(null);
    setConfig(null);
    setIsLoaded(false);
    hasInitialLoad.current = false;
  }, [clearCacheItem]);

  // 🔥 EFECTO PRINCIPAL - Fetch inicial inteligente
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      (!config && !isCacheValid('gymConfig'))
    );

    if (shouldFetch) {
      console.log(`🚀 useGymConfig [${instanceId.current}] initial fetch triggered`);
      fetchConfig();
    } else {
      console.log(`⏸️ useGymConfig [${instanceId.current}] initial fetch skipped`, {
        enabled,
        hasInitialLoad: hasInitialLoad.current,
        refetchOnMount,
        hasConfig: !!config,
        cacheValid: isCacheValid('gymConfig')
      });
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (config && !isLoaded) {
        setIsLoaded(true);
      }
    }

    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useGymConfig [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount, config, isLoaded, fetchConfig, isCacheValid]);

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useGymConfig [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 🔄 Refrescar cuando la página se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled && config && !isCacheValid('gymConfig')) {
        console.log(`👁️ useGymConfig [${instanceId.current}] page visible, cache stale, refreshing...`);
        fetchConfig();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, config, fetchConfig, isCacheValid]);

  // 📊 PROPIEDADES COMPUTADAS
  const hasValidData = Boolean(config && config.name);
  const isStale = !isCacheValid('gymConfig');
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;

  // 🎯 FUNCIONES DE UTILIDAD PARA EL CONFIG
  const getLogoUrl = useCallback(() => {
    if (!config?.logo?.url) return null;
    
    const logoUrl = config.logo.url;
    if (logoUrl.startsWith('http')) return logoUrl;
    
    const baseUrl = window.location.origin;
    const cleanPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    return `${baseUrl}${cleanPath}`;
  }, [config]);

  const getVideoUrl = useCallback(() => {
    if (!config) return null;
    return config.hero?.videoUrl || config.videoUrl || null;
  }, [config]);

  const getPosterUrl = useCallback(() => {
    if (!config) return null;
    return config.hero?.imageUrl || config.imageUrl || null;
  }, [config]);

  const hasLogo = useCallback(() => {
    return !!(config?.logo?.url);
  }, [config]);

  const hasVideo = useCallback(() => {
    return !!(getVideoUrl());
  }, [getVideoUrl]);

  const hasPoster = useCallback(() => {
    return !!(getPosterUrl());
  }, [getPosterUrl]);

  const getSocialLinks = useCallback(() => {
    if (!config?.social) return [];
    
    return Object.entries(config.social)
      .filter(([platform, data]) => data && data.url && data.active)
      .map(([platform, data]) => ({
        platform,
        url: data.url,
        handle: data.handle,
        followers: data.followers
      }));
  }, [config]);

  const getContactInfo = useCallback(() => {
    return {
      phone: config?.contact?.phone || null,
      email: config?.contact?.email || null,
      address: config?.contact?.address || null,
      hours: config?.hours?.full || null
    };
  }, [config]);

  // 🎯 VALOR DE RETORNO COMPLETO
  return {
    // ✅ Datos principales
    config,
    isLoaded,
    isLoading,
    error,
    
    // 🔧 Funciones de control
    refetch,
    invalidate,
    
    // 📊 Información de estado
    hasValidData,
    isStale,
    lastFetch,
    cacheAge,
    
    // 🎯 Funciones de utilidad
    getLogoUrl,
    getVideoUrl,
    getPosterUrl,
    hasLogo,
    hasVideo,
    hasPoster,
    getSocialLinks,
    getContactInfo,
    
    // 📦 Datos derivados (para comodidad)
    logoUrl: getLogoUrl(),
    videoUrl: getVideoUrl(),
    posterUrl: getPosterUrl(),
    socialLinks: getSocialLinks(),
    contactInfo: getContactInfo(),
    
    // 🏢 Datos básicos de acceso rápido
    gymName: config?.name || 'Elite Fitness Club',
    gymDescription: config?.description || 'Tu transformación comienza aquí',
    gymTagline: config?.tagline || null,
    
    // 🎬 Estados específicos para video/imagen
    hasMedia: hasVideo() || hasPoster(),
    mediaType: hasVideo() ? 'video' : hasPoster() ? 'image' : 'none',
    
    // 🔍 Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      mountedRef: mountedRef.current,
      staleTime,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        cacheValid: isCacheValid('gymConfig'),
        priority
      }
    })
  };
};

export default useGymConfig;