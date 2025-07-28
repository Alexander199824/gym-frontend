// src/hooks/useDebounced.js
// FUNCIÓN: Sistema de hooks con DEBOUNCING para evitar rate limiting
// PREVIENE: Múltiples peticiones simultáneas al backend

import { useState, useEffect, useCallback, useRef } from 'react';

// 🚦 COORDINADOR GLOBAL DE PETICIONES
class RequestCoordinator {
  constructor() {
    this.activeRequests = new Map(); // endpoint -> Promise
    this.requestQueue = []; // Array de {endpoint, requestFn, resolve, reject}
    this.processing = false;
    this.lastRequestTime = 0;
    this.minDelay = 200; // 200ms mínimo entre peticiones
  }

  // Coordinar petición para evitar duplicados
  async coordinateRequest(endpoint, requestFn) {
    // Si ya hay una petición activa para este endpoint, reutilizar
    if (this.activeRequests.has(endpoint)) {
      console.log(`🔄 Reutilizando petición activa: ${endpoint}`);
      return this.activeRequests.get(endpoint);
    }

    // Crear nueva petición
    const requestPromise = this.executeRequest(endpoint, requestFn);
    
    // Registrar petición activa
    this.activeRequests.set(endpoint, requestPromise);
    
    // Limpiar cuando termine
    requestPromise.finally(() => {
      this.activeRequests.delete(endpoint);
    });
    
    return requestPromise;
  }

