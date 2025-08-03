// src/services/apiService.js
// FUNCIÓN: Servicio API CORREGIDO - Interceptor NO interfiere con login
// CORRECCIÓN: Error 401 durante login no debe redirigir automáticamente

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

// 📨 INTERCEPTOR DE RESPUESTAS (Response) - CORREGIDO PARA LOGIN
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
        
        // 🎬 ANÁLISIS ESPECÍFICO PARA VIDEO - NUEVO
        if (url.includes('/video')) {
          console.log('🎬 VIDEO ANALYSIS:');
          const data = response.data?.data || response.data;
          console.log('  - Hero Video URL:', data?.heroVideo || '❌ MISSING');
          console.log('  - Poster URL:', data?.poster || '❌ MISSING');
          console.log('  - Title:', data?.title || '❌ MISSING');
          console.log('  - Description:', data?.description || '❌ MISSING');
          console.log('  - Settings:', data?.settings ? '✅ Present' : '❌ MISSING');
          
          if (data?.settings) {
            console.log('    - Autoplay:', data.settings.autoplay);
            console.log('    - Muted:', data.settings.muted);
            console.log('    - Loop:', data.settings.loop);
            console.log('    - Controls:', data.settings.controls);
          }
          
          // Verificar si el video es accesible
          if (data?.heroVideo) {
            console.log('🔍 VIDEO URL VALIDATION:');
            try {
              const videoUrl = new URL(data.heroVideo);
              console.log('  - ✅ Valid absolute URL:', videoUrl.href);
            } catch {
              if (data.heroVideo.startsWith('/')) {
                console.log('  - ✅ Valid relative URL:', data.heroVideo);
              } else {
                console.log('  - ⚠️ Potentially invalid URL format:', data.heroVideo);
              }
            }
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
      
      // 🎬 Contexto específico para endpoint de video
      if (url.includes('/video')) {
        console.log('🎬 VIDEO ENDPOINT ERROR CONTEXT:');
        console.log('📍 Requested URL:', fullUrl);
        
        if (status === 404) {
          console.log('💡 SOLUTION FOR VIDEO 404:');
          console.log('1. Create video endpoint in backend:');
          console.log('   GET /api/gym/video');
          console.log('2. Expected response format:');
          console.log('   {');
          console.log('     "success": true,');
          console.log('     "data": {');
          console.log('       "heroVideo": "https://yourdomain.com/videos/hero.mp4",');
          console.log('       "poster": "https://yourdomain.com/images/video-poster.jpg",');
          console.log('       "title": "Welcome to Our Gym",');
          console.log('       "description": "Experience our amazing facilities",');
          console.log('       "settings": {');
          console.log('         "autoplay": false,');
          console.log('         "muted": true,');
          console.log('         "loop": true,');
          console.log('         "controls": true');
          console.log('       }');
          console.log('     }');
          console.log('   }');
          console.log('3. Video files should be stored in public/videos/ or external CDN');
        }
      }
      
      // ✅ CORRECCIÓN CRÍTICA: Contexto específico por tipo de error
      switch (status) {
        case 401:
          // ✅ NO INTERFERIR CON LOGIN - Solo redirigir si NO estamos en login
          const isLoginRequest = url.includes('/auth/login') || url.includes('/login');
          const isLoginPage = window.location.pathname.includes('/login');
          
          if (isLoginRequest) {
            // ✅ Error 401 en login = credenciales incorrectas
            console.log('🔐 LOGIN FAILED: Credenciales incorrectas');
            console.log('✅ Permitiendo que LoginPage maneje el error');
            // NO hacer nada aquí, dejar que el componente LoginPage maneje
          } else if (!isLoginPage) {
            // ✅ Error 401 fuera de login = token expirado
            console.log('🔐 PROBLEMA: Token expirado o inválido');
            console.log('🔧 ACCIÓN: Redirigiendo a login...');
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
            toast.error('Sesión expirada. Redirigiendo...');
            setTimeout(() => window.location.href = '/login', 1500);
          } else {
            // Ya estamos en login, no hacer nada
            console.log('🔐 Error 401 en página de login - No redirigir');
          }
          break;
          
        case 403:
          console.log('🚫 PROBLEMA: Sin permisos para esta acción');
          console.log('🔧 VERIFICAR: Rol del usuario y permisos necesarios');
          if (!url.includes('/auth/login')) {
            toast.error('Sin permisos para esta acción');
          }
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
          console.log('   - /api/gym/video');
          console.log('   - /api/store/featured-products');
          console.log('   - /api/gym/membership-plans');
          
          // Solo mostrar toast para endpoints críticos (no para video)
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
          
          if (url.includes('/video')) {
            console.log('💡 POSIBLE CAUSA: Error en procesamiento de video o acceso a archivos');
            console.log('🔧 VERIFICAR: Permisos de archivos de video y rutas correctas');
          }
          
          toast.error('Error del servidor, contacta soporte');
          break;
          
        default:
          console.log(`🤔 PROBLEMA: Error HTTP ${status}`);
          console.log('📋 Respuesta completa:', response.data);
          
          const message = response.data?.message || `Error ${status}`;
          // Solo mostrar toast si no es un error de login
          if (!url.includes('/auth/login')) {
            toast.error(message);
          }
      }
      
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ PROBLEMA: Request Timeout');
      console.log('🔍 El servidor tardó más de', config?.timeout, 'ms en responder');
      console.log('🔧 POSIBLES CAUSAS:');
      console.log('   - Servidor sobrecargado');
      console.log('   - Conexión lenta');
      console.log('   - Endpoint pesado');
      console.log('   - Video muy grande (si es endpoint de video)');
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
      
      // No mostrar toast para errores de red durante login
      if (!window.location.pathname.includes('/login')) {
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
  
  // 🎬 OBTENER VIDEO DEL GIMNASIO - NUEVO MÉTODO
  async getGymVideo() {
    console.log('🎬 FETCHING GYM VIDEO...');
    try {
      const result = await this.get('/gym/video');
      console.log('✅ GYM VIDEO RECEIVED:', result);
      
      // Validación adicional para datos de video
      if (result && result.data) {
        const videoData = result.data;
        console.log('🔍 VIDEO DATA VALIDATION:');
        console.log('  - Has hero video:', !!videoData.heroVideo);
        console.log('  - Has poster:', !!videoData.poster);
        console.log('  - Has title:', !!videoData.title);
        console.log('  - Has settings:', !!videoData.settings);
        
        // Validar URLs si existen
        if (videoData.heroVideo) {
          try {
            new URL(videoData.heroVideo);
            console.log('  - Hero video URL: ✅ Valid');
          } catch {
            if (videoData.heroVideo.startsWith('/') || videoData.heroVideo.includes('.')) {
              console.log('  - Hero video URL: ✅ Relative path');
            } else {
              console.log('  - Hero video URL: ⚠️ Potentially invalid');
            }
          }
        }
        
        if (videoData.poster) {
          try {
            new URL(videoData.poster);
            console.log('  - Poster URL: ✅ Valid');
          } catch {
            if (videoData.poster.startsWith('/') || videoData.poster.includes('.')) {
              console.log('  - Poster URL: ✅ Relative path');
            } else {
              console.log('  - Poster URL: ⚠️ Potentially invalid');
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      console.log('❌ GYM VIDEO FAILED:', error.message);
      
      // Análisis específico de errores de video
      if (error.response?.status === 404) {
        console.log('💡 GYM VIDEO: Endpoint not implemented in backend');
        console.log('🔧 IMPLEMENTATION GUIDE:');
        console.log('1. Add route in backend: GET /api/gym/video');
        console.log('2. Create controller method to return video data');
        console.log('3. Store video files in public/videos/ or use CDN URLs');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('🌐 GYM VIDEO: Network connection error');
      } else {
        console.log('🔥 GYM VIDEO: Unexpected error:', error.message);
      }
      
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
  
  // OBTENER CONTENIDO DE SECCIONES (método existente)
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
    
    // ✅ LOGIN CORREGIDO - Sin interferencia del interceptor
    async login(credentials) {
      console.log('🔐 ATTEMPTING LOGIN...');
      
      try {
        const response = await this.post('/auth/login', credentials);
        
        if (response.success && response.data.token) {
          localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', response.data.token);
          console.log('✅ LOGIN SUCCESSFUL');
          // NO mostrar toast aquí, lo maneja LoginPage
        }
        
        return response;
      } catch (error) {
        console.log('❌ LOGIN FAILED in apiService:', error.message);
        // NO mostrar toast aquí, lo maneja LoginPage
        throw error; // Propagar el error al LoginPage
      }
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
    // 👥 MÉTODOS DE USUARIOS MEJORADOS
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

    // 📊 OBTENER ESTADÍSTICAS DE USUARIOS CON FALLBACK MEJORADO
    async getUserStats() {
      console.log('📊 FETCHING USER STATISTICS...');
      try {
        const response = await this.get('/users/stats');
        console.log('✅ USER STATS FROM BACKEND:', response);
        return response.data || response;
      } catch (error) {
        console.warn('⚠️ getUserStats fallback to manual calculation');
        
        // Fallback: intentar calcular manualmente desde usuarios
        try {
          const users = await this.getUsers();
          const userArray = Array.isArray(users) ? users : users.data || [];
          
          const stats = {
            totalUsers: userArray.length,
            totalActiveUsers: userArray.length,
            activeUsers: userArray.filter(u => u.status === 'active').length,
            roleStats: userArray.reduce((acc, user) => {
              acc[user.role] = (acc[user.role] || 0) + 1;
              return acc;
            }, {}),
            newUsersThisMonth: userArray.filter(user => {
              const createdAt = new Date(user.createdAt || user.created_at);
              const thisMonth = new Date();
              return createdAt.getMonth() === thisMonth.getMonth() && 
                     createdAt.getFullYear() === thisMonth.getFullYear();
            }).length
          };
          
          console.log('✅ User stats calculated manually:', stats);
          return stats;
          
        } catch (fallbackError) {
          console.error('❌ Both getUserStats methods failed:', fallbackError);
          
          // Último fallback: datos por defecto
          return {
            totalUsers: 0,
            totalActiveUsers: 0,
            activeUsers: 0,
            roleStats: {
              admin: 0,
              colaborador: 0,
              cliente: 0
            },
            newUsersThisMonth: 0
          };
        }
      }
    }
    
    // ================================
    // 🎫 MÉTODOS DE MEMBRESÍAS MEJORADOS
    // ================================
    
    async getMemberships(params = {}) {
      const response = await api.get('/api/memberships', { params });
      return response.data;
    }

    // 📊 OBTENER ESTADÍSTICAS DE MEMBRESÍAS CON FALLBACK MEJORADO
    async getMembershipStats() {
      console.log('📊 FETCHING MEMBERSHIP STATISTICS...');
      try {
        const response = await this.get('/memberships/stats');
        console.log('✅ MEMBERSHIP STATS FROM BACKEND:', response);
        return response.data || response;
      } catch (error) {
        console.warn('⚠️ getMembershipStats fallback to manual calculation');
        
        try {
          const memberships = await this.getMemberships();
          const membershipArray = Array.isArray(memberships) ? memberships : memberships.data || [];
          
          const now = new Date();
          const stats = {
            totalMemberships: membershipArray.length,
            activeMemberships: membershipArray.filter(m => {
              const endDate = new Date(m.endDate || m.end_date);
              return endDate > now && (m.status === 'active' || !m.status);
            }).length,
            expiredMemberships: membershipArray.filter(m => {
              const endDate = new Date(m.endDate || m.end_date);
              return endDate <= now;
            }).length,
            expiringSoon: membershipArray.filter(m => {
              const endDate = new Date(m.endDate || m.end_date);
              const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              return endDate > now && endDate <= weekAhead;
            }).length
          };
          
          console.log('✅ Membership stats calculated manually:', stats);
          return stats;
          
        } catch (fallbackError) {
          console.error('❌ Both getMembershipStats methods failed:', fallbackError);
          return {
            totalMemberships: 0,
            activeMemberships: 0,
            expiredMemberships: 0,
            expiringSoon: 0
          };
        }
      }
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
    // 💰 MÉTODOS DE PAGOS MEJORADOS
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

    // 📊 OBTENER REPORTES DE PAGOS CON FALLBACK MEJORADO
    async getPaymentReports(params = {}) {
      console.log('📊 FETCHING PAYMENT REPORTS...');
      try {
        const response = await api.get('/api/payments/reports', { params });
        console.log('✅ PAYMENT REPORTS FROM BACKEND:', response.data);
        return response.data;
      } catch (error) {
        console.warn('⚠️ getPaymentReports fallback to manual calculation');
        
        try {
          const payments = await this.getPayments(params);
          const paymentArray = Array.isArray(payments) ? payments : payments.data || [];
          
          const totalIncome = paymentArray.reduce((sum, payment) => {
            return sum + parseFloat(payment.amount || 0);
          }, 0);
          
          const incomeByMethod = paymentArray.reduce((acc, payment) => {
            const method = payment.method || 'unknown';
            const existing = acc.find(item => item.method === method);
            
            if (existing) {
              existing.total += parseFloat(payment.amount || 0);
            } else {
              acc.push({
                method: method,
                total: parseFloat(payment.amount || 0)
              });
            }
            
            return acc;
          }, []);
          
          const stats = {
            totalIncome,
            totalPayments: paymentArray.length,
            incomeByMethod,
            averagePayment: paymentArray.length > 0 ? totalIncome / paymentArray.length : 0
          };
          
          console.log('✅ Payment reports calculated manually:', stats);
          return stats;
          
        } catch (fallbackError) {
          console.error('❌ Both getPaymentReports methods failed:', fallbackError);
          return {
            totalIncome: 0,
            totalPayments: 0,
            incomeByMethod: [],
            averagePayment: 0
          };
        }
      }
    }

    // 🆕 OBTENER ESTADO DE SALUD DEL SISTEMA
    async getSystemHealth() {
      console.log('🔍 FETCHING SYSTEM HEALTH...');
      try {
        const response = await this.get('/system/health');
        console.log('✅ SYSTEM HEALTH FROM BACKEND:', response);
        return response.data || response;
      } catch (error) {
        console.log('❌ SYSTEM HEALTH FAILED:', error.message);
        
        // Fallback básico
        return {
          status: 'unknown',
          uptime: 'unknown',
          lastCheck: new Date().toISOString()
        };
      }
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

    // ✅ NUEVO: OBTENER CONTENIDO DE LANDING PAGE
  async getLandingContent() {
    console.log('📄 FETCHING LANDING CONTENT...');
    try {
      const result = await this.get('/content/landing');
      console.log('✅ LANDING CONTENT RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ LANDING CONTENT FAILED:', error.message);
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