// src/contexts/AppContext.js
// FUNCIÓN: Estado global con cache para contenido del backend
// CONECTA CON: Todos los hooks de gym y sistema de cache

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// 🏗️ ESTADO INICIAL
const initialState = {
  // 🎨 Configuración de UI
  theme: 'light',                    // light, dark, auto
  sidebarCollapsed: false,           // ¿Sidebar colapsado?
  notifications: [],                 // Notificaciones en tiempo real
  
  // 📱 Configuración de dispositivo
  isMobile: false,                   // ¿Es dispositivo móvil?
  isTablet: false,                   // ¿Es tablet?
  screenSize: 'desktop',             // mobile, tablet, desktop
  
  // 🌍 Configuración regional
  language: 'es',                    // Idioma de la aplicación
  timezone: 'America/Guatemala',     // Zona horaria
  currency: 'GTQ',                   // Moneda
  dateFormat: 'dd/MM/yyyy',          // Formato de fecha
  
  // 🔔 Sistema de notificaciones
  notificationSettings: {
    desktop: true,                   // Notificaciones del navegador
    sound: true,                     // Sonidos
    email: true,                     // Notificaciones por email
    push: false                      // Push notifications (futuro)
  },
  
  // 📊 Estado de datos del backend
  dataLoading: {
    gymConfig: false,
    gymStats: false,
    gymServices: false,
    testimonials: false,
    featuredProducts: false,
    sectionsContent: false,
    navigation: false,
    branding: false
  },
  
  // 💾 Cache del backend
  backendCache: {
    gymConfig: { data: null, timestamp: null, ttl: 5 * 60 * 1000 }, // 5 min
    gymStats: { data: null, timestamp: null, ttl: 5 * 60 * 1000 }, // 5 min
    gymServices: { data: null, timestamp: null, ttl: 15 * 60 * 1000 }, // 15 min
    testimonials: { data: null, timestamp: null, ttl: 20 * 60 * 1000 }, // 20 min
    featuredProducts: { data: null, timestamp: null, ttl: 10 * 60 * 1000 }, // 10 min
    sectionsContent: { data: null, timestamp: null, ttl: 10 * 60 * 1000 }, // 10 min
    navigation: { data: null, timestamp: null, ttl: 30 * 60 * 1000 }, // 30 min
    branding: { data: null, timestamp: null, ttl: 60 * 60 * 1000 } // 60 min
  },
  
  // 🎯 Filtros globales
  globalFilters: {
    dateRange: null,
    selectedGym: null,
    activeOnly: true
  },
  
  // 🔧 Configuración de la aplicación
  appSettings: {
    autoRefresh: true,               // Refrescar datos automáticamente
    refreshInterval: 30000,          // Intervalo de refresco (30s)
    compactMode: false,              // Modo compacto
    animationsEnabled: true,         // Animaciones habilitadas
    cacheEnabled: true               // Cache habilitado
  },
  
  // 📈 Métricas en tiempo real
  liveMetrics: {
    onlineUsers: 0,
    todayPayments: 0,
    expiredMemberships: 0,
    lastUpdate: null
  },
  
  // 🔄 Estado de sincronización
  syncStatus: {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingSync: false,
    failedRequests: []
  }
};

// 🎯 TIPOS DE ACCIONES
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
  
  // Filter Actions
  SET_GLOBAL_FILTER: 'SET_GLOBAL_FILTER',
  CLEAR_GLOBAL_FILTERS: 'CLEAR_GLOBAL_FILTERS',
  
  // Settings Actions
  UPDATE_APP_SETTINGS: 'UPDATE_APP_SETTINGS',
  UPDATE_LANGUAGE: 'UPDATE_LANGUAGE',
  
  // Metrics Actions
  UPDATE_LIVE_METRICS: 'UPDATE_LIVE_METRICS',
  
  // Sync Actions
  UPDATE_SYNC_STATUS: 'UPDATE_SYNC_STATUS'
};

// 🔄 REDUCER DE LA APLICACIÓN
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
      
    default:
      return state;
  }
}

// 🏗️ CREAR CONTEXTO
const AppContext = createContext();

// 🎣 HOOK PERSONALIZADO
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
}