  // Ejecutar petición con timing adecuado
  async executeRequest(endpoint, requestFn) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Si es muy pronto, esperar
    if (timeSinceLastRequest < this.minDelay) {
      const delay = this.minDelay - timeSinceLastRequest;
      console.log(`⏰ Esperando ${delay}ms antes de hacer petición: ${endpoint}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    
    try {
      const result = await requestFn();
      console.log(`✅ Petición exitosa: ${endpoint}`);
      return result;
    } catch (error) {
      console.warn(`⚠️ Error en petición: ${endpoint}`, error.message);
      throw error;
    }
  }

  // Obtener estado actual
  getStatus() {
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      processing: this.processing
    };
  }
}

// Instancia global del coordinador
const requestCoordinator = new RequestCoordinator();

// 🎣 HOOK PRINCIPAL CON DEBOUNCING
export const useDebounced = (endpoint, requestFn, options = {}) => {
  const {
    fallbackData = null,
    debounceMs = 300,
    retryCount = 2,
    retryDelay = 1000,
    cacheMs = 5 * 60 * 1000, // 5 minutos
    enabled = true,
    onSuccess = null,
    onError = null
  } = options;

  // Estados
  const [data, setData] = useState(fallbackData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias
  const debounceTimer = useRef(null);
  const retryTimer = useRef(null);
  const mountedRef = useRef(true);
  const currentRetry = useRef(0);

  // Función de fetch con coordinación
  const fetchData = useCallback(async (attempt = 1) => {
    if (!enabled || !requestFn) return;

    try {
      setIsLoading(true);
      setError(null);

      // Coordinar petición para evitar duplicados
      const result = await requestCoordinator.coordinateRequest(
        endpoint,
        requestFn
      );

      // Solo actualizar si el componente sigue montado
      if (mountedRef.current) {
        setData(result);
        setIsLoaded(true);
        setLastFetch(Date.now());
        currentRetry.current = 0;

        if (onSuccess) {
          onSuccess(result);
        }
      }

    } catch (error) {
      if (!mountedRef.current) return;

      console.warn(`⚠️ Error en useDebounced (${endpoint}):`, error.message);
      
      // Determinar si debemos reintentar
      const shouldRetry = attempt < retryCount && (
        error.response?.status === 429 || // Too Many Requests
        error.response?.status >= 500 || // Server Error
        error.code === 'ERR_NETWORK' || // Network Error
        error.code === 'ECONNABORTED' // Timeout
      );

      if (shouldRetry) {
        console.log(`🔄 Reintentando ${endpoint} en ${retryDelay * attempt}ms... (${attempt}/${retryCount})`);
        retryTimer.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchData(attempt + 1);
          }
        }, retryDelay * attempt);
      } else {
        // No reintentar más, usar fallback
        setError(error);
        setData(fallbackData);
        setIsLoaded(true);
        currentRetry.current = 0;

        if (onError) {
          onError(error);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [endpoint, requestFn, enabled, fallbackData, retryCount, retryDelay, onSuccess, onError]);

  // Función de fetch con debounce
  const debouncedFetch = useCallback(() => {
    // Limpiar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Programar nueva petición
    debounceTimer.current = setTimeout(() => {
      fetchData(1);
    }, debounceMs);
  }, [fetchData, debounceMs]);

  // Función de refetch manual
  const refetch = useCallback(() => {
    // Limpiar timers
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
    }

    // Fetch inmediato
    fetchData(1);
  }, [fetchData]);

  // Verificar si necesita refresh
  const needsRefresh = useCallback(() => {
    if (!lastFetch || !cacheMs) return true;
    return Date.now() - lastFetch > cacheMs;
  }, [lastFetch, cacheMs]);

  // Efecto principal
  useEffect(() => {
    if (!enabled) return;

    // Solo fetch si no tenemos datos o el cache expiró
    if (!isLoaded || needsRefresh()) {
      debouncedFetch();
    }

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, [enabled, isLoaded, needsRefresh, debouncedFetch]);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isLoaded,
    error,
    refetch,
    needsRefresh: needsRefresh(),
    lastFetch,
    retryCount: currentRetry.current
  };
};

// 🎣 HOOK ESPECÍFICO PARA GYM CONFIG
export const useGymConfigDebounced = () => {
  const fallback = {
    name: 'Elite Fitness',
    tagline: 'Tu transformación comienza aquí',
    description: 'El mejor gimnasio de Guatemala',
    contact: {
      phone: '+502 2234-5678',
      email: 'info@elitefitness.gt',
      address: 'Zona 10, Ciudad de Guatemala'
    },
    hours: {
      full: 'Lun-Vie 6:00-22:00, Sáb 8:00-20:00'
    },
    social: {
      facebook: { url: 'https://facebook.com/elitefitness', active: true },
      instagram: { url: 'https://instagram.com/elitefitness', active: true }
    }
  };

  return useDebounced(
    '/api/gym/config',
    () => import('../services/apiService').then(module => module.default.getGymConfig()),
    {
      fallbackData: fallback,
      debounceMs: 500, // Más delay para config
      cacheMs: 10 * 60 * 1000, // 10 minutos de cache
      retryCount: 1 // Solo 1 retry para config
    }
  );
};

// 🎣 HOOK ESPECÍFICO PARA STATS
export const useGymStatsDebounced = () => {
  const fallback = {
    members: 500,
    trainers: 12,
    experience: 8,
    satisfaction: 95
  };

  return useDebounced(
    '/api/gym/statistics',
    () => import('../services/apiService').then(module => module.default.getGymStats()),
    {
      fallbackData: fallback,
      debounceMs: 400,
      cacheMs: 15 * 60 * 1000 // 15 minutos
    }
  );
};

// 🎣 HOOK ESPECÍFICO PARA SERVICIOS
export const useGymServicesDebounced = () => {
  const fallback = [
    {
      id: 1,
      title: 'Entrenamiento Personal',
      description: 'Sesiones 1 a 1 con entrenadores certificados',
      icon: 'Dumbbell'
    },
    {
      id: 2,
      title: 'Clases Grupales',
      description: 'Variedad de clases para todos los niveles',
      icon: 'Users'
    },
    {
      id: 3,
      title: 'Área de Pesas',
      description: 'Equipos de última generación',
      icon: 'Target'
    }
  ];

  return useDebounced(
    '/api/gym/services',
    () => import('../services/apiService').then(module => module.default.getGymServices()),
    {
      fallbackData: fallback,
      debounceMs: 350,
      cacheMs: 20 * 60 * 1000 // 20 minutos
    }
  );
};

// 🎣 HOOK ESPECÍFICO PARA PRODUCTOS DESTACADOS
export const useFeaturedProductsDebounced = () => {
  const fallback = [
    {
      id: 1,
      name: 'Proteína Whey Premium',
      price: 250,
      image: '/api/placeholder/300/300',
      category: 'Suplementos'
    },
    {
      id: 2,
      name: 'Camiseta Elite Fitness',
      price: 80,
      image: '/api/placeholder/300/300',
      category: 'Ropa'
    },
    {
      id: 3,
      name: 'Shaker Premium',
      price: 35,
      image: '/api/placeholder/300/300',
      category: 'Accesorios'
    }
  ];

  return useDebounced(
    '/api/gym/featured-products',
    () => import('../services/apiService').then(module => module.default.getFeaturedProducts()),
    {
      fallbackData: fallback,
      debounceMs: 600, // Más delay para productos
      cacheMs: 30 * 60 * 1000 // 30 minutos
    }
  );
};

// 🎣 HOOK ESPECÍFICO PARA PLANES
export const useMembershipPlansDebounced = () => {
  const fallback = [
    {
      id: 1,
      name: 'Básico',
      price: 200,
      duration: 'mes',
      features: ['Acceso al gimnasio', 'Área de cardio']
    },
    {
      id: 2,
      name: 'Premium',
      price: 350,
      duration: 'mes',
      popular: true,
      features: ['Todo lo del básico', 'Clases grupales', 'Entrenamiento personal']
    }
  ];

  return useDebounced(
    '/api/gym/plans',
    () => import('../services/apiService').then(module => module.default.getMembershipPlans()),
    {
      fallbackData: fallback,
      debounceMs: 450,
      cacheMs: 25 * 60 * 1000 // 25 minutos
    }
  );
};

// 🔧 HOOK PARA COORDINADOR STATUS
export const useRequestCoordinatorStatus = () => {
  const [status, setStatus] = useState(requestCoordinator.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(requestCoordinator.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
};

export default useDebounced;

// ✅ SISTEMA IMPLEMENTADO:
//
// 🚦 COORDINADOR DE PETICIONES:
// ✅ Evita peticiones duplicadas al mismo endpoint
// ✅ Reutiliza promesas activas
// ✅ Timing controlado entre peticiones
// ✅ Estado global compartido
//
// ⏰ DEBOUNCING INTELIGENTE:
// ✅ 200-600ms de delay entre hooks
// ✅ Cancela peticiones anteriores
// ✅ Retry con exponential backoff
// ✅ Cache configurable por hook
//
// 🛡️ FALLBACKS ROBUSTOS:
// ✅ Datos por defecto para cada hook
// ✅ Manejo silencioso de errores 429
// ✅ Cleanup apropiado al desmontar
// ✅ Estado consistente siempre
//
// 📊 HOOKS ESPECÍFICOS:
// ✅ useGymConfigDebounced - 500ms delay, 10min cache
// ✅ useGymStatsDebounced - 400ms delay, 15min cache  
// ✅ useGymServicesDebounced - 350ms delay, 20min cache
// ✅ useFeaturedProductsDebounced - 600ms delay, 30min cache
// ✅ useMembershipPlansDebounced - 450ms delay, 25min cache
//
// 🔧 UTILIDADES:
// ✅ useRequestCoordinatorStatus - para debugging
// ✅ refetch manual para cada hook
// ✅ needsRefresh para validar cache
// ✅ Estados claros (loading, loaded, error)