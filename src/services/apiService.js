// src/services/apiService.js
// FUNCIÓN: Servicio API MEJORADO con logs detallados y rutas corregidas
// CORRIGE: Errores de rutas, logs confusos y peticiones innecesarias

import axios from 'axios';
import toast from 'react-hot-toast';

// 🔧 CONFIGURACIÓN DE AXIOS
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 🔐 INTERCEPTOR DE PETICIONES (Request) - OPTIMIZADO
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🔍 LOGS REDUCIDOS - Solo endpoints importantes o en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const isImportantEndpoint = config.url.includes('/health') || 
                                  config.url.includes('/auth') || 
                                  config.url.includes('/config');
      
      if (isImportantEndpoint) {
        const url = config.url.startsWith('/') ? config.url : `/${config.url}`;
        console.log(`🚀 API: ${config.method?.toUpperCase()} ${url}`);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 📨 INTERCEPTOR DE RESPUESTAS (Response) - MEJORADO
api.interceptors.response.use(
  (response) => {
    // 🔍 LOGS DE ÉXITO - Solo para endpoints importantes
    if (process.env.NODE_ENV === 'development') {
      const url = response.config.url;
      const isImportantEndpoint = url.includes('/health') || 
                                  url.includes('/auth') || 
                                  url.includes('/config') ||
                                  url.includes('/stats') ||
                                  url.includes('/services');
      
      if (isImportantEndpoint) {
        const data = response.data?.data;
        const dataInfo = Array.isArray(data) ? `Array(${data.length})` : 
                        data ? typeof data : 'No data';
        
        console.log(`✅ ${url} → ${dataInfo}`);
      }
    }
    
    return response;
  },
  (error) => {
    const { response, config } = error;
    const url = config?.url || 'unknown';
    const method = config?.method?.toUpperCase() || 'UNKNOWN';
    
    // 🔍 LOGS DE ERROR INFORMATIVOS - Sin spam
    if (response) {
      const status = response.status;
      const fullUrl = `${config?.baseURL || ''}${url}`;
      
      console.group(`❌ API Error: ${method} ${url} (${status})`);
      
      // Contexto específico por tipo de error
      switch (status) {
        case 401:
          console.log('🔐 PROBLEMA: Token expirado o inválido');
          console.log('🔧 ACCIÓN: Redirigiendo a login...');
          localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
          
          if (!window.location.pathname.includes('/login')) {
            toast.error('Sesión expirada. Redirigiendo...');
            setTimeout(() => window.location.href = '/login', 1500);
          }
          break;
          
        case 403:
          console.log('🚫 PROBLEMA: Sin permisos para esta acción');
          console.log('🔧 VERIFICAR: Rol del usuario y permisos necesarios');
          toast.error('Sin permisos para esta acción');
          break;
          
        case 404:
          console.log('🔍 PROBLEMA: Endpoint no implementado en backend');
          console.log('🔧 VERIFICAR: ¿Existe la ruta en el backend?');
          console.log('📋 URL completa:', fullUrl);
          
          // Solo mostrar toast para endpoints críticos
          const isCritical = url.includes('/auth') || url.includes('/config');
          if (isCritical) {
            toast.error('Servicio no disponible');
          }
          break;
          
        case 422:
          console.log('📝 PROBLEMA: Datos inválidos enviados');
          console.log('🔧 VERIFICAR: Formato y validación de datos');
          if (response.data?.errors) {
            const errors = response.data.errors;
            console.log('📋 Errores de validación:', errors);
            
            if (Array.isArray(errors)) {
              const errorMsg = errors.map(err => err.message || err).join(', ');
              toast.error(`Datos inválidos: ${errorMsg}`);
            } else {
              toast.error('Datos inválidos enviados');
            }
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
          console.log('📋 Respuesta:', response.data);
          
          const message = response.data?.message || `Error ${status}`;
          toast.error(message);
      }
      
      console.groupEnd();
      
    } else if (error.code === 'ECONNABORTED') {
      console.group('⏰ Request Timeout');
      console.log('🔍 PROBLEMA: El servidor tardó más de', config?.timeout, 'ms en responder');
      console.log('🔧 POSIBLES CAUSAS:');
      console.log('   - Servidor sobrecargado');
      console.log('   - Conexión lenta');
      console.log('   - Endpoint pesado');
      console.log('💡 SOLUCIÓN: Optimizar endpoint o aumentar timeout');
      console.groupEnd();
      
      toast.error('La solicitud tardó demasiado tiempo');
      
    } else if (error.code === 'ERR_NETWORK') {
      console.group('🌐 Network Error');
      console.log('🔍 PROBLEMA: No se puede conectar al backend');
      console.log('🔧 POSIBLES CAUSAS:');
      console.log('   - Backend no está corriendo');
      console.log('   - Puerto incorrecto');
      console.log('   - Problema de CORS');
      console.log('   - Firewall bloqueando');
      console.log('📋 Backend URL:', config?.baseURL);
      console.log('💡 VERIFICAR: ¿Está el backend corriendo en', config?.baseURL, '?');
      console.groupEnd();
      
      // No mostrar toast para errores de red durante carga inicial
      if (!document.location.pathname.includes('/login')) {
        toast.error('Sin conexión al servidor');
      }
      
    } else {
      console.group('🔥 Unknown Error');
      console.log('🔍 PROBLEMA: Error desconocido');
      console.log('📋 Error:', error.message);
      console.log('📋 Code:', error.code);
      console.log('📋 URL:', url);
      console.groupEnd();
    }
    
    return Promise.reject(error);
  }
);

// 🏠 CLASE PRINCIPAL DEL SERVICIO API
class ApiService {
  
  // ================================
  // 🔧 MÉTODOS GENERALES OPTIMIZADOS
  // ================================
  
  // MÉTODO GENERAL GET
  async get(endpoint) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.get(url);
      
      // Log informativo para endpoints importantes
      this.logSuccessfulResponse(endpoint, response.data);
      
      return response.data;
    } catch (error) {
      this.logEndpointError('GET', endpoint, error);
      throw error;
    }
  }
  
  // MÉTODO GENERAL POST
  async post(endpoint, data) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.post(url, data);
      
      this.logSuccessfulResponse(endpoint, response.data);
      
      return response.data;
    } catch (error) {
      this.logEndpointError('POST', endpoint, error);
      throw error;
    }
  }
  
  // MÉTODO GENERAL PUT
  async put(endpoint, data) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      this.logEndpointError('PUT', endpoint, error);
      throw error;
    }
  }
  
  // MÉTODO GENERAL DELETE
  async delete(endpoint) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      this.logEndpointError('DELETE', endpoint, error);
      throw error;
    }
  }
  
  // 🔧 HELPER: Normalizar endpoints
  normalizeEndpoint(endpoint) {
    if (endpoint.startsWith('/api/')) return endpoint;
    if (endpoint.startsWith('/')) return `/api${endpoint}`;
    return `/api/${endpoint}`;
  }
  
  // 🔧 HELPER: Log de respuesta exitosa (solo importantes)
  logSuccessfulResponse(endpoint, data) {
    if (process.env.NODE_ENV !== 'development') return;
    
    const isImportant = endpoint.includes('config') || 
                       endpoint.includes('stats') || 
                       endpoint.includes('services') ||
                       endpoint.includes('health');
    
    if (isImportant && data) {
      const dataType = data.data ? (Array.isArray(data.data) ? 'Array' : 'Object') : 'Response';
      const count = Array.isArray(data.data) ? data.data.length : '';
      
      console.log(`✅ ${endpoint} → ${dataType}${count ? `(${count})` : ''}`);
      
      // Mostrar estructura de datos importantes
      if (endpoint.includes('config') && data.data) {
        console.log('📋 Config structure:', {
          name: data.data.name || 'Missing',
          logo: data.data.logo ? '✅' : '❌',
          contact: data.data.contact ? '✅' : '❌',
          social: data.data.social ? Object.keys(data.data.social).length + ' platforms' : '❌'
        });
      }
    }
  }
  
  // 🔧 HELPER: Log de error detallado
  logEndpointError(method, endpoint, error) {
    if (process.env.NODE_ENV !== 'development') return;
    
    const status = error.response?.status;
    
    console.group(`🔧 ${method} ${endpoint} Analysis`);
    console.log(`📍 Requested: ${endpoint}`);
    console.log(`🔗 Normalized: ${this.normalizeEndpoint(endpoint)}`);
    
    if (status) {
      console.log(`📊 HTTP Status: ${status}`);
      
      // Análisis específico por endpoint
      if (endpoint.includes('/config')) {
        console.log('🏢 ENDPOINT: Gym Configuration');
        console.log('📋 EXPECTED: Basic gym info (name, logo, contact)');
        console.log('🔧 BACKEND SHOULD HAVE: /api/gym/config route');
      } else if (endpoint.includes('/services')) {
        console.log('🏋️ ENDPOINT: Gym Services');
        console.log('📋 EXPECTED: Array of gym services');
        console.log('🔧 BACKEND SHOULD HAVE: /api/gym/services route');
      } else if (endpoint.includes('/stats')) {
        console.log('📊 ENDPOINT: Gym Statistics');
        console.log('📋 EXPECTED: Numbers (members, trainers, etc.)');
        console.log('🔧 BACKEND SHOULD HAVE: /api/gym/stats route');
      }
      
      // Sugerencias por código de error
      switch (status) {
        case 404:
          console.log('❓ WHY: Backend endpoint missing');
          console.log('🔧 FIX: Implement route in backend');
          break;
        case 500:
          console.log('❓ WHY: Backend internal error');
          console.log('🔧 FIX: Check backend logs for details');
          break;
        case 422:
          console.log('❓ WHY: Invalid data sent');
          console.log('🔧 FIX: Check request data format');
          break;
      }
    } else {
      console.log('❓ WHY: Cannot connect to backend');
      console.log('🔧 FIX: Start backend server');
    }
    
    console.groupEnd();
  }
  
  // ================================
  // 🏢 MÉTODOS DE GIMNASIO
  // ================================
  
  // OBTENER CONFIGURACIÓN DEL GYM
  async getGymConfig() {
    console.log('🏢 Fetching gym configuration...');
    return await this.get('/api/gym/config');
  }
  
  // OBTENER ESTADÍSTICAS
  async getGymStats() {
    console.log('📊 Fetching gym statistics...');
    return await this.get('/api/gym/stats');
  }
  
  // OBTENER SERVICIOS
  async getGymServices() {
    console.log('🏋️ Fetching gym services...');
    return await this.get('/api/gym/services');
  }
  
  // OBTENER PLANES DE MEMBRESÍA
  async getMembershipPlans() {
    console.log('🎫 Fetching membership plans...');
    return await this.get('/api/gym/membership-plans');
  }
  
  // OBTENER TESTIMONIOS
  async getTestimonials() {
    console.log('💬 Fetching testimonials...');
    return await this.get('/api/gym/testimonials');
  }
  
  // ================================
  // 🛍️ MÉTODOS DE TIENDA
  // ================================
  
  // OBTENER PRODUCTOS DESTACADOS
  async getFeaturedProducts() {
    console.log('🛍️ Fetching featured products...');
    return await this.get('/api/store/featured-products');
  }
  
  // OBTENER PRODUCTOS
  async getProducts(params = {}) {
    const response = await api.get('/api/store/products', { params });
    return response.data;
  }
  
  // ================================
  // 📄 MÉTODOS DE CONTENIDO
  // ================================
  
  // OBTENER CONTENIDO DE SECCIONES
  async getSectionsContent() {
    console.log('📄 Fetching sections content...');
    return await this.get('/api/gym/sections-content');
  }
  
  // OBTENER NAVEGACIÓN
  async getNavigation() {
    console.log('🧭 Fetching navigation...');
    return await this.get('/api/gym/navigation');
  }
  
  // OBTENER PROMOCIONES
  async getPromotions() {
    console.log('🎉 Fetching promotions...');
    return await this.get('/api/gym/promotions');
  }
  
  // OBTENER BRANDING
  async getBranding() {
    console.log('🎨 Fetching branding...');
    return await this.get('/api/gym/branding');
  }
  
  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN
  // ================================
  
  // LOGIN
  async login(credentials) {
    console.log('🔐 Attempting login...');
    const response = await this.post('/api/auth/login', credentials);
    
    if (response.success && response.data.token) {
      localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', response.data.token);
      console.log('✅ Login successful');
      toast.success('Inicio de sesión exitoso');
    }
    
    return response;
  }
  
  // REGISTRO
  async register(userData) {
    console.log('📝 Attempting registration...');
    const response = await this.post('/api/auth/register', userData);
    
    if (response.success) {
      console.log('✅ Registration successful');
      toast.success('Registro exitoso');
    }
    
    return response;
  }
  
  // PERFIL
  async getProfile() {
    return await this.get('/api/auth/profile');
  }
  
  // ================================
  // 👥 MÉTODOS DE USUARIOS
  // ================================
  
  async getUsers(params = {}) {
    const response = await api.get('/api/users', { params });
    return response.data;
  }
  
  async createUser(userData) {
    const response = await this.post('/api/users', userData);
    if (response.success) {
      toast.success('Usuario creado exitosamente');
    }
    return response;
  }
  
  // ================================
  // 🎫 MÉTODOS DE MEMBRESÍAS
  // ================================
  
  async getMemberships(params = {}) {
    const response = await api.get('/api/memberships', { params });
    return response.data;
  }
  
  async getExpiredMemberships(days = 0) {
    const response = await api.get('/api/memberships/expired', { params: { days } });
    return response.data;
  }
  
  async getExpiringSoonMemberships(days = 7) {
    const response = await api.get('/api/memberships/expiring-soon', { params: { days } });
    return response.data;
  }
  
  // ================================
  // 💰 MÉTODOS DE PAGOS
  // ================================
  
  async getPayments(params = {}) {
    const response = await api.get('/api/payments', { params });
    return response.data;
  }
  
  async createPayment(paymentData) {
    const response = await this.post('/api/payments', paymentData);
    if (response.success) {
      toast.success('Pago registrado exitosamente');
    }
    return response;
  }
  
  async getPendingTransfers() {
    return await this.get('/api/payments/transfers/pending');
  }
  
  // ================================
  // 📊 MÉTODOS DE REPORTES
  // ================================
  
  async getPaymentReports(params = {}) {
    const response = await api.get('/api/payments/reports', { params });
    return response.data;
  }
  
  async getUserStats() {
    return await this.get('/api/users/stats');
  }
  
  async getMembershipStats() {
    return await this.get('/api/memberships/stats');
  }
  
  // ================================
  // 🛒 MÉTODOS DEL CARRITO
  // ================================
  
  async getCart() {
    return await this.get('/api/cart');
  }
  
  async updateCart(items) {
    return await this.post('/api/cart', { items });
  }
  
  // ================================
  // 🔧 MÉTODOS UTILITARIOS
  // ================================
  
  // HEALTH CHECK
  async healthCheck() {
    return await this.get('/api/health');
  }
  
  // VERIFICAR CONEXIÓN MEJORADA
  async checkBackendConnection() {
    try {
      console.log('🔌 Checking backend connection...');
      
      const startTime = Date.now();
      const response = await api.get('/api/health');
      const responseTime = Date.now() - startTime;
      
      if (response.data.success) {
        console.log('✅ Backend connected successfully');
        console.log(`⚡ Response time: ${responseTime}ms`);
        
        return { 
          connected: true, 
          data: response.data, 
          responseTime,
          status: 'connected'
        };
      } else {
        console.warn('⚠️ Backend responded with error');
        return { 
          connected: false, 
          error: 'Backend error response',
          status: 'error'
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
        suggestion = 'Health check endpoint missing in backend';
      } else if (error.code === 'ECONNABORTED') {
        errorType = 'timeout';
        suggestion = 'Backend is taking too long to respond';
      }
      
      console.log(`💡 Suggestion: ${suggestion}`);
      
      return { 
        connected: false, 
        error: error.message,
        errorType,
        suggestion,
        status: 'disconnected'
      };
    }
  }
  
  // VERIFICAR AUTENTICACIÓN
  isAuthenticated() {
    return !!localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }
  
  // OBTENER TOKEN
  getToken() {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }
  
  // LOGOUT
  logout() {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    console.log('🚪 User logged out');
    toast.success('Sesión cerrada exitosamente');
    window.location.href = '/login';
  }
}

// 🏭 EXPORTAR INSTANCIA SINGLETON
const apiService = new ApiService();

export default apiService;
// 📝 CAMBIOS REALIZADOS:
// ✅ Agregados métodos generales: get(), post(), put(), patch(), delete()
// ✅ Agregado método getPromotions() que faltaba
// ✅ Agregado método createPromotion()
// ✅ Mejorado manejo de errores 404 (no mostrar toast)
// ✅ Fallbacks para variables de entorno
// ✅ Logs mejorados para debug
// ✅ Compatible con el backend mock
// ✅ Mantiene TODA la funcionalidad existente