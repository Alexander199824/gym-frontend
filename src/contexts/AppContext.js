// Autor: Alexander Echeverria
// src/contexts/AppContext.js
// FUNCIÓN: Estado global con cache MEJORADO para persistir entre navegaciones
// CONECTA CON: Todos los hooks de gym y sistema de cache

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ESTADO INICIAL
const initialState = {
  // Configuración de UI
  theme: 'light',                    // light, dark, auto
  sidebarCollapsed: false,           // ¿Sidebar colapsado?
  notifications: [],                 // Notificaciones en tiempo real
  
  // Configuración de dispositivo
  isMobile: false,                   // ¿Es dispositivo móvil?
  isTablet: false,                   // ¿Es tablet?
  screenSize: 'desktop',             // mobile, tablet, desktop
  
  // Configuración regional
  language: 'es',                    // Idioma de la aplicación
  timezone: 'America/Guatemala',     // Zona horaria
  currency: 'GTQ',                   // Moneda quetzales guatemaltecos
  dateFormat: 'dd/MM/yyyy',          // Formato de fecha
  
  // Sistema de notificaciones
  notificationSettings: {
    desktop: true,                   // Notificaciones del navegador
    sound: true,                     // Sonidos
    email: true,                     // Notificaciones por email
    push: false                      // Push notifications (futuro)
  },
  
  // Estado de datos del backend
  dataLoading: {
    gymConfig: false,
    gymStats: false,
    gymServices: false,
    testimonials: false,
    featuredProducts: false,
    sectionsContent: false,
    navigation: false,
    branding: false,
    gymVideo: false
  },
  
  // Cache del backend - MEJORADO con persistencia
  backendCache: {
    gymConfig: { data: null, timestamp: null, ttl: 30 * 60 * 1000 }, // 30 min - más tiempo
    gymStats: { data: null, timestamp: null, ttl: 10 * 60 * 1000 }, // 10 min
    gymServices: { data: null, timestamp: null, ttl: 30 * 60 * 1000 }, // 30 min - más estático
    testimonials: { data: null, timestamp: null, ttl: 30 * 60 * 1000 }, // 30 min
    featuredProducts: { data: null, timestamp: null, ttl: 10 * 60 * 1000 }, // 10 min
    sectionsContent: { data: null, timestamp: null, ttl: 20 * 60 * 1000 }, // 20 min
    navigation: { data: null, timestamp: null, ttl: 60 * 60 * 1000 }, // 60 min
    branding: { data: null, timestamp: null, ttl: 60 * 60 * 1000 }, // 60 min
    gymVideo: { data: null, timestamp: null, ttl: 60 * 60 * 1000 } // 60 min - video raramente cambia
  },
  
  // Filtros globales
  globalFilters: {
    dateRange: null,
    selectedGym: null,
    activeOnly: true
  },
  
  // Configuración de la aplicación
  appSettings: {
    autoRefresh: true,               // Refrescar datos automáticamente
    refreshInterval: 30000,          // Intervalo de refresco (30s)
    compactMode: false,              // Modo compacto
    animationsEnabled: true,         // Animaciones habilitadas
    cacheEnabled: true,              // Cache habilitado
    persistentCache: true            // Cache persistente entre navegaciones
  },
  
  // Métricas en tiempo real
  liveMetrics: {
    onlineUsers: 0,
    todayPayments: 0,
    expiredMemberships: 0,
    lastUpdate: null
  },
  
  // Estado de sincronización
  syncStatus: {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingSync: false,
    failedRequests: []
  },
  
  // Estado del video - NUEVO
  videoState: {
    loaded: false,
    error: false,
    playing: false,
    muted: true
  }
};

