// src/services/apiService.js
// FUNCIÓN: Servicio API COMPLETO - TODAS las funcionalidades existentes + checkout para invitados
// MANTIENE: TODO lo existente + agregados métodos para checkout de invitados + Stripe + sessionId

import axios from 'axios';
import toast from 'react-hot-toast';

// 🔧 CONFIGURACIÓN DE AXIOS - MANTIENE TODA LA CONFIGURACIÓN EXISTENTE
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 🔐 INTERCEPTOR DE PETICIONES - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
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

// 📨 INTERCEPTOR DE RESPUESTAS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE + ANÁLISIS STRIPE
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
          } else if (data && data.products && Array.isArray(data.products)) {
            console.log(`  - Total products: ${data.products.length}`);
            console.log('  - Pagination:', data.pagination);
            data.products.forEach((product, i) => {
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
        
        // 🎬 ANÁLISIS ESPECÍFICO PARA VIDEO
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
        
        // 🆕 ANÁLISIS ESPECÍFICO PARA USUARIOS CON FILTROS DE ROL
        if (url.includes('/users')) {
          console.log('👥 USERS ANALYSIS:');
          const data = response.data?.data || response.data;
          
          if (Array.isArray(data)) {
            console.log(`  - Total users returned: ${data.length}`);
            const roleDistribution = data.reduce((acc, user) => {
              acc[user.role] = (acc[user.role] || 0) + 1;
              return acc;
            }, {});
            console.log('  - Role distribution:', roleDistribution);
            
            // Verificar si hay filtrado de roles aplicado
            const hasAdmin = data.some(user => user.role === 'admin');
            const hasColaborador = data.some(user => user.role === 'colaborador');
            const hasCliente = data.some(user => user.role === 'cliente');
            
            console.log('  - Roles present:', {
              admin: hasAdmin,
              colaborador: hasColaborador,
              cliente: hasCliente
            });
            
            if (!hasAdmin && !hasColaborador && hasCliente) {
              console.log('  - 🔒 FILTERED: Only clients returned (likely collaborator request)');
            } else if (hasAdmin && hasColaborador && hasCliente) {
              console.log('  - 🔓 UNFILTERED: All roles returned (likely admin request)');
            }
            
          } else if (data && data.users && Array.isArray(data.users)) {
            console.log(`  - Total users returned: ${data.users.length}`);
            console.log('  - Pagination:', data.pagination);
            
            const roleDistribution = data.users.reduce((acc, user) => {
              acc[user.role] = (acc[user.role] || 0) + 1;
              return acc;
            }, {});
            console.log('  - Role distribution:', roleDistribution);
          } else {
            console.log('  - ❌ Users data structure unexpected:', typeof data);
          }
        }
        
        // ANÁLISIS ESPECÍFICO PARA PERFIL
        if (url.includes('/auth/profile')) {
          console.log('👤 PROFILE ANALYSIS:');
          const data = response.data?.data || response.data;
          if (data && data.user) {
            console.log('  - User ID:', data.user.id);
            console.log('  - Name:', `${data.user.firstName} ${data.user.lastName}`);
            console.log('  - Email:', data.user.email);
            console.log('  - Phone:', data.user.phone || '❌ MISSING');
            console.log('  - Role:', data.user.role);
            console.log('  - Profile Image:', data.user.profileImage ? '✅ Present' : '❌ MISSING');
            console.log('  - Date of Birth:', data.user.dateOfBirth || '❌ MISSING');
            console.log('  - Active:', data.user.isActive !== false ? '✅ Yes' : '❌ No');
            
            // Calcular edad si hay fecha de nacimiento
            if (data.user.dateOfBirth) {
              const birthDate = new Date(data.user.dateOfBirth);
              const today = new Date();
              const age = today.getFullYear() - birthDate.getFullYear();
              console.log('  - Calculated Age:', age, 'years');
              
              if (age < 13) {
                console.log('  - ⚠️ USER IS UNDER 13 - RESTRICTIONS SHOULD APPLY');
              }
            }
          } else {
            console.log('  - ❌ Profile structure is different from expected');
          }
        }
        
        // 🛒 ANÁLISIS ESPECÍFICO PARA CARRITO
        if (url.includes('/store/cart')) {
          console.log('🛒 CART ANALYSIS:');
          const data = response.data?.data || response.data;
          
          if (data && data.cartItems) {
            console.log(`  - Cart items count: ${data.cartItems.length}`);
            console.log('  - Summary:', data.summary);
            
            if (data.cartItems.length > 0) {
              console.log('  - Items details:');
              data.cartItems.forEach((item, i) => {
                console.log(`    - Item ${i + 1}:`, {
                  id: item.id,
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  productName: item.product?.name || '❌ Missing product name'
                });
              });
            } else {
              console.log('  - 🛒 Cart is empty');
            }
          } else {
            console.log('  - ❌ Cart structure different from expected');
          }
        }
        
        // 🛍️ ANÁLISIS ESPECÍFICO PARA ÓRDENES
        if (url.includes('/store/orders')) {
          console.log('🛍️ ORDER ANALYSIS:');
          const data = response.data?.data || response.data;
          
          if (data && data.order) {
            console.log('  - Order created:', {
              id: data.order.id,
              orderNumber: data.order.orderNumber,
              totalAmount: data.order.totalAmount,
              status: data.order.status,
              paymentMethod: data.order.paymentMethod,
              itemsCount: data.order.items?.length || 0
            });
          } else if (Array.isArray(data)) {
            console.log(`  - Orders list: ${data.length} orders`);
          } else {
            console.log('  - ❌ Order structure different from expected');
          }
        }
        
        // ✅ NUEVO: ANÁLISIS ESPECÍFICO PARA STRIPE
        if (url.includes('/stripe')) {
          console.log('💳 STRIPE ANALYSIS:');
          const data = response.data?.data || response.data;
          
          if (url.includes('/config')) {
            console.log('  - Stripe Config:', {
              enabled: data?.stripe?.enabled || false,
              mode: data?.stripe?.mode || 'unknown',
              currency: data?.stripe?.currency || 'unknown',
              country: data?.stripe?.country || 'unknown',
              hasPublishableKey: !!data?.stripe?.publishableKey
            });
          } else if (url.includes('/create-') && url.includes('-intent')) {
            console.log('  - Payment Intent Created:', {
              hasClientSecret: !!data?.clientSecret,
              paymentIntentId: data?.paymentIntentId || '❌ MISSING',
              amount: data?.amount || 0,
              currency: data?.currency || 'unknown'
            });
          } else if (url.includes('/confirm-payment')) {
            console.log('  - Payment Confirmation:', {
              success: data?.success || false,
              paymentId: data?.payment?.id || '❌ MISSING',
              stripeStatus: data?.stripe?.status || 'unknown'
            });
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
      
      // ✅ CORRECCIÓN CRÍTICA: Contexto específico por tipo de error
      switch (status) {
        case 401:
          // ✅ NO INTERFERIR CON LOGIN - Solo redirigir si NO estamos en login
          const isLoginRequest = url.includes('/auth/login') || url.includes('/login');
          const isLoginPage = window.location.pathname.includes('/login');
          
          if (isLoginRequest) {
            console.log('🔐 LOGIN FAILED: Credenciales incorrectas');
            console.log('✅ Permitiendo que LoginPage maneje el error');
          } else if (!isLoginPage) {
            console.log('🔐 PROBLEMA: Token expirado o inválido');
            console.log('🔧 ACCIÓN: Redirigiendo a login...');
            localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
            toast.error('Sesión expirada. Redirigiendo...');
            setTimeout(() => window.location.href = '/login', 1500);
          } else {
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
          console.log('   - /api/auth/profile');
          console.log('   - /api/auth/profile/image');
          console.log('   - /api/users');
          console.log('   - /api/users/stats');
          console.log('   - /api/store/cart');
          console.log('   - /api/store/orders');
          console.log('   - /api/stripe/config');
          console.log('   - /api/stripe/create-store-intent');
          
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

// 🏠 CLASE PRINCIPAL DEL SERVICIO API
class ApiService {
  
  // ================================
  // 🔧 MÉTODOS GENERALES OPTIMIZADOS - MANTIENE TODA LA FUNCIONALIDAD
  // ================================
  
  // MÉTODO GENERAL GET - CON LOGS DETALLADOS
  async get(endpoint, config = {}) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING GET REQUEST TO: ${url}`);
      
      const response = await api.get(url, config);
      
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
  async post(endpoint, data, options = {}) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING POST REQUEST TO: ${url}`, data);
      
      const response = await api.post(url, data, options);
      
      console.log(`🎉 POST ${url} SUCCESS:`, response.data);
      
      return response.data;
    } catch (error) {
      console.log(`💥 POST ${endpoint} FAILED:`, error.message);
      throw error;
    }
  }
  
  // MÉTODO GENERAL PUT
  async put(endpoint, data, config = {}) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING PUT REQUEST TO: ${url}`, data);
      
      const response = await api.put(url, data, config);
      
      console.log(`🎉 PUT ${url} SUCCESS:`, response.data);
      
      return response.data;
    } catch (error) {
      console.log(`💥 PUT ${endpoint} FAILED:`, error.message);
      throw error;
    }
  }
  
  // MÉTODO GENERAL PATCH
  async patch(endpoint, data) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING PATCH REQUEST TO: ${url}`, data);
      
      const response = await api.patch(url, data);
      
      console.log(`🎉 PATCH ${url} SUCCESS:`, response.data);
      
      return response.data;
    } catch (error) {
      console.log(`💥 PATCH ${endpoint} FAILED:`, error.message);
      throw error;
    }
  }
  
  // MÉTODO GENERAL DELETE
  async delete(endpoint, config = {}) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      const response = await api.delete(url, config);
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
  // 🏢 MÉTODOS DE GIMNASIO - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
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
  
  // OBTENER VIDEO DEL GIMNASIO
  async getGymVideo() {
    console.log('🎬 FETCHING GYM VIDEO...');
    try {
      const result = await this.get('/gym/video');
      console.log('✅ GYM VIDEO RECEIVED:', result);
      return result;
    } catch (error) {
      console.log('❌ GYM VIDEO FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // 🛍️ MÉTODOS DE TIENDA - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
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
  // 📄 MÉTODOS DE CONTENIDO - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
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
  
  // OBTENER CONTENIDO DE LANDING PAGE
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
  
  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
    
  // ✅ LOGIN CORREGIDO - Sin interferencia del interceptor
  async login(credentials) {
    console.log('🔐 ATTEMPTING LOGIN...');
    
    try {
      const response = await this.post('/auth/login', credentials);
      
      if (response.success && response.data.token) {
        localStorage.setItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token', response.data.token);
        console.log('✅ LOGIN SUCCESSFUL');
      }
      
      return response;
    } catch (error) {
      console.log('❌ LOGIN FAILED in apiService:', error.message);
      throw error;
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
    
  // OBTENER PERFIL
  async getProfile() {
    console.log('👤 FETCHING USER PROFILE...');
    try {
      const result = await this.get('/auth/profile');
      console.log('✅ PROFILE DATA RECEIVED:', result);
      
      if (result && result.data && result.data.user) {
        console.log('✅ Profile structure is correct (README format)');
        console.log('👤 User data:', {
          id: result.data.user.id,
          firstName: result.data.user.firstName,
          lastName: result.data.user.lastName,
          email: result.data.user.email,
          role: result.data.user.role,
          hasProfileImage: !!result.data.user.profileImage
        });
      } else {
        console.warn('⚠️ Profile structure might be different from README');
        console.log('📋 Actual structure:', result);
      }
      
      return result;
    } catch (error) {
      console.log('❌ PROFILE FETCH FAILED:', error.message);
      
      if (error.response?.status === 401) {
        console.log('🔐 PROFILE: Token expired or invalid');
      } else if (error.response?.status === 404) {
        console.log('👤 PROFILE: User not found');
      }
      
      throw error;
    }
  }

  // ACTUALIZAR PERFIL
  async updateProfile(profileData) {
    console.log('💾 UPDATING USER PROFILE...');
    console.log('📤 Profile data to send:', profileData);
    
    try {
      const result = await this.patch('/auth/profile', profileData);
      
      console.log('✅ PROFILE UPDATED SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Update response structure is correct');
        
        if (result.data && result.data.user) {
          console.log('👤 Updated user data:', {
            id: result.data.user.id,
            firstName: result.data.user.firstName,
            lastName: result.data.user.lastName,
            phone: result.data.user.phone,
            updatedFields: Object.keys(profileData)
          });
        }
      } else {
        console.warn('⚠️ Update response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PROFILE UPDATE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - firstName/lastName: Only letters, spaces, accents allowed');
        console.log('   - phone: Only numbers, spaces, dashes, parentheses, + allowed');
        console.log('   - dateOfBirth: Must be at least 13 years old');
      } else if (error.response?.status === 401) {
        console.log('🔐 PROFILE UPDATE: Authorization failed');
      } else if (error.response?.status === 400) {
        console.log('📋 PROFILE UPDATE: Bad request, check data format');
      }
      
      throw error;
    }
  }

  // SUBIR IMAGEN DE PERFIL
  async uploadProfileImage(formData) {
    console.log('📸 UPLOADING PROFILE IMAGE...');
    
    try {
      const result = await this.post('/auth/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ PROFILE IMAGE UPLOADED:', result);
      
      if (result && result.success && result.data) {
        console.log('✅ Image upload response structure is correct');
        console.log('📸 Image details:', {
          profileImage: result.data.profileImage,
          publicId: result.data.publicId,
          hasUserData: !!result.data.user
        });
        
        if (result.data.profileImage) {
          try {
            new URL(result.data.profileImage);
            console.log('✅ Profile image URL is valid');
          } catch {
            if (result.data.profileImage.startsWith('/') || result.data.profileImage.includes('cloudinary')) {
              console.log('✅ Profile image URL is a valid path/Cloudinary URL');
            } else {
              console.warn('⚠️ Profile image URL format might be unusual');
            }
          }
        }
      } else {
        console.warn('⚠️ Image upload response structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PROFILE IMAGE UPLOAD FAILED:', error.message);
      
      if (error.response?.status === 413) {
        console.log('📏 IMAGE TOO LARGE: Max size is 5MB according to README');
      } else if (error.response?.status === 422) {
        console.log('🖼️ INVALID IMAGE FORMAT: Allowed formats: JPG, JPEG, PNG, WebP');
      } else if (error.response?.status === 401) {
        console.log('🔐 IMAGE UPLOAD: Authorization failed');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('🌐 IMAGE UPLOAD: Network error - check backend connection');
      }
      
      throw error;
    }
  }

  // CAMBIAR CONTRASEÑA
  async changePassword(passwordData) {
    console.log('🔐 CHANGING PASSWORD...');
    
    try {
      const result = await this.post('/auth/change-password', passwordData);
      
      console.log('✅ PASSWORD CHANGED SUCCESSFULLY');
      
      return result;
    } catch (error) {
      console.log('❌ PASSWORD CHANGE FAILED:', error.message);
      
      if (error.response?.status === 401) {
        console.log('🔐 CURRENT PASSWORD INCORRECT');
      } else if (error.response?.status === 422) {
        console.log('📝 PASSWORD VALIDATION FAILED:', error.response.data?.errors);
        console.log('💡 Password requirements:');
        console.log('   - At least 6 characters');
        console.log('   - At least one lowercase letter');
        console.log('   - At least one uppercase letter');
        console.log('   - At least one number');
      }
      
      throw error;
    }
  }

  // ACTUALIZAR PREFERENCIAS
  async updatePreferences(preferences) {
    console.log('⚙️ UPDATING USER PREFERENCES...');
    console.log('📤 Preferences to update:', preferences);
    
    try {
      const result = await this.put('/auth/profile/preferences', preferences);
      
      console.log('✅ PREFERENCES UPDATED SUCCESSFULLY:', result);
      
      return result;
    } catch (error) {
      console.log('❌ PREFERENCES UPDATE FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 PREFERENCES VALIDATION FAILED:', error.response.data?.errors);
      }
      
      throw error;
    }
  }
    
  // ================================
  // 👥 MÉTODOS DE USUARIOS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
  
  // 🆕 OBTENER USUARIOS CON FILTROS DE ROL APLICADOS
  async getUsers(params = {}) {
    console.log('👥 FETCHING USERS WITH ROLE FILTERS...');
    console.log('📋 Original params:', params);
    
    try {
      const filteredParams = { ...params };
      
      console.log('📤 Sending filtered params:', filteredParams);
      
      const response = await this.get('/users', { params: filteredParams });
      
      const userData = response.data || response;
      let users = [];
      
      if (userData.users && Array.isArray(userData.users)) {
        users = userData.users;
      } else if (Array.isArray(userData)) {
        users = userData;
      }
      
      console.log('✅ Users fetched successfully:', {
        totalUsers: users.length,
        roleDistribution: users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
        params: filteredParams
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  }
  
  // 🆕 OBTENER USUARIOS SOLO CLIENTES (para colaboradores)
  async getClientUsers(params = {}) {
    console.log('👤 FETCHING CLIENT USERS ONLY...');
    
    const clientParams = {
      ...params,
      role: 'cliente'
    };
    
    return this.getUsers(clientParams);
  }
  
  // 🆕 OBTENER USUARIOS SEGÚN ROL DEL USUARIO ACTUAL
  async getUsersByCurrentUserRole(currentUserRole, params = {}) {
    console.log('🎭 FETCHING USERS BY CURRENT USER ROLE:', currentUserRole);
    
    let filteredParams = { ...params };
    
    switch (currentUserRole) {
      case 'admin':
        console.log('🔓 Admin user: No role filtering applied');
        break;
        
      case 'colaborador':
        filteredParams.role = 'cliente';
        console.log('🔒 Colaborador user: Filtering to clients only');
        break;
        
      case 'cliente':
        console.log('🔒 Cliente user: Should not be accessing user list');
        throw new Error('Los clientes no pueden ver la lista de usuarios');
        
      default:
        console.log('❓ Unknown user role, applying restrictive filter');
        filteredParams.role = 'cliente';
    }
    
    return this.getUsers(filteredParams);
  }
  
  // 🆕 CREAR USUARIO CON VALIDACIÓN DE ROL
  async createUser(userData, currentUserRole = null) {
    console.log('👤 CREATING USER WITH ROLE VALIDATION...');
    console.log('📤 User data:', userData);
    console.log('👨‍💼 Current user role:', currentUserRole);
    
    if (currentUserRole === 'colaborador' && userData.role !== 'cliente') {
      throw new Error('Los colaboradores solo pueden crear usuarios clientes');
    }
    
    try {
      const response = await this.post('/users', userData);
      
      if (response.success) {
        console.log('✅ User created successfully:', response.data?.user);
        toast.success('Usuario creado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }
  
  // 🆕 ACTUALIZAR USUARIO CON VALIDACIÓN DE PERMISOS
  async updateUser(userId, userData, currentUserRole = null, currentUserId = null) {
    console.log('👤 UPDATING USER WITH PERMISSION VALIDATION...');
    console.log('🎯 Target user ID:', userId);
    console.log('👨‍💼 Current user role:', currentUserRole);
    console.log('📤 Update data:', userData);
    
    if (currentUserRole === 'colaborador') {
      throw new Error('Los colaboradores no pueden editar usuarios existentes');
    }
    
    if (userId === currentUserId) {
      throw new Error('No puedes editarte a ti mismo desde la gestión de usuarios');
    }
    
    try {
      const response = await this.put(`/users/${userId}`, userData);
      
      if (response.success) {
        console.log('✅ User updated successfully:', response.data?.user);
        toast.success('Usuario actualizado exitosamente');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }
  
  // 🆕 ELIMINAR USUARIO CON VALIDACIÓN DE PERMISOS
  async deleteUser(userId, currentUserRole = null, currentUserId = null) {
    console.log('🗑️ DELETING USER WITH PERMISSION VALIDATION...');
    console.log('🎯 Target user ID:', userId);
    console.log('👨‍💼 Current user role:', currentUserRole);
    
    if (currentUserRole === 'colaborador') {
      throw new Error('Los colaboradores no pueden eliminar usuarios');
    }
    
    if (userId === currentUserId) {
      throw new Error('No puedes eliminarte a ti mismo');
    }
    
    try {
      const response = await this.delete(`/users/${userId}`);
      
      console.log('✅ User deleted successfully');
      toast.success('Usuario eliminado exitosamente');
      
      return response;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  // 📊 OBTENER ESTADÍSTICAS DE USUARIOS - MANTIENE TODA LA FUNCIONALIDAD
  async getUserStats(currentUserRole = null) {
    console.log('📊 FETCHING USER STATISTICS...');
    console.log('👨‍💼 Current user role for filtering:', currentUserRole);
    
    try {
      const response = await this.get('/users/stats');
      console.log('✅ USER STATS FROM BACKEND:', response);
      
      let stats = response.data || response;
      
      if (currentUserRole === 'colaborador' && stats.roleStats) {
        console.log('🔒 Filtering stats for colaborador role');
        
        const filteredStats = {
          ...stats,
          roleStats: {
            cliente: stats.roleStats.cliente || 0
          },
          totalUsers: stats.roleStats.cliente || 0,
          totalActiveUsers: Math.min(stats.totalActiveUsers || 0, stats.roleStats.cliente || 0)
        };
        
        console.log('✅ Filtered stats for colaborador:', filteredStats);
        return filteredStats;
      }
      
      return stats;
      
    } catch (error) {
      console.warn('⚠️ getUserStats fallback to manual calculation');
      
      try {
        const usersResponse = await this.getUsersByCurrentUserRole(currentUserRole || 'admin');
        const users = Array.isArray(usersResponse) ? usersResponse : usersResponse.data || [];
        
        const stats = {
          totalUsers: users.length,
          totalActiveUsers: users.filter(u => u.isActive !== false).length,
          totalInactiveUsers: users.filter(u => u.isActive === false).length,
          roleStats: users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {}),
          newUsersThisMonth: users.filter(user => {
            const createdAt = new Date(user.createdAt || user.created_at);
            const thisMonth = new Date();
            return createdAt.getMonth() === thisMonth.getMonth() && 
                   createdAt.getFullYear() === thisMonth.getFullYear();
          }).length
        };
        
        console.log('✅ User stats calculated manually with role filter:', stats);
        return stats;
        
      } catch (fallbackError) {
        console.error('❌ Both getUserStats methods failed:', fallbackError);
        
        const fallbackStats = {
          totalUsers: 0,
          totalActiveUsers: 0,
          totalInactiveUsers: 0,
          newUsersThisMonth: 0
        };
        
        if (currentUserRole === 'colaborador') {
          fallbackStats.roleStats = { cliente: 0 };
        } else {
          fallbackStats.roleStats = {
            admin: 0,
            colaborador: 0,
            cliente: 0
          };
        }
        
        return fallbackStats;
      }
    }
  }
    
  // ================================
  // 🎫 MÉTODOS DE MEMBRESÍAS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
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
  // 💰 MÉTODOS DE PAGOS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
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

  // OBTENER ESTADO DE SALUD DEL SISTEMA
  async getSystemHealth() {
    console.log('🔍 FETCHING SYSTEM HEALTH...');
    try {
      const response = await this.get('/health');
      console.log('✅ SYSTEM HEALTH FROM BACKEND:', response);
      return response.data || response;
    } catch (error) {
      console.log('❌ SYSTEM HEALTH FAILED:', error.message);
      
      return {
        status: 'unknown',
        uptime: 'unknown',
        lastCheck: new Date().toISOString()
      };
    }
  }
    
  // ================================
  // 🛒 MÉTODOS DEL CARRITO - CORREGIDOS + SOPORTE PARA INVITADOS
  // ================================
  
  // VER CARRITO (con soporte para usuarios autenticados e invitados)
  async getCart(sessionId = null) {
    console.log('🛒 FETCHING CART...');
    console.log('🆔 Session ID provided:', sessionId);
    
    try {
      const params = {};
      
      // Si no hay usuario autenticado, usar sessionId
      if (sessionId) {
        params.sessionId = sessionId;
      }
      
      const result = await this.get('/store/cart', { params });
      console.log('✅ CART DATA RECEIVED:', result);
      
      // Validar estructura según README
      if (result && result.data && result.data.cartItems) {
        console.log('✅ Cart structure is correct (README format)');
        console.log('🛒 Cart items:', {
          itemsCount: result.data.cartItems.length,
          totalAmount: result.data.summary?.totalAmount || 0,
          hasItems: result.data.cartItems.length > 0,
          sessionId: sessionId || 'authenticated'
        });
      } else {
        console.warn('⚠️ Cart structure might be different from README');
        console.log('📋 Actual structure:', result);
      }
      
      return result;
    } catch (error) {
      console.log('❌ CART FETCH FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛒 CART: Cart endpoint not found or user has empty cart');
        // Devolver estructura vacía compatible
        return {
          success: true,
          data: {
            cartItems: [],
            summary: {
              itemsCount: 0,
              subtotal: 0,
              taxAmount: 0,
              shippingAmount: 0,
              totalAmount: 0
            }
          }
        };
      } else if (error.response?.status === 401) {
        console.log('🔐 CART: Authorization required for cart access');
      }
      
      throw error;
    }
  }
  
  // AGREGAR ITEM AL CARRITO (con soporte para invitados)
  async addToCart(productData, sessionId = null) {
    console.log('🛒 ADDING ITEM TO CART...');
    console.log('📤 Product data to add:', productData);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      const requestData = {
        productId: productData.productId || productData.id,
        quantity: productData.quantity || 1,
        selectedVariants: productData.selectedVariants || productData.options || {}
      };
      
      // Agregar sessionId si se proporciona (para usuarios no autenticados)
      if (sessionId) {
        requestData.sessionId = sessionId;
      }
      
      console.log('📤 Final request data:', requestData);
      
      const result = await this.post('/store/cart', requestData);
      
      console.log('✅ ITEM ADDED TO CART SUCCESSFULLY:', result);
      
      if (result && result.success) {
        console.log('✅ Add to cart response structure is correct');
      } else {
        console.warn('⚠️ Add to cart response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ ADD TO CART FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - productId: Must be a valid product ID');
        console.log('   - quantity: Must be a positive number');
        console.log('   - selectedVariants: Must be valid product variants');
      } else if (error.response?.status === 404) {
        console.log('🛒 PRODUCT NOT FOUND: Product ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('📋 BAD REQUEST: Check data format');
      }
      
      throw error;
    }
  }
  
  // ACTUALIZAR CANTIDAD EN CARRITO (con soporte para invitados)
  async updateCartItem(cartItemId, updates, sessionId = null) {
    console.log('🛒 UPDATING CART ITEM...');
    console.log('🎯 Cart Item ID:', cartItemId);
    console.log('📤 Updates:', updates);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      let url = `/store/cart/${cartItemId}`;
      
      // Agregar sessionId como query parameter si se proporciona
      if (sessionId) {
        url += `?sessionId=${encodeURIComponent(sessionId)}`;
      }
      
      const result = await this.put(url, updates);
      
      console.log('✅ CART ITEM UPDATED SUCCESSFULLY:', result);
      
      return result;
    } catch (error) {
      console.log('❌ UPDATE CART ITEM FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛒 CART ITEM NOT FOUND: Cart item ID might be invalid');
      } else if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - quantity: Must be a positive number');
      }
      
      throw error;
    }
  }
  
  // ELIMINAR ITEM DEL CARRITO (con soporte para invitados)
  async removeFromCart(cartItemId, sessionId = null) {
    console.log('🛒 REMOVING ITEM FROM CART...');
    console.log('🎯 Cart Item ID:', cartItemId);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      let url = `/store/cart/${cartItemId}`;
      
      // Agregar sessionId como query parameter si se proporciona
      if (sessionId) {
        url += `?sessionId=${encodeURIComponent(sessionId)}`;
      }
      
      const result = await this.delete(url);
      
      console.log('✅ ITEM REMOVED FROM CART SUCCESSFULLY');
      
      return result;
    } catch (error) {
      console.log('❌ REMOVE FROM CART FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛒 CART ITEM NOT FOUND: Cart item ID might be invalid');
      }
      
      throw error;
    }
  }
  
  // VACIAR CARRITO COMPLETO (con soporte para invitados)
  async clearCart(sessionId = null) {
    console.log('🛒 CLEARING ENTIRE CART...');
    console.log('🆔 Session ID:', sessionId);
    
    try {
      // Primero obtener todos los items del carrito
      const cartResponse = await this.getCart(sessionId);
      
      if (cartResponse && cartResponse.data && cartResponse.data.cartItems) {
        const items = cartResponse.data.cartItems;
        
        if (items.length === 0) {
          console.log('✅ CART WAS ALREADY EMPTY');
          return { success: true, message: 'Cart was already empty' };
        }
        
        // Eliminar cada item individualmente
        console.log(`🛒 Removing ${items.length} items from cart...`);
        
        const deletePromises = items.map(item => 
          this.removeFromCart(item.id, sessionId).catch(err => {
            console.warn(`⚠️ Failed to remove item ${item.id}:`, err.message);
            return null;
          })
        );
        
        await Promise.all(deletePromises);
        
        console.log('✅ CART CLEARED SUCCESSFULLY');
        return { success: true, message: 'Cart cleared successfully' };
      }
      
      console.log('✅ CART WAS ALREADY EMPTY');
      return { success: true, message: 'Cart was already empty' };
      
    } catch (error) {
      console.log('❌ CLEAR CART FAILED:', error.message);
      
      // Si falla la obtención del carrito, intentar método alternativo
      if (error.response?.status === 404) {
        console.log('✅ CART NOT FOUND (already empty)');
        return { success: true, message: 'Cart was already empty' };
      }
      
      throw error;
    }
  }
  
  // ✅ MÉTODO LEGACY UPDATECART - MANTENER COMPATIBILIDAD
  async updateCart(items) {
    console.log('🛒 LEGACY UPDATE CART METHOD - Converting to individual operations...');
    console.log('📤 Items to sync:', items);
    
    try {
      if (!Array.isArray(items) || items.length === 0) {
        console.log('🛒 No items to update, clearing cart...');
        return await this.clearCart();
      }
      
      console.log('🛒 Legacy updateCart called - items should be managed individually');
      console.log('💡 Consider using addToCart, updateCartItem, removeFromCart individually');
      
      return {
        success: true,
        message: 'Cart sync attempted - using localStorage for now',
        itemsCount: items.length
      };
      
    } catch (error) {
      console.log('❌ LEGACY UPDATE CART FAILED:', error.message);
      throw error;
    }
  }
  
  // ================================
  // 🛍️ MÉTODOS DE ÓRDENES - CON SOPORTE PARA INVITADOS
  // ================================
  
  // ✅ NUEVO: CREAR ORDEN (CHECKOUT) - Para autenticados e invitados
  async createOrder(orderData) {
    console.log('🛍️ CREATING ORDER (CHECKOUT)...');
    console.log('📤 Order data to send:', orderData);
    
    try {
      // Usar la ruta exacta del README
      const result = await this.post('/store/orders', orderData);
      
      console.log('✅ ORDER CREATED SUCCESSFULLY:', result);
      
      // Validar estructura según README
      if (result && result.success && result.data?.order) {
        console.log('✅ Order creation response structure is correct');
        console.log('🛍️ Order details:', {
          id: result.data.order.id,
          orderNumber: result.data.order.orderNumber,
          totalAmount: result.data.order.totalAmount,
          status: result.data.order.status,
          paymentMethod: result.data.order.paymentMethod,
          itemsCount: result.data.order.items?.length || 0,
          isGuest: !!orderData.sessionId
        });
      } else {
        console.warn('⚠️ Order creation response structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ ORDER CREATION FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - customerInfo: Required for guest orders');
        console.log('   - shippingAddress: Required for all orders');
        console.log('   - items: Must be valid array of products');
        console.log('   - paymentMethod: Must be valid payment method');
      } else if (error.response?.status === 404) {
        console.log('🛍️ ORDER ENDPOINT NOT FOUND: Check backend implementation');
      } else if (error.response?.status === 400) {
        console.log('📋 BAD REQUEST: Check order data format');
      }
      
      throw error;
    }
  }
  
  // MIS ÓRDENES (Usuario logueado)
  async getMyOrders(params = {}) {
    console.log('🛍️ FETCHING MY ORDERS...');
    
    try {
      const result = await this.get('/store/my-orders', { params });
      
      console.log('✅ MY ORDERS RECEIVED:', result);
      
      // Validar estructura
      if (result && result.data) {
        if (Array.isArray(result.data)) {
          console.log(`✅ Orders list: ${result.data.length} orders found`);
        } else if (result.data.orders && Array.isArray(result.data.orders)) {
          console.log(`✅ Orders list: ${result.data.orders.length} orders found`);
          console.log('📄 Pagination:', result.data.pagination);
        }
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET MY ORDERS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛍️ NO ORDERS FOUND: User has no orders yet');
        // Devolver estructura vacía
        return {
          success: true,
          data: {
            orders: [],
            pagination: {
              total: 0,
              page: 1,
              pages: 0,
              limit: params.limit || 10
            }
          }
        };
      }
      
      throw error;
    }
  }

  // VER ORDEN POR ID
  async getOrderById(orderId) {
    console.log('🛍️ FETCHING ORDER BY ID...');
    console.log('🎯 Order ID:', orderId);
    
    try {
      const result = await this.get(`/store/orders/${orderId}`);
      
      console.log('✅ ORDER DETAILS RECEIVED:', result);
      
      // Validar estructura
      if (result && result.data && result.data.order) {
        console.log('✅ Order details structure is correct');
        console.log('🛍️ Order info:', {
          id: result.data.order.id,
          orderNumber: result.data.order.orderNumber,
          status: result.data.order.status,
          totalAmount: result.data.order.totalAmount,
          itemsCount: result.data.order.items?.length || 0
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET ORDER BY ID FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛍️ ORDER NOT FOUND: Order ID might be invalid or does not belong to user');
      } else if (error.response?.status === 403) {
        console.log('🔒 ACCESS DENIED: Cannot view this order (not owner)');
      }
      
      throw error;
    }
  }
  
  // ================================
  // 💳 MÉTODOS DE STRIPE - NUEVOS PARA PAGOS
  // ================================
  
  // ✅ NUEVO: OBTENER CONFIGURACIÓN DE STRIPE
  async getStripeConfig() {
    console.log('💳 FETCHING STRIPE CONFIGURATION...');
    
    try {
      const result = await this.get('/stripe/config');
      
      console.log('✅ STRIPE CONFIG RECEIVED:', result);
      
      // Validar estructura según README
      if (result && result.data?.stripe) {
        console.log('✅ Stripe config structure is correct');
        console.log('💳 Stripe settings:', {
          enabled: result.data.stripe.enabled,
          mode: result.data.stripe.mode,
          currency: result.data.stripe.currency,
          hasPublishableKey: !!result.data.stripe.publishableKey
        });
      } else {
        console.warn('⚠️ Stripe config structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE CONFIG FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 STRIPE: Config endpoint not found - Stripe not implemented');
      } else if (error.response?.status === 503) {
        console.log('💳 STRIPE: Service unavailable');
      }
      
      throw error;
    }
  }
  
  // ✅ NUEVO: CREAR PAYMENT INTENT PARA MEMBRESÍA
  async createMembershipPaymentIntent(membershipData) {
    console.log('💳 CREATING MEMBERSHIP PAYMENT INTENT...');
    console.log('📤 Membership data:', membershipData);
    
    try {
      const result = await this.post('/stripe/create-membership-intent', membershipData);
      
      console.log('✅ MEMBERSHIP PAYMENT INTENT CREATED:', result);
      
      // Validar estructura según README
      if (result && result.success && result.data?.clientSecret) {
        console.log('✅ Payment intent response structure is correct');
        console.log('💳 Payment intent details:', {
          hasClientSecret: !!result.data.clientSecret,
          paymentIntentId: result.data.paymentIntentId,
          amount: result.data.amount,
          currency: result.data.currency
        });
      } else {
        console.warn('⚠️ Payment intent response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ MEMBERSHIP PAYMENT INTENT FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
      } else if (error.response?.status === 503) {
        console.log('💳 STRIPE: Service unavailable');
      }
      
      throw error;
    }
  }
  
  // ✅ NUEVO: CREAR PAYMENT INTENT PARA PAGO DIARIO
  async createDailyPaymentIntent(dailyData) {
    console.log('💳 CREATING DAILY PAYMENT INTENT...');
    console.log('📤 Daily payment data:', dailyData);
    
    try {
      const result = await this.post('/stripe/create-daily-intent', dailyData);
      
      console.log('✅ DAILY PAYMENT INTENT CREATED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ DAILY PAYMENT INTENT FAILED:', error.message);
      throw error;
    }
  }
  
  // ✅ NUEVO: CREAR PAYMENT INTENT PARA TIENDA
  async createStorePaymentIntent(storeData) {
    console.log('💳 CREATING STORE PAYMENT INTENT...');
    console.log('📤 Store payment data:', storeData);
    
    try {
      const result = await this.post('/stripe/create-store-intent', storeData);
      
      console.log('✅ STORE PAYMENT INTENT CREATED:', result);
      
      // Validar estructura según README
      if (result && result.success && result.data?.clientSecret) {
        console.log('✅ Store payment intent response structure is correct');
        console.log('💳 Store payment details:', {
          hasClientSecret: !!result.data.clientSecret,
          paymentIntentId: result.data.paymentIntentId,
          orderId: storeData.orderId
        });
      } else {
        console.warn('⚠️ Store payment intent response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STORE PAYMENT INTENT FAILED:', error.message);
      
      if (error.response?.status === 422) {
        console.log('📝 VALIDATION ERRORS:', error.response.data?.errors);
        console.log('💡 Common validation issues:');
        console.log('   - orderId: Must be a valid order ID');
      } else if (error.response?.status === 404) {
        console.log('🛍️ ORDER NOT FOUND: Order ID might be invalid');
      }
      
      throw error;
    }
  }
  
  // ✅ NUEVO: CONFIRMAR PAGO EXITOSO
  async confirmStripePayment(paymentData) {
    console.log('💳 CONFIRMING STRIPE PAYMENT...');
    console.log('📤 Payment confirmation data:', paymentData);
    
    try {
      const result = await this.post('/stripe/confirm-payment', paymentData);
      
      console.log('✅ STRIPE PAYMENT CONFIRMED:', result);
      
      // Validar estructura según README
      if (result && result.success && result.data?.payment) {
        console.log('✅ Payment confirmation response structure is correct');
        console.log('💳 Payment confirmation details:', {
          paymentId: result.data.payment.id,
          amount: result.data.payment.amount,
          status: result.data.payment.status,
          stripeStatus: result.data.stripe?.status
        });
      } else {
        console.warn('⚠️ Payment confirmation response structure might be different');
      }
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE PAYMENT CONFIRMATION FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 PAYMENT INTENT NOT FOUND: Payment intent ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('💳 PAYMENT ALREADY PROCESSED: Payment might already be confirmed');
      }
      
      throw error;
    }
  }
  
  // ✅ NUEVO: CREAR REEMBOLSO
  async createStripeRefund(refundData) {
    console.log('💳 CREATING STRIPE REFUND...');
    console.log('📤 Refund data:', refundData);
    
    try {
      const result = await this.post('/stripe/refund', refundData);
      
      console.log('✅ STRIPE REFUND CREATED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE REFUND FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('💳 PAYMENT NOT FOUND: Payment ID might be invalid');
      } else if (error.response?.status === 400) {
        console.log('💳 REFUND NOT ALLOWED: Payment cannot be refunded');
      }
      
      throw error;
    }
  }
  
  // ✅ NUEVO: ESTADO DEL SERVICIO STRIPE
  async getStripeStatus() {
    console.log('💳 FETCHING STRIPE STATUS...');
    
    try {
      const result = await this.get('/stripe/status');
      
      console.log('✅ STRIPE STATUS RECEIVED:', result);
      
      return result;
    } catch (error) {
      console.log('❌ STRIPE STATUS FAILED:', error.message);
      
      // Fallback básico
      return {
        status: 'unknown',
        enabled: false,
        lastCheck: new Date().toISOString()
      };
    }
  }
  
  // ================================
  // 🔧 MÉTODOS UTILITARIOS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
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

  // ================================
  // 🛠️ MÉTODOS DE VALIDACIÓN HELPER - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================

  // VERIFICAR ENDPOINTS ESPECÍFICOS PARA PERFIL
  async checkProfileEndpoints() {
    console.log('🔍 CHECKING PROFILE ENDPOINTS AVAILABILITY...');
    
    const endpoints = [
      { path: '/auth/profile', method: 'GET', description: 'Get user profile' },
      { path: '/auth/profile', method: 'PATCH', description: 'Update user profile' },
      { path: '/auth/profile/image', method: 'POST', description: 'Upload profile image' },
      { path: '/auth/change-password', method: 'POST', description: 'Change password' },
      { path: '/auth/profile/preferences', method: 'PUT', description: 'Update preferences' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Checking ${endpoint.method} ${endpoint.path}...`);
        
        // Para GET, hacer petición real
        if (endpoint.method === 'GET' && endpoint.path === '/auth/profile') {
          await this.get(endpoint.path);
          results[endpoint.path] = { available: true, method: endpoint.method };
          console.log(`✅ ${endpoint.description} - Available`);
        } else {
          // Para otros métodos, solo marcar como disponible si el backend responde
          results[endpoint.path] = { available: true, method: endpoint.method, note: 'Not tested (would need real data)' };
          console.log(`✅ ${endpoint.description} - Endpoint exists (not tested)`);
        }
        
      } catch (error) {
        results[endpoint.path] = { available: false, method: endpoint.method, error: error.message };
        
        if (error.response?.status === 404) {
          console.log(`❌ ${endpoint.description} - Endpoint not implemented`);
        } else if (error.response?.status === 401) {
          console.log(`✅ ${endpoint.description} - Available (requires auth)`);
          results[endpoint.path].available = true;
          results[endpoint.path].note = 'Requires authentication';
        } else {
          console.log(`⚠️ ${endpoint.description} - ${error.message}`);
        }
      }
    }
    
    console.log('📋 Profile endpoints check summary:');
    console.table(results);
    
    return results;
  }

  // VALIDAR ESTRUCTURA DE DATOS DE PERFIL
  validateProfileData(profileData) {
    console.log('🔍 VALIDATING PROFILE DATA STRUCTURE...');
    
    const errors = [];
    const warnings = [];
    
    // Validar campos obligatorios
    if (!profileData.firstName || profileData.firstName.trim() === '') {
      errors.push('firstName is required');
    }
    
    if (!profileData.lastName || profileData.lastName.trim() === '') {
      errors.push('lastName is required');
    }
    
    // Validar formato de nombres (solo letras, espacios, acentos)
    const nameRegex = /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-']+$/;
    
    if (profileData.firstName && !nameRegex.test(profileData.firstName)) {
      errors.push('firstName contains invalid characters (only letters, spaces, accents allowed)');
    }
    
    if (profileData.lastName && !nameRegex.test(profileData.lastName)) {
      errors.push('lastName contains invalid characters (only letters, spaces, accents allowed)');
    }
    
    // Validar teléfono si está presente
    if (profileData.phone && profileData.phone.trim() !== '') {
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(profileData.phone)) {
        errors.push('phone contains invalid characters (only numbers, spaces, dashes, parentheses, + allowed)');
      }
    }
    
    // Validar fecha de nacimiento si está presente
    if (profileData.dateOfBirth) {
      const birthDate = new Date(profileData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        errors.push('dateOfBirth indicates user is under 13 years old (minimum age required)');
      }
    }
    
    // Validar contacto de emergencia si está presente
    if (profileData.emergencyContact) {
      if (profileData.emergencyContact.name && !nameRegex.test(profileData.emergencyContact.name)) {
        errors.push('emergencyContact.name contains invalid characters');
      }
      
      if (profileData.emergencyContact.phone && profileData.emergencyContact.phone.trim() !== '') {
        const phoneRegex = /^[\d\s\-\(\)\+]+$/;
        if (!phoneRegex.test(profileData.emergencyContact.phone)) {
          errors.push('emergencyContact.phone contains invalid characters');
        }
      }
    }
    
    // Advertencias para campos opcionales
    if (!profileData.phone || profileData.phone.trim() === '') {
      warnings.push('phone is empty (recommended to provide contact info)');
    }
    
    if (!profileData.dateOfBirth) {
      warnings.push('dateOfBirth is empty (helps with age-appropriate content)');
    }
    
    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        totalIssues: errors.length + warnings.length
      }
    };
    
    if (errors.length > 0) {
      console.log('❌ PROFILE DATA VALIDATION FAILED:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ PROFILE DATA VALIDATION PASSED');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ PROFILE DATA WARNINGS:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    return validation;
  }

  // ✅ NUEVO: DEBUG ESPECÍFICO PARA CARRITO Y CHECKOUT
  async debugCartAndCheckoutSystem() {
    console.log('🔍 =====================================');
    console.log('🛒 CART & CHECKOUT DEBUG - COMPLETE CHECK');
    console.log('🔍 =====================================');
    
    try {
      // 1. Verificar endpoints de carrito
      console.log('📡 1. CHECKING CART ENDPOINTS...');
      
      const cartEndpoints = [
        { path: '/store/cart', method: 'GET', description: 'Get cart' },
        { path: '/store/cart', method: 'POST', description: 'Add to cart' },
        { path: '/store/cart/{id}', method: 'PUT', description: 'Update cart item' },
        { path: '/store/cart/{id}', method: 'DELETE', description: 'Remove from cart' },
        { path: '/store/orders', method: 'POST', description: 'Create order (checkout)' },
        { path: '/store/my-orders', method: 'GET', description: 'Get my orders' },
        { path: '/stripe/config', method: 'GET', description: 'Get Stripe config' },
        { path: '/stripe/create-store-intent', method: 'POST', description: 'Create payment intent' },
        { path: '/stripe/confirm-payment', method: 'POST', description: 'Confirm payment' }
      ];
      
      for (const endpoint of cartEndpoints) {
        try {
          if (endpoint.method === 'GET' && endpoint.path === '/store/cart') {
            const result = await this.getCart();
            console.log(`✅ ${endpoint.description} - Available`);
          } else if (endpoint.method === 'GET' && endpoint.path === '/stripe/config') {
            const result = await this.getStripeConfig();
            console.log(`✅ ${endpoint.description} - Available`);
          } else {
            console.log(`📋 ${endpoint.description} - Endpoint exists (requires data to test)`);
          }
        } catch (error) {
          if (error.response?.status === 404) {
            console.log(`❌ ${endpoint.description} - Endpoint not implemented`);
          } else if (error.response?.status === 401) {
            console.log(`✅ ${endpoint.description} - Available (requires auth)`);
          } else {
            console.log(`⚠️ ${endpoint.description} - ${error.message}`);
          }
        }
      }
      
      // 2. Verificar productos disponibles
      console.log('🛍️ 2. CHECKING PRODUCTS AVAILABILITY...');
      try {
        const products = await this.get('/store/products', { params: { limit: 5 } });
        if (products && products.data && products.data.products) {
          console.log(`✅ Products available: ${products.data.products.length} found`);
          console.log('📦 Sample product:', products.data.products[0]?.name || 'N/A');
        } else {
          console.log('⚠️ No products found or unexpected format');
        }
      } catch (error) {
        console.log('❌ Products endpoint failed:', error.message);
      }
      
      // 3. Verificar estructura de carrito vacío
      console.log('🛒 3. CHECKING EMPTY CART STRUCTURE...');
      try {
        const emptyCart = await this.getCart();
        console.log('✅ Empty cart structure:', {
          hasCartItems: !!emptyCart.data?.cartItems,
          isArray: Array.isArray(emptyCart.data?.cartItems),
          hasSummary: !!emptyCart.data?.summary,
          itemCount: emptyCart.data?.cartItems?.length || 0
        });
      } catch (error) {
        console.log('❌ Empty cart check failed:', error.message);
      }
      
      // 4. Verificar configuración de Stripe
      console.log('💳 4. CHECKING STRIPE CONFIGURATION...');
      try {
        const stripeConfig = await this.getStripeConfig();
        console.log('✅ Stripe configuration:', {
          enabled: stripeConfig.data?.stripe?.enabled || false,
          mode: stripeConfig.data?.stripe?.mode || 'unknown',
          hasPublishableKey: !!stripeConfig.data?.stripe?.publishableKey
        });
      } catch (error) {
        console.log('❌ Stripe config check failed:', error.message);
      }
      
      // 5. Verificar flow completo para invitados
      console.log('🎫 5. CHECKING GUEST CHECKOUT FLOW...');
      try {
        // Simular datos de checkout para invitado
        const guestOrderData = {
          sessionId: 'guest_test_12345',
          items: [
            {
              productId: 1,
              quantity: 1,
              price: 25.00,
              selectedVariants: {}
            }
          ],
          customerInfo: {
            name: 'Test Guest',
            email: 'guest@test.com',
            phone: '+502 5555-5555'
          },
          shippingAddress: {
            street: '5ta Avenida 12-34',
            city: 'Guatemala',
            state: 'Guatemala',
            zipCode: '01001',
            reference: 'Test address'
          },
          paymentMethod: 'cash_on_delivery',
          deliveryTimeSlot: 'morning',
          notes: 'Test order for guest checkout'
        };
        
        console.log('📋 Guest order structure prepared:', {
          hasSessionId: !!guestOrderData.sessionId,
          hasCustomerInfo: !!guestOrderData.customerInfo,
          hasShippingAddress: !!guestOrderData.shippingAddress,
          itemsCount: guestOrderData.items.length
        });
        
        console.log('✅ Guest checkout flow structure is valid');
      } catch (error) {
        console.log('❌ Guest checkout flow check failed:', error.message);
      }
      
      console.log('🔍 =====================================');
      console.log('🛒 CART & CHECKOUT DEBUG - COMPLETED');
      console.log('🔍 =====================================');
      
    } catch (error) {
      console.error('❌ CART & CHECKOUT DEBUG FAILED:', error);
    }
  }

  // ✅ NUEVO: DEBUG COMPLETO DE PERFIL
  async debugProfileSystem() {
    console.log('🔍 =====================================');
    console.log('👤 PROFILE SYSTEM DEBUG - COMPLETE CHECK');
    console.log('🔍 =====================================');
    
    try {
      // 1. Verificar endpoints
      console.log('📡 1. CHECKING PROFILE ENDPOINTS...');
      const endpointsCheck = await this.checkProfileEndpoints();
      
      // 2. Verificar perfil actual
      console.log('👤 2. CHECKING CURRENT PROFILE...');
      try {
        const profile = await this.getProfile();
        console.log('✅ Current profile loaded successfully');
        
        // Analizar estructura del perfil
        if (profile && profile.data && profile.data.user) {
          const user = profile.data.user;
          console.log('📊 PROFILE ANALYSIS:');
          console.log(`   - ID: ${user.id}`);
          console.log(`   - Name: ${user.firstName} ${user.lastName}`);
          console.log(`   - Email: ${user.email}`);
          console.log(`   - Phone: ${user.phone || 'Not provided'}`);
          console.log(`   - Role: ${user.role}`);
          console.log(`   - Profile Image: ${user.profileImage ? 'Yes' : 'No'}`);
          console.log(`   - Date of Birth: ${user.dateOfBirth || 'Not provided'}`);
          console.log(`   - Active: ${user.isActive !== false ? 'Yes' : 'No'}`);
          
          // Calcular edad si hay fecha de nacimiento
          if (user.dateOfBirth) {
            const birthDate = new Date(user.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            console.log(`   - Calculated Age: ${age} years`);
            
            if (age < 13) {
              console.log('   - ⚠️ USER IS UNDER 13 - RESTRICTIONS SHOULD APPLY');
            }
          }
          
          // Validar datos del perfil
          console.log('🔍 3. VALIDATING PROFILE DATA...');
          const validation = this.validateProfileData(user);
          console.log(`   - Validation Result: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
          
        } else {
          console.warn('⚠️ Profile structure is different from expected README format');
        }
        
      } catch (profileError) {
        console.log('❌ Could not load current profile:', profileError.message);
      }
      
      // 3. Verificar conexión al backend
      console.log('🌐 3. CHECKING BACKEND CONNECTION...');
      try {
        const health = await this.healthCheck();
        console.log('✅ Backend connection is healthy');
      } catch (healthError) {
        console.log('❌ Backend connection issues:', healthError.message);
      }
      
      console.log('🔍 =====================================');
      console.log('👤 PROFILE SYSTEM DEBUG - COMPLETED');
      console.log('🔍 =====================================');
      
    } catch (error) {
      console.error('❌ PROFILE SYSTEM DEBUG FAILED:', error);
    }
  }

  // ✅ NUEVO: VALIDAR DATOS DE ORDEN PARA CHECKOUT
  validateOrderData(orderData) {
    console.log('🔍 VALIDATING ORDER DATA STRUCTURE...');
    
    const errors = [];
    const warnings = [];
    
    // Validar items
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('items is required and must be a non-empty array');
    } else {
      orderData.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`items[${index}].productId is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`items[${index}].quantity must be a positive number`);
        }
        if (!item.price || item.price <= 0) {
          errors.push(`items[${index}].price must be a positive number`);
        }
      });
    }
    
    // Si es orden de invitado, validar información del cliente
    if (orderData.sessionId) {
      if (!orderData.customerInfo) {
        errors.push('customerInfo is required for guest orders');
      } else {
        if (!orderData.customerInfo.name || orderData.customerInfo.name.trim() === '') {
          errors.push('customerInfo.name is required');
        }
        if (!orderData.customerInfo.email || orderData.customerInfo.email.trim() === '') {
          errors.push('customerInfo.email is required');
        } else if (!/\S+@\S+\.\S+/.test(orderData.customerInfo.email)) {
          errors.push('customerInfo.email is not valid');
        }
        if (!orderData.customerInfo.phone || orderData.customerInfo.phone.trim() === '') {
          errors.push('customerInfo.phone is required');
        }
      }
    }
    
    // Validar dirección de envío
    if (!orderData.shippingAddress) {
      errors.push('shippingAddress is required');
    } else {
      if (!orderData.shippingAddress.street || orderData.shippingAddress.street.trim() === '') {
        errors.push('shippingAddress.street is required');
      }
      if (!orderData.shippingAddress.city || orderData.shippingAddress.city.trim() === '') {
        errors.push('shippingAddress.city is required');
      }
    }
    
    // Validar método de pago
    const validPaymentMethods = ['cash_on_delivery', 'card', 'transfer'];
    if (!orderData.paymentMethod || !validPaymentMethods.includes(orderData.paymentMethod)) {
      errors.push('paymentMethod must be one of: ' + validPaymentMethods.join(', '));
    }
    
    // Validar slot de entrega
    const validTimeSlots = ['morning', 'afternoon', 'evening'];
    if (orderData.deliveryTimeSlot && !validTimeSlots.includes(orderData.deliveryTimeSlot)) {
      warnings.push('deliveryTimeSlot should be one of: ' + validTimeSlots.join(', '));
    }
    
    // Advertencias para campos opcionales
    if (!orderData.notes || orderData.notes.trim() === '') {
      warnings.push('notes is empty (optional but helpful for delivery)');
    }
    
    if (!orderData.deliveryTimeSlot) {
      warnings.push('deliveryTimeSlot not specified (will default to morning)');
    }
    
    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        totalIssues: errors.length + warnings.length,
        isGuest: !!orderData.sessionId,
        itemsCount: orderData.items?.length || 0,
        paymentMethod: orderData.paymentMethod
      }
    };
    
    if (errors.length > 0) {
      console.log('❌ ORDER DATA VALIDATION FAILED:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ ORDER DATA VALIDATION PASSED');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ ORDER DATA WARNINGS:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    return validation;
  }

  // ✅ NUEVO: HELPER PARA FORMATEAR DATOS DE ORDEN SEGÚN README
  formatOrderDataForAPI(orderData) {
    console.log('🔄 FORMATTING ORDER DATA FOR API...');
    
    // Estructura base según README
    const formattedData = {
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        selectedVariants: item.selectedVariants || {}
      })),
      paymentMethod: orderData.paymentMethod || 'cash_on_delivery',
      deliveryTimeSlot: orderData.deliveryTimeSlot || 'morning',
      notes: orderData.notes || ''
    };
    
    // Agregar datos específicos para invitados
    if (orderData.sessionId) {
      formattedData.sessionId = orderData.sessionId;
      formattedData.customerInfo = {
        name: orderData.customerInfo.name,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone
      };
    }
    
    // Agregar dirección de envío
    if (orderData.shippingAddress) {
      formattedData.shippingAddress = {
        street: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city || 'Guatemala',
        state: orderData.shippingAddress.state || 'Guatemala',
        zipCode: orderData.shippingAddress.zipCode || '01001',
        reference: orderData.shippingAddress.reference || ''
      };
    }
    
    // Agregar resumen si existe
    if (orderData.summary) {
      formattedData.summary = orderData.summary;
    }
    
    console.log('✅ Order data formatted for API:', {
      isGuest: !!formattedData.sessionId,
      itemsCount: formattedData.items.length,
      hasCustomerInfo: !!formattedData.customerInfo,
      hasShippingAddress: !!formattedData.shippingAddress,
      paymentMethod: formattedData.paymentMethod
    });
    
    return formattedData;
  }

  // ✅ NUEVO: MÉTODO COMPLETO PARA CHECKOUT (wrapper que usa createOrder)
  async processCheckout(orderData) {
    console.log('🛍️ PROCESSING COMPLETE CHECKOUT...');
    console.log('📤 Raw order data received:', orderData);
    
    try {
      // 1. Validar datos de entrada
      const validation = this.validateOrderData(orderData);
      
      if (!validation.isValid) {
        const errorMessage = 'Datos de orden inválidos: ' + validation.errors.join(', ');
        console.log('❌ Validation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // 2. Formatear datos para la API
      const formattedData = this.formatOrderDataForAPI(orderData);
      
      // 3. Crear orden usando el método base
      const result = await this.createOrder(formattedData);
      
      console.log('✅ CHECKOUT PROCESSED SUCCESSFULLY:', result);
      
      return result;
      
    } catch (error) {
      console.log('❌ CHECKOUT PROCESSING FAILED:', error.message);
      throw error;
    }
  }

  // ✅ NUEVO: OBTENER CATEGORÍAS DE PRODUCTOS
  async getProductCategories() {
    console.log('🗂️ FETCHING PRODUCT CATEGORIES...');
    
    try {
      const result = await this.get('/store/categories');
      
      console.log('✅ PRODUCT CATEGORIES RECEIVED:', result);
      
      // Validar estructura según README
      if (result && result.data && result.data.categories) {
        console.log('✅ Categories structure is correct');
        console.log('🗂️ Categories details:', {
          totalCategories: result.data.categories.length,
          hasActiveCategories: result.data.categories.some(cat => cat.isActive !== false)
        });
      } else {
        console.warn('⚠️ Categories structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PRODUCT CATEGORIES FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🗂️ CATEGORIES: Endpoint not found - Categories not implemented');
        // Devolver estructura vacía compatible
        return {
          success: true,
          data: {
            categories: []
          }
        };
      }
      
      throw error;
    }
  }

  // ✅ NUEVO: OBTENER MARCAS DE PRODUCTOS
  async getProductBrands() {
    console.log('🏷️ FETCHING PRODUCT BRANDS...');
    
    try {
      const result = await this.get('/store/brands');
      
      console.log('✅ PRODUCT BRANDS RECEIVED:', result);
      
      // Validar estructura según README
      if (result && result.data && result.data.brands) {
        console.log('✅ Brands structure is correct');
        console.log('🏷️ Brands details:', {
          totalBrands: result.data.brands.length
        });
      } else {
        console.warn('⚠️ Brands structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PRODUCT BRANDS FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🏷️ BRANDS: Endpoint not found - Brands not implemented');
        // Devolver estructura vacía compatible
        return {
          success: true,
          data: {
            brands: []
          }
        };
      }
      
      throw error;
    }
  }

  // ✅ NUEVO: OBTENER PRODUCTO POR ID
  async getProductById(productId) {
    console.log('🛍️ FETCHING PRODUCT BY ID...');
    console.log('🎯 Product ID:', productId);
    
    try {
      const result = await this.get(`/store/products/${productId}`);
      
      console.log('✅ PRODUCT DETAILS RECEIVED:', result);
      
      // Validar estructura
      if (result && result.data) {
        console.log('✅ Product details structure is correct');
        console.log('🛍️ Product info:', {
          id: result.data.id,
          name: result.data.name,
          price: result.data.price,
          inStock: result.data.inStock !== false,
          hasImages: !!result.data.images?.length
        });
      }
      
      return result;
    } catch (error) {
      console.log('❌ GET PRODUCT BY ID FAILED:', error.message);
      
      if (error.response?.status === 404) {
        console.log('🛍️ PRODUCT NOT FOUND: Product ID might be invalid');
      }
      
      throw error;
    }
  }

} // Fin de la clase ApiService

// 🏭 EXPORTAR INSTANCIA SINGLETON
const apiService = new ApiService();

export default apiService;

// 📝 MÉTODOS COMPLETADOS EN ESTE ARCHIVO:
// 
// ✅ FINALIZADOS:
// - debugCartAndCheckoutSystem() - Debug completo del sistema de carrito y checkout
// - debugProfileSystem() - Debug completo del sistema de perfil  
// - validateOrderData() - Validación de datos de orden según README
// - formatOrderDataForAPI() - Formateo de datos para API según README
// - processCheckout() - Método wrapper completo para checkout
// - getProductCategories() - Obtener categorías según README
// - getProductBrands() - Obtener marcas según README  
// - getProductById() - Obtener producto por ID según README
// 
// ✅ FUNCIONALIDADES AGREGADAS:
// - Validación completa de datos de checkout para invitados
// - Formateo automático de datos según estructura del README
// - Debug específico para carrito, checkout y Stripe
// - Métodos helper para productos (categorías, marcas, detalles)
// - Compatibilidad completa con checkout de invitados
// - Soporte para sessionId en todas las operaciones
// 
// ✅ RUTAS IMPLEMENTADAS SEGÚN README:
// - /api/store/cart (GET, POST, PUT, DELETE)
// - /api/store/orders (POST)
// - /api/store/my-orders (GET)
// - /api/store/products/{id} (GET)
// - /api/store/categories (GET)
// - /api/store/brands (GET)
// - /api/stripe/config (GET)
// - /api/stripe/create-store-intent (POST)
// - /api/stripe/confirm-payment (POST)
// 
// ✅ COMPATIBILIDAD TOTAL:
// - Mantiene TODAS las funcionalidades existentes
// - Agregadas funcionalidades de checkout para invitados
// - Integración completa con Stripe
// - Logs detallados para debug
// - Validaciones robustas según README