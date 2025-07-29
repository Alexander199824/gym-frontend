// src/hooks/useGymServices.js
// FUNCIÓN: Hook 100% OPTIMIZADO para servicios del gimnasio
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useGymServices = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 15 * 60 * 1000, // 15 minutos - servicios muy estáticos
    activeOnly = true, // Filtrar solo servicios activos
  } = options;

  // Estados
  const [services, setServices] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`gymServices-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🏋️ useGymServices [${instanceId.current}] hook initialized`);

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchServices = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useGymServices [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ useGymServices [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && services && services.length > 0 && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useGymServices [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`🏋️ useGymServices [${instanceId.current}] Fetching Gym Services${forceRefresh ? ' (forced)' : ''}`);
      console.log('📡 Making API request to /api/gym/services');
      
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
        '/api/gym/services',
        () => apiService.getGymServices(),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'normal'
        }
      );

      console.log('✅ Services response received:', response);

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useGymServices [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let servicesData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, title: "...", ... }, ... ] }
        servicesData = response.data;
        console.log('🏋️ Services data extracted:');
        console.log('  - Total services:', servicesData.length);
        if (Array.isArray(servicesData)) {
          servicesData.forEach((service, i) => {
            console.log(`  - Service ${i + 1}: ${service.title} (Active: ${service.active !== false})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        servicesData = response;
        console.log('🏋️ Services data (direct array):', servicesData.length);
      } else {
        console.warn('⚠️ Invalid services response structure:', response);
        // En lugar de lanzar error, usar array vacío
        servicesData = [];
      }

      // Filtrar solo servicios activos si está habilitado
      const processedServices = activeOnly && Array.isArray(servicesData)
        ? servicesData.filter(service => service.active !== false)
        : servicesData;

      setServices(processedServices); // ✅ Guardamos solo la data, no el wrapper
      setIsLoaded(true);
      setError(null);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;
      console.log(`✅ Gym services loaded successfully! (${processedServices.length} ${activeOnly ? 'active' : 'total'})`);

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ useGymServices [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // No limpiar services anterior en caso de error, mantener datos previos
        if (services.length === 0) {
          setServices([]); // Fallback a array vacío
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
  }, [enabled, isLoading, services, lastFetch, staleTime, activeOnly]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const reload = useCallback(() => {
    console.log(`🔄 useGymServices [${instanceId.current}] manual reload requested`);
    return fetchServices(true);
  }, [fetchServices]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useGymServices [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/gym/services');
    setLastFetch(null);
  }, []);

  // 🔍 FUNCIÓN PARA OBTENER SERVICIO POR ID
  const getServiceById = useCallback((id) => {
    return services.find(service => service.id === id) || null;
  }, [services]);

  // 🔍 FUNCIÓN PARA FILTRAR SERVICIOS
  const getServicesByCategory = useCallback((category) => {
    return services.filter(service => 
      service.category?.toLowerCase() === category.toLowerCase()
    );
  }, [services]);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      services.length === 0 ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 useGymServices [${instanceId.current}] initial fetch triggered`);
      fetchServices();
    } else {
      console.log(`⏸️ useGymServices [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (services.length > 0 && !isLoaded) {
        setIsLoaded(true);
        hasInitialLoad.current = true;
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useGymServices [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useGymServices [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Array.isArray(services) && services.length > 0;
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;
  const activeServicesCount = services.filter(service => service.active !== false).length;
  const totalServicesCount = services.length;

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    services,        // ✅ Solo la data: [ { id: 1, title: "...", ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    
    // Funciones de control
    reload,          // Función para recargar manualmente
    invalidate,      // Función para invalidar cache
    
    // Funciones de utilidad
    getServiceById,      // Obtener servicio por ID
    getServicesByCategory, // Filtrar por categoría
    
    // Información de estado
    hasValidData,
    isStale,
    lastFetch,
    cacheAge,
    activeServicesCount,
    totalServicesCount,
    isEmpty: services.length === 0,
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        activeOnly,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        dataStructure: {
          isArray: Array.isArray(services),
          length: services.length,
          hasActiveFilter: activeOnly,
          sampleService: services[0] ? {
            hasId: !!services[0].id,
            hasTitle: !!services[0].title,
            hasDescription: !!services[0].description,
            isActive: services[0].active !== false
          } : null
        }
      }
    })
  };
};

export default useGymServices;