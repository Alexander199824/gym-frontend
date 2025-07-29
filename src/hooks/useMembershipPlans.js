// src/hooks/useMembershipPlans.js
// FUNCIÓN: Hook 100% OPTIMIZADO para planes de membresía del gimnasio
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useMembershipPlans = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 20 * 60 * 1000, // 20 minutos - planes muy estáticos
    activeOnly = true, // Solo planes activos
    sortBy = 'order', // 'order', 'price', 'popular'
    currency = 'GTQ', // Moneda por defecto
  } = options;

  // Estados
  const [plans, setPlans] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`membershipPlans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🎫 useMembershipPlans [${instanceId.current}] hook initialized`);

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchPlans = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useMembershipPlans [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ useMembershipPlans [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && plans && plans.length > 0 && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useMembershipPlans [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`🎫 useMembershipPlans [${instanceId.current}] Fetching Membership Plans${forceRefresh ? ' (forced)' : ''}`);
      console.log('📡 Making API request to /api/gym/membership-plans');
      
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
        '/api/gym/membership-plans',
        () => apiService.getMembershipPlans(),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'normal'
        }
      );

      console.log('✅ Plans response received:', response);

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useMembershipPlans [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let plansData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, name: "...", price: 250, ... }, ... ] }
        plansData = response.data;
        console.log('🎫 Plans data extracted:');
        console.log('  - Total plans:', plansData.length);
        if (Array.isArray(plansData)) {
          plansData.forEach((plan, i) => {
            console.log(`  - Plan ${i + 1}: ${plan.name} - Q${plan.price} (Popular: ${plan.popular})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        plansData = response;
        console.log('🎫 Plans data (direct array):', plansData.length);
      } else {
        console.warn('⚠️ Invalid plans response structure:', response);
        // En lugar de lanzar error, usar array vacío
        plansData = [];
      }

      // Aplicar filtros y procesamiento
      let processedPlans = Array.isArray(plansData) ? [...plansData] : [];

      // Filtrar solo planes activos
      if (activeOnly) {
        processedPlans = processedPlans.filter(plan => plan.active !== false);
      }

      // Calcular descuentos si no están calculados
      processedPlans = processedPlans.map(plan => ({
        ...plan,
        discountPercentage: plan.discountPercentage || (
          plan.originalPrice && plan.originalPrice > plan.price
            ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
            : 0
        ),
        savings: plan.originalPrice && plan.originalPrice > plan.price
          ? plan.originalPrice - plan.price
          : 0
      }));

      // Aplicar ordenamiento
      switch (sortBy) {
        case 'price':
          processedPlans.sort((a, b) => a.price - b.price);
          break;
        case 'popular':
          processedPlans.sort((a, b) => {
            if (a.popular && !b.popular) return -1;
            if (!a.popular && b.popular) return 1;
            return (a.order || 0) - (b.order || 0);
          });
          break;
        case 'order':
        default:
          processedPlans.sort((a, b) => (a.order || 0) - (b.order || 0));
          break;
      }

      setPlans(processedPlans); // ✅ Guardamos solo la data procesada
      setIsLoaded(true);
      setError(null);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;
      console.log(`✅ Membership plans loaded successfully! (${processedPlans.length} active)`);

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ useMembershipPlans [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // No limpiar plans anterior en caso de error, mantener datos previos
        if (plans.length === 0) {
          setPlans([]); // Fallback a array vacío
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
  }, [enabled, isLoading, plans, lastFetch, staleTime, activeOnly, sortBy]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const reload = useCallback(() => {
    console.log(`🔄 useMembershipPlans [${instanceId.current}] manual reload requested`);
    return fetchPlans(true);
  }, [fetchPlans]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useMembershipPlans [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/gym/membership-plans');
    setLastFetch(null);
  }, []);

  // 🔍 FUNCIÓN PARA OBTENER PLAN POR ID
  const getPlanById = useCallback((id) => {
    return plans.find(plan => plan.id === id) || null;
  }, [plans]);

  // 🔍 FUNCIÓN PARA OBTENER PLAN POPULAR
  const getPopularPlan = useCallback(() => {
    return plans.find(plan => plan.popular === true) || null;
  }, [plans]);

  // 🔍 FUNCIÓN PARA OBTENER PLANES POR DURACIÓN
  const getPlansByDuration = useCallback((duration) => {
    return plans.filter(plan => 
      plan.duration?.toLowerCase() === duration.toLowerCase()
    );
  }, [plans]);

  // 🔍 FUNCIÓN PARA OBTENER PLANES CON DESCUENTO
  const getDiscountedPlans = useCallback(() => {
    return plans.filter(plan => 
      plan.originalPrice && plan.originalPrice > plan.price
    );
  }, [plans]);

  // 💰 FUNCIÓN PARA FORMATEAR PRECIO CON MONEDA
  const formatPrice = useCallback((price, showCurrency = true) => {
    if (typeof price !== 'number') return '0';
    
    const formattedPrice = price.toLocaleString('es-GT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return showCurrency ? `Q${formattedPrice}` : formattedPrice;
  }, []);

  // 📊 FUNCIÓN PARA CALCULAR PRECIO PROMEDIO
  const getAveragePrice = useCallback(() => {
    if (plans.length === 0) return 0;
    
    const totalPrice = plans.reduce((sum, plan) => sum + (plan.price || 0), 0);
    return Math.round((totalPrice / plans.length) * 100) / 100;
  }, [plans]);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      plans.length === 0 ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 useMembershipPlans [${instanceId.current}] initial fetch triggered`);
      fetchPlans();
    } else {
      console.log(`⏸️ useMembershipPlans [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (plans.length > 0 && !isLoaded) {
        setIsLoaded(true);
        hasInitialLoad.current = true;
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useMembershipPlans [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useMembershipPlans [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Array.isArray(plans) && plans.length > 0;
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;
  const popularPlan = getPopularPlan();
  const discountedPlans = getDiscountedPlans();
  const averagePrice = getAveragePrice();

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    plans,           // ✅ Solo la data: [ { id: 1, name: "...", price: 250, ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    
    // Funciones de control
    reload,          // Función para recargar manualmente
    invalidate,      // Función para invalidar cache
    
    // Funciones de utilidad
    getPlanById,         // Obtener plan por ID
    getPopularPlan,      // Obtener plan popular
    getPlansByDuration,  // Filtrar por duración
    getDiscountedPlans,  // Obtener planes con descuento
    formatPrice,         // Formatear precio con moneda
    getAveragePrice,     // Calcular precio promedio
    
    // Información de estado
    hasValidData,
    isStale,
    lastFetch,
    cacheAge,
    popularPlan,
    discountedPlans,
    averagePrice,
    isEmpty: plans.length === 0,
    
    // Estadísticas útiles
    stats: {
      total: plans.length,
      withDiscount: discountedPlans.length,
      popular: popularPlan ? 1 : 0,
      averagePrice,
      cheapest: plans.length > 0 ? Math.min(...plans.map(p => p.price || 0)) : 0,
      mostExpensive: plans.length > 0 ? Math.max(...plans.map(p => p.price || 0)) : 0
    },
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        activeOnly,
        sortBy,
        currency,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        dataStructure: {
          isArray: Array.isArray(plans),
          length: plans.length,
          samplePlan: plans[0] ? {
            hasId: !!plans[0].id,
            hasName: !!plans[0].name,
            hasPrice: !!plans[0].price,
            hasFeatures: !!(plans[0].features && plans[0].features.length),
            isActive: plans[0].active !== false,
            isPopular: plans[0].popular === true,
            hasDiscount: !!(plans[0].originalPrice && plans[0].originalPrice > plans[0].price)
          } : null
        }
      }
    })
  };
};

export default useMembershipPlans;