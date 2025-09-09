// src/services/baseService.js
// CLASE BASE CON MÉTODOS CRUD GENERALES Y HELPERS

import { api } from './apiConfig.js';
import toast from 'react-hot-toast';

class BaseService {
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
  
  // ✅ MEJORADO: MÉTODO GENERAL PATCH - Optimizado para actualizaciones parciales
  async patch(endpoint, data) {
    try {
      const url = this.normalizeEndpoint(endpoint);
      console.log(`🎯 MAKING PATCH REQUEST TO: ${url}`);
      console.log('📤 PATCH Data (only changed fields):', data);
      
      const response = await api.patch(url, data);
      
      console.log(`🎉 PATCH ${url} SUCCESS:`, response.data);
      
      // ✅ NUEVO: Log específico para actualizaciones de perfil
      if (url.includes('/auth/profile')) {
        console.log('👤 PROFILE UPDATE SUCCESS:');
        console.log('  - Changed fields:', response.data?.data?.changedFields || Object.keys(data));
        console.log('  - Update message:', response.data?.message);
        console.log('  - User data updated:', !!response.data?.data?.user);
      }
      
      return response.data;
    } catch (error) {
      console.log(`💥 PATCH ${endpoint} FAILED:`, error.message);
      
      // ✅ NUEVO: Log específico para errores de perfil
      if (endpoint.includes('/auth/profile')) {
        console.log('👤 PROFILE UPDATE ERROR DETAILS:');
        console.log('  - Attempted to update:', Object.keys(data));
        console.log('  - Error type:', error.response?.status);
        console.log('  - Validation errors:', error.response?.data?.errors);
      }
      
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
  // 🔧 MÉTODOS UTILITARIOS - MANTIENE TODA LA FUNCIONALIDAD EXISTENTE
  // ================================
    
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
    
  isAuthenticated() {
    return !!localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }
    
  getToken() {
    return localStorage.getItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
  }
    
  logout() {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY || 'elite_fitness_token');
    console.log('🚪 USER LOGGED OUT');
    toast.success('Sesión cerrada exitosamente');
    window.location.href = '/login';
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
}

export { BaseService };