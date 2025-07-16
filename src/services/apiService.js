// src/services/apiService.js
// UBICACIÓN: /gym-frontend/src/services/apiService.js
// FUNCIÓN: Servicio principal para comunicación con el backend Express.js
// CONECTA CON: Todos los endpoints del backend (/api/*)

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
// Agrega automáticamente el token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.REACT_APP_TOKEN_KEY);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug en desarrollo
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
// Maneja errores globales y tokens expirados
api.interceptors.response.use(
  (response) => {
    // Debug en desarrollo
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
          // Token expirado o inválido
          console.warn('🔐 Token expirado o inválido');
          localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
          
          // Solo redirigir si no estamos ya en login
          if (!window.location.pathname.includes('/login')) {
            toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Sin permisos
          toast.error('No tienes permisos para realizar esta acción.');
          break;
          
        case 404:
          // Recurso no encontrado
          toast.error('Recurso no encontrado.');
          break;
          
        case 422:
          // Errores de validación
          if (response.data?.errors) {
            const errorMsg = response.data.errors
              .map(err => err.message)
              .join(', ');
            toast.error(`Error de validación: ${errorMsg}`);
          }
          break;
          
        case 429:
          // Rate limit excedido
          toast.error('Demasiadas solicitudes. Intenta de nuevo más tarde.');
          break;
          
        case 500:
          // Error del servidor
          toast.error('Error interno del servidor. Contacta al administrador.');
          break;
          
        default:
          // Otros errores
          const message = response.data?.message || 'Error desconocido';
          toast.error(message);
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      toast.error('La solicitud tardó demasiado. Verifica tu conexión.');
    } else if (error.code === 'ERR_NETWORK') {
      // Error de red
      toast.error('Error de conexión. Verifica que el servidor esté ejecutándose.');
    } else {
      // Error desconocido
      toast.error('Error de conexión. Verifica tu internet.');
    }
    
    console.error('❌ API Error:', error);
    return Promise.reject(error);
  }
);

// 🏠 CLASE PRINCIPAL DEL SERVICIO API
class ApiService {
  
  // ================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN
  // ================================
  
  // LOGIN - Conecta con POST /api/auth/login
  async login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    
    if (response.data.success && response.data.data.token) {
      // Guardar token en localStorage
      localStorage.setItem(process.env.REACT_APP_TOKEN_KEY, response.data.data.token);
      toast.success('Inicio de sesión exitoso');
    }
    
