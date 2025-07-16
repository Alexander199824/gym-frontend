// src/contexts/AppContext.js
// UBICACIÓN: /gym-frontend/src/contexts/AppContext.js
// FUNCIÓN: Estado global de la aplicación (configuraciones, notificaciones, etc.)
// CONECTA CON: Configuraciones globales y estado de UI

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
  
  // 📊 Estado de datos
  dataLoading: {
    users: false,
    memberships: false,
    payments: false,
    reports: false
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
    animationsEnabled: true          // Animaciones habilitadas
  },
  
  // 📈 Métricas en tiempo real
  liveMetrics: {
    onlineUsers: 0,
    todayPayments: 0,
    expiredMemberships: 0,
    lastUpdate: null
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
  
  // Filter Actions
  SET_GLOBAL_FILTER: 'SET_GLOBAL_FILTER',
  CLEAR_GLOBAL_FILTERS: 'CLEAR_GLOBAL_FILTERS',
  
  // Settings Actions
  UPDATE_APP_SETTINGS: 'UPDATE_APP_SETTINGS',
  UPDATE_LANGUAGE: 'UPDATE_LANGUAGE',
  
  // Metrics Actions
  UPDATE_LIVE_METRICS: 'UPDATE_LIVE_METRICS'
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
    localStorage.setItem('gym_app_settings', JSON.stringify(settings));
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
      // Aquí se haría la llamada al API para obtener métricas actualizadas
      // const metrics = await apiService.getLiveMetrics();
      // updateLiveMetrics(metrics);
      
      // Por ahora, simulamos datos
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
  
  // 🔔 Mostrar notificación de éxito
  const showSuccess = (message, title = 'Éxito') => {
    addNotification({
      type: 'success',
      title,
      message,
      icon: 'CheckCircle'
    });
  };
  
  // ⚠️ Mostrar notificación de error
  const showError = (message, title = 'Error') => {
    addNotification({
      type: 'error',
      title,
      message,
      icon: 'XCircle',
      persistent: true
    });
  };
  
  // 💡 Mostrar notificación de información
  const showInfo = (message, title = 'Información') => {
    addNotification({
      type: 'info',
      title,
      message,
      icon: 'Info'
    });
  };
  
  // ⚠️ Mostrar notificación de advertencia
  const showWarning = (message, title = 'Advertencia') => {
    addNotification({
      type: 'warning',
      title,
      message,
      icon: 'AlertTriangle'
    });
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
    appName: process.env.REACT_APP_NAME,
    appVersion: process.env.REACT_APP_VERSION,
    isProduction: process.env.NODE_ENV === 'production'
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// 📝 NOTAS DE USO:
// - useApp() para acceder a todas las funciones globales
// - Las notificaciones se auto-remueven después de 5 segundos
// - El tema se sincroniza con localStorage
// - Las métricas se actualizan automáticamente cada 30 segundos
// - Detección automática de dispositivo móvil/tablet
// - Formateo automático de fechas y moneda según configuración regional