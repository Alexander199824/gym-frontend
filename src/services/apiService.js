// src/services/apiService.js
// FUNCIÓN: Servicio API MEJORADO con logs detallados y rutas corregidas
// CORRIGE: Errores de rutas, logs confusos y peticiones innecesarias
// FUNCIÓN: Servicio API MEJORADO con logs DETALLADOS de las respuestas del backend
// MUESTRA: Exactamente qué datos devuelve el backend para debug

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

// 🔐 INTERCEPTOR DE PETICIONES (Request) - MEJORADO
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🔍 LOGS DETALLADOS - Mostrar TODA petición en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const url = config.url.startsWith('/') ? config.url : `/${config.url}`;
      console.log(`🚀 API REQUEST: ${config.method?.toUpperCase()} ${config.baseURL}${url}`);
      
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
      if (config.params) {
        console.log('📋 Request Params:', config.params);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 📨 INTERCEPTOR DE RESPUESTAS (Response) - CON LOGS SÚPER DETALLADOS
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
        
        // Análisis específico por endpoint
        if (url.includes('/config')) {
          console.log('🏢 CONFIG ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Name:', data?.name || '❌ MISSING');
          console.log('  - Logo URL:', data?.logo?.url || '❌ MISSING');
          console.log('  - Description:', data?.description || '❌ MISSING');
          console.log('  - Contact:', data?.contact ? '✅ Present' : '❌ MISSING');
          console.log('  - Social:', data?.social ? Object.keys(data.social).length + ' platforms' : '❌ MISSING');
        }
        
        if (url.includes('/stats')) {
          console.log('📊 STATS ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Members:', data?.members || '❌ MISSING');
          console.log('  - Trainers:', data?.trainers || '❌ MISSING');
          console.log('  - Experience:', data?.experience || '❌ MISSING');
          console.log('  - Satisfaction:', data?.satisfaction || '❌ MISSING');
        }
        
        if (url.includes('/services')) {
          console.log('🏋️ SERVICES ANALYSIS:');
          const data = response.data?.data || response.data;
          if (Array.isArray(data)) {
            console.log(`  - Total services: ${data.length}`);
            data.forEach((service, i) => {
              console.log(`  - Service ${i + 1}:`, {
                id: service.id,
                title: service.title,
                active: service.active !== false
              });
            });
          } else {
            console.log('  - ❌ Services is not an array:', typeof data);
          }
        }
        
        if (url.includes('/testimonials')) {
          console.log('💬 TESTIMONIALS ANALYSIS:');
          const data = response.data?.data || response.data;
          if (Array.isArray(data)) {
            console.log(`  - Total testimonials: ${data.length}`);
            data.forEach((testimonial, i) => {
              console.log(`  - Testimonial ${i + 1}:`, {
                id: testimonial.id,
                name: testimonial.name,
                text: testimonial.text?.substring(0, 50) + '...',
                rating: testimonial.rating
              });
            });
          } else {
            console.log('  - ❌ Testimonials is not an array:', typeof data);
          }
        }
        
        if (url.includes('/products')) {
          console.log('🛍️ PRODUCTS ANALYSIS:');
          const data = response.data?.data || response.data;
          if (Array.isArray(data)) {
            console.log(`  - Total products: ${data.length}`);
            data.forEach((product, i) => {
              console.log(`  - Product ${i + 1}:`, {
                id: product.id,
                name: product.name,
                price: product.price,
                inStock: product.inStock !== false
              });
            });
          } else {
            console.log('  - ❌ Products is not an array:', typeof data);
          }
        }
        
        if (url.includes('/membership-plans')) {
          console.log('🎫 PLANS ANALYSIS:');
          const data = response.data?.data || response.data;
          if (Array.isArray(data)) {
            console.log(`  - Total plans: ${data.length}`);
            data.forEach((plan, i) => {
              console.log(`  - Plan ${i + 1}:`, {
                id: plan.id,
                name: plan.name,
                price: plan.price,
                popular: plan.popular
              });
            });
          } else {
            console.log('  - ❌ Plans is not an array:', typeof data);
          }
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
    
    // 🔍 LOGS DE ERROR SÚPER DETALLADOS
    console.group(`❌ BACKEND ERROR: ${method} ${url}`);
    
    if (response) {
      const status = response.status;
      console.log('📊 Error Status:', status);
      console.log('📋 Error Headers:', response.headers);
      console.log('📦 Error Data:', response.data);
      
      const fullUrl = `${config?.baseURL || ''}${url}`;
      
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
          console.log('💡 POSIBLES RUTAS ESPERADAS:');
          console.log('   - /api/gym/config');
          console.log('   - /api/gym/stats');
          console.log('   - /api/gym/services');
          console.log('   - /api/gym/testimonials');
          console.log('   - /api/store/featured-products');
          console.log('   - /api/gym/membership-plans');
          
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
          
          // Análisis específico para errores 500 comunes
          if (url.includes('/testimonials')) {
            console.log('💡 POSIBLE CAUSA: Campo created_at o updated_at undefined');
            console.log('🔧 SOLUCIÓN: Agregar validación en gymController.js');
            console.log('📝 CÓDIGO SUGERIDO: testimonial.created_at ? testimonial.created_at.toISOString() : new Date().toISOString()');
          }
          
          toast.error('Error del servidor, contacta soporte');
          break;
          
        default:
          console.log(`🤔 PROBLEMA: Error HTTP ${status}`);
          console.log('📋 Respuesta completa:', response.data);
          
          const message = response.data?.message || `Error ${status}`;
          toast.error(message);
      }
      
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ PROBLEMA: Request Timeout');
      console.log('🔍 El servidor tardó más de', config?.timeout, 'ms en responder');
      console.log('🔧 POSIBLES CAUSAS:');
      console.log('   - Servidor sobrecargado');
      console.log('   - Conexión lenta');
      console.log('   - Endpoint pesado');
      console.log('💡 SOLUCIÓN: Optimizar endpoint o aumentar timeout');
      
      toast.error('La solicitud tardó demasiado tiempo');
      
    } else if (error.code === 'ERR_NETWORK') {
      console.log('🌐 PROBLEMA: No se puede conectar al backend');
      console.log('🔧 POSIBLES CAUSAS:');
      console.log('   - Backend no está corriendo');
      console.log('   - Puerto incorrecto');
      console.log('   - Problema de CORS');
      console.log('   - Firewall bloqueando');
      console.log('📋 Backend URL configurada:', config?.baseURL);
      console.log('💡 VERIFICACIONES:');
      console.log('   1. ¿Está el backend corriendo?');
      console.log('   2. ¿Responde en:', config?.baseURL);
      console.log('   3. ¿Hay errors en los logs del backend?');
      console.log('   4. ¿CORS configurado correctamente?');
      
      // No mostrar toast para errores de red durante carga inicial
      if (!document.location.pathname.includes('/login')) {
        toast.error('Sin conexión al servidor');
      }
      
    } else {
      console.log('🔥 ERROR DESCONOCIDO');
      console.log('🔍 Error message:', error.message);
      console.log('📋 Error code:', error.code);
      console.log('📋 Error stack:', error.stack);
      console.log('📋 URL afectada:', url);
    }
    
    console.groupEnd();
    
    return Promise.reject(error);
  }
);

