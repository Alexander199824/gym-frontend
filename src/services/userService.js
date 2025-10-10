// src/services/userService.js
// SERVICIO DE GESTIÓN DE USUARIOS Y MEMBRESÍAS
import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';
import { api } from './apiConfig.js';

class UserService extends BaseService {
  // ================================
  // 👥 MÉTODOS DE USUARIOS
  // ================================

  /**
   * Obtener lista de usuarios con filtros y paginación
   * Backend response: { success: true, data: { users: [...], pagination: {...} } }
   */
  async getUsers(params = {}) {
    console.log('👥 FETCHING USERS...');
    console.log('📋 Params:', params);
    
    try {
      const response = await this.get('/users', { params });
      
      console.log('📦 Raw response:', response);
      
      // El backend devuelve: { success: true, data: { users: [...], pagination: {...} } }
      if (response.success && response.data) {
        const { users, pagination } = response.data;
        
        console.log('✅ Users fetched successfully:', {
          totalUsers: users?.length || 0,
          totalInDB: pagination?.total || 0,
          currentPage: pagination?.page || 1
        });
        
        // Retornar la estructura completa
        return {
          users: users || [],
          pagination: pagination || {
            total: users?.length || 0,
            page: 1,
            pages: 1,
            limit: params.limit || 20
          }
        };
      }
      
      // Fallback para respuestas antiguas
      if (Array.isArray(response)) {
        console.warn('⚠️ Response is array (old format)');
        return {
          users: response,
          pagination: { total: response.length, page: 1, pages: 1 }
        };
      }
      
      console.warn('⚠️ Unexpected response format');
      return {
        users: [],
        pagination: { total: 0, page: 1, pages: 1 }
      };
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   * Backend response: { success: true, data: { user: {...} } }
   */
  async getUserById(userId) {
    console.log('👤 FETCHING USER BY ID:', userId);
    
    try {
      const response = await this.get(`/users/${userId}`);
      
      console.log('📦 User response:', response);
      
      // Backend devuelve: { success: true, data: { user: {...} } }
      if (response.success && response.data?.user) {
        console.log('✅ User found:', response.data.user.email);
        return response.data.user;
      }
      
      // Fallback
      if (response.data) {
        return response.data;
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Buscar usuarios
   * Backend response: { success: true, data: { users: [...] } }
   */
  async searchUsers(query, role = null) {
    console.log('🔍 SEARCHING USERS:', { query, role });
    
    if (!query || query.length < 2) {
      throw new Error('La búsqueda debe tener al menos 2 caracteres');
    }
    
    try {
      const params = { q: query };
      if (role) params.role = role;
      
      const response = await this.get('/users/search', { params });
      
      console.log('📦 Search response:', response);
      
      // Backend devuelve: { success: true, data: { users: [...] } }
      if (response.success && response.data?.users) {
        console.log('✅ Users found:', response.data.users.length);
        return response.data.users;
      }
      
      // Fallback
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Error searching users:', error);
      throw error;
    }
  }

  /**
   * Obtener solo clientes
   */
  async getClientUsers(params = {}) {
    console.log('👤 FETCHING CLIENT USERS ONLY...');
    
    const clientParams = {
      ...params,
      role: 'cliente'
    };
    
    return this.getUsers(clientParams);
  }
  
  /**
   * Obtener usuarios según rol del usuario actual
   */
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
  
  /**
   * Crear nuevo usuario
   * Backend response: { success: true, data: { user: {...} }, message: "..." }
   */
  async createUser(userData, currentUserRole = null) {
    console.log('➕ CREATING USER...');
    console.log('📤 User data:', { ...userData, password: '***' });
    console.log('👨‍💼 Current user role:', currentUserRole);
    
    // Validación de permisos para colaborador
    if (currentUserRole === 'colaborador' && userData.role !== 'cliente') {
      const error = new Error('Los colaboradores solo pueden crear usuarios clientes');
      toast.error(error.message);
      throw error;
    }
    
    try {
      const response = await this.post('/users', userData);
      
      console.log('📦 Create response:', response);
      
      // Backend devuelve: { success: true, data: { user: {...} }, message: "..." }
      if (response.success) {
        const user = response.data?.user || response.data;
        console.log('✅ User created successfully:', user.email);
        toast.success(response.message || 'Usuario creado exitosamente');
        return user;
      }
      
      throw new Error(response.message || 'Error al crear usuario');
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al crear usuario';
      toast.error(errorMsg);
      throw error;
    }
  }
  
  /**
   * Actualizar usuario existente
   * Backend response: { success: true, data: { user: {...} }, message: "..." }
   */
  async updateUser(userId, userData, currentUserRole = null, currentUserId = null) {
    console.log('✏️  UPDATING USER...');
    console.log('🎯 Target user ID:', userId);
    console.log('👨‍💼 Current user role:', currentUserRole);
    console.log('📤 Update data:', userData);
    
    // Validación de permisos para colaborador
    if (currentUserRole === 'colaborador') {
      const error = new Error('Los colaboradores no pueden editar usuarios existentes');
      toast.error(error.message);
      throw error;
    }
    
    // Validación: no puede editarse a sí mismo desde gestión
    if (userId === currentUserId) {
      const error = new Error('No puedes editarte a ti mismo desde la gestión de usuarios');
      toast.error(error.message);
      throw error;
    }
    
    try {
      // El backend usa PATCH para actualizaciones parciales
      const response = await this.patch(`/users/${userId}`, userData);
      
      console.log('📦 Update response:', response);
      
      // Backend devuelve: { success: true, data: { user: {...} }, message: "..." }
      if (response.success) {
        const user = response.data?.user || response.data;
        console.log('✅ User updated successfully:', user.email);
        toast.success(response.message || 'Usuario actualizado exitosamente');
        return user;
      }
      
      throw new Error(response.message || 'Error al actualizar usuario');
      
    } catch (error) {
      console.error('❌ Error updating user:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al actualizar usuario';
      toast.error(errorMsg);
      throw error;
    }
  }
  
  /**
   * Eliminar usuario (soft delete - desactiva el usuario)
   * Backend response: { success: true, message: "..." }
   */
  async deleteUser(userId, currentUserRole = null, currentUserId = null) {
    console.log('🗑️  DELETING USER...');
    console.log('🎯 Target user ID:', userId);
    console.log('👨‍💼 Current user role:', currentUserRole);
    
    // Validación de permisos para colaborador
    if (currentUserRole === 'colaborador') {
      const error = new Error('Los colaboradores no pueden eliminar usuarios');
      toast.error(error.message);
      throw error;
    }
    
    // Validación: no puede eliminarse a sí mismo
    if (userId === currentUserId) {
      const error = new Error('No puedes eliminarte a ti mismo');
      toast.error(error.message);
      throw error;
    }
    
    try {
      const response = await this.delete(`/users/${userId}`);
      
      console.log('📦 Delete response:', response);
      
      // Backend devuelve: { success: true, message: "Usuario desactivado exitosamente" }
      if (response.success) {
        console.log('✅ User deleted/deactivated successfully');
        toast.success(response.message || 'Usuario eliminado exitosamente');
        return response;
      }
      
      throw new Error(response.message || 'Error al eliminar usuario');
      
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al eliminar usuario';
      toast.error(errorMsg);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de usuarios
   * Backend response: { success: true, data: { stats } }
   */
  async getUserStats(currentUserRole = null) {
    console.log('📊 FETCHING USER STATISTICS...');
    console.log('👨‍💼 Current user role:', currentUserRole);
    
    try {
      const response = await this.get('/users/stats');
      
      console.log('📦 Stats response:', response);
      
      // Backend devuelve: { success: true, data: { ... } }
      let stats = response.success ? response.data : response;
      
      // Filtrar stats para colaborador
      if (currentUserRole === 'colaborador' && stats) {
        console.log('🔒 Filtering stats for colaborador role');
        
        const filteredStats = {
          ...stats,
          // Solo mostrar stats de clientes
          roleStats: {
            cliente: stats.roleStats?.cliente || 0
          },
          totalUsers: stats.roleStats?.cliente || 0,
          totalActiveUsers: Math.min(
            stats.totalActiveUsers || 0, 
            stats.roleStats?.cliente || 0
          )
        };
        
        console.log('✅ Filtered stats:', filteredStats);
        return filteredStats;
      }
      
      console.log('✅ Stats fetched successfully');
      return stats;
      
    } catch (error) {
      console.warn('⚠️ getUserStats error, calculating manually...');
      
      try {
        // Fallback: calcular stats manualmente desde la lista de usuarios
        const usersResponse = await this.getUsersByCurrentUserRole(
          currentUserRole || 'admin', 
          { limit: 1000 }
        );
        
        const users = usersResponse.users || [];
        
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
        
        console.log('✅ Stats calculated manually:', stats);
        return stats;
        
      } catch (fallbackError) {
        console.error('❌ Both getUserStats methods failed:', fallbackError);
        
        // Stats vacíos pero válidos
        const emptyStats = {
          totalUsers: 0,
          totalActiveUsers: 0,
          totalInactiveUsers: 0,
          newUsersThisMonth: 0
        };
        
        if (currentUserRole === 'colaborador') {
          emptyStats.roleStats = { cliente: 0 };
        } else {
          emptyStats.roleStats = {
            admin: 0,
            colaborador: 0,
            cliente: 0
          };
        }
        
        return emptyStats;
      }
    }
  }

  /**
   * Obtener clientes frecuentes (con pagos diarios)
   * Backend response: { success: true, data: { clients: [...], criteria: {...} } }
   */
  async getFrequentDailyClients(days = 30, minVisits = 10) {
    console.log('💪 FETCHING FREQUENT DAILY CLIENTS...');
    
    try {
      const response = await this.get('/users/frequent-daily-clients', {
        params: { days, minVisits }
      });
      
      console.log('📦 Frequent clients response:', response);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error fetching frequent clients:', error);
      throw error;
    }
  }

  // ================================
  // 🎫 MÉTODOS DE MEMBRESÍAS
  // ================================

  /**
   * Obtener membresías del usuario actual
   */
  async getMemberships(params = {}) {
    try {
      console.log('💳 Getting user memberships...');
      
      const response = await this.get('/memberships', { params });
      
      console.log('📦 Memberships response:', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ Error getting memberships:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de membresías
   */
  async getMembershipStats() {
    console.log('📊 FETCHING MEMBERSHIP STATISTICS...');
    
    try {
      const response = await this.get('/memberships/stats');
      console.log('✅ Membership stats:', response);
      return response.data || response;
      
    } catch (error) {
      console.warn('⚠️ getMembershipStats fallback...');
      
      try {
        const memberships = await this.getMemberships();
        const membershipArray = Array.isArray(memberships) 
          ? memberships 
          : memberships.data || [];
        
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
        console.error('❌ Both getMembershipStats methods failed');
        return {
          totalMemberships: 0,
          activeMemberships: 0,
          expiredMemberships: 0,
          expiringSoon: 0
        };f
      }
    }
  }
  
  /**
   * Obtener membresías expiradas
   */
  async getExpiredMemberships(days = 0) {
    const response = await api.get('/memberships/expired', { params: { days } });
    return response.data;
  }
    
  /**
   * Obtener membresías por expirar
   */
  async getExpiringSoonMemberships(days = 7) {
    const response = await api.get('/memberships/expiring-soon', { params: { days } });
    return response.data;
  }

  // ================================
  // 💰 MÉTODOS DE PAGOS
  // ================================

  /**
   * Obtener historial de pagos del usuario
   */
  async getPayments(params = {}) {
    try {
      console.log('💰 Getting user payments...');
      
      const response = await this.get('/payments', { params });
      
      console.log('📦 Payments response:', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ Error getting payments:', error);
      throw error;
    }
  }

  /**
   * Obtener reportes de pagos
   */
  async getPaymentReports(params = {}) {
    console.log('📊 FETCHING PAYMENT REPORTS...');
    
    try {
      const response = await api.get('/payments/reports', { params });
      console.log('✅ Payment reports:', response.data);
      return response.data;
      
    } catch (error) {
      console.warn('⚠️ getPaymentReports fallback...');
      
      try {
        const payments = await this.getPayments(params);
        const paymentArray = Array.isArray(payments) 
          ? payments 
          : payments.data || [];
        
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
          averagePayment: paymentArray.length > 0 
            ? totalIncome / paymentArray.length 
            : 0
        };
        
        console.log('✅ Payment reports calculated manually:', stats);
        return stats;
        
      } catch (fallbackError) {
        console.error('❌ Both getPaymentReports methods failed');
        return {
          totalIncome: 0,
          totalPayments: 0,
          incomeByMethod: [],
          averagePayment: 0
        };
      }
    }
  }

  /**
   * Crear pago desde orden
   */
  async createPaymentFromOrder(orderData) {
    console.log('💰 CREATING PAYMENT FROM ORDER...');
    console.log('📤 Order data:', orderData);
    
    try {
      const result = await this.post('/payments/from-order', orderData);
      
      console.log('✅ Payment created:', result);
      
      if (result && result.success && result.data?.payment) {
        console.log('💰 Payment details:', {
          id: result.data.payment.id,
          amount: result.data.payment.amount,
          orderId: orderData.orderId,
          status: result.data.payment.status
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Payment creation failed:', error.message);
      
      // Si el endpoint no existe, continuar sin error
      if (error.response?.status === 404) {
        console.warn('⚠️ Payment endpoint not available - continuing');
        return {
          success: true,
          message: 'Payment record skipped',
          data: {
            payment: {
              id: 'skipped',
              orderId: orderData.orderId,
              status: 'skipped'
            }
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * Obtener transferencias pendientes
   */
  async getPendingTransfers() {
    return await this.get('/payments/transfers/pending');
  }
  
  /**
   * Crear pago simple
   */
  async createSimplePayment(paymentData) {
    console.log('💰 CREATING SIMPLE PAYMENT...');
    console.log('📤 Payment data:', paymentData);
    
    try {
      const result = await this.post('/payments', paymentData);
      
      console.log('✅ Simple payment created:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Simple payment failed:', error.message);
      
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn('⚠️ Payment creation issues - continuing');
        return {
          success: false,
          message: 'Payment record could not be created',
          error: error.message,
          data: {
            payment: {
              id: 'failed',
              status: 'failed'
            }
          }
        };
      }
      
      throw error;
    }
  }

  // ================================
  // 🔧 UTILIDADES
  // ================================

  /**
   * Health check del servicio de usuarios
   */
  async healthCheck() {
    try {
      const response = await this.get('/users/stats', { timeout: 3000 });
      return { 
        healthy: true, 
        service: 'UserService',
        responseTime: '< 3s' 
      };
    } catch (error) {
      return { 
        healthy: false, 
        service: 'UserService',
        error: error.message 
      };
    }
  }
}

export { UserService };