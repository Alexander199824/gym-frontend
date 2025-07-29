// src/hooks/useMembershipPlans.js
// FUNCIÓN: Hook para planes de membresía del gimnasio - CORREGIDO
// CONECTA CON: GET /api/gym/membership-plans

// src/hooks/useMembershipPlans.js
// FUNCIÓN: Hook optimizado para planes de membresía - Cache inteligente
// EVITA: Múltiples peticiones innecesarias al mismo endpoint

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// 🏠 CACHE GLOBAL para planes de membresía
const globalMembershipPlansCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  error: null,
  subscribers: new Set()
};

// ⏰ TTL del cache: 30 minutos (los planes cambian muy poco)
const CACHE_TTL = 30 * 60 * 1000;

const useMembershipPlans = () => {
  const { setCacheData, getCacheData } = useApp();
  const [state, setState] = useState({
    plans: null,
    isLoaded: false,
    isLoading: false,
    error: null
  });
  
  const subscriberIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const isMountedRef = useRef(true);
  
  // 🔧 Función para actualizar estado de forma segura
  const safeSetState = (newState) => {
    if (isMountedRef.current) {
      setState(prevState => ({ ...prevState, ...newState }));
    }
  };
  
  // 🔧 Notificar a todos los subscribers
  const notifySubscribers = (data) => {
    globalMembershipPlansCache.subscribers.forEach(callback => {
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  };
  
  // 🔧 Obtener datos del cache
  const getFromCache = () => {
    // Verificar cache de AppContext primero
    const appCacheData = getCacheData('membershipPlans');
    if (appCacheData) {
      console.log('📦 Using AppContext cache for membership plans');
      return appCacheData;
    }
    
    // Verificar cache global
    if (globalMembershipPlansCache.data && globalMembershipPlansCache.timestamp) {
      const age = Date.now() - globalMembershipPlansCache.timestamp;
      if (age < CACHE_TTL) {
        console.log('📦 Using global cache for membership plans');
        return globalMembershipPlansCache.data;
      }
    }
    
    return null;
  };
  
  // 🔧 Guardar en cache
  const saveToCache = (data) => {
    globalMembershipPlansCache.data = data;
    globalMembershipPlansCache.timestamp = Date.now();
    globalMembershipPlansCache.error = null;
    
    setCacheData('membershipPlans', data);
    console.log('💾 Membership plans saved to cache');
  };
  
  // 🚀 Función principal para obtener planes de membresía
  const fetchMembershipPlans = async (force = false) => {
    // Si ya hay una petición en curso y no es forzada, esperar
    if (globalMembershipPlansCache.isLoading && !force) {
      console.log('⏳ Membership plans fetch already in progress, waiting...');
      return;
    }
    
    // Verificar cache primero (solo si no es forzada)
    if (!force) {
      const cachedData = getFromCache();
      if (cachedData) {
        safeSetState({
          plans: cachedData,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        return;
      }
    }
    
    // Marcar como cargando
    globalMembershipPlansCache.isLoading = true;
    safeSetState({ isLoading: true, error: null });
    
    try {
      console.group('🎫 Fetching Membership Plans');
      console.log('📡 Making API request to /api/gym/membership-plans');
      
      const response = await apiService.getMembershipPlans();
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, aborting update');
        console.groupEnd();
        return;
      }
      
      if (response.success && response.data) {
        const plans = Array.isArray(response.data) ? response.data : [];
        const activePlans = plans.filter(plan => plan.active !== false);
        const popularPlan = plans.find(plan => plan.popular);
        
        console.log('✅ Membership plans received successfully');
        console.log('📋 Plans summary:', {
          total: plans.length,
          active: activePlans.length,
          popular: popularPlan ? popularPlan.name : 'None',
          priceRange: plans.length > 0 ? {
            min: Math.min(...plans.map(p => p.price || 0)),
            max: Math.max(...plans.map(p => p.price || 0))
          } : null,
          durations: [...new Set(plans.map(p => p.duration).filter(Boolean))],
          totalFeatures: plans.reduce((sum, plan) => sum + (plan.features?.length || 0), 0)
        });
        
        // Log de planes individuales
        if (plans.length > 0) {
          console.log('📋 Individual plans:');
          plans.forEach((plan, index) => {
            const price = plan.price ? `Q${plan.price}/${plan.duration || 'mes'}` : 'No price';
            const popular = plan.popular ? '🔥 Popular' : '';
            const active = plan.active !== false ? '✅' : '❌';
            const features = plan.features ? `(${plan.features.length} features)` : '';
            console.log(`  ${index + 1}. ${plan.name || 'Unnamed'} - ${price} ${popular} ${active} ${features}`);
          });
        } else {
          console.log('⚠️ No membership plans returned from backend');
        }
        
        // Guardar en cache
        saveToCache(plans);
        
        // Actualizar estado
        const newState = {
          plans: plans,
          isLoaded: true,
          isLoading: false,
          error: null
        };
        
        safeSetState(newState);
        notifySubscribers(newState);
        console.groupEnd();
        
      } else {
        throw new Error('Invalid response format from backend');
      }
      
    } catch (error) {
      console.group('❌ Membership Plans Fetch Failed');
      console.log('🔍 Error details:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📍 PROBLEM: /api/gym/membership-plans endpoint not found');
        console.log('🔧 SOLUTION: Implement membership plans endpoint in backend');
        console.log('📋 EXPECTED RESPONSE:');
        console.log(`   {
     "success": true,
     "data": [
       {
         "id": 1,
         "name": "Básico",
         "price": 199,
         "originalPrice": 249,
         "duration": "mes",
         "popular": false,
         "iconName": "Shield",
         "color": "#3b82f6",
         "features": [
           "Acceso a área de pesas",
           "Clases grupales básicas",
           "Casillero incluido"
         ],
         "active": true
       }
     ]
   }`);
      } else if (error.response?.status === 500) {
        console.log('📍 PROBLEM: Backend internal error in membership plans');
        console.log('🔧 SOLUTION: Check backend logs for database errors');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('📍 PROBLEM: Cannot connect to backend');
        console.log('🔧 SOLUTION: Verify backend is running');
      }
      
      console.groupEnd();
      
      const errorState = {
        plans: null,
        isLoaded: true,
        isLoading: false,
        error: error.message
      };
      
      safeSetState(errorState);
      globalMembershipPlansCache.error = error.message;
      globalMembershipPlansCache.isLoading = false;
      notifySubscribers(errorState);
    }
    
    globalMembershipPlansCache.isLoading = false;
  };
  
  // 🔧 Suscribirse a cambios en el cache global
  useEffect(() => {
    // Función de callback para recibir actualizaciones
    const handleCacheUpdate = (newState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    };
    
    // Suscribirse
    globalMembershipPlansCache.subscribers.add(handleCacheUpdate);
    
    // Verificar cache existente
    const cachedData = getFromCache();
    if (cachedData) {
      console.log('📦 Loading membership plans from existing cache');
      safeSetState({
        plans: cachedData,
        isLoaded: true,
        isLoading: false,
        error: null
      });
    } else if (!globalMembershipPlansCache.isLoading) {
      // Solo hacer fetch si no hay cache y no hay petición en curso
      fetchMembershipPlans();
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      globalMembershipPlansCache.subscribers.delete(handleCacheUpdate);
    };
  }, []);
  
  // 🔄 Función para refrescar datos
  const refetch = () => {
    console.log('🔄 Force refreshing membership plans...');
    fetchMembershipPlans(true);
  };
  
  // 🧹 Función para limpiar cache
  const clearCache = () => {
    console.log('🧹 Clearing membership plans cache...');
    globalMembershipPlansCache.data = null;
    globalMembershipPlansCache.timestamp = null;
    globalMembershipPlansCache.error = null;
    
    safeSetState({
      plans: null,
      isLoaded: false,
      isLoading: false,
      error: null
    });
  };
  
  // 🔧 Funciones de utilidad para planes
  const getActivePlans = () => {
    return state.plans ? state.plans.filter(plan => plan.active !== false) : [];
  };
  
  const getPlanById = (id) => {
    return state.plans ? state.plans.find(plan => plan.id === id) : null;
  };
  
  const getPopularPlan = () => {
    return state.plans ? state.plans.find(plan => plan.popular && plan.active !== false) : null;
  };
  
  const getPlansByDuration = (duration) => {
    return state.plans ? state.plans.filter(plan => 
      plan.duration === duration && plan.active !== false
    ) : [];
  };
  
  const getPlansByPriceRange = (minPrice, maxPrice) => {
    return state.plans ? state.plans.filter(plan => 
      plan.price >= minPrice && plan.price <= maxPrice && plan.active !== false
    ) : [];
  };
  
  const getCheapestPlan = () => {
    const activePlans = getActivePlans();
    if (activePlans.length === 0) return null;
    return activePlans.reduce((cheapest, plan) => 
      (plan.price || 0) < (cheapest.price || 0) ? plan : cheapest
    );
  };
  
  const getMostExpensivePlan = () => {
    const activePlans = getActivePlans();
    if (activePlans.length === 0) return null;
    return activePlans.reduce((expensive, plan) => 
      (plan.price || 0) > (expensive.price || 0) ? plan : expensive
    );
  };
  
  const getPriceRange = () => {
    const activePlans = getActivePlans();
    if (activePlans.length === 0) return { min: 0, max: 0 };
    const prices = activePlans.map(plan => plan.price || 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };
  
  const getAvailableDurations = () => {
    if (!state.plans) return [];
    return [...new Set(state.plans
      .filter(plan => plan.active !== false)
      .map(plan => plan.duration)
      .filter(Boolean)
    )];
  };
  
  const getTotalFeatures = () => {
    const activePlans = getActivePlans();
    return activePlans.reduce((total, plan) => total + (plan.features?.length || 0), 0);
  };
  
  return {
    plans: state.plans,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    clearCache,
    
    // Funciones de utilidad
    activePlans: getActivePlans(),
    popularPlan: getPopularPlan(),
    cheapestPlan: getCheapestPlan(),
    mostExpensivePlan: getMostExpensivePlan(),
    getPlanById,
    getPlansByDuration,
    getPlansByPriceRange,
    getAvailableDurations,
    getPriceRange,
    getTotalFeatures,
    hasValidPlans: state.plans && Array.isArray(state.plans) && state.plans.length > 0,
    activePlansCount: getActivePlans().length,
    priceRange: getPriceRange(),
    availableDurations: getAvailableDurations(),
    totalFeatures: getTotalFeatures(),
    cacheAge: globalMembershipPlansCache.timestamp ? Date.now() - globalMembershipPlansCache.timestamp : null,
    isCacheValid: globalMembershipPlansCache.timestamp ? (Date.now() - globalMembershipPlansCache.timestamp) < CACHE_TTL : false
  };
};

export default useMembershipPlans;