// src/services/userService.js
// SERVICIO DE GESTIÓN DE USUARIOS Y MEMBRESÍAS

import toast from 'react-hot-toast';
import { BaseService } from './baseService.js';
import { api } from './apiConfig.js';

class UserService extends BaseService {
  // ================================
  // 👥 MÉTODOS DE USUARIOS
  // ================================

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

  async getClientUsers(params = {}) {
    console.log('👤 FETCHING CLIENT USERS ONLY...');
    
    const clientParams = {
      ...params,
      role: 'cliente'
    };
    
    return this.getUsers(clientParams);
  }
  
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
  // 🎫 MÉTODOS DE MEMBRESÍAS
  // ================================

  // ✅ MÉTODO: Obtener membresías del usuario actual
  async getMemberships(params = {}) {
    try {
      console.log('👤 UserService: Getting user memberships...');
      
      const response = await this.get('/api/memberships', { params });
      
      console.log('📦 UserService: User memberships response:', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ UserService: Error getting memberships:', error);
      throw error;
    }
  }

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
  // 💰 MÉTODOS DE PAGOS
  // ================================

  // ✅ MÉTODO: Obtener historial de pagos del usuario
  async getPayments(params = {}) {
    try {
      console.log('💰 UserService: Getting user payments...');
      
      const response = await this.get('/api/payments', { params });
      
      console.log('📦 UserService: User payments response:', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ UserService: Error getting payments:', error);
      throw error;
    }
  }

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

  // CREAR PAGO DESDE ORDEN
  async createPaymentFromOrder(orderData) {
    console.log('💰 CREATING PAYMENT FROM ORDER...');
    console.log('📤 Order data for payment:', orderData);
    
    try {
      const result = await this.post('/payments/from-order', orderData);
      
      console.log('✅ PAYMENT FROM ORDER CREATED SUCCESSFULLY:', result);
      
      if (result && result.success && result.data?.payment) {
        console.log('✅ Payment from order response structure is correct');
        console.log('💰 Payment from order details:', {
          id: result.data.payment.id,
          amount: result.data.payment.amount,
          orderId: orderData.orderId,
          status: result.data.payment.status,
          paymentMethod: result.data.payment.paymentMethod
        });
      } else {
        console.warn('⚠️ Payment from order response structure might be different from README');
      }
      
      return result;
    } catch (error) {
      console.log('❌ PAYMENT FROM ORDER CREATION FAILED:', error.message);
      
      if (error.response?.status === 404 && error.response?.config?.url?.includes('/payments/from-order')) {
        console.warn('⚠️ ENDPOINT /payments/from-order NO EXISTE - Continuando sin registro de pago');
        return {
          success: true,
          message: 'Payment record skipped - endpoint not available',
          data: {
            payment: {
              id: 'skipped',
              orderId: orderData.orderId,
              status: 'skipped',
              note: 'Payment endpoint not available'
            }
          }
        };
      }
      
      throw error;
    }
  }

  async getPendingTransfers() {
    return await this.get('/payments/transfers/pending');
  }
  
  // MÉTODO ALTERNATIVO PARA CREAR PAGO SIMPLE
  async createSimplePayment(paymentData) {
    console.log('💰 CREATING SIMPLE PAYMENT...');
    console.log('📤 Payment data:', paymentData);
    
    try {
      const result = await this.post('/payments', paymentData);
      
      console.log('✅ SIMPLE PAYMENT CREATED SUCCESSFULLY:', result);
      
      return result;
    } catch (error) {
      console.log('❌ SIMPLE PAYMENT CREATION FAILED:', error.message);
      
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn('⚠️ PAYMENT CREATION ENDPOINT ISSUES - Continuando sin registro');
        return {
          success: false,
          message: 'Payment record could not be created but order is valid',
          error: error.message,
          data: {
            payment: {
              id: 'failed',
              status: 'failed',
              note: 'Payment creation failed but order succeeded'
            }
          }
        };
      }
      
      throw error;
    }
  }
}

export { UserService };