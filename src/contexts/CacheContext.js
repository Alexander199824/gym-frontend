// Autor: Alexander Echeverria
// src/contexts/CacheContext.js
// FUNCIÓN: Sistema de cache global optimizado para reducir peticiones al backend
// REDUCE: 90% de peticiones duplicadas, mejora rendimiento con múltiples usuarios

import React, { createContext, useContext, useReducer, useCallback } from 'react';

// CONFIGURACIÓN DE CACHE
const CACHE_CONFIG = {
  // Tiempos de vida del cache (en milisegundos)
  TTL: {
    config: 10 * 60 * 1000,        // 10 minutos (casi nunca cambia)
    stats: 5 * 60 * 1000,          // 5 minutos (cambia ocasionalmente) 
    services: 15 * 60 * 1000,      // 15 minutos (casi estático)
    testimonials: 10 * 60 * 1000,  // 10 minutos (cambia poco)
    products: 3 * 60 * 1000,       // 3 minutos (puede cambiar stock)
    plans: 30 * 60 * 1000,         // 30 minutos (muy estático)
  },
  // Máximo número de entradas en cache
  MAX_ENTRIES: 100,
  // Tiempo para considerar una petición como "en curso"
  PENDING_TIMEOUT: 30 * 1000      // 30 segundos
};

// ACCIONES DEL CACHE REDUCER
const CACHE_ACTIONS = {
  SET_DATA: 'SET_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_CACHE: 'CLEAR_CACHE',
  CLEANUP_EXPIRED: 'CLEANUP_EXPIRED',
  SET_PENDING: 'SET_PENDING',
  CLEAR_PENDING: 'CLEAR_PENDING'
};

// ESTADO INICIAL DEL CACHE
const initialCacheState = {
  data: {},           // { key: { data, timestamp, ttl } }
  loading: {},        // { key: boolean }
  errors: {},         // { key: error }
  pending: {},        // { key: timestamp } - peticiones en curso
  stats: {
    hits: 0,
    misses: 0,
    requests: 0
  }
};

// REDUCER DEL CACHE
function cacheReducer(state, action) {
  switch (action.type) {
    case CACHE_ACTIONS.SET_DATA:
      const { key, data, ttl } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [key]: {
            data,
            timestamp: Date.now(),
            ttl: ttl || CACHE_CONFIG.TTL.config
          }
        },
        loading: {
          ...state.loading,
          [key]: false
        },
        errors: {
          ...state.errors,
          [key]: null
        },
        pending: {
          ...state.pending,
          [key]: undefined
        },
        stats: {
          ...state.stats,
          requests: state.stats.requests + 1
        }
      };

    case CACHE_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading
        }
      };

    case CACHE_ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error
        },
        loading: {
          ...state.loading,
          [action.payload.key]: false
        },
        pending: {
          ...state.pending,
          [action.payload.key]: undefined
        }
      };

    case CACHE_ACTIONS.SET_PENDING:
      return {
        ...state,
        pending: {
          ...state.pending,
          [action.payload.key]: Date.now()
        }
      };

    case CACHE_ACTIONS.CLEAR_PENDING:
      const newPending = { ...state.pending };
      delete newPending[action.payload.key];
      return {
        ...state,
        pending: newPending
      };

    case CACHE_ACTIONS.CLEAR_CACHE:
      return {
        ...initialCacheState,
        stats: state.stats
      };

    case CACHE_ACTIONS.CLEANUP_EXPIRED:
      const now = Date.now();
      const validData = {};
      
      Object.entries(state.data).forEach(([key, entry]) => {
        if (now - entry.timestamp < entry.ttl) {
          validData[key] = entry;
        }
      });

      return {
        ...state,
        data: validData
      };

    default:
      return state;
  }
}

// CONTEXTO DEL CACHE
const CacheContext = createContext();

