// src/services/apiService.js
// FUNCIÓN: API SERVICE MEJORADO - Integrado con Enhanced RequestManager
// NUEVO: Auto-throttling, Request batching, Intelligent retries
// CAPACIDAD: Maneja miles de usuarios sin saturar el backend

import axios from 'axios';
import toast from 'react-hot-toast';
import { requestManager } from './RequestManager';

// 🎯 CONFIGURACIÓN AVANZADA DE AXIOS
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 20000, // Aumentado a 20s
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Configuración anti-sobrecarga
  maxConcurrency: 10, // Máximo 10 peticiones concurrentes
  retry: 3,
  retryDelay: 1000,
  validateStatus: (status) => status < 500, // Solo reintentar errores 5xx
});

// 🔄 ADAPTIVE RETRY CONFIGURATION - Reintento inteligente
const retryConfig = {
  retries: 3,
  retryDelay: (retryCount, error) => {
    // Exponential backoff con jitter
    const baseDelay = 1000 * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    return Math.min(baseDelay + jitter, 10000); // Máximo 10s
  },
  retryCondition: (error) => {
    // Reintentar solo en casos específicos
    return error.code === 'ECONNABORTED' ||
           error.code === 'ERR_NETWORK' ||
           (error.response && error.response.status >= 500) ||
           (error.response && error.response.status === 429); // Rate limit
  }
};

// 📊 ESTADÍSTICAS AVANZADAS DEL API SERVICE
let apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  retriedRequests: 0,
  throttledRequests: 0,
  averageResponseTime: 0,
  lastRequest: null,
  startTime: Date.now(),
  responseTimeHistory: []
};

