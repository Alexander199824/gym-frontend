// src/services/apiConfig.js
// CONFIGURACIÓN BASE DE AXIOS E INTERCEPTORS

import axios from 'axios';
import toast from 'react-hot-toast';

// CONFIGURACIÓN DE AXIOS - TODA LA CONFIGURACIÓN EXISTENTE
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// INTERCEPTOR DE PETICIONES - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🔍 LOGS DETALLADOS - Mostrar TODA petición en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const url = config.url.startsWith('/') ? config.url : `/${config.url}`;
      console.log(`API REQUEST: ${config.method?.toUpperCase()} ${config.baseURL}${url}`);
      
      if (config.data) {
        console.log(' Request Data:', config.data);
      }
      if (config.params) {
        console.log(' Request Params:', config.params);
      }
    }
    
    return config;
  },
  (error) => {
    console.error(' Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// INTERCEPTOR DE RESPUESTAS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE + ANÁLISIS MEJORADO
api.interceptors.response.use(
  (response) => {
    // 🔍 LOGS SÚPER DETALLADOS - Mostrar TODO lo que devuelve el backend
    if (process.env.NODE_ENV === 'development') {
      const url = response.config.url;
      const method = response.config.method?.toUpperCase();
      
      console.group(`✅ BACKEND RESPONSE: ${method} ${url}`);
      console.log('📊 Status:', response.status);
      console.log('📋 Headers:', response.headers);
      
      // MOSTRAR DATOS COMPLETOS del backend
      if (response.data) {
        console.log('📦 FULL RESPONSE DATA:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // ✅ NUEVO: Análisis específico para horarios flexibles
        if (url.includes('/gym/config/flexible') && method === 'PUT') {
          console.log('🕒 FLEXIBLE HOURS UPDATE ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Update successful:', response.data?.success || false);
          console.log('  - Section updated:', response.data?.section || 'Not specified');
          console.log('  - Hours data present:', !!(data?.hours));
          console.log('  - Message:', response.data?.message || 'No message');
        }
        
        if (url.includes('/gym/config/editor') && method === 'GET') {
          console.log('📝 GYM CONFIG EDITOR ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Has gym config:', !!data);
          console.log('  - Hours structure:', data?.hours ? 'Present' : 'Missing');
          if (data?.hours) {
            const openDays = Object.keys(data.hours).filter(day => data.hours[day]?.isOpen);
            const totalSlots = openDays.reduce((sum, day) => {
              return sum + (data.hours[day]?.timeSlots?.length || 0);
            }, 0);
            console.log('  - Open days:', openDays.length);
            console.log('  - Total time slots:', totalSlots);
          }
        }
        
        if (url.includes('/gym/capacity/metrics') && method === 'GET') {
          console.log('📊 CAPACITY METRICS ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Total capacity:', data?.totalCapacity || 0);
          console.log('  - Total reservations:', data?.totalReservations || 0);
          console.log('  - Average occupancy:', data?.averageOccupancy || 0);
          console.log('  - Available spaces:', data?.availableSpaces || 0);
        }
        
        // ✅ Análisis específico para actualizaciones de perfil
        if (url.includes('/auth/profile') && method === 'PATCH') {
          console.log('👤 PROFILE UPDATE ANALYSIS:');
          const data = response.data?.data || response.data;
          if (data && data.user) {
            console.log('  - Update successful:', response.data?.success || false);
            console.log('  - User ID:', data.user.id);
            console.log('  - Updated fields:', response.data?.data?.changedFields || 'Not specified');
            console.log('  - Message:', response.data?.message || 'No message');
            console.log('  - Profile Image:', data.user.profileImage ? '✅ Present' : '❌ Missing');
          }
        }
        
        // Análisis específico por endpoint (mantiene todos los existentes)
        if (url.includes('/config')) {
          console.log('🏢 CONFIG ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Name:', data?.name || '❌ MISSING');
          console.log('  - Logo URL:', data?.logo?.url || '❌ MISSING');
          console.log('  - Description:', data?.description || '❌ MISSING');
          console.log('  - Contact:', data?.contact ? '✅ Present' : '❌ MISSING');
          console.log('  - Social:', data?.social ? Object.keys(data.social).length + ' platforms' : '❌ MISSING');
        }
        
      } else {
        console.log('📦 NO DATA in response');
      }
      
      console.groupEnd();
    }
    
    return response;
  },
  (error) => {
    const { response, config } = error;
    const url = config?.url || 'unknown';
    const method = config?.method?.toUpperCase() || 'UNKNOWN';
    
    // 🔍 LOGS DE ERROR SÚPER DETALLADOS (mantiene la lógica existente)
    console.group(`❌ BACKEND ERROR: ${method} ${url}`);
    
    if (response) {
      const status = response.status;
      console.log('📊 Error Status:', status);
      console.log('📋 Error Headers:', response.headers);
      console.log('📦 Error Data:', response.data);
      
      const fullUrl = `${config?.baseURL || ''}${url}`;
      
      // ✅ CORRECCIÓN CRÍTICA: Contexto específico por tipo de error
      switch (status) {
        case 401:
  // ✅ LISTA DE RUTAS PÚBLICAS QUE NO DEBEN REDIRIGIR
  const PUBLIC_ROUTES = ['/', '/store', '/register', '/auth/google-success'];
  const currentPath = window.location.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    currentPath === route || currentPath.startsWith(route)
  );
  
  const isLoginRequest = url.includes('/auth/login') || url.includes('/login');
  const isLoginPage = window.location.pathname.includes('/login');
  
  if (isLoginRequest) {
    // Error en login - dejar que LoginPage lo maneje
    console.log('🔐 LOGIN FAILED: Credenciales incorrectas');
    console.log('✅ Permitiendo que LoginPage maneje el error');
  } else if (isPublicRoute) {
    // ✅ NUEVO: Si estamos en ruta pública, NO redirigir
    console.log('🌐 Error 401 en ruta pública:', currentPath);
    console.log('✅ NO redirigir - la página puede funcionar sin autenticación');
  } else if (!isLoginPage) {
    // Solo redirigir si NO estamos en login NI en ruta pública
    console.log('🔐 PROBLEMA: Token expirado o inválido');
    console.log('🔧 ACCIÓN: Redirigiendo a login...');
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    toast.error('Sesión expirada. Redirigiendo...');
    setTimeout(() => window.location.href = '/login', 1500);
  }
  break;
          
        case 429:
          console.log('🚦 PROBLEMA: Demasiadas peticiones (rate limiting)');
          console.log('🔧 SOLUCIÓN: Reducir frecuencia de peticiones');
          toast.error('Demasiadas solicitudes, espera un momento');
          break;
          
        case 500:
          console.log('🔥 PROBLEMA: Error interno del servidor');
          console.log('🔧 VERIFICAR: Logs del backend para más detalles');
          console.log('📋 Error del servidor:', response.data?.message || 'Sin detalles');
          
          toast.error('Error del servidor, contacta soporte');
          break;
          
        default:
          console.log(`🤔 PROBLEMA: Error HTTP ${status}`);
          console.log('📋 Respuesta completa:', response.data);
          
          const message = response.data?.message || `Error ${status}`;
          if (!url.includes('/auth/login')) {
            toast.error(message);
          }
      }
      
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ PROBLEMA: Request Timeout');
      console.log('🔍 El servidor tardó más de', config?.timeout, 'ms en responder');
      toast.error('La solicitud tardó demasiado tiempo');
      
    } else if (error.code === 'ERR_NETWORK') {
      console.log('🌐 PROBLEMA: No se puede conectar al backend');
      console.log('📋 Backend URL configurada:', config?.baseURL);
      
      if (!window.location.pathname.includes('/login')) {
        toast.error('Sin conexión al servidor');
      }
      
    } else {
      console.log('🔥 ERROR DESCONOCIDO');
      console.log('🔍 Error message:', error.message);
      console.log('📋 Error code:', error.code);
    }
    
    console.groupEnd();
    
    return Promise.reject(error);
  }
);

export { api };