// 🏭 PROVIDER DE LA APLICACIÓN
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // 📱 EFECTO: Detectar tamaño de pantalla
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
  
  // 🌐 EFECTO: Detectar estado de conexión
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
  
  // 🎨 EFECTO: Manejar tema del sistema
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
  
  // ⏰ EFECTO: Auto refresh de métricas
  useEffect(() => {
    if (state.appSettings.autoRefresh) {
      const interval = setInterval(() => {
        refreshLiveMetrics();
      }, state.appSettings.refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [state.appSettings.autoRefresh, state.appSettings.refreshInterval]);
  
  // 💾 EFECTO: Cargar cache desde localStorage
  useEffect(() => {
    loadCacheFromStorage();
  }, []);
  
  // 💾 EFECTO: Guardar cache en localStorage
  useEffect(() => {
    saveCacheToStorage();
  }, [state.backendCache]);
  
  // ⚡ FUNCIONES DE LA APLICACIÓN
  
  // 🎨 Cambiar tema
  const setTheme = (theme) => {
    dispatch({ type: ACTION_TYPES.SET_THEME, payload: theme });
    localStorage.setItem('gym_theme', theme);
  };
  
  // 📱 Toggle sidebar
  const toggleSidebar = () => {
    dispatch({ type: ACTION_TYPES.TOGGLE_SIDEBAR });
  };
  
  // 🔔 Agregar notificación
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
  
  // 🗑️ Remover notificación
  const removeNotification = (id) => {
    dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: id });
  };
  
  // 🧹 Limpiar todas las notificaciones
  const clearNotifications = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_NOTIFICATIONS });
  };
  
  // ⚙️ Actualizar configuración de notificaciones
  const updateNotificationSettings = (settings) => {
    dispatch({ type: ACTION_TYPES.UPDATE_NOTIFICATION_SETTINGS, payload: settings });
    
    // Solicitar permiso para notificaciones del navegador
    if (settings.desktop && 'Notification' in window) {
      Notification.requestPermission();
    }
  };
  
  // 📊 Establecer estado de carga de datos
  const setDataLoading = (loadingState) => {
    dispatch({ type: ACTION_TYPES.SET_DATA_LOADING, payload: loadingState });
  };
  
  // 💾 FUNCIONES DE CACHE
  
  // Establecer datos en cache
  const setCacheData = (key, data) => {
    dispatch({
      type: ACTION_TYPES.SET_CACHE_DATA,
      payload: { key, data }
    });
  };
  
  // Obtener datos del cache
  const getCacheData = (key) => {
    const cacheItem = state.backendCache[key];
    if (!cacheItem || !cacheItem.timestamp) return null;
    
    const now = Date.now();
    const age = now - cacheItem.timestamp;
    
    if (age > cacheItem.ttl) {
      // Cache expirado
      return null;
    }
    
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
  
  // Limpiar cache completo
  const clearCache = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_CACHE });
    localStorage.removeItem('gym_backend_cache');
  };
  
  // Limpiar item específico del cache
  const clearCacheItem = (key) => {
    dispatch({ type: ACTION_TYPES.CLEAR_CACHE_ITEM, payload: key });
  };
  
  // Cargar cache desde localStorage
  const loadCacheFromStorage = () => {
    try {
      const savedCache = localStorage.getItem('gym_backend_cache');
      if (savedCache) {
        const cacheData = JSON.parse(savedCache);
        
        // Verificar y cargar solo cache válido
        Object.entries(cacheData).forEach(([key, item]) => {
          if (item && item.timestamp && item.data) {
            const now = Date.now();
            const age = now - item.timestamp;
            const ttl = state.backendCache[key]?.ttl || 5 * 60 * 1000;
            
            if (age <= ttl) {
              setCacheData(key, item.data);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar cache desde localStorage:', error);
    }
  };
  
  // Guardar cache en localStorage
  const saveCacheToStorage = () => {
    try {
      const cacheToSave = {};
      Object.entries(state.backendCache).forEach(([key, item]) => {
        if (item.data && item.timestamp) {
          cacheToSave[key] = item;
        }
      });
      localStorage.setItem('gym_backend_cache', JSON.stringify(cacheToSave));
    } catch (error) {
      console.error('Error al guardar cache en localStorage:', error);
    }
  };
  
  // 🎯 Establecer filtro global
  const setGlobalFilter = (filter) => {
    dispatch({ type: ACTION_TYPES.SET_GLOBAL_FILTER, payload: filter });
  };
  
  // 🧹 Limpiar filtros globales
  const clearGlobalFilters = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_GLOBAL_FILTERS });
  };
  
  // ⚙️ Actualizar configuración de la app
  const updateAppSettings = (settings) => {
    dispatch({ type: ACTION_TYPES.UPDATE_APP_SETTINGS, payload: settings });
    localStorage.setItem('gym_app_settings', JSON.stringify({ ...state.appSettings, ...settings }));
  };
  
  // 🌍 Cambiar idioma
  const setLanguage = (language) => {
    dispatch({ type: ACTION_TYPES.UPDATE_LANGUAGE, payload: language });
    localStorage.setItem('gym_language', language);
  };
  
  // 📈 Actualizar métricas en tiempo real
  const updateLiveMetrics = (metrics) => {
    dispatch({ type: ACTION_TYPES.UPDATE_LIVE_METRICS, payload: metrics });
  };
  
  // 🔄 Refrescar métricas en tiempo real
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
  
  // 📅 Formatear fecha según configuración
  const formatDate = (date, formatString = state.dateFormat) => {
    return format(new Date(date), formatString, { locale: es });
  };
  
  // 💰 Formatear moneda según configuración
  const formatCurrency = (amount) => {
    const formatter = new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: state.currency,
      minimumFractionDigits: 2
    });
    return formatter.format(amount);
  };
  
  // 🔔 Funciones de notificación simplificadas
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
  
  // 📦 VALOR DEL CONTEXTO
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
    
    // Funciones de cache
    setCacheData,
    getCacheData,
    isCacheValid,
    clearCache,
    clearCacheItem,
    
    // Funciones de filtros
    setGlobalFilter,
    clearGlobalFilters,
    
    // Funciones de configuración
    updateAppSettings,
    setLanguage,
    
    // Funciones de métricas
    updateLiveMetrics,
    refreshLiveMetrics,
    
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

// 📝 NOTAS DE CAMBIOS:
// ✅ Agregado sistema de cache completo para backend
// ✅ TTL configurables por tipo de dato
// ✅ Persistencia en localStorage
// ✅ Estado de sincronización y conexión
// ✅ Funciones simplificadas para cache
// ✅ Auto-limpieza de cache expirado
// ✅ Compatible con todos los hooks del backend