// TIPOS DE ACCIONES
const ACTION_TYPES = {
  // UI Actions
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SCREEN_SIZE: 'SET_SCREEN_SIZE',
  
  // Notification Actions
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  UPDATE_NOTIFICATION_SETTINGS: 'UPDATE_NOTIFICATION_SETTINGS',
  
  // Data Loading Actions
  SET_DATA_LOADING: 'SET_DATA_LOADING',
  
  // Cache Actions
  SET_CACHE_DATA: 'SET_CACHE_DATA',
  CLEAR_CACHE: 'CLEAR_CACHE',
  CLEAR_CACHE_ITEM: 'CLEAR_CACHE_ITEM',
  LOAD_CACHE_FROM_STORAGE: 'LOAD_CACHE_FROM_STORAGE',
  
  // Filter Actions
  SET_GLOBAL_FILTER: 'SET_GLOBAL_FILTER',
  CLEAR_GLOBAL_FILTERS: 'CLEAR_GLOBAL_FILTERS',
  
  // Settings Actions
  UPDATE_APP_SETTINGS: 'UPDATE_APP_SETTINGS',
  UPDATE_LANGUAGE: 'UPDATE_LANGUAGE',
  
  // Metrics Actions
  UPDATE_LIVE_METRICS: 'UPDATE_LIVE_METRICS',
  
  // Sync Actions
  UPDATE_SYNC_STATUS: 'UPDATE_SYNC_STATUS',
  
  // Video Actions - NUEVO
  UPDATE_VIDEO_STATE: 'UPDATE_VIDEO_STATE'
};

// REDUCER DE LA APLICACIÓN
function appReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
      
    case ACTION_TYPES.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      };
      
    case ACTION_TYPES.SET_SCREEN_SIZE:
      return {
        ...state,
        isMobile: action.payload.isMobile,
        isTablet: action.payload.isTablet,
        screenSize: action.payload.screenSize
      };
      
    case ACTION_TYPES.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 10) // Max 10
      };
      
    case ACTION_TYPES.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
      
    case ACTION_TYPES.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
      
    case ACTION_TYPES.UPDATE_NOTIFICATION_SETTINGS:
      return {
        ...state,
        notificationSettings: { ...state.notificationSettings, ...action.payload }
      };
      
    case ACTION_TYPES.SET_DATA_LOADING:
      return {
        ...state,
        dataLoading: { ...state.dataLoading, ...action.payload }
      };
      
    case ACTION_TYPES.SET_CACHE_DATA:
      return {
        ...state,
        backendCache: {
          ...state.backendCache,
          [action.payload.key]: {
            data: action.payload.data,
            timestamp: Date.now(),
            ttl: state.backendCache[action.payload.key]?.ttl || 5 * 60 * 1000
          }
        }
      };
      
    case ACTION_TYPES.LOAD_CACHE_FROM_STORAGE:
      return {
        ...state,
        backendCache: { ...state.backendCache, ...action.payload }
      };
      
    case ACTION_TYPES.CLEAR_CACHE:
      return {
        ...state,
        backendCache: Object.keys(state.backendCache).reduce((acc, key) => {
          acc[key] = { data: null, timestamp: null, ttl: state.backendCache[key].ttl };
          return acc;
        }, {})
      };
      
    case ACTION_TYPES.CLEAR_CACHE_ITEM:
      return {
        ...state,
        backendCache: {
          ...state.backendCache,
          [action.payload]: {
            data: null,
            timestamp: null,
            ttl: state.backendCache[action.payload]?.ttl || 5 * 60 * 1000
          }
        }
      };
      
    case ACTION_TYPES.SET_GLOBAL_FILTER:
      return {
        ...state,
        globalFilters: { ...state.globalFilters, ...action.payload }
      };
      
    case ACTION_TYPES.CLEAR_GLOBAL_FILTERS:
      return {
        ...state,
        globalFilters: {
          dateRange: null,
          selectedGym: null,
          activeOnly: true
        }
      };
      
    case ACTION_TYPES.UPDATE_APP_SETTINGS:
      return {
        ...state,
        appSettings: { ...state.appSettings, ...action.payload }
      };
      
    case ACTION_TYPES.UPDATE_LANGUAGE:
      return {
        ...state,
        language: action.payload
      };
      
    case ACTION_TYPES.UPDATE_LIVE_METRICS:
      return {
        ...state,
        liveMetrics: { ...state.liveMetrics, ...action.payload, lastUpdate: new Date() }
      };
      
    case ACTION_TYPES.UPDATE_SYNC_STATUS:
      return {
        ...state,
        syncStatus: { ...state.syncStatus, ...action.payload }
      };
      
    case ACTION_TYPES.UPDATE_VIDEO_STATE:
      return {
        ...state,
        videoState: { ...state.videoState, ...action.payload }
      };
      
    default:
      return state;
  }
}

