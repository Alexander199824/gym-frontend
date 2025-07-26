// src/services/apiService.js
// FUNCIÓN: Servicio API COMPLETO con todos los endpoints del backend
// CONECTA CON: Todos los endpoints del backend según documentación

import axios from 'axios';
import toast from 'react-hot-toast';

// 🔧 CONFIGURACIÓN DE AXIOS
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // http://localhost:5000
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 🔐 INTERCEPTOR DE PETICIONES (Request)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug en desarrollo (SIN mostrar en pantalla)
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// 📨 INTERCEPTOR DE RESPUESTAS (Response)
api.interceptors.response.use(
  (response) => {
    // Debug en desarrollo (SIN mostrar en pantalla)
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log(`✅ API Response: ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Manejo de errores específicos
    if (response) {
      switch (response.status) {
        case 401:
          console.warn('🔐 Token expirado o inválido');
          localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
          
          if (!window.location.pathname.includes('/login')) {
            toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          toast.error('No tienes permisos para realizar esta acción.');
          break;
          
        case 404:
          toast.error('Recurso no encontrado.');
          break;
          
        case 422:
          if (response.data?.errors) {
            const errorMsg = response.data.errors
              .map(err => err.message)
              .join(', ');
            toast.error(`Error de validación: ${errorMsg}`);
          }
          break;
          
        case 429:
          toast.error('Demasiadas solicitudes. Intenta de nuevo más tarde.');
          break;
          
        case 500:
          toast.error('Error interno del servidor. Contacta al administrador.');
          break;
          
        default:
          const message = response.data?.message || 'Error desconocido';
          toast.error(message);
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('La solicitud tardó demasiado. Verifica tu conexión.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Error de conexión. Verifica que el servidor esté ejecutándose.');
    } else {
      toast.error('Error de conexión. Verifica tu internet.');
    }
    
    console.error('❌ API Error:', error);
    return Promise.reject(error);
  }
);

// 🏠 CLASE PRINCIPAL DEL SERVICIO API
class ApiService {
  
  // ================================
  // 🏢 MÉTODOS DE CONFIGURACIÓN DEL GYM
  // ================================
  
  // OBTENER CONFIGURACIÓN COMPLETA DEL GYM - GET /api/gym/config
  async getGymConfig() {
    const response = await api.get('/api/gym/config');
    return response.data;
  }
  
  // OBTENER ESTADÍSTICAS PÚBLICAS - GET /api/gym/stats
  async getGymStats() {
    const response = await api.get('/api/gym/stats');
    return response.data;
  }
  
  // OBTENER SERVICIOS DEL GYM - GET /api/gym/services
  async getGymServices() {
    const response = await api.get('/api/gym/services');
    return response.data;
  }
  
  // OBTENER PLANES DE MEMBRESÍA PÚBLICOS - GET /api/gym/membership-plans
  async getMembershipPlans() {
    const response = await api.get('/api/gym/membership-plans');
    return response.data;
  }
  
  // OBTENER TESTIMONIOS - GET /api/gym/testimonials
  async getTestimonials() {
    const response = await api.get('/api/gym/testimonials');
    return response.data;
  }
  
  // OBTENER INFORMACIÓN DE CONTACTO - GET /api/gym/contact
  async getContactInfo() {
    const response = await api.get('/api/gym/contact');
    return response.data;
  }
  
  // OBTENER REDES SOCIALES - GET /api/gym/social-media
  async getSocialMedia() {
    const response = await api.get('/api/gym/social-media');
    return response.data;
  }
  
  // OBTENER GALERÍA/VIDEOS - GET /api/gym/media
  async getGymMedia() {
    const response = await api.get('/api/gym/media');
    return response.data;
  }
  
  // ================================
  // 📄 MÉTODOS DE CONTENIDO DE SECCIONES
  // ================================
  
  // OBTENER CONTENIDO DE SECCIONES - GET /api/gym/sections-content
  async getSectionsContent() {
    const response = await api.get('/api/gym/sections-content');
    return response.data;
  }
  
  // OBTENER NAVEGACIÓN - GET /api/gym/navigation
  async getNavigation() {
    const response = await api.get('/api/gym/navigation');
    return response.data;
  }
  
  // OBTENER CONTENIDO PROMOCIONAL - GET /api/gym/promotional-content
  async getPromotionalContent() {
    const response = await api.get('/api/gym/promotional-content');
    return response.data;
  }
  
  // OBTENER CONFIGURACIÓN DE FORMULARIOS - GET /api/gym/forms-config
  async getFormsConfig() {
    const response = await api.get('/api/gym/forms-config');
    return response.data;
  }
  
  // OBTENER MENSAJES DEL SISTEMA - GET /api/gym/system-messages
  async getSystemMessages() {
    const response = await api.get('/api/gym/system-messages');
    return response.data;
  }
  
  // OBTENER CONFIGURACIÓN DE BRANDING - GET /api/gym/branding
  async getBranding() {
    const response = await api.get('/api/gym/branding');
    return response.data;
  }
  
  // ================================
  // 🛍️ MÉTODOS DE TIENDA
  // ================================
  
  // OBTENER PRODUCTOS - GET /api/store/products
  async getProducts(params = {}) {
    const response = await api.get('/api/store/products', { params });
    return response.data;
  }
  
  // OBTENER PRODUCTO POR ID - GET /api/store/products/:id
  async getProductById(id) {
    const response = await api.get(`/api/store/products/${id}`);
    return response.data;
  }
  
  // OBTENER PRODUCTOS DESTACADOS - GET /api/store/featured-products
  async getFeaturedProducts() {
    const response = await api.get('/api/store/featured-products');
    return response.data;
  }
  
  // OBTENER CATEGORÍAS DE PRODUCTOS - GET /api/store/categories
  async getProductCategories() {
    const response = await api.get('/api/store/categories');
    return response.data;
  }
  
  // OBTENER MARCAS - GET /api/store/brands
  async getBrands() {
    const response = await api.get('/api/store/brands');
    return response.data;
  }
  
  // BUSCAR PRODUCTOS - GET /api/store/products/search
  async searchProducts(query, filters = {}) {
    const response = await api.get('/api/store/products/search', { 
      params: { q: query, ...filters } 
    });
    return response.data;
  }
  
  // ================================
  // 🛒 MÉTODOS DEL CARRITO
  // ================================
  
  // OBTENER CARRITO - GET /api/cart
  async getCart() {
    const response = await api.get('/api/cart');
    return response.data;
  }
  
  // ACTUALIZAR CARRITO - PUT /api/cart
  async updateCart(items) {
    const response = await api.put('/api/cart', { items });
    return response.data;
  }
  
  // AGREGAR AL CARRITO - POST /api/cart/items
  async addToCart(productId, quantity = 1, options = {}) {
    const response = await api.post('/api/cart/items', {
      productId,
      quantity,
      options
    });
    return response.data;
  }
  
  // ELIMINAR DEL CARRITO - DELETE /api/cart/items/:itemId
  async removeFromCart(itemId) {
    const response = await api.delete(`/api/cart/items/${itemId}`);
    return response.data;
  }
  
  // LIMPIAR CARRITO - DELETE /api/cart
  async clearCart() {
    const response = await api.delete('/api/cart');
    return response.data;
  }
  
  // ================================
  // 📦 MÉTODOS DE PEDIDOS
  // ================================
  
  // CREAR PEDIDO - POST /api/orders
  async createOrder(orderData) {
    const response = await api.post('/api/orders', orderData);
    
    if (response.data.success) {
      toast.success('Pedido creado exitosamente');
    }
    
    return response.data;
  }
  
  // OBTENER PEDIDOS DEL USUARIO - GET /api/orders
  async getOrders(params = {}) {
    const response = await api.get('/api/orders', { params });
    return response.data;
  }
  
  // OBTENER PEDIDO POR ID - GET /api/orders/:id
  async getOrderById(id) {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  }
  
  // ================================
  // 📧 MÉTODOS DE CONTACTO
  // ================================
  
  // ENVIAR MENSAJE DE CONTACTO - POST /api/contact
  async sendContactMessage(messageData) {
    const response = await api.post('/api/contact', messageData);
    
    if (response.data.success) {
      toast.success('Mensaje enviado exitosamente');
    }
    
    return response.data;
  }
  
  // SUSCRIBIRSE AL NEWSLETTER - POST /api/newsletter/subscribe
  async subscribeNewsletter(email) {
    const response = await api.post('/api/newsletter/subscribe', { email });
    
    if (response.data.success) {
      toast.success('Suscripción exitosa');
    }
    
    return response.data;
  }
  
  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN
  // ================================
  
  // LOGIN - POST /api/auth/login
  async login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    
    if (response.data.success && response.data.data.token) {
      localStorage.setItem(process.env.REACT_APP_TOKEN_KEY, response.data.data.token);
      toast.success('Inicio de sesión exitoso');
    }
    
    return response.data;
  }
  
  // REGISTRO - POST /api/auth/register
  async register(userData) {
    const response = await api.post('/api/auth/register', userData);
    
    if (response.data.success) {
      toast.success('Registro exitoso');
    }
    
    return response.data;
  }
  
  // PERFIL - GET /api/auth/profile
  async getProfile() {
    const response = await api.get('/api/auth/profile');
    return response.data;
  }
  
  // ACTUALIZAR PERFIL - PATCH /api/auth/profile
  async updateProfile(profileData) {
    const response = await api.patch('/api/auth/profile', profileData);
    
    if (response.data.success) {
      toast.success('Perfil actualizado exitosamente');
    }
    
    return response.data;
  }
  
  // LOGOUT
  logout() {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
    toast.success('Sesión cerrada exitosamente');
    window.location.href = '/login';
  }
  
  // ================================
  // 👥 MÉTODOS DE USUARIOS
  // ================================
  
  // OBTENER USUARIOS - GET /api/users
  async getUsers(params = {}) {
    const response = await api.get('/api/users', { params });
    return response.data;
  }
  
  // OBTENER USUARIO POR ID - GET /api/users/:id
  async getUserById(id) {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  }
  
  // CREAR USUARIO - POST /api/users
  async createUser(userData) {
    const response = await api.post('/api/users', userData);
    
    if (response.data.success) {
      toast.success('Usuario creado exitosamente');
    }
    
    return response.data;
  }
  
  // ACTUALIZAR USUARIO - PATCH /api/users/:id
  async updateUser(id, userData) {
    const response = await api.patch(`/api/users/${id}`, userData);
    
    if (response.data.success) {
      toast.success('Usuario actualizado exitosamente');
    }
    
    return response.data;
  }
  
  // ELIMINAR USUARIO - DELETE /api/users/:id
  async deleteUser(id) {
    const response = await api.delete(`/api/users/${id}`);
    
    if (response.data.success) {
      toast.success('Usuario eliminado exitosamente');
    }
    
    return response.data;
  }
  
  // BUSCAR USUARIOS - GET /api/users/search
  async searchUsers(query) {
    const response = await api.get('/api/users/search', { 
      params: { q: query } 
    });
    return response.data;
  }
  
  // ================================
  // 🎫 MÉTODOS DE MEMBRESÍAS
  // ================================
  
  // OBTENER MEMBRESÍAS - GET /api/memberships
  async getMemberships(params = {}) {
    const response = await api.get('/api/memberships', { params });
    return response.data;
  }
  
  // OBTENER MEMBRESÍA POR ID - GET /api/memberships/:id
  async getMembershipById(id) {
    const response = await api.get(`/api/memberships/${id}`);
    return response.data;
  }
  
  // CREAR MEMBRESÍA - POST /api/memberships
  async createMembership(membershipData) {
    const response = await api.post('/api/memberships', membershipData);
    
    if (response.data.success) {
      toast.success('Membresía creada exitosamente');
    }
    
    return response.data;
  }
  
  // ACTUALIZAR MEMBRESÍA - PATCH /api/memberships/:id
  async updateMembership(id, membershipData) {
    const response = await api.patch(`/api/memberships/${id}`, membershipData);
    
    if (response.data.success) {
      toast.success('Membresía actualizada exitosamente');
    }
    
    return response.data;
  }
  
  // RENOVAR MEMBRESÍA - POST /api/memberships/:id/renew
  async renewMembership(id, renewData) {
    const response = await api.post(`/api/memberships/${id}/renew`, renewData);
    
    if (response.data.success) {
      toast.success('Membresía renovada exitosamente');
    }
    
    return response.data;
  }
  
  // CANCELAR MEMBRESÍA - POST /api/memberships/:id/cancel
  async cancelMembership(id, reason) {
    const response = await api.post(`/api/memberships/${id}/cancel`, { reason });
    
    if (response.data.success) {
      toast.success('Membresía cancelada exitosamente');
    }
    
    return response.data;
  }
  
  // MEMBRESÍAS VENCIDAS - GET /api/memberships/expired
  async getExpiredMemberships(days = 0) {
    const response = await api.get('/api/memberships/expired', { 
      params: { days } 
    });
    return response.data;
  }
  
  // MEMBRESÍAS POR VENCER - GET /api/memberships/expiring-soon
  async getExpiringSoonMemberships(days = 7) {
    const response = await api.get('/api/memberships/expiring-soon', { 
      params: { days } 
    });
    return response.data;
  }
  
  // ================================
  // 💰 MÉTODOS DE PAGOS
  // ================================
  
  // OBTENER PAGOS - GET /api/payments
  async getPayments(params = {}) {
    const response = await api.get('/api/payments', { params });
    return response.data;
  }
  
  // OBTENER PAGO POR ID - GET /api/payments/:id
  async getPaymentById(id) {
    const response = await api.get(`/api/payments/${id}`);
    return response.data;
  }
  
  // CREAR PAGO - POST /api/payments
  async createPayment(paymentData) {
    const response = await api.post('/api/payments', paymentData);
    
    if (response.data.success) {
      toast.success('Pago registrado exitosamente');
    }
    
    return response.data;
  }
  
  // TRANSFERENCIAS PENDIENTES - GET /api/payments/transfers/pending
  async getPendingTransfers() {
    const response = await api.get('/api/payments/transfers/pending');
    return response.data;
  }
  
  // VALIDAR TRANSFERENCIA - POST /api/payments/:id/validate-transfer
  async validateTransfer(id, validation) {
    const response = await api.post(`/api/payments/${id}/validate-transfer`, validation);
    
    if (response.data.success) {
      toast.success('Transferencia validada exitosamente');
    }
    
    return response.data;
  }
  
  // SUBIR COMPROBANTE - POST /api/payments/:id/transfer-proof
  async uploadTransferProof(id, file) {
    const formData = new FormData();
    formData.append('proof', file);
    
    const response = await api.post(`/api/payments/${id}/transfer-proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      toast.success('Comprobante subido exitosamente');
    }
    
    return response.data;
  }
  
  // ================================
  // 📊 MÉTODOS DE REPORTES
  // ================================
  
  // REPORTES DE PAGOS - GET /api/payments/reports
  async getPaymentReports(params = {}) {
    const response = await api.get('/api/payments/reports', { params });
    return response.data;
  }
  
  // ESTADÍSTICAS DE USUARIOS - GET /api/users/stats
  async getUserStats() {
    const response = await api.get('/api/users/stats');
    return response.data;
  }
  
  // ESTADÍSTICAS DE MEMBRESÍAS - GET /api/memberships/stats
  async getMembershipStats() {
    const response = await api.get('/api/memberships/stats');
    return response.data;
  }
  
  // ================================
  // 🔧 MÉTODOS UTILITARIOS
  // ================================
  
  // HEALTH CHECK - GET /api/health
  async healthCheck() {
    const response = await api.get('/api/health');
    return response.data;
  }
  
  // VERIFICAR CONEXIÓN AL BACKEND
  async checkBackendConnection() {
    try {
      console.log('🔍 Verificando conexión al backend...');
      console.log('🔗 URL configurada:', process.env.REACT_APP_API_URL);
      
      const startTime = Date.now();
      const response = await api.get('/api/health');
      const responseTime = Date.now() - startTime;
      
      if (response.data.success) {
        console.log('✅ Backend conectado exitosamente!');
        console.log('📊 Datos del backend:', response.data);
        console.log(`⚡ Tiempo de respuesta: ${responseTime}ms`);
        return { connected: true, data: response.data, responseTime };
      } else {
        console.warn('⚠️ Backend respondió pero con error:', response.data);
        return { connected: false, error: 'Backend respondió con error' };
      }
    } catch (error) {
      console.error('❌ No se pudo conectar al backend!');
      console.error('🔍 Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url: error.config?.url
      });
      
      if (error.code === 'ERR_NETWORK') {
        console.error('🚫 Error de red: El backend no está corriendo o hay un problema de CORS');
      } else if (error.response?.status === 404) {
        console.error('🚫 Error 404: La ruta /api/health no existe en el backend');
      }
      
      return { connected: false, error: error.message };
    }
  }
  
  // SUBIR IMAGEN - POST /api/upload/image
  async uploadImage(file, type = 'general') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    const response = await api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      toast.success('Imagen subida exitosamente');
    }
    
    return response.data;
  }
  
  // SUBIR MÚLTIPLES IMÁGENES - POST /api/upload/images
  async uploadImages(files, type = 'general') {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });
    formData.append('type', type);
    
    const response = await api.post('/api/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      toast.success('Imágenes subidas exitosamente');
    }
    
    return response.data;
  }
  
  // VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO
  isAuthenticated() {
    return !!localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
  }
  
  // OBTENER TOKEN ACTUAL
  getToken() {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
  }
}

// 🏭 EXPORTAR INSTANCIA SINGLETON
const apiService = new ApiService();

export default apiService;

// 📝 NOTAS:
// - TODOS los endpoints del backend están implementados
// - Manejo automático de errores con toast
// - Token JWT se adjunta automáticamente  
// - Cache y timeouts configurados
// - Debug logs en desarrollo
// - Compatible con todos los nuevos endpoints de gym, tienda, carrito, etc.