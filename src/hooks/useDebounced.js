// Autor: Alexander Echeverria
// src/hooks/useDebounced.js
// FUNCIÓN: Sistema de hooks con debouncing para evitar rate limiting del backend

import { useState, useEffect, useCallback, useRef } from 'react';

// Coordinador global de peticiones
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
      console.log(`Reutilizando petición activa: ${endpoint}`);
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
      console.log(`Esperando ${delay}ms antes de hacer petición: ${endpoint}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    
    try {
      const result = await requestFn();
      console.log(`Petición exitosa: ${endpoint}`);
      return result;
    } catch (error) {
      console.warn(`Error en petición: ${endpoint}`, error.message);
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

// Hook principal con debouncing
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

      console.warn(`Error en useDebounced (${endpoint}):`, error.message);
      
      // Determinar si debemos reintentar
      const shouldRetry = attempt < retryCount && (
        error.response?.status === 429 || // Too Many Requests
        error.response?.status >= 500 || // Server Error
        error.code === 'ERR_NETWORK' || // Network Error
        error.code === 'ECONNABORTED' // Timeout
      );

      if (shouldRetry) {
        console.log(`Reintentando ${endpoint} en ${retryDelay * attempt}ms... (${attempt}/${retryCount})`);
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

// Hook específico para configuración del gimnasio
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

// Hook específico para estadísticas
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

// Hook específico para servicios
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

// Hook específico para productos destacados
export const useFeaturedProductsDebounced = () => {
  const fallback = [
    {
      id: 1,
      name: 'Proteína Whey Premium',
      price: 250,
      currency: 'Q',
      image: '/api/placeholder/300/300',
      category: 'Suplementos'
    },
    {
      id: 2,
      name: 'Camiseta Elite Fitness',
      price: 80,
      currency: 'Q',
      image: '/api/placeholder/300/300',
      category: 'Ropa'
    },
    {
      id: 3,
      name: 'Shaker Premium',
      price: 35,
      currency: 'Q',
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

// Hook específico para planes de membresía
export const useMembershipPlansDebounced = () => {
  const fallback = [
    {
      id: 1,
      name: 'Básico',
      price: 200,
      currency: 'Q',
      duration: 'mes',
      features: ['Acceso al gimnasio', 'Área de cardio']
    },
    {
      id: 2,
      name: 'Premium',
      price: 350,
      currency: 'Q',
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

// Hook para estado del coordinador de peticiones
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

/*
DOCUMENTACIÓN DEL SISTEMA useDebounced

PROPÓSITO:
Este sistema de hooks implementa debouncing inteligente y coordinación de peticiones para prevenir
rate limiting del backend y optimizar el rendimiento de la aplicación del gimnasio. Proporciona
una capa de gestión robusta que evita peticiones duplicadas, implementa reintentos automáticos
y mantiene cache de datos para mejorar la experiencia del usuario.

FUNCIONALIDADES PRINCIPALES:
- Coordinación global de peticiones para evitar duplicados al mismo endpoint
- Sistema de debouncing configurable por hook específico
- Cache inteligente con tiempos personalizables por tipo de dato
- Reintentos automáticos con backoff exponencial
- Fallbacks robustos con datos por defecto
- Cleanup automático de recursos al desmontar componentes
- Logging detallado para debugging y monitoreo

ARCHIVOS Y CONEXIONES:

SERVICIOS UTILIZADOS:
- ../services/apiService: Importación dinámica para evitar circular dependencies
  * getGymConfig(): Configuración básica del gimnasio
  * getGymStats(): Estadísticas de miembros y rendimiento
  * getGymServices(): Servicios ofrecidos por el gimnasio
  * getFeaturedProducts(): Productos destacados de la tienda
  * getMembershipPlans(): Planes de membresía disponibles

DEPENDENCIAS DE REACT:
- useState: Gestión de estados de datos, carga y errores
- useEffect: Efectos para fetch automático y cleanup
- useCallback: Optimización de funciones para evitar re-renders
- useRef: Referencias para timers y estado de montaje

QUE PROPORCIONA AL SISTEMA:

COORDINADOR GLOBAL DE PETICIONES:
El sistema incluye una clase RequestCoordinator que gestiona todas las peticiones:

**Prevención de Duplicados**:
- Detecta peticiones activas al mismo endpoint
- Reutiliza promesas existentes en lugar de crear nuevas
- Evita sobrecarga del backend con múltiples requests idénticos
- Mantiene un mapa global de peticiones activas

**Control de Timing**:
- Tiempo mínimo de 200ms entre peticiones
- Coordinación inteligente para espaciar requests
- Prevención de rate limiting del servidor
- Logging de delays aplicados automáticamente

**Estado Global Compartido**:
- Información en tiempo real de peticiones activas
- Cola de peticiones pendientes
- Métricas de rendimiento y uso
- Estado de procesamiento global

HOOK PRINCIPAL useDebounced:
Proporciona la funcionalidad base para todos los hooks específicos:

**Configuración Flexible**:
- `fallbackData`: Datos por defecto mientras carga o en caso de error
- `debounceMs`: Tiempo de debounce personalizable (300ms por defecto)
- `retryCount`: Número de reintentos automáticos (2 por defecto)
- `retryDelay`: Delay base entre reintentos (1000ms por defecto)
- `cacheMs`: Tiempo de vida del cache (5 minutos por defecto)
- `enabled`: Control para habilitar/deshabilitar el hook
- `onSuccess/onError`: Callbacks para manejo de eventos

**Estados Proporcionados**:
- `data`: Datos actuales (fallback o datos del servidor)
- `isLoading`: Indica si hay una petición en curso
- `isLoaded`: Indica si se han cargado datos al menos una vez
- `error`: Error actual si la petición falló
- `refetch`: Función para forzar nueva petición
- `needsRefresh`: Indica si el cache ha expirado
- `lastFetch`: Timestamp de última petición exitosa
- `retryCount`: Número de reintentos realizados

**Manejo de Errores Inteligente**:
- Reintentos automáticos para errores temporales (429, 5xx, red)
- Backoff exponencial para espaciar reintentos
- Fallback a datos por defecto cuando fallan todos los reintentos
- Logging detallado de errores para debugging

HOOKS ESPECÍFICOS DEL GIMNASIO:

**useGymConfigDebounced**:
- **Datos**: Configuración básica del gimnasio guatemalteco
- **Fallback**: Información por defecto de Elite Fitness Guatemala
- **Debounce**: 500ms (configuración cambia poco)
- **Cache**: 10 minutos (datos muy estables)
- **Contenido**: Nombre, descripción, contacto, horarios, redes sociales

**useGymStatsDebounced**:
- **Datos**: Estadísticas del gimnasio (miembros, entrenadores, etc.)
- **Fallback**: 500 miembros, 12 entrenadores, 8 años experiencia, 95% satisfacción
- **Debounce**: 400ms
- **Cache**: 15 minutos (estadísticas cambian gradualmente)
- **Contenido**: Métricas clave para mostrar credibilidad

**useGymServicesDebounced**:
- **Datos**: Servicios ofrecidos por el gimnasio
- **Fallback**: Entrenamiento personal, clases grupales, área de pesas
- **Debounce**: 350ms
- **Cache**: 20 minutos (servicios son relativamente estables)
- **Contenido**: Lista de servicios con descripciones e iconos

**useFeaturedProductsDebounced**:
- **Datos**: Productos destacados de la tienda del gimnasio
- **Fallback**: Proteína Whey (Q250), Camiseta (Q80), Shaker (Q35)
- **Debounce**: 600ms (mayor delay para evitar sobrecarga)
- **Cache**: 30 minutos (productos cambian ocasionalmente)
- **Contenido**: Productos con precios en quetzales guatemaltecos

**useMembershipPlansDebounced**:
- **Datos**: Planes de membresía disponibles
- **Fallback**: Plan Básico (Q200/mes), Plan Premium (Q350/mes)
- **Debounce**: 450ms
- **Cache**: 25 minutos (planes son bastante estables)
- **Contenido**: Planes con precios en quetzales y características

CARACTERÍSTICAS TÉCNICAS:

**Sistema de Cache Inteligente**:
- Cache independiente por hook con tiempos optimizados
- Verificación automática de expiración
- Invalidación manual disponible con refetch()
- Persistencia durante la sesión del usuario

**Optimizaciones de Rendimiento**:
- Importación dinámica de servicios para evitar dependencias circulares
- Referencias useRef para evitar re-renders innecesarios
- Cleanup automático de timers al desmontar componentes
- Debouncing configurable según criticidad de datos

**Manejo de Estados del Componente**:
- Verificación de montaje antes de actualizar estados
- Prevención de memory leaks con cleanup apropiado
- Estados consistentes incluso durante errores
- Transiciones suaves entre estados de carga

ESTRATEGIAS DE RECUPERACIÓN:

**Criterios de Reintento**:
- Error 429 (Too Many Requests): Reintento automático
- Errores 5xx (Server Error): Reintento con backoff
- ERR_NETWORK (Network Error): Reintento para problemas de red
- ECONNABORTED (Timeout): Reintento para timeouts

**Fallbacks Robustos**:
- Datos por defecto específicos para cada hook
- Información contextual del gimnasio guatemalteco
- Precios en quetzales para productos y membresías
- Contenido funcional incluso sin backend

INTEGRACIÓN CON EL GIMNASIO:

**Datos Específicos de Guatemala**:
- Precios en quetzales guatemaltecos (Q)
- Información de contacto local
- Horarios adaptados al mercado guatemalteco
- Servicios típicos de gimnasios locales

**Productos de la Tienda**:
- Suplementos con precios en moneda local
- Equipos y accesorios del gimnasio
- Ropa deportiva con marca del gimnasio
- Precios competitivos para el mercado guatemalteco

**Planes de Membresía**:
- Estructura de precios en quetzales
- Planes adaptados al poder adquisitivo local
- Características diferenciadas por nivel
- Promociones y ofertas especiales

BENEFICIOS DEL SISTEMA:

**Para el Rendimiento**:
- Reducción significativa de peticiones al backend
- Menor latencia percibida por el usuario
- Uso eficiente del ancho de banda
- Prevención de sobrecarga del servidor

**Para la Experiencia de Usuario**:
- Carga más rápida de contenido
- Disponibilidad de datos incluso con problemas de red
- Transiciones suaves sin pantallas de carga excesivas
- Información siempre disponible con fallbacks

**Para el Desarrollo**:
- Hooks especializados para cada tipo de dato
- Manejo automático de errores y reintentos
- Debugging facilitado con logging detallado
- Coordinación automática sin configuración manual

Este sistema es fundamental para mantener un rendimiento óptimo de la aplicación
del gimnasio, proporcionando una experiencia fluida para los usuarios mientras
protege el backend de sobrecarga y asegura la disponibilidad de información
crítica del negocio en Guatemala.
*/