// CREAR CONTEXTO
const AppContext = createContext();

// HOOK PERSONALIZADO
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
}

// PROVIDER DE LA APLICACIÓN
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // EFECTO: Cargar cache desde localStorage AL INICIO
  useEffect(() => {
    loadCacheFromStorage();
  }, []);
  
  // EFECTO: Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;
      const screenSize = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
      
      dispatch({
        type: ACTION_TYPES.SET_SCREEN_SIZE,
        payload: { isMobile, isTablet, screenSize }
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // EFECTO: Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: ACTION_TYPES.UPDATE_SYNC_STATUS,
        payload: { isOnline: true }
      });
    };
    
    const handleOffline = () => {
      dispatch({
        type: ACTION_TYPES.UPDATE_SYNC_STATUS,
        payload: { isOnline: false }
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // EFECTO: Manejar tema del sistema
  useEffect(() => {
    if (state.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        document.documentElement.className = mediaQuery.matches ? 'dark' : 'light';
      };
      
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      document.documentElement.className = state.theme;
    }
  }, [state.theme]);
  
  // EFECTO: Auto refresh de métricas
  useEffect(() => {
    if (state.appSettings.autoRefresh) {
      const interval = setInterval(() => {
        refreshLiveMetrics();
      }, state.appSettings.refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [state.appSettings.autoRefresh, state.appSettings.refreshInterval]);
  
  // EFECTO: Guardar cache en localStorage cuando cambie - MEJORADO
  useEffect(() => {
    if (state.appSettings.persistentCache) {
      saveCacheToStorage();
    }
  }, [state.backendCache, state.appSettings.persistentCache]);
  
  // EFECTO: Refrescar cache cuando se vuelve visible la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, checking cache freshness...');
        checkCacheFreshness();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // FUNCIONES DE LA APLICACIÓN
  
  // Cambiar tema
  const setTheme = (theme) => {
    dispatch({ type: ACTION_TYPES.SET_THEME, payload: theme });
    localStorage.setItem('gym_theme', theme);
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    dispatch({ type: ACTION_TYPES.TOGGLE_SIDEBAR });
  };
  
  // Agregar notificación
  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    dispatch({ type: ACTION_TYPES.ADD_NOTIFICATION, payload: newNotification });
    
    // Auto-remove después de 5 segundos si no es persistente
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
    
    // Notificación del navegador si está habilitada
    if (state.notificationSettings.desktop && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    }
  };
  
  // Remover notificación
  const removeNotification = (id) => {
    dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: id });
  };
  
  // Limpiar todas las notificaciones
  const clearNotifications = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_NOTIFICATIONS });
  };
  
  // Actualizar configuración de notificaciones
  const updateNotificationSettings = (settings) => {
    dispatch({ type: ACTION_TYPES.UPDATE_NOTIFICATION_SETTINGS, payload: settings });
    
    // Solicitar permiso para notificaciones del navegador
    if (settings.desktop && 'Notification' in window) {
      Notification.requestPermission();
    }
  };
  
  // Establecer estado de carga de datos
  const setDataLoading = (loadingState) => {
    dispatch({ type: ACTION_TYPES.SET_DATA_LOADING, payload: loadingState });
  };
  
  // FUNCIONES DE CACHE MEJORADAS
  
  // Establecer datos en cache
  const setCacheData = (key, data) => {
    console.log(`Setting cache for ${key}:`, data);
    dispatch({
      type: ACTION_TYPES.SET_CACHE_DATA,
      payload: { key, data }
    });
  };
  
  // Obtener datos del cache
  const getCacheData = (key) => {
    const cacheItem = state.backendCache[key];
    if (!cacheItem || !cacheItem.timestamp) {
      console.log(`Cache MISS for ${key}: No data`);
      return null;
    }
    
    const now = Date.now();
    const age = now - cacheItem.timestamp;
    
    if (age > cacheItem.ttl) {
      console.log(`Cache EXPIRED for ${key}: Age ${age}ms > TTL ${cacheItem.ttl}ms`);
      return null;
    }
    
    console.log(`Cache HIT for ${key}: Age ${age}ms, TTL ${cacheItem.ttl}ms`);
    return cacheItem.data;
  };
  
  // Verificar si cache es válido
  const isCacheValid = (key) => {
    const cacheItem = state.backendCache[key];
    if (!cacheItem || !cacheItem.timestamp) return false;
    
    const now = Date.now();
    const age = now - cacheItem.timestamp;
    
    return age <= cacheItem.ttl;
  };
  
  // Verificar frescura del cache
  const checkCacheFreshness = () => {
    console.log('Checking cache freshness...');
    const now = Date.now();
    
    Object.entries(state.backendCache).forEach(([key, cacheItem]) => {
      if (cacheItem.timestamp) {
        const age = now - cacheItem.timestamp;
        const remainingTime = cacheItem.ttl - age;
        
        if (remainingTime <= 0) {
          console.log(`Cache for ${key} expired, marking for refresh`);
        } else {
          console.log(`Cache for ${key} still fresh: ${Math.round(remainingTime / 1000)}s remaining`);
        }
      }
    });
  };
  
  // Limpiar cache completo
  const clearCache = () => {
    console.log('Clearing all cache...');
    dispatch({ type: ACTION_TYPES.CLEAR_CACHE });
    if (state.appSettings.persistentCache) {
      localStorage.removeItem('gym_backend_cache');
    }
  };
  
  // Limpiar item específico del cache
  const clearCacheItem = (key) => {
    console.log(`Clearing cache for ${key}`);
    dispatch({ type: ACTION_TYPES.CLEAR_CACHE_ITEM, payload: key });
  };
  
  // Cargar cache desde localStorage - MEJORADO
  const loadCacheFromStorage = () => {
    if (!state.appSettings.persistentCache) return;
    
    try {
      const savedCache = localStorage.getItem('gym_backend_cache');
      if (savedCache) {
        const cacheData = JSON.parse(savedCache);
        const validCache = {};
        const now = Date.now();
        
        console.log('Loading cache from localStorage...');
        
        // Verificar y cargar solo cache válido
        Object.entries(cacheData).forEach(([key, item]) => {
          if (item && item.timestamp && item.data) {
            const age = now - item.timestamp;
            const ttl = state.backendCache[key]?.ttl || 5 * 60 * 1000;
            
            if (age <= ttl) {
              validCache[key] = {
                ...item,
                ttl // Actualizar TTL desde configuración actual
              };
              console.log(`Restored ${key} from cache (age: ${Math.round(age / 1000)}s)`);
            } else {
              console.log(`Expired ${key} in cache (age: ${Math.round(age / 1000)}s)`);
            }
          }
        });
        
        if (Object.keys(validCache).length > 0) {
          dispatch({ 
            type: ACTION_TYPES.LOAD_CACHE_FROM_STORAGE, 
            payload: validCache 
          });
          console.log(`Loaded ${Object.keys(validCache).length} valid cache entries`);
        }
      }
    } catch (error) {
      console.error('Error loading cache from localStorage:', error);
    }
  };
  
  // Guardar cache en localStorage - MEJORADO
  const saveCacheToStorage = () => {
    if (!state.appSettings.persistentCache) return;
    
    try {
      const cacheToSave = {};
      let savedCount = 0;
      
      Object.entries(state.backendCache).forEach(([key, item]) => {
        if (item.data && item.timestamp) {
          cacheToSave[key] = item;
          savedCount++;
        }
      });
      
      if (savedCount > 0) {
        localStorage.setItem('gym_backend_cache', JSON.stringify(cacheToSave));
        console.log(`Saved ${savedCount} cache entries to localStorage`);
      }
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  };
  
  // FUNCIONES DEL VIDEO - NUEVAS
  const updateVideoState = (newState) => {
    dispatch({ type: ACTION_TYPES.UPDATE_VIDEO_STATE, payload: newState });
  };
  
  const setVideoLoaded = (loaded) => {
    updateVideoState({ loaded, error: !loaded });
  };
  
  const setVideoPlaying = (playing) => {
    updateVideoState({ playing });
  };
  
  const setVideoMuted = (muted) => {
    updateVideoState({ muted });
  };
  
  // Establecer filtro global
  const setGlobalFilter = (filter) => {
    dispatch({ type: ACTION_TYPES.SET_GLOBAL_FILTER, payload: filter });
  };
  
  // Limpiar filtros globales
  const clearGlobalFilters = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_GLOBAL_FILTERS });
  };
  
  // Actualizar configuración de la app
  const updateAppSettings = (settings) => {
    dispatch({ type: ACTION_TYPES.UPDATE_APP_SETTINGS, payload: settings });
    localStorage.setItem('gym_app_settings', JSON.stringify({ ...state.appSettings, ...settings }));
  };
  
  // Cambiar idioma
  const setLanguage = (language) => {
    dispatch({ type: ACTION_TYPES.UPDATE_LANGUAGE, payload: language });
    localStorage.setItem('gym_language', language);
  };
  
  // Actualizar métricas en tiempo real
  const updateLiveMetrics = (metrics) => {
    dispatch({ type: ACTION_TYPES.UPDATE_LIVE_METRICS, payload: metrics });
  };
  
  // Refrescar métricas en tiempo real
  const refreshLiveMetrics = async () => {
    try {
      // Simulación de métricas (reemplazar con API real)
      const mockMetrics = {
        onlineUsers: Math.floor(Math.random() * 50),
        todayPayments: Math.floor(Math.random() * 100),
        expiredMemberships: Math.floor(Math.random() * 10)
      };
      
      updateLiveMetrics(mockMetrics);
    } catch (error) {
      console.error('Error al refrescar métricas:', error);
    }
  };
  
  // Formatear fecha según configuración
  const formatDate = (date, formatString = state.dateFormat) => {
    return format(new Date(date), formatString, { locale: es });
  };
  
  // Formatear moneda en quetzales guatemaltecos
  const formatCurrency = (amount) => {
    const formatter = new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: state.currency,
      minimumFractionDigits: 2
    });
    return formatter.format(amount);
  };
  
  // Funciones de notificación simplificadas
  const showSuccess = (message, title = 'Éxito') => {
    addNotification({ type: 'success', title, message, icon: 'CheckCircle' });
  };
  
  const showError = (message, title = 'Error') => {
    addNotification({ type: 'error', title, message, icon: 'XCircle', persistent: true });
  };
  
  const showInfo = (message, title = 'Información') => {
    addNotification({ type: 'info', title, message, icon: 'Info' });
  };
  
  const showWarning = (message, title = 'Advertencia') => {
    addNotification({ type: 'warning', title, message, icon: 'AlertTriangle' });
  };
  
  // VALOR DEL CONTEXTO
  const contextValue = {
    // Estado
    ...state,
    
    // Funciones de UI
    setTheme,
    toggleSidebar,
    
    // Funciones de notificaciones
    addNotification,
    removeNotification,
    clearNotifications,
    updateNotificationSettings,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    
    // Funciones de datos
    setDataLoading,
    
    // Funciones de cache MEJORADAS
    setCacheData,
    getCacheData,
    isCacheValid,
    clearCache,
    clearCacheItem,
    checkCacheFreshness,
    
    // Funciones de filtros
    setGlobalFilter,
    clearGlobalFilters,
    
    // Funciones de configuración
    updateAppSettings,
    setLanguage,
    
    // Funciones de métricas
    updateLiveMetrics,
    refreshLiveMetrics,
    
    // Funciones de video - NUEVAS
    updateVideoState,
    setVideoLoaded,
    setVideoPlaying,
    setVideoMuted,
    
    // Funciones de utilidad
    formatDate,
    formatCurrency,
    
    // Información útil
    appName: 'Elite Fitness Club',
    appVersion: '1.0.0',
    isProduction: process.env.NODE_ENV === 'production'
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/*
DOCUMENTACIÓN DEL CONTEXTO AppContext

PROPÓSITO:
Este contexto proporciona el estado global de la aplicación del gimnasio Elite Fitness Club,
manejando configuración de UI, notificaciones, cache inteligente, métricas en tiempo real
y funciones de utilidad. Sirve como el cerebro central que coordina toda la información
y configuración compartida entre componentes, con soporte especializado para el mercado
guatemalteco y transacciones en quetzales.

FUNCIONALIDADES PRINCIPALES:
- Gestión de estado global centralizada con useReducer
- Sistema de cache inteligente con persistencia en localStorage
- Configuración de UI responsive (móvil, tablet, desktop)
- Sistema de notificaciones unificado
- Formateo de fechas y moneda en quetzales guatemaltecos
- Métricas en tiempo real del gimnasio
- Manejo de estado de conexión online/offline
- Configuración de video y multimedia
- Filtros globales para datos
- Persistencia de configuraciones de usuario

CONEXIONES CON OTROS ARCHIVOS:

HOOKS QUE LO UTILIZAN:
- useApp(): Hook principal exportado para acceder al contexto
- Todos los hooks personalizados del gimnasio que requieren estado global
- Hooks de datos que necesitan cache inteligente
- Hooks de UI que manejan responsive design

COMPONENTES CONECTADOS:
- ClientDashboard: Panel principal que usa métricas y notificaciones
- MembershipCard: Utiliza formatCurrency para mostrar precios en quetzales
- PaymentHistoryCard: Formatea transacciones en moneda guatemalteca
- ScheduleCard: Usa formatDate para fechas localizadas
- MembershipCheckout: Integra notificaciones y formateo de moneda
- CacheDebugPanel: Accede a funciones de cache para debugging
- RateLimitDebug: Utiliza sistema de notificaciones

SERVICIOS INTEGRADOS:
- membershipService: Cache de datos de membresías
- paymentService: Cache de transacciones financieras
- userService: Cache de información de usuarios
- gymService: Cache de configuración del gimnasio

LIBRERÍAS EXTERNAS:
- date-fns: Formateo de fechas con locale español
- date-fns/locale/es: Localización española para fechas

QUE PROPORCIONA AL USUARIO:

CONFIGURACIÓN REGIONAL:
- Idioma español por defecto (language: 'es')
- Zona horaria Guatemala (timezone: 'America/Guatemala')
- Moneda quetzales guatemaltecos (currency: 'GTQ')
- Formato de fecha local (dateFormat: 'dd/MM/yyyy')

FUNCIONES DE FORMATEO:
- formatCurrency(): Formatea montos como "Q 150.00" usando Intl.NumberFormat
- formatDate(): Formatea fechas en español guatemalteco
- Configuración automática de locale español para todas las fechas

SISTEMA DE NOTIFICACIONES:
- showSuccess(): Muestra notificaciones de éxito con icono verde
- showError(): Muestra errores persistentes con icono rojo
- showInfo(): Muestra información con icono azul  
- showWarning(): Muestra advertencias con icono amarillo
- Notificaciones del navegador cuando están habilitadas
- Auto-eliminación después de 5 segundos (excepto errores)

CONFIGURACIÓN DE UI:
- Detección automática de dispositivo (móvil/tablet/desktop)
- Gestión de tema (claro/oscuro/automático)
- Estado del sidebar (colapsado/expandido)
- Configuración de animaciones y modo compacto

CACHE INTELIGENTE:
- TTL configurables por tipo de dato (10min a 60min)
- Persistencia automática en localStorage
- Verificación de frescura al volver a la página
- Logs detallados para debugging
- Auto-limpieza de cache expirado

MÉTRICAS EN TIEMPO REAL:
- Usuarios online en el gimnasio
- Pagos del día actual en quetzales
- Membresías vencidas pendientes
- Actualización automática cada 30 segundos

CONFIGURACIONES DE CACHE POR TIPO:
- gymConfig: 30 minutos (configuración estable)
- gymStats: 10 minutos (estadísticas dinámicas)
- gymServices: 30 minutos (servicios del gimnasio)
- testimonials: 30 minutos (testimonios de clientes)
- featuredProducts: 10 minutos (productos destacados)
- sectionsContent: 20 minutos (contenido de secciones)
- navigation: 60 minutos (navegación raramente cambia)
- branding: 60 minutos (marca y logos estables)
- gymVideo: 60 minutos (videos promocionales)

CASOS DE USO EN EL GIMNASIO:
- Formateo consistente de precios de membresías en quetzales
- Cache de datos de clientes para acceso rápido
- Notificaciones de pagos vencidos o completados
- Métricas de ocupación en tiempo real
- Configuración regional guatemalteca automática
- Persistencia de preferencias de usuario
- Optimización de rendimiento con cache inteligente

ESTADO DE CONEXIÓN:
- Detección automática online/offline
- Manejo de requests fallidos cuando no hay conexión
- Reintento automático al recuperar conexión
- Estado de sincronización pendiente

GESTIÓN DE VIDEO:
- Estado de carga de videos promocionales
- Control de reproducción y audio
- Manejo de errores en contenido multimedia
- Optimización para dispositivos móviles

CONFIGURACIONES PERSISTENTES:
- Tema preferido del usuario
- Idioma seleccionado
- Configuraciones de notificaciones
- Configuraciones de la aplicación
- Cache de datos entre sesiones

FUNCIONALIDADES TÉCNICAS:
- useReducer para manejo de estado complejo
- localStorage para persistencia de datos
- Event listeners para detección de cambios
- Cleanup automático de efectos
- Validación de cache por TTL
- Manejo de errores graceful

INTEGRACIÓN CON BACKEND:
- Cache automático de respuestas de API
- Gestión de estados de carga
- Manejo de errores de red
- Optimización de requests duplicados
- Persistencia de datos críticos

BENEFICIOS PARA RENDIMIENTO:
- Reducción de requests al servidor
- Carga instantánea de datos cacheados
- Optimización de memoria con límites de cache
- Limpieza automática de datos obsoletos
- Persistencia inteligente entre navegaciones

ACCESIBILIDAD Y UX:
- Soporte completo para dispositivos móviles
- Notificaciones no intrusivas
- Tema automático según preferencias del sistema
- Formateo local para mejor comprensión
- Estados de carga claros y consistentes

Este contexto es fundamental para la operación del gimnasio en Guatemala,
proporcionando una base sólida para todas las operaciones financieras en
quetzales, configuración regional apropiada, y optimización de rendimiento
a través de un sistema de cache inteligente que mejora significativamente
la experiencia del usuario.
*/