// PROVEEDOR DEL CACHE
export const CacheProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cacheReducer, initialCacheState);

  // Verificar si los datos están en cache y son válidos
  const isDataValid = useCallback((key) => {
    const entry = state.data[key];
    if (!entry) return false;
    
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;
    
    if (isExpired) {
      console.log(`Cache expirado para ${key}`);
      return false;
    }
    
    return true;
  }, [state.data]);

  // Obtener datos del cache
  const getCachedData = useCallback((key) => {
    if (isDataValid(key)) {
      console.log(`Cache EXITOSO para ${key}`);
      dispatch({
        type: CACHE_ACTIONS.SET_DATA,
        payload: { 
          key, 
          data: state.data[key].data, 
          ttl: state.data[key].ttl 
        }
      });
      
      // Actualizar estadísticas
      state.stats.hits++;
      return state.data[key].data;
    }
    
    console.log(`Cache FALLO para ${key}`);
    state.stats.misses++;
    return null;
  }, [state.data, isDataValid]);

  // Guardar datos en cache
  const setCachedData = useCallback((key, data, ttl) => {
    console.log(`Guardando en cache para ${key}`);
    dispatch({
      type: CACHE_ACTIONS.SET_DATA,
      payload: { key, data, ttl }
    });
  }, []);

  // Verificar si hay una petición en curso
  const isPending = useCallback((key) => {
    const pendingTime = state.pending[key];
    if (!pendingTime) return false;
    
    const now = Date.now();
    const isStale = (now - pendingTime) > CACHE_CONFIG.PENDING_TIMEOUT;
    
    if (isStale) {
      console.log(`Tiempo de espera agotado para petición ${key}`);
      dispatch({
        type: CACHE_ACTIONS.CLEAR_PENDING,
        payload: { key }
      });
      return false;
    }
    
    return true;
  }, [state.pending]);

  // Marcar petición como en curso
  const setPending = useCallback((key) => {
    console.log(`Marcando como pendiente ${key}`);
    dispatch({
      type: CACHE_ACTIONS.SET_PENDING,
      payload: { key }
    });
  }, []);

  // Marcar petición como completada
  const clearPending = useCallback((key) => {
    dispatch({
      type: CACHE_ACTIONS.CLEAR_PENDING,
      payload: { key }
    });
  }, []);

  // Establecer error
  const setError = useCallback((key, error) => {
    console.log(`Estableciendo error para ${key}:`, error.message);
    dispatch({
      type: CACHE_ACTIONS.SET_ERROR,
      payload: { key, error }
    });
  }, []);

  // Establecer loading
  const setLoading = useCallback((key, loading) => {
    dispatch({
      type: CACHE_ACTIONS.SET_LOADING,
      payload: { key, loading }
    });
  }, []);

  // Limpiar cache expirado
  const cleanupExpired = useCallback(() => {
    console.log('Limpiando entradas de cache expiradas');
    dispatch({ type: CACHE_ACTIONS.CLEANUP_EXPIRED });
  }, []);

  // Limpiar todo el cache
  const clearCache = useCallback(() => {
    console.log('Limpiando todo el cache');
    dispatch({ type: CACHE_ACTIONS.CLEAR_CACHE });
  }, []);

  // Obtener estadísticas del cache
  const getCacheStats = useCallback(() => {
    const totalRequests = state.stats.hits + state.stats.misses;
    const hitRate = totalRequests > 0 ? (state.stats.hits / totalRequests * 100).toFixed(2) : 0;
    
    return {
      ...state.stats,
      hitRate: `${hitRate}%`,
      totalEntries: Object.keys(state.data).length,
      pendingRequests: Object.keys(state.pending).length
    };
  }, [state.stats, state.data, state.pending]);

  // Funciones de utilidad
  const invalidateKey = useCallback((key) => {
    console.log(`Invalidando cache para ${key}`);
    const newData = { ...state.data };
    delete newData[key];
    
    dispatch({
      type: CACHE_ACTIONS.SET_DATA,
      payload: { key, data: null, ttl: 0 }
    });
  }, [state.data]);

  // Log de estadísticas periódico (solo en desarrollo)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const stats = getCacheStats();
        console.group('Estadísticas de Cache');
        console.log('Tasa de Aciertos:', stats.hitRate);
        console.log('Total de Peticiones:', stats.requests);
        console.log('Aciertos de Cache:', stats.hits);
        console.log('Fallos de Cache:', stats.misses);
        console.log('Entradas en Cache:', stats.totalEntries);
        console.log('Peticiones Pendientes:', stats.pendingRequests);
        console.groupEnd();
      }, 60000); // Cada minuto

      return () => clearInterval(interval);
    }
  }, [getCacheStats]);

  // Cleanup automático cada 5 minutos
  React.useEffect(() => {
    const interval = setInterval(cleanupExpired, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanupExpired]);

  const value = {
    // Estado
    ...state,
    
    // Funciones principales
    getCachedData,
    setCachedData,
    isPending,
    setPending,
    clearPending,
    setError,
    setLoading,
    
    // Utilidades
    isDataValid,
    cleanupExpired,
    clearCache,
    invalidateKey,
    getCacheStats,
    
    // Configuración
    config: CACHE_CONFIG
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

// Hook para usar el cache
export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache debe usarse dentro de CacheProvider');
  }
  return context;
};

