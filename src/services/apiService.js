// src/services/apiService.js
// FUNCIÓN: Servicio API MEJORADO con logs detallados y rutas corregidas
// CORRIGE: Errores de rutas, logs confusos y peticiones innecesarias

import axios from 'axios';
import toast from 'react-hot-toast';

// 🔧 CONFIGURACIÓN DE AXIOS
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 15000, // Reducido a 15s
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 🔐 INTERCEPTOR DE PETICIONES (Request)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🔍 LOGS MEJORADOS - Solo en desarrollo y sin spam
    if (process.env.NODE_ENV === 'development') {
      const url = config.url.startsWith('/') ? config.url : `/${config.url}`;
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// 📨 INTERCEPTOR DE RESPUESTAS (Response) - MEJORADO
api.interceptors.response.use(
  (response) => {
    // 🔍 LOGS DE ÉXITO - Solo en desarrollo y más informativos
    if (process.env.NODE_ENV === 'development') {
      const url = response.config.url;
      const dataType = Array.isArray(response.data?.data) ? 'Array' : typeof response.data?.data;
      const dataLength = Array.isArray(response.data?.data) ? response.data.data.length : 'N/A';
      
      console.log(`✅ API Success: ${url}`);
      console.log(`📊 Response type: ${dataType}${dataLength !== 'N/A' ? ` (${dataLength} items)` : ''}`);
    }
    
    return response;
  },
  (error) => {
    const { response, config } = error;
    const url = config?.url || 'unknown';
    
    // 🔍 LOGS DE ERROR MEJORADOS - Más informativos
    if (response) {
      const status = response.status;
      const method = config?.method?.toUpperCase() || 'UNKNOWN';
      const fullUrl = `${config?.baseURL || ''}${url}`;
      
      console.group(`❌ API Error ${status}: ${method} ${url}`);
      console.log(`🔗 Full URL: ${fullUrl}`);
      console.log(`📄 Response data:`, response.data);
      
      switch (status) {
        case 401:
          console.log('🔐 Problema: Token expirado o inválido');
          localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
          
          if (!window.location.pathname.includes('/login')) {
            toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          console.log('🚫 Problema: Sin permisos para esta acción');
          toast.error('No tienes permisos para realizar esta acción.');
          break;
          
        case 404:
          console.log('🔍 Problema: Endpoint no encontrado en el backend');
          console.log('💡 Solución: Verifica que la ruta exista en el backend');
          // NO mostrar toast para 404 ya que pueden ser endpoints opcionales
          break;
          
        case 422:
          console.log('📝 Problema: Error de validación de datos');
          if (response.data?.errors) {
            const errorMsg = response.data.errors.map(err => err.message).join(', ');
            console.log('📋 Errores de validación:', errorMsg);
            toast.error(`Error de validación: ${errorMsg}`);
          }
          break;
          
        case 429:
          console.log('🚦 Problema: Demasiadas peticiones (rate limiting)');
          toast.error('Demasiadas solicitudes. Intenta de nuevo más tarde.');
          break;
          
        case 500:
          console.log('🔥 Problema: Error interno del servidor');
          console.log('💡 Solución: Revisa los logs del backend');
          toast.error('Error interno del servidor. Contacta al administrador.');
          break;
          
        default:
          console.log(`🤔 Problema: Error HTTP ${status}`);
          const message = response.data?.message || `Error ${status}`;
          toast.error(message);
      }
      
      console.groupEnd();
    } else if (error.code === 'ECONNABORTED') {
      console.log(`⏰ Error: Timeout en ${url} (${config?.timeout}ms)`);
      console.log('💡 Solución: El servidor tarda mucho en responder');
      toast.error('La solicitud tardó demasiado. Verifica tu conexión.');
    } else if (error.code === 'ERR_NETWORK') {
      console.log(`🌐 Error: No se puede conectar al backend en ${url}`);
      console.log('💡 Solución: Verifica que el servidor esté corriendo en', config?.baseURL);
      // NO mostrar toast para errores de red al inicio
    } else {
      console.log(`🔥 Error desconocido en ${url}:`, error.message);
    }
    
    return Promise.reject(error);
  }
);

// 🏠 CLASE PRINCIPAL DEL SERVICIO API
class ApiService {
  
  // ================================
  // 🔧 MÉTODOS GENERALES (MEJORADOS)
  // ================================
  
  // MÉTODO GENERAL GET - MEJORADO
  async get(endpoint) {
    try {
      // Asegurar que el endpoint empiece con /api
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      this.logEndpointError('GET', endpoint, error);
      throw error;
    }
  }
  
  // MÉTODO GENERAL POST - MEJORADO
  async post(endpoint, data) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      this.logEndpointError('POST', endpoint, error);
      throw error;
    }
  }
  
  // MÉTODO GENERAL PUT - MEJORADO
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
  
  // MÉTODO GENERAL PATCH - MEJORADO
  async patch(endpoint, data) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.patch(url, data);
      return response.data;
    } catch (error) {
      this.logEndpointError('PATCH', endpoint, error);
      throw error;
    }
  }
  
  // MÉTODO GENERAL DELETE - MEJORADO
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
  
  // 🔧 HELPER: Normalizar endpoints para asegurar /api prefix
  normalizeEndpoint(endpoint) {
    // Si ya empieza con /api, devolverlo tal como está
    if (endpoint.startsWith('/api/')) {
      return endpoint;
    }
    
    // Si empieza con /, agregarlo después de /api
    if (endpoint.startsWith('/')) {
      return `/api${endpoint}`;
    }
    
    // Si no empieza con /, agregarlo con /api/
    return `/api/${endpoint}`;
  }
  
  // 🔧 HELPER: Log detallado de errores por endpoint
  logEndpointError(method, endpoint, error) {
    const status = error.response?.status;
    
    console.group(`🔧 ${method} ${endpoint} - Error Analysis`);
    console.log(`📍 Endpoint solicitado: ${endpoint}`);
    console.log(`🔗 URL normalizada: ${this.normalizeEndpoint(endpoint)}`);
    
    if (status) {
      console.log(`📊 Status: ${status}`);
      
      switch (status) {
        case 404:
          console.log('❓ ¿Qué significa? El endpoint no existe en el backend');
          console.log('🔧 ¿Qué hacer? Verificar que el backend tenga esta ruta implementada');
          break;
        case 500:
          console.log('❓ ¿Qué significa? Error interno en el backend');
          console.log('🔧 ¿Qué hacer? Revisar logs del backend para más detalles');
          break;
        case 422:
          console.log('❓ ¿Qué significa? Datos inválidos enviados');
          console.log('🔧 ¿Qué hacer? Verificar el formato de los datos enviados');
          break;
      }
    } else {
      console.log('❓ ¿Qué significa? No se pudo conectar al backend');
      console.log('🔧 ¿Qué hacer? Verificar que el backend esté corriendo');
    }
    
    console.groupEnd();
  }
  
  // ================================
  // 🏢 MÉTODOS DE CONFIGURACIÓN DEL GYM - RUTAS CORREGIDAS
  // ================================
  
  // OBTENER CONFIGURACIÓN COMPLETA DEL GYM
  async getGymConfig() {
    return await this.get('/api/gym/config');
  }
  
  // OBTENER ESTADÍSTICAS PÚBLICAS
  async getGymStats() {
    return await this.get('/api/gym/stats');
  }
  
  // OBTENER SERVICIOS DEL GYM
  async getGymServices() {
    return await this.get('/api/gym/services');
  }
  
  // OBTENER PLANES DE MEMBRESÍA PÚBLICOS
  async getMembershipPlans() {
    return await this.get('/api/gym/membership-plans');
  }
  
  // OBTENER TESTIMONIOS
  async getTestimonials() {
    return await this.get('/api/gym/testimonials');
  }
  
  // OBTENER INFORMACIÓN DE CONTACTO
  async getContactInfo() {
    return await this.get('/api/gym/contact');
  }
  
  // OBTENER REDES SOCIALES
  async getSocialMedia() {
    return await this.get('/api/gym/social-media');
  }
  
  // OBTENER GALERÍA/VIDEOS
  async getGymMedia() {
    return await this.get('/api/gym/media');
  }
  
  // ================================
  // 🎉 MÉTODOS DE PROMOCIONES - CORREGIDOS
  // ================================
  
  // OBTENER PROMOCIONES ACTIVAS
  async getPromotions() {
    return await this.get('/api/gym/promotions');
  }
  
  // OBTENER PROMOCIÓN POR ID
  async getPromotionById(id) {
    return await this.get(`/api/gym/promotions/${id}`);
  }
  
  // CREAR PROMOCIÓN
  async createPromotion(promotionData) {
    const response = await this.post('/api/gym/promotions', promotionData);
    
    if (response.success) {
      toast.success('Promoción creada exitosamente');
    }
    
    return response;
  }
  
  // ================================
  // 📄 MÉTODOS DE CONTENIDO - RUTAS CORREGIDAS
  // ================================
  
  // OBTENER CONTENIDO DE SECCIONES
  async getSectionsContent() {
    return await this.get('/api/gym/sections-content');
  }
  
  // OBTENER NAVEGACIÓN
  async getNavigation() {
    return await this.get('/api/gym/navigation');
  }
  
  // OBTENER CONTENIDO PROMOCIONAL
  async getPromotionalContent() {
    return await this.get('/api/gym/promotional-content');
  }
  
  // OBTENER CONFIGURACIÓN DE BRANDING
  async getBranding() {
    return await this.get('/api/gym/branding');
  }
  
  // ================================
  // 🛍️ MÉTODOS DE TIENDA
  // ================================
  
  // OBTENER PRODUCTOS DESTACADOS
  async getFeaturedProducts() {
    return await this.get('/api/store/featured-products');
  }
  
  // OBTENER PRODUCTOS
  async getProducts(params = {}) {
    const response = await api.get('/api/store/products', { params });
    return response.data;
  }
  
  // OBTENER PRODUCTO POR ID
  async getProductById(id) {
    return await this.get(`/api/store/products/${id}`);
  }
  
  // ================================
  // 🛒 MÉTODOS DEL CARRITO
  // ================================
  
  // OBTENER CARRITO
  async getCart() {
    return await this.get('/api/cart');
  }
  
  // ACTUALIZAR CARRITO
  async updateCart(items) {
    return await this.post('/api/cart', { items });
  }
  
  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN
  // ================================
  
  // LOGIN
  async login(credentials) {
    const response = await this.post('/api/auth/login', credentials);
    
    if (response.success && response.data.token) {
      localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', response.data.token);
      toast.success('Inicio de sesión exitoso');
    }
    
    return response;
  }
  
  // REGISTRO
  async register(userData) {
    const response = await this.post('/api/auth/register', userData);
    
    if (response.success) {
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
  
  // OBTENER USUARIOS
  async getUsers(params = {}) {
    const response = await api.get('/api/users', { params });
    return response.data;
  }
  
  // CREAR USUARIO
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
  
  // OBTENER MEMBRESÍAS
  async getMemberships(params = {}) {
    const response = await api.get('/api/memberships', { params });
    return response.data;
  }
  
  // MEMBRESÍAS VENCIDAS
  async getExpiredMemberships(days = 0) {
    const response = await api.get('/api/memberships/expired', { 
      params: { days } 
    });
    return response.data;
  }
  
  // MEMBRESÍAS POR VENCER
  async getExpiringSoonMemberships(days = 7) {
    const response = await api.get('/api/memberships/expiring-soon', { 
      params: { days } 
    });
    return response.data;
  }
  
  // ================================
  // 💰 MÉTODOS DE PAGOS
  // ================================
  
  // OBTENER PAGOS
  async getPayments(params = {}) {
    const response = await api.get('/api/payments', { params });
    return response.data;
  }
  
  // CREAR PAGO
  async createPayment(paymentData) {
    const response = await this.post('/api/payments', paymentData);
    
    if (response.success) {
      toast.success('Pago registrado exitosamente');
    }
    
    return response;
  }
  
  // TRANSFERENCIAS PENDIENTES
  async getPendingTransfers() {
    return await this.get('/api/payments/transfers/pending');
  }
  
  // ================================
  // 📊 MÉTODOS DE REPORTES
  // ================================
  
  // REPORTES DE PAGOS
  async getPaymentReports(params = {}) {
    const response = await api.get('/api/payments/reports', { params });
    return response.data;
  }
  
  // ESTADÍSTICAS DE USUARIOS
  async getUserStats() {
    return await this.get('/api/users/stats');
  }
  
  // ESTADÍSTICAS DE MEMBRESÍAS
  async getMembershipStats() {
    return await this.get('/api/memberships/stats');
  }
  
  // ================================
  // 🔧 MÉTODOS UTILITARIOS - MEJORADOS
  // ================================
  
  // HEALTH CHECK
  async healthCheck() {
    return await this.get('/api/health');
  }
  
  // VERIFICAR CONEXIÓN AL BACKEND - MEJORADO
  async checkBackendConnection() {
    try {
      console.log('🔍 Verificando conexión al backend...');
      
      const startTime = Date.now();
      const response = await api.get('/api/health');
      const responseTime = Date.now() - startTime;
      
      if (response.data.success) {
        console.log('✅ Backend conectado exitosamente!');
        console.log(`⚡ Tiempo de respuesta: ${responseTime}ms`);
        return { 
          connected: true, 
          data: response.data, 
          responseTime,
          status: 'connected'
        };
      } else {
        console.warn('⚠️ Backend respondió pero con error:', response.data);
        return { 
          connected: false, 
          error: 'Backend respondió con error',
          status: 'error'
        };
      }
    } catch (error) {
      console.log('❌ No se pudo conectar al backend');
      
      let errorType = 'unknown';
      let suggestion = 'Verifica la configuración';
      
      if (error.code === 'ERR_NETWORK') {
        errorType = 'network';
        suggestion = 'El backend no está corriendo o hay problema de CORS';
      } else if (error.response?.status === 404) {
        errorType = 'endpoint_not_found';
        suggestion = 'La ruta /api/health no existe en el backend';
      } else if (error.code === 'ECONNABORTED') {
        errorType = 'timeout';
        suggestion = 'El backend tarda mucho en responder';
      }
      
      console.log(`💡 Sugerencia: ${suggestion}`);
      
      return { 
        connected: false, 
        error: error.message,
        errorType,
        suggestion,
        status: 'disconnected'
      };
    }
  }
  
  // VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO
  isAuthenticated() {
    return !!localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }
  
  // OBTENER TOKEN ACTUAL
  getToken() {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }
  
  // LOGOUT
  logout() {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
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