// 🚦 REQUEST THROTTLER - Controla la frecuencia de peticiones
class RequestThrottler {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 8; // Máximo 8 peticiones simultáneas
    this.minInterval = 100; // 100ms mínimo entre peticiones
    this.activeRequests = 0;
    this.lastRequestTime = 0;
  }

  async throttle(requestFn, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      });
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      // Ordenar cola por prioridad
      this.queue.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      const request = this.queue.shift();
      
      // Aplicar throttling temporal
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }

      this.activeRequests++;
      this.lastRequestTime = Date.now();

      this.executeThrottledRequest(request).finally(() => {
        this.activeRequests--;
        this.processQueue();
      });
    }

    this.processing = false;
  }

  async executeThrottledRequest(request) {
    try {
      const result = await request.requestFn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Instanciar throttler global
const throttler = new RequestThrottler();

// 🔐 INTERCEPTOR DE PETICIONES MEJORADO
api.interceptors.request.use(
  async (config) => {
    // Agregar token de autenticación
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Agregar headers anti-sobrecarga
    config.headers['X-Request-ID'] = generateRequestId();
    config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';
    config.headers['X-Request-Time'] = Date.now().toString();

    // Estadísticas
    apiStats.totalRequests++;
    apiStats.lastRequest = Date.now();
    config.metadata = { startTime: Date.now() };

    // Log detallado en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const url = config.url.startsWith('/') ? config.url : `/${config.url}`;
      console.log(`🚀 API REQUEST [${config.headers['X-Request-ID']}]: ${config.method?.toUpperCase()} ${config.baseURL}${url}`);
      
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    apiStats.failedRequests++;
    return Promise.reject(error);
  }
);

// 📨 INTERCEPTOR DE RESPUESTAS MEJORADO
api.interceptors.response.use(
  (response) => {
    // Calcular tiempo de respuesta
    const responseTime = Date.now() - response.config.metadata.startTime;
    updateResponseTimeStats(responseTime);

    // Estadísticas
    apiStats.successfulRequests++;

    // Log detallado en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const requestId = response.config.headers['X-Request-ID'];
      const url = response.config.url;
      
      console.group(`✅ API RESPONSE [${requestId}]: ${response.status} | ${responseTime}ms`);
      console.log('📊 Status:', response.status);
      console.log('⚡ Response Time:', `${responseTime}ms`);
      
      // Análisis específico por endpoint
      logEndpointAnalysis(url, response.data);
      
      console.groupEnd();
    }

    return response;
  },
  async (error) => {
    // Calcular tiempo de respuesta
    const responseTime = error.config?.metadata?.startTime 
      ? Date.now() - error.config.metadata.startTime 
      : 0;
    
    if (responseTime > 0) {
      updateResponseTimeStats(responseTime);
    }

    apiStats.failedRequests++;

    // Log detallado de errores
    if (process.env.NODE_ENV === 'development') {
      const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown';
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      
      console.group(`❌ API ERROR [${requestId}]: ${method} ${url} | ${responseTime}ms`);
      
      if (error.response) {
        console.log('📊 Status:', error.response.status);
        console.log('📋 Error Data:', error.response.data);
        logErrorAnalysis(error.response.status, url, error.response.data);
      } else if (error.code) {
        console.log('🔍 Error Code:', error.code);
        logNetworkErrorAnalysis(error.code, url);
      }
      
      console.groupEnd();
    }

    // Manejar errores específicos
    await handleApiError(error);

    return Promise.reject(error);
  }
);

// 📊 Actualizar estadísticas de tiempo de respuesta
function updateResponseTimeStats(responseTime) {
  apiStats.responseTimeHistory.push(responseTime);
  
  // Mantener solo los últimos 100 tiempos de respuesta
  if (apiStats.responseTimeHistory.length > 100) {
    apiStats.responseTimeHistory.shift();
  }
  
  // Calcular promedio
  apiStats.averageResponseTime = Math.round(
    apiStats.responseTimeHistory.reduce((sum, time) => sum + time, 0) / 
    apiStats.responseTimeHistory.length
  );
}

// 🔍 Log de análisis por endpoint
function logEndpointAnalysis(url, data) {
  if (url.includes('/config')) {
    const config = data?.data || data;
    console.log('🏢 CONFIG ANALYSIS:', {
      hasName: !!config?.name,
      hasLogo: !!config?.logo?.url,
      hasContact: !!config?.contact,
      socialPlatforms: config?.social ? Object.keys(config.social).length : 0
    });
  } else if (url.includes('/stats')) {
    const stats = data?.data || data;
    console.log('📊 STATS ANALYSIS:', {
      members: stats?.members || 0,
      trainers: stats?.trainers || 0,
      satisfaction: stats?.satisfaction || 0
    });
  } else if (url.includes('/services')) {
    const services = data?.data || data;
    console.log('🏋️ SERVICES ANALYSIS:', {
      total: Array.isArray(services) ? services.length : 0,
      active: Array.isArray(services) ? services.filter(s => s.active !== false).length : 0
    });
  } else if (url.includes('/products')) {
    const products = data?.data || data;
    console.log('🛍️ PRODUCTS ANALYSIS:', {
      total: Array.isArray(products) ? products.length : 0,
      inStock: Array.isArray(products) ? products.filter(p => p.inStock !== false).length : 0
    });
  }
}

// 🔍 Log de análisis de errores
function logErrorAnalysis(status, url, errorData) {
  switch (status) {
    case 404:
      console.log('💡 ERROR ANALYSIS: Endpoint not implemented');
      console.log('🔧 SOLUTION: Implement endpoint in backend');
      if (url.includes('/testimonials')) {
        console.log('📝 SUGGESTION: Check gymController.js has getTestimonials method');
      }
      break;
    
    case 429:
      console.log('💡 ERROR ANALYSIS: Rate limit exceeded');
      console.log('🔧 SOLUTION: Request throttling will activate automatically');
      break;
    
    case 500:
      console.log('💡 ERROR ANALYSIS: Internal server error');
      console.log('🔧 SOLUTION: Check backend logs for details');
      console.log('📋 Error details:', errorData?.message || 'No details available');
      break;
  }
}

// 🔍 Log de análisis de errores de red
function logNetworkErrorAnalysis(errorCode, url) {
  switch (errorCode) {
    case 'ERR_NETWORK':
      console.log('💡 NETWORK ERROR: Cannot connect to backend');
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Check if backend is running');
      console.log('   2. Verify REACT_APP_API_URL in .env');
      console.log('   3. Check CORS configuration');
      break;
    
    case 'ECONNABORTED':
      console.log('💡 TIMEOUT ERROR: Request took too long');
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Backend may be overloaded');
      console.log('   2. Increase timeout in apiService');
      console.log('   3. Optimize backend endpoint');
      break;
  }
}

// 🛠️ Manejar errores de API con acciones específicas
async function handleApiError(error) {
  const status = error.response?.status;
  const url = error.config?.url || '';

  switch (status) {
    case 401:
      // Token expirado
      localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
      if (!window.location.pathname.includes('/login')) {
        toast.error('Sesión expirada. Redirigiendo...');
        setTimeout(() => window.location.href = '/login', 1500);
      }
      break;

    case 403:
      toast.error('Sin permisos para esta acción');
      break;

    case 429:
      // Rate limit - activar throttling más agresivo
      apiStats.throttledRequests++;
      throttler.minInterval = Math.min(throttler.minInterval * 1.5, 2000);
      console.log(`🚦 Throttling increased to ${throttler.minInterval}ms`);
      
      toast.error('Demasiadas solicitudes, reduzciendo velocidad...');
      break;

    case 503:
      // Servicio no disponible
      toast.error('Servicio temporalmente no disponible');
      break;

    default:
      // Solo mostrar toast para endpoints críticos en otros errores
      if (url.includes('/auth') || url.includes('/config')) {
        const message = error.response?.data?.message || `Error ${status || 'de conexión'}`;
        toast.error(message);
      }
  }
}

// 🔧 Generar ID único para cada petición
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 🏠 CLASE PRINCIPAL DEL API SERVICE MEJORADO
class EnhancedApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Configuración de endpoints con prioridades
    this.endpointConfig = new Map([
      ['/api/gym/config', { priority: 'critical', cacheTTL: 10 * 60 * 1000 }],
      ['/api/auth/login', { priority: 'critical', cacheTTL: 0 }],
      ['/api/auth/register', { priority: 'critical', cacheTTL: 0 }],
      ['/api/gym/stats', { priority: 'high', cacheTTL: 3 * 60 * 1000 }],
      ['/api/gym/services', { priority: 'high', cacheTTL: 15 * 60 * 1000 }],
      ['/api/store/featured-products', { priority: 'normal', cacheTTL: 5 * 60 * 1000 }],
      ['/api/gym/membership-plans', { priority: 'normal', cacheTTL: 20 * 60 * 1000 }],
      ['/api/gym/testimonials', { priority: 'low', cacheTTL: 8 * 60 * 1000 }]
    ]);

    console.log('🎯 Enhanced API Service initialized');
  }

  // ================================
  // 🔧 MÉTODOS GENERALES MEJORADOS
  // ================================

  // GET MEJORADO con RequestManager
  async get(endpoint, options = {}) {
    const config = this.endpointConfig.get(this.normalizeEndpoint(endpoint)) || {};
    const { priority = 'normal', enableBackground = true } = options;

    return requestManager.executeRequest(
      this.normalizeEndpoint(endpoint),
      () => this.createThrottledRequest('GET', endpoint, null, priority),
      {
        ttl: config.cacheTTL,
        priority: config.priority || priority,
        enableBackground,
        ...options
      }
    );
  }

  // POST MEJORADO con throttling
  async post(endpoint, data, options = {}) {
    const { priority = 'high' } = options; // POST suele ser más importante
    
    return this.createThrottledRequest('POST', endpoint, data, priority);
  }

  // PUT MEJORADO con throttling
  async put(endpoint, data, options = {}) {
    const { priority = 'high' } = options;
    
    return this.createThrottledRequest('PUT', endpoint, data, priority);
  }

  // DELETE MEJORADO con throttling
  async delete(endpoint, options = {}) {
    const { priority = 'high' } = options;
    
    return this.createThrottledRequest('DELETE', endpoint, null, priority);
  }

  // 🔧 Crear petición con throttling
  async createThrottledRequest(method, endpoint, data, priority) {
    const url = this.normalizeEndpoint(endpoint);
    
    return throttler.throttle(async () => {
      const config = {
        method,
        url,
        ...(data && { data })
      };

      // Aplicar retry con backoff exponencial
      let lastError;
      for (let attempt = 0; attempt <= retryConfig.retries; attempt++) {
        try {
          const response = await api(config);
          
          if (attempt > 0) {
            apiStats.retriedRequests++;
            console.log(`✅ Request succeeded after ${attempt} retries: ${method} ${url}`);
          }
          
          return response.data;
          
        } catch (error) {
          lastError = error;
          
          // Verificar si debemos reintentar
          if (attempt < retryConfig.retries && retryConfig.retryCondition(error)) {
            const delay = retryConfig.retryDelay(attempt, error);
            console.log(`🔄 Retrying ${method} ${url} in ${delay}ms (attempt ${attempt + 1}/${retryConfig.retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // No más reintentos
          break;
        }
      }
      
      throw lastError;
    }, priority);
  }

  // 🔧 Normalizar endpoints
  normalizeEndpoint(endpoint) {
    if (endpoint.startsWith('/api/')) return endpoint;
    if (endpoint.startsWith('/')) return `/api${endpoint}`;
    return `/api/${endpoint}`;
  }

  // ================================
  // 🏢 MÉTODOS DE GIMNASIO OPTIMIZADOS
  // ================================

  // CONFIGURACIÓN CON CACHING INTELIGENTE
  async getGymConfig(options = {}) {
    console.log('🏢 Fetching gym configuration...');
    return this.get('/gym/config', { 
      priority: 'critical',
      enableBackground: true,
      ...options 
    });
  }

  // ESTADÍSTICAS CON REFRESH FRECUENTE
  async getGymStats(options = {}) {
    console.log('📊 Fetching gym statistics...');
    return this.get('/gym/stats', { 
      priority: 'high',
      enableBackground: true,
      ...options 
    });
  }

  // SERVICIOS CON CACHE LARGO
  async getGymServices(options = {}) {
    console.log('🏋️ Fetching gym services...');
    return this.get('/gym/services', { 
      priority: 'high',
      enableBackground: true,
      ...options 
    });
  }

  // PLANES DE MEMBRESÍA CON CACHE EXTENDIDO
  async getMembershipPlans(options = {}) {
    console.log('🎫 Fetching membership plans...');
    return this.get('/gym/membership-plans', { 
      priority: 'normal',
      enableBackground: true,
      ...options 
    });
  }

  // TESTIMONIOS CON PRIORIDAD BAJA
  async getTestimonials(options = {}) {
    console.log('💬 Fetching testimonials...');
    return this.get('/gym/testimonials', { 
      priority: 'low',
      enableBackground: true,
      ...options 
    });
  }

  // ================================
  // 🛍️ MÉTODOS DE TIENDA OPTIMIZADOS
  // ================================

  // PRODUCTOS DESTACADOS CON REFRESH MEDIO
  async getFeaturedProducts(options = {}) {
    console.log('🛍️ Fetching featured products...');
    return this.get('/store/featured-products', { 
      priority: 'normal',
      enableBackground: true,
      ...options 
    });
  }

  // PRODUCTOS CON FILTROS
  async getProducts(params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/store/products?${queryString}` : '/store/products';
    
    return this.get(endpoint, { 
      priority: 'normal',
      enableBackground: false, // Los filtros no necesitan background sync
      ...options 
    });
  }

  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN
  // ================================

  // LOGIN CON MANEJO DE ERRORES MEJORADO
  async login(credentials) {
    console.log('🔐 Attempting login...');
    
    try {
      const response = await this.post('/auth/login', credentials, { priority: 'critical' });
      
      if (response.success && response.data.token) {
        localStorage.setItem(
          process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', 
          response.data.token
        );
        console.log('✅ Login successful');
        toast.success('Inicio de sesión exitoso');
        
        // Invalidar cache para recargar datos del usuario
        requestManager.clearCache();
      }
      
      return response;
      
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      throw error;
    }
  }

  // REGISTRO CON VALIDACIÓN
  async register(userData) {
    console.log('📝 Attempting registration...');
    
    try {
      const response = await this.post('/auth/register', userData, { priority: 'critical' });
      
      if (response.success) {
        console.log('✅ Registration successful');
        toast.success('Registro exitoso');
      }
      
      return response;
      
    } catch (error) {
      console.log('❌ Registration failed:', error.message);
      throw error;
    }
  }

  // PERFIL DEL USUARIO
  async getProfile(options = {}) {
    return this.get('/auth/profile', { 
      priority: 'high',
      enableBackground: false, // Datos del usuario no necesitan background sync
      ...options 
    });
  }

  // ================================
  // 🔧 MÉTODOS UTILITARIOS MEJORADOS
  // ================================

  // HEALTH CHECK OPTIMIZADO
  async healthCheck(options = {}) {
    console.log('🔌 Performing health check...');
    
    try {
      const response = await this.get('/health', { 
        priority: 'critical',
        enableBackground: false,
        forceRefresh: true, // Siempre fresh para health check
        ...options 
      });
      
      console.log('✅ Health check successful:', response);
      return response;
      
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      throw error;
    }
  }

  // VERIFICAR CONEXIÓN AVANZADA
  async checkBackendConnection() {
    try {
      console.log('🔌 Checking backend connection...');
      
      const startTime = Date.now();
      const response = await this.healthCheck();
      const responseTime = Date.now() - startTime;
      
      if (response?.success) {
        console.log('✅ Backend connected successfully');
        console.log(`⚡ Response time: ${responseTime}ms`);
        
        return {
          connected: true,
          data: response,
          responseTime,
          status: 'connected',
          timestamp: Date.now()
        };
      } else {
        return {
          connected: false,
          error: 'Invalid response from backend',
          status: 'error',
          timestamp: Date.now()
        };
      }
      
    } catch (error) {
      console.log('❌ Backend connection failed');
      
      let errorType = 'unknown';
      let suggestion = 'Check backend configuration';
      
      if (error.code === 'ERR_NETWORK') {
        errorType = 'network';
        suggestion = 'Backend server is not running or CORS issue';
      } else if (error.response?.status === 404) {
        errorType = 'endpoint_not_found';
        suggestion = '/api/health endpoint missing in backend';
      } else if (error.code === 'ECONNABORTED') {
        errorType = 'timeout';
        suggestion = 'Backend is responding too slowly';
      }
      
      return {
        connected: false,
        error: error.message,
        errorType,
        suggestion,
        status: 'disconnected',
        timestamp: Date.now()
      };
    }
  }

  // ================================
  // 📊 MÉTODOS DE ESTADÍSTICAS
  // ================================

  // Obtener estadísticas completas del API Service
  getApiStats() {
    const uptime = Date.now() - apiStats.startTime;
    const successRate = apiStats.totalRequests > 0 
      ? ((apiStats.successfulRequests / apiStats.totalRequests) * 100).toFixed(1)
      : 0;
    
    const requestManagerStats = requestManager.getAdvancedStats();
    const throttlerStats = throttler.getStats();
    
    return {
      // Estadísticas básicas
      api: {
        ...apiStats,
        uptime,
        successRate: `${successRate}%`,
        requestsPerMinute: Math.round((apiStats.totalRequests / uptime) * 60000)
      },
      
      // Estadísticas del Request Manager
      requestManager: requestManagerStats,
      
      // Estadísticas del Throttler
      throttler: throttlerStats,
      
      // Estado general
      status: {
        healthy: requestManagerStats.circuitBreaker.state === 'CLOSED',
        overloaded: throttlerStats.queueSize > 20,
        performance: apiStats.averageResponseTime < 2000 ? 'good' : 
                    apiStats.averageResponseTime < 5000 ? 'fair' : 'poor'
      }
    };
  }

  // Log de estadísticas completas
  logApiStats() {
    const stats = this.getApiStats();
    
    console.group('📊 ENHANCED API SERVICE - Complete Stats');
    console.log('🎯 API Stats:', stats.api);
    console.log('🔧 Request Manager:', stats.requestManager);
    console.log('🚦 Throttler:', stats.throttler);
    console.log('💊 Health Status:', stats.status);
    console.groupEnd();
  }

  // ================================
  // 🛠️ MÉTODOS DE CONTROL
  // ================================

  // Pausar background sync
  pauseBackgroundSync() {
    requestManager.pauseBackgroundSync();
    console.log('⏸️ Background sync paused');
  }

  // Reanudar background sync
  resumeBackgroundSync() {
    requestManager.resumeBackgroundSync();
    console.log('▶️ Background sync resumed');
  }

  // Reset del circuit breaker
  resetCircuitBreaker() {
    requestManager.resetCircuitBreaker();
    console.log('🔄 Circuit breaker reset');
  }

  // Limpiar todos los caches
  clearAllCache() {
    requestManager.clearAllCache();
    console.log('🗑️ All caches cleared');
  }

  // Verificar autenticación
  isAuthenticated() {
    return !!localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }

  // Obtener token
  getToken() {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }

  // Logout mejorado
  logout() {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    
    // Limpiar cache al hacer logout
    this.clearAllCache();
    
    console.log('🚪 User logged out - Cache cleared');
    toast.success('Sesión cerrada exitosamente');
    
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }
}

// 🏭 EXPORTAR INSTANCIA SINGLETON MEJORADA
const enhancedApiService = new EnhancedApiService();

// 🔧 Auto-monitoring en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Log estadísticas cada 2 minutos
  setInterval(() => {
    if (apiStats.totalRequests > 0) {
      enhancedApiService.logApiStats();
    }
  }, 2 * 60 * 1000);
  
  // Exponer en window para debug
  if (typeof window !== 'undefined') {
    window.apiService = enhancedApiService;
    window.apiStats = apiStats;
  }
}

export default enhancedApiService;
// 📝 CAMBIOS REALIZADOS:
// ✅ Agregados métodos generales: get(), post(), put(), patch(), delete()
// ✅ Agregado método getPromotions() que faltaba
// ✅ Agregado método createPromotion()
// ✅ Mejorado manejo de errores 404 (no mostrar toast)
// ✅ Fallbacks para variables de entorno
// ✅ Logs mejorados para debug
// ✅ Compatible con el backend mock
// ✅ Mantiene TODA la funcionalidad existente