    return response.data;
  }
  
  // REGISTRO - Conecta con POST /api/auth/register
  async register(userData) {
    const response = await api.post('/api/auth/register', userData);
    
    if (response.data.success) {
      toast.success('Registro exitoso');
    }
    
    return response.data;
  }
  
  // PERFIL - Conecta con GET /api/auth/profile
  async getProfile() {
    const response = await api.get('/api/auth/profile');
    return response.data;
  }
  
  // ACTUALIZAR PERFIL - Conecta con PATCH /api/auth/profile
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
  
  // OBTENER USUARIOS - Conecta con GET /api/users
  async getUsers(params = {}) {
    const response = await api.get('/api/users', { params });
    return response.data;
  }
  
  // OBTENER USUARIO POR ID - Conecta con GET /api/users/:id
  async getUserById(id) {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  }
  
  // CREAR USUARIO - Conecta con POST /api/users
  async createUser(userData) {
    const response = await api.post('/api/users', userData);
    
    if (response.data.success) {
      toast.success('Usuario creado exitosamente');
    }
    
    return response.data;
  }
  
  // ACTUALIZAR USUARIO - Conecta con PATCH /api/users/:id
  async updateUser(id, userData) {
    const response = await api.patch(`/api/users/${id}`, userData);
    
    if (response.data.success) {
      toast.success('Usuario actualizado exitosamente');
    }
    
    return response.data;
  }
  
  // ELIMINAR USUARIO - Conecta con DELETE /api/users/:id
  async deleteUser(id) {
    const response = await api.delete(`/api/users/${id}`);
    
    if (response.data.success) {
      toast.success('Usuario eliminado exitosamente');
    }
    
    return response.data;
  }
  
  // BUSCAR USUARIOS - Conecta con GET /api/users/search
  async searchUsers(query) {
    const response = await api.get('/api/users/search', { 
      params: { q: query } 
    });
    return response.data;
  }
  
  // ================================
  // 🎫 MÉTODOS DE MEMBRESÍAS
  // ================================
  
  // OBTENER MEMBRESÍAS - Conecta con GET /api/memberships
  async getMemberships(params = {}) {
    const response = await api.get('/api/memberships', { params });
    return response.data;
  }
  
  // OBTENER MEMBRESÍA POR ID - Conecta con GET /api/memberships/:id
  async getMembershipById(id) {
    const response = await api.get(`/api/memberships/${id}`);
    return response.data;
  }
  
  // CREAR MEMBRESÍA - Conecta con POST /api/memberships
  async createMembership(membershipData) {
    const response = await api.post('/api/memberships', membershipData);
    
    if (response.data.success) {
      toast.success('Membresía creada exitosamente');
    }
    
    return response.data;
  }
  
  // ACTUALIZAR MEMBRESÍA - Conecta con PATCH /api/memberships/:id
  async updateMembership(id, membershipData) {
    const response = await api.patch(`/api/memberships/${id}`, membershipData);
    
    if (response.data.success) {
      toast.success('Membresía actualizada exitosamente');
    }
    
    return response.data;
  }
  
  // RENOVAR MEMBRESÍA - Conecta con POST /api/memberships/:id/renew
  async renewMembership(id, renewData) {
    const response = await api.post(`/api/memberships/${id}/renew`, renewData);
    
    if (response.data.success) {
      toast.success('Membresía renovada exitosamente');
    }
    
    return response.data;
  }
  
  // CANCELAR MEMBRESÍA - Conecta con POST /api/memberships/:id/cancel
  async cancelMembership(id, reason) {
    const response = await api.post(`/api/memberships/${id}/cancel`, { reason });
    
    if (response.data.success) {
      toast.success('Membresía cancelada exitosamente');
    }
    
    return response.data;
  }
  
  // MEMBRESÍAS VENCIDAS - Conecta con GET /api/memberships/expired
  async getExpiredMemberships(days = 0) {
    const response = await api.get('/api/memberships/expired', { 
      params: { days } 
    });
    return response.data;
  }
  
  // MEMBRESÍAS POR VENCER - Conecta con GET /api/memberships/expiring-soon
  async getExpiringSoonMemberships(days = 7) {
    const response = await api.get('/api/memberships/expiring-soon', { 
      params: { days } 
    });
    return response.data;
  }
  
  // ================================
  // 💰 MÉTODOS DE PAGOS
  // ================================
  
  // OBTENER PAGOS - Conecta con GET /api/payments
  async getPayments(params = {}) {
    const response = await api.get('/api/payments', { params });
    return response.data;
  }
  
  // OBTENER PAGO POR ID - Conecta con GET /api/payments/:id
  async getPaymentById(id) {
    const response = await api.get(`/api/payments/${id}`);
    return response.data;
  }
  
  // CREAR PAGO - Conecta con POST /api/payments
  async createPayment(paymentData) {
    const response = await api.post('/api/payments', paymentData);
    
    if (response.data.success) {
      toast.success('Pago registrado exitosamente');
    }
    
    return response.data;
  }
  
  // TRANSFERENCIAS PENDIENTES - Conecta con GET /api/payments/transfers/pending
  async getPendingTransfers() {
    const response = await api.get('/api/payments/transfers/pending');
    return response.data;
  }
  
  // VALIDAR TRANSFERENCIA - Conecta con POST /api/payments/:id/validate-transfer
  async validateTransfer(id, validation) {
    const response = await api.post(`/api/payments/${id}/validate-transfer`, validation);
    
    if (response.data.success) {
      toast.success('Transferencia validada exitosamente');
    }
    
    return response.data;
  }
  
  // SUBIR COMPROBANTE - Conecta con POST /api/payments/:id/transfer-proof
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
  
  // REPORTES DE PAGOS - Conecta con GET /api/payments/reports
  async getPaymentReports(params = {}) {
    const response = await api.get('/api/payments/reports', { params });
    return response.data;
  }
  
  // ESTADÍSTICAS DE USUARIOS - Conecta con GET /api/users/stats
  async getUserStats() {
    const response = await api.get('/api/users/stats');
    return response.data;
  }
  
  // ESTADÍSTICAS DE MEMBRESÍAS - Conecta con GET /api/memberships/stats
  async getMembershipStats() {
    const response = await api.get('/api/memberships/stats');
    return response.data;
  }
  
  // ================================
  // 🔧 MÉTODOS UTILITARIOS
  // ================================
  
  // HEALTH CHECK - Conecta con GET /api/health
  async healthCheck() {
    const response = await api.get('/api/health');
    return response.data;
  }
  
  // SUBIR IMAGEN DE PERFIL - Conecta con POST /api/auth/profile/image
  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/api/auth/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      toast.success('Imagen actualizada exitosamente');
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

// 📝 NOTAS DE USO:
// - Todos los métodos devuelven promesas
// - Los errores se manejan automáticamente con toast
// - El token JWT se adjunta automáticamente
// - Los timeouts están configurados para 30 segundos
// - Debug logs disponibles en modo desarrollo