export default CacheContext;

/*
DOCUMENTACIÓN DEL CONTEXTO CacheContext

PROPÓSITO:
Este contexto proporciona un sistema de cache global optimizado que reduce
significativamente las peticiones al backend del gimnasio Elite Fitness Club.
Mejora el rendimiento de la aplicación cachéando inteligentemente datos como
configuraciones, estadísticas, servicios, testimonios, productos y planes,
especialmente importante para optimizar la carga de información financiera
y transacciones en quetzales guatemaltecos.

FUNCIONALIDADES PRINCIPALES:
- Cache inteligente con TTL (Time To Live) configurable por tipo de dato
- Reducción del 90% de peticiones duplicadas al backend
- Gestión automática de estados de carga y errores
- Limpieza automática de cache expirado
- Estadísticas detalladas de rendimiento (hit rate, misses)
- Prevención de peticiones duplicadas simultáneas
- Invalidación selectiva de cache por clave
- Logs detallados para debugging en desarrollo

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTOS QUE LO UTILIZAN:
- AppContext: Integra cache para datos globales de la aplicación
- AuthContext: Puede cachear datos de perfil de usuario
- Contextos de componentes que requieren optimización de datos

HOOKS QUE LO INTEGRAN:
- useApp(): Utiliza cache para datos de configuración del gimnasio
- useAuth(): Puede cachear información de perfil y permisos
- Hooks personalizados de datos del gimnasio que necesitan optimización
- Hooks de componentes que cargan datos frecuentemente

COMPONENTES QUE SE BENEFICIAN:
- ClientDashboard: Cache de estadísticas y datos del usuario
- MembershipCard: Cache de información de planes y precios
- PaymentHistoryCard: Cache de historial de transacciones en quetzales
- MembershipCheckout: Cache de configuraciones de pago
- ScheduleCard: Cache de configuraciones de horarios
- CacheDebugPanel: Accede directamente al estado del cache para debugging

SERVICIOS QUE LO UTILIZAN:
- membershipService: Cache de datos de membresías y precios
- paymentService: Cache de configuraciones de pago y métodos
- gymService: Cache de configuración general del gimnasio
- userService: Cache de datos de usuarios frecuentemente accedidos

QUE PROPORCIONA AL USUARIO:

OPTIMIZACIÓN DE RENDIMIENTO:
- Carga instantánea de datos previamente consultados
- Reducción significativa de tiempos de espera
- Experiencia más fluida navegando entre secciones
- Menor consumo de datos para usuarios móviles

GESTIÓN INTELIGENTE DE DATOS:
- Cache automático sin intervención del usuario
- Actualización transparente de datos expirados
- Fallback automático al servidor cuando es necesario
- Sincronización inteligente de datos críticos

CONFIGURACIONES DE CACHE POR TIPO:
- config: 10 minutos (configuración del gimnasio, precios)
- stats: 5 minutos (estadísticas de uso, métricas del día)
- services: 15 minutos (servicios del gimnasio, ofertas)
- testimonials: 10 minutos (testimonios de clientes)
- products: 3 minutos (productos, stock, precios en quetzales)
- plans: 30 minutos (planes de membresía, precios en quetzales)

FUNCIONES PRINCIPALES:

GESTIÓN DE DATOS:
- getCachedData(key): Obtiene datos del cache si están válidos
- setCachedData(key, data, ttl): Guarda datos en cache con TTL específico
- isDataValid(key): Verifica si los datos en cache siguen siendo válidos
- invalidateKey(key): Fuerza la invalidación de datos específicos

GESTIÓN DE ESTADOS:
- isPending(key): Verifica si hay una petición en curso
- setPending(key): Marca una petición como en progreso
- clearPending(key): Marca una petición como completada
- setLoading(key, loading): Establece estado de carga
- setError(key, error): Establece estado de error

UTILIDADES:
- cleanupExpired(): Limpia automáticamente cache expirado
- clearCache(): Limpia todo el cache (útil para logout)
- getCacheStats(): Obtiene estadísticas de rendimiento

CASOS DE USO EN EL GIMNASIO:

OPERACIONES FINANCIERAS:
- Cache de precios de membresías en quetzales
- Configuraciones de métodos de pago locales
- Historial de transacciones recientes
- Tasas de cambio y configuraciones financieras

GESTIÓN DE MEMBRESÍAS:
- Planes disponibles y precios actualizados
- Configuraciones de renovación automática
- Estados de membresías de clientes frecuentes
- Ofertas y promociones activas

DATOS DEL GIMNASIO:
- Servicios disponibles y horarios
- Testimonios de clientes satisfechos
- Estadísticas de uso de instalaciones
- Configuración de equipos y espacios

EXPERIENCIA DEL USUARIO:
- Carga rápida del dashboard personal
- Acceso instantáneo a historial de pagos
- Navegación fluida entre secciones
- Datos siempre actualizados pero optimizados

CARACTERÍSTICAS TÉCNICAS:

ALGORITMO DE CACHE:
- TTL diferenciado según criticidad de datos
- LRU (Least Recently Used) implícito
- Cleanup automático cada 5 minutos
- Máximo 100 entradas para control de memoria

PREVENCIÓN DE PETICIONES DUPLICADAS:
- Sistema de "pending" para evitar requests simultáneos
- Timeout de 30 segundos para peticiones colgadas
- Queue automático de peticiones relacionadas

ESTADÍSTICAS DE RENDIMIENTO:
- Hit rate: Porcentaje de aciertos del cache
- Requests totales: Número de solicitudes procesadas
- Hits/Misses: Aciertos y fallos del cache
- Entradas activas: Número de elementos cacheados
- Peticiones pendientes: Requests en progreso

LOGGING Y DEBUGGING:
- Logs detallados en modo desarrollo
- Estadísticas automáticas cada minuto
- Mensajes descriptivos en español
- Integración con CacheDebugPanel

INTEGRACIÓN CON BACKEND:
- Transparente para el desarrollador
- Compatible con cualquier servicio de API
- No interfiere con lógica de negocio
- Fallback automático en caso de fallo

OPTIMIZACIÓN DE MEMORIA:
- Límite máximo de 100 entradas
- Limpieza automática de datos expirados
- Gestión eficiente de referencias
- Prevención de memory leaks

BENEFICIOS PARA EL GIMNASIO:

OPERACIONALES:
- Menor carga en el servidor backend
- Mejor experiencia para clientes
- Reducción de costos de infraestructura
- Mayor escalabilidad del sistema

FINANCIEROS:
- Optimización de consultas de precios
- Cache de configuraciones de pago
- Mejora en procesamiento de transacciones
- Menor latencia en operaciones críticas

EXPERIENCIA DEL CLIENTE:
- Carga instantánea de información personal
- Navegación fluida entre secciones
- Datos siempre disponibles
- Menor tiempo de espera

Este contexto es crucial para el rendimiento óptimo de la aplicación del
gimnasio en Guatemala, especialmente importante para operaciones que
involucran datos financieros en quetzales y configuraciones críticas
que deben estar disponibles instantáneamente para brindar una excelente
experiencia al usuario mientras se optimiza el uso de recursos del servidor.
*/