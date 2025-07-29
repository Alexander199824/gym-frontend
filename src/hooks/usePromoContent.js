// src/hooks/usePromoContent.js
// FUNCIÓN: Hook 100% OPTIMIZADO para contenido promocional del gimnasio
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const usePromoContent = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 5 * 60 * 1000, // 5 minutos - promociones pueden cambiar más seguido
    activeOnly = true, // Solo promociones activas
    currentOnly = true, // Solo promociones vigentes (no expiradas)
  } = options;

  // Estados
  const [promoContent, setPromoContent] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`promoContent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🎉 usePromoContent [${instanceId.current}] hook initialized`);

  // 📱 Contenido promocional por defecto
  const defaultPromoContent = {
    banners: [],
    popups: [],
    discounts: [],
    announcements: [],
    specialOffers: []
  };

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchPromoContent = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ usePromoContent [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ usePromoContent [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && promoContent && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ usePromoContent [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`🎉 usePromoContent [${instanceId.current}] Fetching Promotional Content${forceRefresh ? ' (forced)' : ''}`);
      
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
        '/api/gym/promo-content',
        () => apiService.get('/gym/promo-content'),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'low' // Contenido promocional no es crítico
        }
      );

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ usePromoContent [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // Procesar respuesta
      let processedPromoContent = defaultPromoContent;

      if (response && response.success && response.data) {
        console.log('✅ Promotional content received:', response.data);
        
        // Estructurar contenido promocional
        processedPromoContent = {
          banners: response.data.banners || [],
          popups: response.data.popups || [],
          discounts: response.data.discounts || [],
          announcements: response.data.announcements || [],
          specialOffers: response.data.specialOffers || []
        };

        // Aplicar filtros
        if (activeOnly || currentOnly) {
          const now = new Date();
          
          Object.keys(processedPromoContent).forEach(key => {
            if (Array.isArray(processedPromoContent[key])) {
              processedPromoContent[key] = processedPromoContent[key].filter(item => {
                // Filtrar solo activos
                if (activeOnly && item.active === false) return false;
                
                // Filtrar solo vigentes (no expirados)
                if (currentOnly && item.expiresAt) {
                  const expiryDate = new Date(item.expiresAt);
                  if (expiryDate < now) return false;
                }
                
                // Filtrar solo que ya hayan iniciado
                if (currentOnly && item.startsAt) {
                  const startDate = new Date(item.startsAt);
                  if (startDate > now) return false;
                }
                
                return true;
              });
            }
          });
        }

        console.log('🎉 Promotional content processed:', {
          banners: processedPromoContent.banners.length,
          popups: processedPromoContent.popups.length,
          discounts: processedPromoContent.discounts.length,
          announcements: processedPromoContent.announcements.length,
          specialOffers: processedPromoContent.specialOffers.length
        });

      } else {
        console.warn('⚠️ No promotional content available or invalid response');
      }

      setPromoContent(processedPromoContent);
      setIsLoaded(true);
      setError(null);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ usePromoContent [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // En caso de error, usar contenido por defecto
        if (!promoContent) {
          setPromoContent(defaultPromoContent);
        }
        
        setIsLoaded(true);
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
  }, [enabled, isLoading, promoContent, lastFetch, staleTime, activeOnly, currentOnly]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const refresh = useCallback(() => {
    console.log(`🔄 usePromoContent [${instanceId.current}] manual refresh requested`);
    return fetchPromoContent(true);
  }, [fetchPromoContent]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ usePromoContent [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/gym/promo-content');
    setLastFetch(null);
  }, []);

  // 🔍 FUNCIÓN PARA OBTENER PROMOCIONES POR TIPO
  const getPromosByType = useCallback((type) => {
    if (!promoContent || !promoContent[type]) return [];
    return promoContent[type];
  }, [promoContent]);

  // 🔍 FUNCIÓN PARA OBTENER PROMOCIONES PRIORITARIAS
  const getPriorityPromos = useCallback(() => {
    if (!promoContent) return [];
    
    const allPromos = [
      ...promoContent.banners,
      ...promoContent.popups,
      ...promoContent.announcements,
      ...promoContent.specialOffers
    ];
    
    return allPromos
      .filter(promo => promo.priority === 'high' || promo.featured === true)
      .sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0));
  }, [promoContent]);

  // 🔍 FUNCIÓN PARA VERIFICAR SI HAY PROMOCIONES ACTIVAS
  const hasActivePromos = useCallback(() => {
    if (!promoContent) return false;
    
    return Object.values(promoContent).some(promos => 
      Array.isArray(promos) && promos.length > 0
    );
  }, [promoContent]);

  // 📊 FUNCIÓN PARA OBTENER ESTADÍSTICAS DE PROMOCIONES
  const getPromoStats = useCallback(() => {
    if (!promoContent) return null;
    
    const totalPromos = Object.values(promoContent).reduce((sum, promos) => 
      sum + (Array.isArray(promos) ? promos.length : 0), 0
    );
    
    const priorityPromos = getPriorityPromos().length;
    
    return {
      total: totalPromos,
      banners: promoContent.banners.length,
      popups: promoContent.popups.length,
      discounts: promoContent.discounts.length,
      announcements: promoContent.announcements.length,
      specialOffers: promoContent.specialOffers.length,
      priority: priorityPromos
    };
  }, [promoContent, getPriorityPromos]);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      !promoContent ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 usePromoContent [${instanceId.current}] initial fetch triggered`);
      fetchPromoContent();
    } else {
      console.log(`⏸️ usePromoContent [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (promoContent && !isLoaded) {
        setIsLoaded(true);
        hasInitialLoad.current = true;
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 usePromoContent [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 usePromoContent [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Boolean(promoContent && hasActivePromos());
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;
  const stats = getPromoStats();

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    promoContent: promoContent || defaultPromoContent,
    isLoaded,
    isLoading,
    error,
    lastFetch,
    
    // Funciones de control
    refresh,
    invalidate,
    
    // Funciones de utilidad
    getPromosByType,      // Obtener promociones por tipo
    getPriorityPromos,    // Obtener promociones prioritarias
    hasActivePromos,      // Verificar si hay promociones activas
    getPromoStats,        // Obtener estadísticas
    
    // Acceso directo a tipos de promociones
    banners: promoContent?.banners || [],
    popups: promoContent?.popups || [],
    discounts: promoContent?.discounts || [],
    announcements: promoContent?.announcements || [],
    specialOffers: promoContent?.specialOffers || [],
    
    // Información de estado
    hasValidData,
    isStale,
    cacheAge,
    stats,
    isEmpty: !hasActivePromos(),
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        activeOnly,
        currentOnly,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        dataStructure: promoContent ? {
          types: Object.keys(promoContent),
          totalItems: Object.values(promoContent).reduce((sum, arr) => 
            sum + (Array.isArray(arr) ? arr.length : 0), 0
          )
        } : null
      }
    })
  };
};

export default usePromoContent;