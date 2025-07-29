// src/hooks/useTestimonials.js
// FUNCIÓN: Hook 100% OPTIMIZADO para testimonios del gimnasio
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useTestimonials = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 8 * 60 * 1000, // 8 minutos - testimonios cambian poco
    activeOnly = true, // Filtrar solo testimonios activos
    verifiedOnly = false, // Solo testimonios verificados
    limit = null, // Límite de testimonios
  } = options;

  // Estados
  const [testimonials, setTestimonials] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`testimonials-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🚀 useTestimonials [${instanceId.current}] hook initialized`);

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchTestimonials = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useTestimonials [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ useTestimonials [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && testimonials && testimonials.length > 0 && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useTestimonials [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`💬 useTestimonials [${instanceId.current}] Loading Testimonials${forceRefresh ? ' (forced)' : ''}`);
      console.log('📡 Requesting testimonials...');
      
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
        '/api/gym/testimonials',
        () => apiService.getTestimonials(),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'low' // Testimonios no son críticos
        }
      );

      console.log('💬 Testimonials received:', response);

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useTestimonials [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let testimonialsData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, name: "...", ... }, ... ] }
        testimonialsData = response.data;
        console.log('💬 Testimonials data extracted:');
        console.log('  - Total testimonials:', testimonialsData.length);
        if (Array.isArray(testimonialsData)) {
          testimonialsData.forEach((testimonial, i) => {
            console.log(`  - Testimonial ${i + 1}: ${testimonial.name} (${testimonial.rating}⭐)`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        testimonialsData = response;
        console.log('💬 Testimonials data (direct array):', testimonialsData.length);
      } else {
        console.warn('⚠️ Invalid testimonials response structure:', response);
        // En lugar de lanzar error, usar array vacío
        testimonialsData = [];
      }

      // Aplicar filtros
      let processedTestimonials = Array.isArray(testimonialsData) ? [...testimonialsData] : [];

      // Filtrar solo testimonios activos
      if (activeOnly) {
        processedTestimonials = processedTestimonials.filter(testimonial => testimonial.active !== false);
      }

      // Filtrar solo testimonios verificados
      if (verifiedOnly) {
        processedTestimonials = processedTestimonials.filter(testimonial => testimonial.verified === true);
      }

      // Aplicar límite si está especificado
      if (limit && limit > 0) {
        processedTestimonials = processedTestimonials.slice(0, limit);
      }

      // Ordenar por fecha más reciente primero (si hay fecha)
      processedTestimonials.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
      });

      setTestimonials(processedTestimonials); // ✅ Guardamos solo la data procesada
      setIsLoaded(true);
      setError(null);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;
      console.log(`✅ Testimonials loaded successfully! (${processedTestimonials.length} ${activeOnly ? 'active' : 'total'})`);

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ useTestimonials [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // No limpiar testimonials anterior en caso de error, mantener datos previos
        if (testimonials.length === 0) {
          setTestimonials([]); // Fallback a array vacío
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
  }, [enabled, isLoading, testimonials, lastFetch, staleTime, activeOnly, verifiedOnly, limit]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const reload = useCallback(() => {
    console.log(`🔄 useTestimonials [${instanceId.current}] manual reload requested`);
    return fetchTestimonials(true);
  }, [fetchTestimonials]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useTestimonials [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/gym/testimonials');
    setLastFetch(null);
  }, []);

  // 🔍 FUNCIÓN PARA OBTENER TESTIMONIOS POR RATING
  const getTestimonialsByRating = useCallback((minRating = 5) => {
    return testimonials.filter(testimonial => 
      (testimonial.rating || 0) >= minRating
    );
  }, [testimonials]);

  // 🔍 FUNCIÓN PARA OBTENER TESTIMONIOS ALEATORIOS
  const getRandomTestimonials = useCallback((count = 3) => {
    if (testimonials.length === 0) return [];
    
    const shuffled = [...testimonials].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, [testimonials]);

  // 📊 FUNCIÓN PARA CALCULAR RATING PROMEDIO
  const getAverageRating = useCallback(() => {
    if (testimonials.length === 0) return 0;
    
    const totalRating = testimonials.reduce((sum, testimonial) => 
      sum + (testimonial.rating || 0), 0
    );
    
    return Math.round((totalRating / testimonials.length) * 10) / 10; // Redondear a 1 decimal
  }, [testimonials]);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      testimonials.length === 0 ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 useTestimonials [${instanceId.current}] initial fetch triggered`);
      fetchTestimonials();
    } else {
      console.log(`⏸️ useTestimonials [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (testimonials.length > 0 && !isLoaded) {
        setIsLoaded(true);
        hasInitialLoad.current = true;
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useTestimonials [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useTestimonials [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Array.isArray(testimonials) && testimonials.length > 0;
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;
  const verifiedCount = testimonials.filter(t => t.verified === true).length;
  const averageRating = getAverageRating();

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    testimonials,    // ✅ Solo la data: [ { id: 1, name: "...", text: "...", rating: 5 }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    
    // Funciones de control
    reload,          // Función para recargar manualmente
    invalidate,      // Función para invalidar cache
    
    // Funciones de utilidad
    getTestimonialsByRating,  // Filtrar por rating mínimo
    getRandomTestimonials,    // Obtener testimonios aleatorios
    getAverageRating,         // Calcular rating promedio
    
    // Información de estado
    hasValidData,
    isStale,
    lastFetch,
    cacheAge,
    verifiedCount,
    averageRating,
    isEmpty: testimonials.length === 0,
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        activeOnly,
        verifiedOnly,
        limit,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        dataStructure: {
          isArray: Array.isArray(testimonials),
          length: testimonials.length,
          filters: { activeOnly, verifiedOnly, limit },
          sampleTestimonial: testimonials[0] ? {
            hasId: !!testimonials[0].id,
            hasName: !!testimonials[0].name,
            hasText: !!testimonials[0].text,
            hasRating: !!testimonials[0].rating,
            isActive: testimonials[0].active !== false,
            isVerified: testimonials[0].verified === true
          } : null
        }
      }
    })
  };
};

export default useTestimonials;