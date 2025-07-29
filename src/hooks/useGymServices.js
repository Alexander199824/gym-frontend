// src/hooks/useGymServices.js
// FUNCIÓN: Hook optimizado para servicios del gym - Cache inteligente
// EVITA: Múltiples peticiones innecesarias al mismo endpoint

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// 🏠 CACHE GLOBAL para servicios
const globalServicesCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  error: null,
  subscribers: new Set()
};

// ⏰ TTL del cache: 15 minutos (los servicios cambian poco)
const CACHE_TTL = 15 * 60 * 1000;

const useGymServices = () => {
  const { setCacheData, getCacheData } = useApp();
  const [state, setState] = useState({
    services: null,
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
    globalServicesCache.subscribers.forEach(callback => {
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  };
  
  // 🔧 Obtener datos del cache
  const getFromCache = () => {
    // Verificar cache de AppContext primero
    const appCacheData = getCacheData('gymServices');
    if (appCacheData) {
      console.log('📦 Using AppContext cache for gym services');
      return appCacheData;
    }
    
    // Verificar cache global
    if (globalServicesCache.data && globalServicesCache.timestamp) {
      const age = Date.now() - globalServicesCache.timestamp;
      if (age < CACHE_TTL) {
        console.log('📦 Using global cache for gym services');
        return globalServicesCache.data;
      }
    }
    
    return null;
  };
  
  // 🔧 Guardar en cache
  const saveToCache = (data) => {
    globalServicesCache.data = data;
    globalServicesCache.timestamp = Date.now();
    globalServicesCache.error = null;
    
    setCacheData('gymServices', data);
    console.log('💾 Gym services saved to cache');
  };
  
  // 🚀 Función principal para obtener servicios
  const fetchGymServices = async (force = false) => {
    // Si ya hay una petición en curso y no es forzada, esperar
    if (globalServicesCache.isLoading && !force) {
      console.log('⏳ Gym services fetch already in progress, waiting...');
      return;
    }
    
    // Verificar cache primero (solo si no es forzada)
    if (!force) {
      const cachedData = getFromCache();
      if (cachedData) {
        safeSetState({
          services: cachedData,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        return;
      }
    }
    
    // Marcar como cargando
    globalServicesCache.isLoading = true;
    safeSetState({ isLoading: true, error: null });
    
    try {
      console.group('🏋️ Fetching Gym Services');
      console.log('📡 Making API request to /api/gym/services');
      
      const response = await apiService.getGymServices();
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, aborting update');
        console.groupEnd();
        return;
      }
      
      if (response.success && response.data) {
        const services = Array.isArray(response.data) ? response.data : [];
        const activeServices = services.filter(service => service.active !== false);
        
        console.log('✅ Gym services received successfully');
        console.log('📋 Services summary:', {
          total: services.length,
          active: activeServices.length,
          hasImages: services.filter(s => s.imageUrl).length,
          hasFeatures: services.filter(s => s.features && s.features.length > 0).length
        });
        
        // Log de servicios individuales
        if (services.length > 0) {
          console.log('📋 Individual services:');
          services.forEach((service, index) => {
            console.log(`  ${index + 1}. ${service.title || 'Unnamed'} - ${service.active !== false ? '✅ Active' : '❌ Inactive'}`);
          });
        } else {
          console.log('⚠️ No services returned from backend');
        }
        
        // Guardar en cache
        saveToCache(services);
        
        // Actualizar estado
        const newState = {
          services: services,
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
      console.group('❌ Gym Services Fetch Failed');
      console.log('🔍 Error details:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📍 PROBLEM: /api/gym/services endpoint not found');
        console.log('🔧 SOLUTION: Implement gym services endpoint in backend');
        console.log('📋 EXPECTED RESPONSE:');
        console.log(`   {
     "success": true,
     "data": [
       {
         "id": 1,
         "title": "Entrenamiento Personal",
         "description": "Sesiones personalizadas...",
         "icon": "Users",
         "active": true,
         "features": ["Evaluación", "Plan personalizado"]
       }
     ]
   }`);
      } else if (error.response?.status === 500) {
        console.log('📍 PROBLEM: Backend internal error in services');
        console.log('🔧 SOLUTION: Check backend logs for database errors');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('📍 PROBLEM: Cannot connect to backend');
        console.log('🔧 SOLUTION: Verify backend is running');
      }
      
      console.groupEnd();
      
      const errorState = {
        services: null,
        isLoaded: true,
        isLoading: false,
        error: error.message
      };
      
      safeSetState(errorState);
      globalServicesCache.error = error.message;
      globalServicesCache.isLoading = false;
      notifySubscribers(errorState);
    }
    
    globalServicesCache.isLoading = false;
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
    globalServicesCache.subscribers.add(handleCacheUpdate);
    
    // Verificar cache existente
    const cachedData = getFromCache();
    if (cachedData) {
      console.log('📦 Loading gym services from existing cache');
      safeSetState({
        services: cachedData,
        isLoaded: true,
        isLoading: false,
        error: null
      });
    } else if (!globalServicesCache.isLoading) {
      // Solo hacer fetch si no hay cache y no hay petición en curso
      fetchGymServices();
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      globalServicesCache.subscribers.delete(handleCacheUpdate);
    };
  }, []);
  
  // 🔄 Función para refrescar datos
  const refetch = () => {
    console.log('🔄 Force refreshing gym services...');
    fetchGymServices(true);
  };
  
  // 🧹 Función para limpiar cache
  const clearCache = () => {
    console.log('🧹 Clearing gym services cache...');
    globalServicesCache.data = null;
    globalServicesCache.timestamp = null;
    globalServicesCache.error = null;
    
    safeSetState({
      services: null,
      isLoaded: false,
      isLoading: false,
      error: null
    });
  };
  
  // 🔧 Funciones de utilidad para servicios
  const getActiveServices = () => {
    return state.services ? state.services.filter(service => service.active !== false) : [];
  };
  
  const getServiceById = (id) => {
    return state.services ? state.services.find(service => service.id === id) : null;
  };
  
  const getServicesByCategory = (category) => {
    return state.services ? state.services.filter(service => 
      service.category === category && service.active !== false
    ) : [];
  };
  
  return {
    services: state.services,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    clearCache,
    
    // Funciones de utilidad
    activeServices: getActiveServices(),
    getServiceById,
    getServicesByCategory,
    hasValidServices: state.services && Array.isArray(state.services) && state.services.length > 0,
    activeServicesCount: getActiveServices().length,
    cacheAge: globalServicesCache.timestamp ? Date.now() - globalServicesCache.timestamp : null,
    isCacheValid: globalServicesCache.timestamp ? (Date.now() - globalServicesCache.timestamp) < CACHE_TTL : false
  };
};

export default useGymServices;