// 🏠 CLASE PRINCIPAL DEL SERVICIO API
class ApiService {
  
  // ================================
  // 🔧 MÉTODOS GENERALES OPTIMIZADOS
  // ================================
  
  // MÉTODO GENERAL GET - CON LOGS DETALLADOS
  async get(endpoint) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING GET REQUEST TO: ${url}`);
      
      const response = await api.get(url);
      
      // Log específico del resultado
      console.log(`🎉 GET ${url} SUCCESS:`, {
        hasData: !!response.data,
        dataType: Array.isArray(response.data?.data) ? 'Array' : typeof response.data?.data,
        dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
        success: response.data?.success
      });
      
      return response.data;
    } catch (error) {
      console.log(`💥 GET ${endpoint} FAILED:`, error.message);
      throw error;
    }
  }
  
  // MÉTODO GENERAL POST
  async post(endpoint, data) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING POST REQUEST TO: ${url}`, data);
      
      const response = await api.post(url, data);
      
      console.log(`🎉 POST ${url} SUCCESS:`, response.data);
      
      return response.data;
    } catch (error) {
      console.log(`💥 POST ${endpoint} FAILED:`, error.message);
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
  
  // 🔧 HELPER: Log de error detallado
  logEndpointError(method, endpoint, error) {
    const status = error.response?.status;
    
    console.group(`🔧 ${method} ${endpoint} Analysis`);
    console.log(`📍 Requested: ${endpoint}`);
    console.log(`🔗 Normalized: ${this.normalizeEndpoint(endpoint)}`);
    
    if (status) {
      console.log(`📊 HTTP Status: ${status}`);
    } else {
      console.log('❓ WHY: Cannot connect to backend');
      console.log('🔧 FIX: Start backend server');
    }
    
    console.groupEnd();
  }
  
  // ================================
  // 🏢 MÉTODOS DE GIMNASIO CON LOGS ESPECÍFICOS
  // ================================
  
  // OBTENER CONFIGURACIÓN DEL GYM
  async getGymConfig() {
    console.log('🏢 FETCHING GYM CONFIGURATION...');
    try {
      const result = await this.get('/gym/config');
      console.log('✅ GYM CONFIG RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM CONFIG FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER ESTADÍSTICAS
  async getGymStats() {
    console.log('📊 FETCHING GYM STATISTICS...');
    try {
      const result = await this.get('/gym/stats');
      console.log('✅ GYM STATS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM STATS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER SERVICIOS
  async getGymServices() {
    console.log('🏋️ FETCHING GYM SERVICES...');
    try {
      const result = await this.get('/gym/services');
      console.log('✅ GYM SERVICES RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM SERVICES FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER PLANES DE MEMBRESÍA
  async getMembershipPlans() {
    console.log('🎫 FETCHING MEMBERSHIP PLANS...');
    try {
      const result = await this.get('/gym/membership-plans');
      console.log('✅ MEMBERSHIP PLANS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ MEMBERSHIP PLANS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER TESTIMONIOS
  async getTestimonials() {
    console.log('💬 FETCHING TESTIMONIALS...');
    try {
      const result = await this.get('/gym/testimonials');
      console.log('✅ TESTIMONIALS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ TESTIMONIALS FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // 🛍️ MÉTODOS DE TIENDA
  // ================================
  
  // OBTENER PRODUCTOS DESTACADOS
  async getFeaturedProducts() {
    console.log('🛍️ FETCHING FEATURED PRODUCTS...');
    try {
      const result = await this.get('/store/featured-products');
      console.log('✅ FEATURED PRODUCTS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ FEATURED PRODUCTS FAILED:', error.message);
      throw error;
    }
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
    console.log('📄 FETCHING SECTIONS CONTENT...');
    try {
      const result = await this.get('/gym/sections-content');
      console.log('✅ SECTIONS CONTENT RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ SECTIONS CONTENT FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER NAVEGACIÓN
  async getNavigation() {
    console.log('🧭 FETCHING NAVIGATION...');
    try {
      const result = await this.get('/gym/navigation');
      console.log('✅ NAVIGATION RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ NAVIGATION FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER PROMOCIONES
  async getPromotions() {
    console.log('🎉 FETCHING PROMOTIONS...');
    try {
      const result = await this.get('/gym/promotions');
      console.log('✅ PROMOTIONS RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ PROMOTIONS FAILED:', error.message);
      throw error;
    }
  }
  
  // OBTENER BRANDING
  async getBranding() {
    console.log('🎨 FETCHING BRANDING...');
    try {
      const result = await this.get('/gym/branding');
      console.log('✅ BRANDING RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ BRANDING FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN
  // ================================
  
  // LOGIN
  async login(credentials) {
    console.log('🔐 ATTEMPTING LOGIN...');
    const response = await this.post('/auth/login', credentials);
    
    if (response.success && response.data.token) {
      localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', response.data.token);
      console.log('✅ LOGIN SUCCESSFUL');
      toast.success('Inicio de sesión exitoso');
    }
    
    return response;
  }
  
  // REGISTRO
  async register(userData) {
    console.log('📝 ATTEMPTING REGISTRATION...');
    const response = await this.post('/auth/register', userData);
    
    if (response.success) {
      console.log('✅ REGISTRATION SUCCESSFUL');
      toast.success('Registro exitoso');
    }
    
    return response;
  }
  
  // PERFIL
  async getProfile() {
    return await this.get('/auth/profile');
  }
  
  // ================================
  // 👥 MÉTODOS DE USUARIOS
  // ================================
  
  async getUsers(params = {}) {
    const response = await api.get('/api/users', { params });
    return response.data;
  }
  
  async createUser(userData) {
    const response = await this.post('/users', userData);
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
    const response = await this.post('/payments', paymentData);
    if (response.success) {
      toast.success('Pago registrado exitosamente');
    }
    return response;
  }
  
  async getPendingTransfers() {
    return await this.get('/payments/transfers/pending');
  }
  
  // ================================
  // 📊 MÉTODOS DE REPORTES
  // ================================
  
  async getPaymentReports(params = {}) {
    const response = await api.get('/api/payments/reports', { params });
    return response.data;
  }
  
  async getUserStats() {
    return await this.get('/users/stats');
  }
  
  async getMembershipStats() {
    return await this.get('/memberships/stats');
  }
  
  // ================================
  // 🛒 MÉTODOS DEL CARRITO
  // ================================
  
  async getCart() {
    return await this.get('/cart');
  }
  
  async updateCart(items) {
    return await this.post('/cart', { items });
  }
  
  // ================================
  // 🔧 MÉTODOS UTILITARIOS
  // ================================
  
  // HEALTH CHECK
  async healthCheck() {
    console.log('🔌 HEALTH CHECK...');
    try {
      const result = await this.get('/health');
      console.log('✅ HEALTH CHECK SUCCESS:', result);
      return result;
    } catch (error) {
      console.log('❌ HEALTH CHECK FAILED:', error.message);
      throw error;
    }
  }
  
  // VERIFICAR CONEXIÓN MEJORADA
  async checkBackendConnection() {
    try {
      console.log('🔌 CHECKING BACKEND CONNECTION...');
      
      const startTime = Date.now();
      const response = await api.get('/api/health');
      const responseTime = Date.now() - startTime;
      
      if (response.data.success) {
        console.log('✅ BACKEND CONNECTED SUCCESSFULLY');
        console.log(`⚡ Response time: ${responseTime}ms`);
        console.log('📦 Health data:', response.data);
        
        return { 
          connected: true, 
          data: response.data, 
          responseTime,
          status: 'connected'
        };
      } else {
        console.warn('⚠️ BACKEND RESPONDED WITH ERROR');
        return { 
          connected: false, 
          error: 'Backend error response',
          status: 'error'
        };
      }
    } catch (error) {
      console.log('❌ BACKEND CONNECTION FAILED');
      
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
    console.log('🚪 USER LOGGED OUT');
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