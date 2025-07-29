// src/hooks/useTestimonials.js
// FUNCIÓN: Hook para testimonios de clientes
// CONECTA CON: GET /api/gym/testimonials

// src/hooks/useTestimonials.js
// FUNCIÓN: Hook optimizado para testimonios - Cache inteligente
// EVITA: Múltiples peticiones innecesarias al mismo endpoint

// src/hooks/useTestimonials.js
// FUNCIÓN: Hook CORREGIDO para testimonios - Manejo de errores sin bloqueo
// CORRIGE: Error 500 no bloquea la landing page, logs informativos

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// 🏠 CACHE GLOBAL para testimonios
const globalTestimonialsCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  error: null,
  subscribers: new Set()
};

// ⏰ TTL del cache: 20 minutos (los testimonios cambian muy poco)
const CACHE_TTL = 20 * 60 * 1000;

const useTestimonials = () => {
  const { setCacheData, getCacheData } = useApp();
  const [state, setState] = useState({
    testimonials: null,
    isLoaded: false,
    isLoading: false,
    error: null,
    hasError: false
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
    globalTestimonialsCache.subscribers.forEach(callback => {
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  };
  
  // 🔧 Obtener datos del cache
  const getFromCache = () => {
    // Verificar cache de AppContext primero
    const appCacheData = getCacheData('testimonials');
    if (appCacheData) {
      console.log('📦 Using AppContext cache for testimonials');
      return appCacheData;
    }
    
    // Verificar cache global
    if (globalTestimonialsCache.data && globalTestimonialsCache.timestamp) {
      const age = Date.now() - globalTestimonialsCache.timestamp;
      if (age < CACHE_TTL) {
        console.log('📦 Using global cache for testimonials');
        return globalTestimonialsCache.data;
      }
    }
    
    return null;
  };
  
  // 🔧 Guardar en cache
  const saveToCache = (data) => {
    globalTestimonialsCache.data = data;
    globalTestimonialsCache.timestamp = Date.now();
    globalTestimonialsCache.error = null;
    
    setCacheData('testimonials', data);
    console.log('💾 Testimonials saved to cache');
  };
  
  // 🚀 Función principal para obtener testimonios
  const fetchTestimonials = async (force = false) => {
    // Si ya hay una petición en curso y no es forzada, esperar
    if (globalTestimonialsCache.isLoading && !force) {
      console.log('⏳ Testimonials fetch already in progress, waiting...');
      return;
    }
    
    // Verificar cache primero (solo si no es forzada)
    if (!force) {
      const cachedData = getFromCache();
      if (cachedData) {
        safeSetState({
          testimonials: cachedData,
          isLoaded: true,
          isLoading: false,
          error: null,
          hasError: false
        });
        return;
      }
    }
    
    // Marcar como cargando
    globalTestimonialsCache.isLoading = true;
    safeSetState({ isLoading: true, error: null, hasError: false });
    
    try {
      console.group('💬 Fetching Testimonials');
      console.log('📡 Making API request to /api/gym/testimonials');
      
      const response = await apiService.getTestimonials();
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, aborting update');
        console.groupEnd();
        return;
      }
      
      if (response.success && response.data) {
        const testimonials = Array.isArray(response.data) ? response.data : [];
        const activeTestimonials = testimonials.filter(testimonial => testimonial.active !== false);
        
        console.log('✅ Testimonials received successfully');
        console.log('📋 Testimonials summary:', {
          total: testimonials.length,
          active: activeTestimonials.length,
          hasImages: testimonials.filter(t => t.image?.url).length,
          averageRating: testimonials.length > 0 ? 
            (testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / testimonials.length).toFixed(1) : 'N/A',
          verified: testimonials.filter(t => t.verified).length
        });
        
        // Log de testimonios individuales (solo nombres)
        if (testimonials.length > 0) {
          console.log('📋 Individual testimonials:');
          testimonials.forEach((testimonial, index) => {
            console.log(`  ${index + 1}. ${testimonial.name || 'Anonymous'} - ${testimonial.rating || 5}⭐ ${testimonial.active !== false ? '✅' : '❌'}`);
          });
        } else {
          console.log('⚠️ No testimonials returned from backend');
        }
        
        // Guardar en cache
        saveToCache(testimonials);
        
        // Actualizar estado
        const newState = {
          testimonials: testimonials,
          isLoaded: true,
          isLoading: false,
          error: null,
          hasError: false
        };
        
        safeSetState(newState);
        notifySubscribers(newState);
        console.groupEnd();
        
      } else {
        throw new Error('Invalid response format from backend');
      }
      
    } catch (error) {
      console.group('❌ Testimonials Fetch Failed');
      console.log('🔍 Error details:', error.message);
      
      let errorMessage = 'Error desconocido';
      let errorSolution = 'Verificar backend';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint no encontrado';
        errorSolution = 'Implementar /api/gym/testimonials en backend';
        
        console.log('📍 PROBLEM: /api/gym/testimonials endpoint not found');
        console.log('🔧 SOLUTION: Implement testimonials endpoint in backend');
        console.log('📋 EXPECTED RESPONSE:');
        console.log(`   {
     "success": true,
     "data": [
       {
         "id": 1,
         "name": "María González",
         "role": "Miembro Premium",
         "text": "Excelente gimnasio...",
         "rating": 5,
         "image": { "url": "photo.jpg" },
         "verified": true,
         "active": true,
         "created_at": "2024-01-01T00:00:00.000Z"
       }
     ]
   }`);
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor';
        errorSolution = 'Revisar logs del backend para error específico';
        
        console.log('📍 PROBLEM: Backend internal error in testimonials');
        console.log('🔧 SOLUTION: Check backend logs for database errors');
        console.log('💡 LIKELY CAUSE: Field missing in database (created_at, updated_at)');
        console.log('💡 COMMON FIX: Check if trying to call .toISOString() on undefined field');
        
        // Información específica para el error de testimonials
        console.log('🔍 SPECIFIC ERROR: TypeError reading toISOString()');
        console.log('📍 BACKEND LOCATION: gymController.js line 186');
        console.log('🔧 BACKEND FIX: Add null checks before .toISOString()');
        console.log('📋 EXAMPLE FIX:');
        console.log('   date: testimonial.created_at ? testimonial.created_at.toISOString() : new Date().toISOString()');
        
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Sin conexión al backend';
        errorSolution = 'Verificar que el backend esté corriendo';
        
        console.log('📍 PROBLEM: Cannot connect to backend');
        console.log('🔧 SOLUTION: Verify backend is running');
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout en la petición';
        errorSolution = 'El backend está tardando mucho en responder';
        
        console.log('📍 PROBLEM: Request timeout');
        console.log('🔧 SOLUTION: Optimize backend query or increase timeout');
      }
      
      console.log('🎯 ACTION: Landing page will continue without testimonials section');
      console.log('✅ OTHER SECTIONS: Should still load normally');
      console.groupEnd();
      
      // ⚠️ IMPORTANTE: Marcar como cargado CON error pero NO bloquear la app
      const errorState = {
        testimonials: null,
        isLoaded: true, // ← CRÍTICO: Marcar como cargado para no bloquear
        isLoading: false,
        error: errorMessage,
        hasError: true // ← Añadir flag específico de error
      };
      
      safeSetState(errorState);
      globalTestimonialsCache.error = errorMessage;
      globalTestimonialsCache.isLoading = false;
      notifySubscribers(errorState);
    }
    
    globalTestimonialsCache.isLoading = false;
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
    globalTestimonialsCache.subscribers.add(handleCacheUpdate);
    
    // Verificar cache existente
    const cachedData = getFromCache();
    if (cachedData) {
      console.log('📦 Loading testimonials from existing cache');
      safeSetState({
        testimonials: cachedData,
        isLoaded: true,
        isLoading: false,
        error: null,
        hasError: false
      });
    } else if (!globalTestimonialsCache.isLoading) {
      // Solo hacer fetch si no hay cache y no hay petición en curso
      fetchTestimonials();
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      globalTestimonialsCache.subscribers.delete(handleCacheUpdate);
    };
  }, []);
  
  // 🔄 Función para refrescar datos
  const refetch = () => {
    console.log('🔄 Force refreshing testimonials...');
    fetchTestimonials(true);
  };
  
  // 🧹 Función para limpiar cache
  const clearCache = () => {
    console.log('🧹 Clearing testimonials cache...');
    globalTestimonialsCache.data = null;
    globalTestimonialsCache.timestamp = null;
    globalTestimonialsCache.error = null;
    
    safeSetState({
      testimonials: null,
      isLoaded: false,
      isLoading: false,
      error: null,
      hasError: false
    });
  };
  
  // 🔧 Funciones de utilidad para testimonios
  const getActiveTestimonials = () => {
    return state.testimonials ? state.testimonials.filter(testimonial => testimonial.active !== false) : [];
  };
  
  const getTestimonialById = (id) => {
    return state.testimonials ? state.testimonials.find(testimonial => testimonial.id === id) : null;
  };
  
  const getVerifiedTestimonials = () => {
    return state.testimonials ? state.testimonials.filter(testimonial => 
      testimonial.verified && testimonial.active !== false
    ) : [];
  };
  
  const getTestimonialsByRating = (minRating = 4) => {
    return state.testimonials ? state.testimonials.filter(testimonial => 
      (testimonial.rating || 5) >= minRating && testimonial.active !== false
    ) : [];
  };
  
  const getAverageRating = () => {
    if (!state.testimonials || state.testimonials.length === 0) return 0;
    const sum = state.testimonials.reduce((total, testimonial) => total + (testimonial.rating || 5), 0);
    return (sum / state.testimonials.length).toFixed(1);
  };
  
  // 🔍 Función para verificar si se puede mostrar la sección
  const shouldShowTestimonialsSection = () => {
    return state.isLoaded && 
           !state.hasError && 
           state.testimonials && 
           Array.isArray(state.testimonials) && 
           state.testimonials.length > 0;
  };
  
  return {
    testimonials: state.testimonials,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    hasError: state.hasError, // ← Nuevo flag específico de error
    refetch,
    clearCache,
    
    // Funciones de utilidad
    activeTestimonials: getActiveTestimonials(),
    verifiedTestimonials: getVerifiedTestimonials(),
    getTestimonialById,
    getTestimonialsByRating,
    getAverageRating,
    shouldShowTestimonialsSection, // ← Nueva función para verificar si mostrar sección
    hasValidTestimonials: shouldShowTestimonialsSection(),
    activeTestimonialsCount: getActiveTestimonials().length,
    averageRating: getAverageRating(),
    cacheAge: globalTestimonialsCache.timestamp ? Date.now() - globalTestimonialsCache.timestamp : null,
    isCacheValid: globalTestimonialsCache.timestamp ? (Date.now() - globalTestimonialsCache.timestamp) < CACHE_TTL : false,
    
    // Estados de depuración
    debugInfo: {
      isLoaded: state.isLoaded,
      hasError: state.hasError,
      hasData: !!state.testimonials,
      dataLength: state.testimonials?.length || 0,
      error: state.error,
      cacheAge: globalTestimonialsCache.timestamp ? Date.now() - globalTestimonialsCache.timestamp : null
    }
  };
};

export default useTestimonials;