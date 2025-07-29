// src/hooks/useNavigation.js
// FUNCIÓN: Hook 100% OPTIMIZADO para navegación del gimnasio
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useNavigation = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 30 * 60 * 1000, // 30 minutos - navegación muy estática
    includeHidden = false, // Incluir elementos ocultos
    userRole = null, // Filtrar por rol de usuario
  } = options;

  // Estados
  const [navigation, setNavigation] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`navigation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🧭 useNavigation [${instanceId.current}] hook initialized`);

  // 📱 Navegación por defecto
  const defaultNavigation = {
    main: [
      { id: 'home', label: 'Inicio', href: '/', order: 1, visible: true },
      { id: 'services', label: 'Servicios', href: '#servicios', order: 2, visible: true },
      { id: 'plans', label: 'Planes', href: '#planes', order: 3, visible: true },
      { id: 'store', label: 'Tienda', href: '#tienda', order: 4, visible: true },
      { id: 'contact', label: 'Contacto', href: '#contacto', order: 5, visible: true }
    ],
    footer: [
      { id: 'about', label: 'Acerca de', href: '/about', order: 1, visible: true },
      { id: 'privacy', label: 'Privacidad', href: '/privacy', order: 2, visible: true },
      { id: 'terms', label: 'Términos', href: '/terms', order: 3, visible: true }
    ],
    dashboard: [],
    mobile: []
  };

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchNavigation = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useNavigation [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ useNavigation [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && navigation && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useNavigation [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`🧭 useNavigation [${instanceId.current}] Fetching Navigation${forceRefresh ? ' (forced)' : ''}`);
      
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
        '/api/gym/navigation',
        () => apiService.getNavigation(),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'low' // Navegación no es crítica
        }
      );

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useNavigation [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // Procesar respuesta
      let processedNavigation = defaultNavigation;

      if (response && response.success && response.data) {
        console.log('✅ Navigation received:', response.data);
        
        processedNavigation = {
          main: response.data.main || defaultNavigation.main,
          footer: response.data.footer || defaultNavigation.footer,
          dashboard: response.data.dashboard || [],
          mobile: response.data.mobile || []
        };

        // Aplicar filtros
        Object.keys(processedNavigation).forEach(section => {
          if (Array.isArray(processedNavigation[section])) {
            processedNavigation[section] = processedNavigation[section]
              .filter(item => {
                // Filtrar elementos ocultos si no se incluyen
                if (!includeHidden && item.visible === false) return false;
                
                // Filtrar por rol si está especificado
                if (userRole && item.roles && Array.isArray(item.roles)) {
                  if (!item.roles.includes(userRole)) return false;
                }
                
                return true;
              })
              .sort((a, b) => (a.order || 0) - (b.order || 0)); // Ordenar por order
          }
        });

        console.log('🧭 Navigation processed:', {
          main: processedNavigation.main.length,
          footer: processedNavigation.footer.length,
          dashboard: processedNavigation.dashboard.length,
          mobile: processedNavigation.mobile.length
        });

      } else {
        console.warn('⚠️ No navigation data available, using defaults');
      }

      setNavigation(processedNavigation);
      setIsLoaded(true);
      setError(null);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ useNavigation [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // En caso de error, usar navegación por defecto
        if (!navigation) {
          setNavigation(defaultNavigation);
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
  }, [enabled, isLoading, navigation, lastFetch, staleTime, includeHidden, userRole]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const refresh = useCallback(() => {
    console.log(`🔄 useNavigation [${instanceId.current}] manual refresh requested`);
    return fetchNavigation(true);
  }, [fetchNavigation]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useNavigation [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/gym/navigation');
    setLastFetch(null);
  }, []);

  // 🔍 FUNCIÓN PARA OBTENER NAVEGACIÓN POR SECCIÓN
  const getNavigationBySection = useCallback((section) => {
    if (!navigation || !navigation[section]) return [];
    return navigation[section];
  }, [navigation]);

  // 🔍 FUNCIÓN PARA OBTENER ITEM POR ID
  const getNavigationItemById = useCallback((id) => {
    if (!navigation) return null;
    
    for (const section of Object.values(navigation)) {
      if (Array.isArray(section)) {
        const item = section.find(item => item.id === id);
        if (item) return item;
      }
    }
    
    return null;
  }, [navigation]);

  // 🔍 FUNCIÓN PARA VERIFICAR SI HAY NAVEGACIÓN
  const hasNavigation = useCallback(() => {
    if (!navigation) return false;
    
    return Object.values(navigation).some(section => 
      Array.isArray(section) && section.length > 0
    );
  }, [navigation]);

  // 📊 FUNCIÓN PARA OBTENER ESTADÍSTICAS DE NAVEGACIÓN
  const getNavigationStats = useCallback(() => {
    if (!navigation) return null;
    
    const totalItems = Object.values(navigation).reduce((sum, section) => 
      sum + (Array.isArray(section) ? section.length : 0), 0
    );
    
    const visibleItems = Object.values(navigation).reduce((sum, section) => 
      sum + (Array.isArray(section) ? section.filter(item => item.visible !== false).length : 0), 0
    );
    
    return {
      total: totalItems,
      visible: visibleItems,
      hidden: totalItems - visibleItems,
      main: navigation.main?.length || 0,
      footer: navigation.footer?.length || 0,
      dashboard: navigation.dashboard?.length || 0,
      mobile: navigation.mobile?.length || 0
    };
  }, [navigation]);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      !navigation ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 useNavigation [${instanceId.current}] initial fetch triggered`);
      fetchNavigation();
    } else {
      console.log(`⏸️ useNavigation [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (navigation && !isLoaded) {
        setIsLoaded(true);
        hasInitialLoad.current = true;
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useNavigation [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useNavigation [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Boolean(navigation && hasNavigation());
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;
  const stats = getNavigationStats();

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    navigation: navigation || defaultNavigation,
    isLoaded,
    isLoading,
    error,
    lastFetch,
    
    // Funciones de control
    refresh,
    invalidate,
    
    // Funciones de utilidad
    getNavigationBySection,    // Obtener navegación por sección
    getNavigationItemById,     // Obtener item por ID
    hasNavigation,             // Verificar si hay navegación
    getNavigationStats,        // Obtener estadísticas
    
    // Acceso directo a secciones
    mainNavigation: navigation?.main || defaultNavigation.main,
    footerNavigation: navigation?.footer || defaultNavigation.footer,
    dashboardNavigation: navigation?.dashboard || [],
    mobileNavigation: navigation?.mobile || [],
    
    // Información de estado
    hasValidData,
    isStale,
    cacheAge,
    stats,
    isEmpty: !hasNavigation(),
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        includeHidden,
        userRole,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        dataStructure: navigation ? {
          sections: Object.keys(navigation),
          totalItems: Object.values(navigation).reduce((sum, arr) => 
            sum + (Array.isArray(arr) ? arr.length : 0), 0
          )
        } : null
      }
    })
  };
};

export default useNavigation;