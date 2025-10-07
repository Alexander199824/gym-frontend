// Autor: Alexander Echeverria
// src/hooks/useGymConfig.js
// FUNCIÓN: Hook optimizado ACTUALIZADO para conectar con test-gym-info-manager.js
// ✅ SIN DATOS HARDCODEADOS - TODO DESDE EL BACKEND

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import { useApp } from '../contexts/AppContext';
import { GymService } from '../services/gymService';
const gymService = new GymService();

const useGymConfig = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 30 * 60 * 1000, // 30 minutos
    priority = 'high'
  } = options;

  // Usar cache del AppContext
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

  console.log(`useGymConfig [${instanceId.current}] inicializado - conectado con test backend`);

  // Verificar cache al inicializar
  useEffect(() => {
    const cachedData = getCacheData('gymConfig');
    if (cachedData) {
      console.log(`useGymConfig [${instanceId.current}] restaurado desde cache:`, {
        name: cachedData.name,
        tagline: cachedData.tagline,
        hasLogo: !!cachedData.logo?.url,
        hasContact: !!cachedData.contact,
        hasSocial: !!cachedData.social
      });
      setConfig(cachedData);
      setIsLoaded(true);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;
    }
  }, [getCacheData]);

  // ✅ FUNCIÓN DE FETCH ACTUALIZADA PARA ENDPOINTS DEL TEST
  const fetchConfig = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current || !enabled) {
      console.log(`useGymConfig [${instanceId.current}] fetch omitido - deshabilitado`);
      return;
    }

    // Verificar cache válido primero
    if (!forceRefresh && isCacheValid('gymConfig')) {
      const cachedData = getCacheData('gymConfig');
      if (cachedData) {
        console.log(`useGymConfig [${instanceId.current}] usando cache válido`);
        setConfig(cachedData);
        setIsLoaded(true);
        setLastFetch(Date.now());
        return;
      }
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`useGymConfig [${instanceId.current}] fetch omitido - ya cargando`);
      return;
    }

    try {
      console.log(`useGymConfig [${instanceId.current}] 🏢 obteniendo configuración desde backend${forceRefresh ? ' (forzado)' : ''}...`);
      
      // Cancelar petición anterior si existe
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      fetchAbortController.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setDataLoading({ gymConfig: true });

      // ✅ USAR gymService.getGymConfig() - conecta con /api/gym/config
      const result = await requestManager.executeRequest(
        '/api/gym/config',
        () => gymService.getGymConfig(),
        {
          forceRefresh,
          ttl: staleTime,
          priority,
          signal: fetchAbortController.current.signal
        }
      );

      if (!mountedRef.current) {
        console.log(`useGymConfig [${instanceId.current}] componente desmontado, omitiendo actualización`);
        return;
      }

      // Extraer datos del response según estructura del test
      let configData = null;
      
      if (result && result.success && result.data) {
        configData = result.data;
      } else if (result && result.name) {
        configData = result;
      }

      if (configData) {
        console.log(`useGymConfig [${instanceId.current}] ✅ configuración cargada desde backend:`, {
          name: configData.name || 'N/A',
          tagline: configData.tagline || 'N/A',
          hasDescription: !!configData.description,
          hasLogo: !!configData.logo?.url,
          hasHero: !!configData.hero,
          hasContact: !!configData.contact,
          hasSocial: !!(configData.social && Object.keys(configData.social).length > 0),
          hasVideo: !!(configData.hero?.videoUrl),
          hasMultimedia: !!configData.multimedia
        });

        // Guardar en cache del AppContext
        setCacheData('gymConfig', configData);

        setConfig(configData);
        setError(null);
        setLastFetch(Date.now());
        hasInitialLoad.current = true;

        console.log(`useGymConfig [${instanceId.current}] ✅ guardado en cache del AppContext`);
      } else {
        throw new Error('No se recibió configuración del backend');
      }

    } catch (err) {
      if (mountedRef.current && err.name !== 'AbortError') {
        console.error(`useGymConfig [${instanceId.current}] ❌ error:`, err.message);
        setError(err);
        
        // En caso de error, intentar usar cache aunque esté expirado
        const expiredCache = getCacheData('gymConfig');
        if (expiredCache && !config) {
          console.log(`useGymConfig [${instanceId.current}] usando cache expirado como fallback`);
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

  // Función de refetch manual
  const refetch = useCallback(() => {
    console.log(`useGymConfig [${instanceId.current}] 🔄 refetch manual solicitado`);
    return fetchConfig(true);
  }, [fetchConfig]);

  // Función de invalidación
  const invalidate = useCallback(() => {
    console.log(`useGymConfig [${instanceId.current}] 🗑️ invalidando cache`);
    requestManager.invalidateCache('/api/gym/config');
    clearCacheItem('gymConfig');
    setLastFetch(null);
    setConfig(null);
    setIsLoaded(false);
    hasInitialLoad.current = false;
  }, [clearCacheItem]);

  // Efecto principal - Fetch inicial inteligente
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      (!config && !isCacheValid('gymConfig'))
    );

    if (shouldFetch) {
      console.log(`useGymConfig [${instanceId.current}] 🚀 fetch inicial activado`);
      fetchConfig();
    } else {
      console.log(`useGymConfig [${instanceId.current}] ⏭️ fetch inicial omitido`, {
        enabled,
        hasInitialLoad: hasInitialLoad.current,
        refetchOnMount,
        hasConfig: !!config,
        cacheValid: isCacheValid('gymConfig')
      });
      
      if (config && !isLoaded) {
        setIsLoaded(true);
      }
    }

    return () => {
      if (fetchAbortController.current) {
        console.log(`useGymConfig [${instanceId.current}] abortando fetch en cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount, config, isLoaded, fetchConfig, isCacheValid]);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`useGymConfig [${instanceId.current}] 👋 componente desmontándose`);
      mountedRef.current = false;
      
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // Refrescar cuando la página se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled && config && !isCacheValid('gymConfig')) {
        console.log(`useGymConfig [${instanceId.current}] 👁️ página visible, cache obsoleto, refrescando...`);
        fetchConfig();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, config, fetchConfig, isCacheValid]);

  // Propiedades computadas
  const hasValidData = Boolean(config && config.name);
  const isStale = !isCacheValid('gymConfig');
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;

  // ✅ FUNCIONES DE UTILIDAD ACTUALIZADAS SEGÚN ESTRUCTURA DEL TEST
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
    // Según test: config.hero.videoUrl
    return config.hero?.videoUrl || null;
  }, [config]);

  const getPosterUrl = useCallback(() => {
    if (!config) return null;
    // Según test: config.hero.imageUrl
    return config.hero?.imageUrl || null;
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

  // ✅ ACTUALIZADO: Redes sociales según estructura del test
  // Formato del test: { platform: { url, active, handle } }
  const getSocialLinks = useCallback(() => {
    if (!config?.social) return [];
    
    return Object.entries(config.social)
      .filter(([platform, data]) => {
        // Según test: data.active indica si está activa
        return data && data.url && data.active;
      })
      .map(([platform, data]) => ({
        platform,
        url: data.url,
        handle: data.handle || null,
        active: data.active
      }));
  }, [config]);

  // ✅ ACTUALIZADO: Información de contacto según estructura del test
  // Formato del test: config.contact = { phone, email, address, whatsapp, location, city }
  const getContactInfo = useCallback(() => {
    return {
      phone: config?.contact?.phone || null,
      email: config?.contact?.email || null,
      address: config?.contact?.address || null,
      whatsapp: config?.contact?.whatsapp || null,
      city: config?.contact?.city || null,
      location: config?.contact?.location || null,
      mapsUrl: config?.contact?.location?.mapsUrl || null
    };
  }, [config]);

  // ✅ FUNCIONES ADICIONALES SEGÚN TEST
  const getThemeColors = useCallback(() => {
    return {
      primary: config?.theme?.primaryColor || null,
      secondary: config?.theme?.secondaryColor || null,
      success: config?.theme?.successColor || null,
      warning: config?.theme?.warningColor || null,
      danger: config?.theme?.dangerColor || null
    };
  }, [config]);

  const getMultimediaInfo = useCallback(() => {
    if (!config?.multimedia) return null;
    
    return {
      hasAnyMedia: config.multimedia.hasAnyMedia || false,
      hasLogo: config.multimedia.hasLogo || false,
      hasVideo: config.multimedia.hasVideo || false,
      hasHeroImage: config.multimedia.hasHeroImage || false,
      imageType: config.multimedia.imageType || null
    };
  }, [config]);

  const getVideoConfig = useCallback(() => {
    if (!config?.hero?.videoConfig) return null;
    
    return {
      autoplay: config.hero.videoConfig.autoplay || false,
      muted: config.hero.videoConfig.muted || false,
      loop: config.hero.videoConfig.loop || false,
      controls: config.hero.videoConfig.controls || false
    };
  }, [config]);

  // Valor de retorno completo
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
    
    // Funciones de utilidad
    getLogoUrl,
    getVideoUrl,
    getPosterUrl,
    hasLogo,
    hasVideo,
    hasPoster,
    getSocialLinks,
    getContactInfo,
    getThemeColors,
    getMultimediaInfo,
    getVideoConfig,
    
    // Datos derivados (para comodidad)
    logoUrl: getLogoUrl(),
    videoUrl: getVideoUrl(),
    posterUrl: getPosterUrl(),
    socialLinks: getSocialLinks(),
    contactInfo: getContactInfo(),
    themeColors: getThemeColors(),
    multimediaInfo: getMultimediaInfo(),
    videoConfig: getVideoConfig(),
    
    // ✅ Datos básicos según test (SIN hardcodeo)
    gymName: config?.name || '',
    gymDescription: config?.description || '',
    gymTagline: config?.tagline || '',
    
    // Estados específicos para video/imagen
    hasMedia: hasVideo() || hasPoster(),
    mediaType: hasVideo() ? 'video' : hasPoster() ? 'image' : 'none',
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      mountedRef: mountedRef.current,
      staleTime,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        cacheValid: isCacheValid('gymConfig'),
        priority,
        backendConnected: true,
        testEndpoint: '/api/gym/config'
      }
    })
  };
};

export default useGymConfig;

/*
=============================================================================
HOOK useGymConfig - ACTUALIZADO PARA TEST-GYM-INFO-MANAGER.JS
=============================================================================

✅ CAMBIOS PRINCIPALES:
- Conectado con gymService.getGymConfig() -> /api/gym/config
- SIN datos hardcodeados - todo desde backend
- Estructura de datos según formato del test
- Funciones de utilidad actualizadas a estructura real

✅ FUNCIONES DISPONIBLES:
- getLogoUrl() - URL completa del logo
- getVideoUrl() - URL del video hero
- getPosterUrl() - URL de imagen hero
- getSocialLinks() - Array de redes sociales ACTIVAS
- getContactInfo() - Objeto completo de contacto
- getThemeColors() - Colores del tema
- getMultimediaInfo() - Info de multimedia disponible
- getVideoConfig() - Configuración del video

✅ ESTADOS RETORNADOS:
- config: Objeto completo de configuración
- isLoading: Indica si está cargando
- isLoaded: Indica si ya cargó
- error: Error si ocurre
- hasValidData: Verifica que hay datos válidos

✅ MANTIENE COMPATIBILIDAD:
- Cache persistente con AppContext
- Request Manager para optimización
- Todos los métodos existentes
- Debug info en desarrollo

Este hook está completamente sincronizado con el test backend
y NO tiene datos hardcodeados.
=============================================================================
*/