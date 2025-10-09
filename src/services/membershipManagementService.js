/*
 * ============================================================================
 * MEMBERSHIP MANAGEMENT SERVICE - USANDO BASESERVICE
 * ============================================================================
 * Autor: Alexander Echeverria
 * Archivo: src/services/membershipManagementService.js
 * 
 * CORREGIDO: Ahora extiende de BaseService y usa sus métodos correctamente
 * ============================================================================
 */

import { BaseService } from './baseService';

class MembershipManagementService extends BaseService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ============================================================================
  // HELPERS DE CACHÉ
  // ============================================================================

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📦 Cache hit: ${key}`);
      return cached.data;
    }
    return null;
  }

  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    console.log('🗑️ Cache limpiado:', pattern || 'todo');
  }

  // ============================================================================
  // OBTENER MEMBRESÍAS CON FILTROS
  // ============================================================================

  /**
   * Obtener lista de membresías con filtros y paginación
   * USA: GET /api/memberships
   */
  async getMemberships(params = {}) {
    try {
      console.log('📋 [membershipManagementService] Obteniendo membresías con parámetros:', params);

      // Construir query params
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.type && params.type !== 'all') queryParams.append('type', params.type);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.userId) queryParams.append('userId', params.userId);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/memberships?${queryString}` : '/memberships';

      console.log('🎯 Endpoint final:', endpoint);

      // USAR BaseService.get
      const response = await this.get(endpoint);

      console.log('📦 Respuesta del backend:', response);

      // Extraer datos según el formato del backend
      const data = response.data || response;
      const memberships = data.memberships || [];
      const pagination = data.pagination || {
        page: parseInt(params.page) || 1,
        limit: parseInt(params.limit) || 20,
        total: memberships.length,
        pages: 1
      };

      console.log(`✅ ${memberships.length} membresías obtenidas`);

      return {
        success: true,
        memberships,
        pagination
      };

    } catch (error) {
      console.error('❌ Error en getMemberships:', error);
      throw error;
    }
  }

  /**
   * Obtener membresía por ID
   * USA: GET /api/memberships/:id
   */
  async getMembershipById(membershipId) {
    try {
      console.log(`🔍 [membershipManagementService] Obteniendo membresía ${membershipId}...`);

      // USAR BaseService.get
      const response = await this.get(`/memberships/${membershipId}`);

      const data = response.data || response;
      const membership = data.membership || data;

      console.log('✅ Membresía obtenida:', membership);

      return {
        success: true,
        membership
      };

    } catch (error) {
      console.error('❌ Error en getMembershipById:', error);
      throw error;
    }
  }

  // ============================================================================
  // ESTADÍSTICAS Y REPORTES
  // ============================================================================

  /**
   * Obtener estadísticas generales de membresías
   * USA: GET /api/memberships/stats (con fallback manual)
   */
  async getStatistics() {
    try {
      console.log('📊 [membershipManagementService] Obteniendo estadísticas...');

      const stats = {
        totalMemberships: 0,
        activeMemberships: 0,
        expiredMemberships: 0,
        expiringSoon: 0,
        pendingMemberships: 0,
        cancelledMemberships: 0,
        suspendedMemberships: 0
      };

      // Intentar endpoint de estadísticas
      try {
        const response = await this.get('/memberships/stats');
        if (response.success || response.data) {
          console.log('✅ Estadísticas del endpoint stats obtenidas');
          const data = response.data || response;
          return data;
        }
      } catch (statsError) {
        console.log('⚠️ Endpoint /stats no disponible, calculando manualmente...');
      }

      // Fallback: Calcular manualmente
      console.log('📊 Calculando estadísticas manualmente...');

      // Total de membresías
      try {
        const allResponse = await this.get('/memberships?limit=1000');
        const allData = allResponse.data || allResponse;
        stats.totalMemberships = allData.pagination?.total || allData.memberships?.length || 0;
        console.log(`  Total: ${stats.totalMemberships}`);
      } catch (error) {
        console.warn('Error obteniendo total:', error.message);
      }

      // Membresías activas
      try {
        const activeResponse = await this.get('/memberships?status=active&limit=1000');
        const activeData = activeResponse.data || activeResponse;
        stats.activeMemberships = activeData.pagination?.total || activeData.memberships?.length || 0;
        console.log(`  Activas: ${stats.activeMemberships}`);
      } catch (error) {
        console.warn('Error obteniendo activas:', error.message);
      }

      // Membresías vencidas
      try {
        const expiredResponse = await this.get('/memberships/expired?days=0');
        const expiredData = expiredResponse.data || expiredResponse;
        stats.expiredMemberships = expiredData.total || expiredData.memberships?.length || 0;
        console.log(`  Vencidas: ${stats.expiredMemberships}`);
      } catch (error) {
        console.warn('Error obteniendo vencidas:', error.message);
      }

      // Membresías por vencer (próximos 7 días)
      try {
        const expiringResponse = await this.get('/memberships/expiring-soon?days=7');
        const expiringData = expiringResponse.data || expiringResponse;
        stats.expiringSoon = expiringData.total || expiringData.memberships?.length || 0;
        console.log(`  Por vencer: ${stats.expiringSoon}`);
      } catch (error) {
        console.warn('Error obteniendo por vencer:', error.message);
      }

      // Membresías pendientes
      try {
        const pendingResponse = await this.get('/memberships?status=pending&limit=1000');
        const pendingData = pendingResponse.data || pendingResponse;
        stats.pendingMemberships = pendingData.pagination?.total || pendingData.memberships?.length || 0;
        console.log(`  Pendientes: ${stats.pendingMemberships}`);
      } catch (error) {
        console.warn('Error obteniendo pendientes:', error.message);
      }

      // Membresías canceladas
      try {
        const cancelledResponse = await this.get('/memberships?status=cancelled&limit=1000');
        const cancelledData = cancelledResponse.data || cancelledResponse;
        stats.cancelledMemberships = cancelledData.pagination?.total || cancelledData.memberships?.length || 0;
        console.log(`  Canceladas: ${stats.cancelledMemberships}`);
      } catch (error) {
        console.warn('Error obteniendo canceladas:', error.message);
      }

      // Membresías suspendidas
      try {
        const suspendedResponse = await this.get('/memberships?status=suspended&limit=1000');
        const suspendedData = suspendedResponse.data || suspendedResponse;
        stats.suspendedMemberships = suspendedData.pagination?.total || suspendedData.memberships?.length || 0;
        console.log(`  Suspendidas: ${stats.suspendedMemberships}`);
      } catch (error) {
        console.warn('Error obteniendo suspendidas:', error.message);
      }

      console.log('✅ Estadísticas calculadas:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Error en getStatistics:', error);
      // Retornar estadísticas vacías en caso de error
      return {
        totalMemberships: 0,
        activeMemberships: 0,
        expiredMemberships: 0,
        expiringSoon: 0,
        pendingMemberships: 0,
        cancelledMemberships: 0,
        suspendedMemberships: 0
      };
    }
  }

  /**
   * Obtener membresías vencidas
   * USA: GET /api/memberships/expired?days=0
   */
  async getExpiredMemberships(days = 0) {
    try {
      console.log(`📊 [membershipManagementService] Obteniendo vencidas (días: ${days})...`);

      // USAR BaseService.get
      const response = await this.get(`/memberships/expired?days=${days}`);

      const data = response.data || response;
      const memberships = data.memberships || [];
      const total = data.total || memberships.length;

      console.log(`✅ ${total} membresías vencidas obtenidas`);

      return {
        success: true,
        memberships,
        total
      };

    } catch (error) {
      console.error('❌ Error en getExpiredMemberships:', error);
      return {
        success: false,
        memberships: [],
        total: 0
      };
    }
  }

  /**
   * Obtener membresías próximas a vencer
   * USA: GET /api/memberships/expiring-soon?days=7
   */
  async getExpiringSoonMemberships(days = 7) {
    try {
      console.log(`📊 [membershipManagementService] Obteniendo por vencer (días: ${days})...`);

      // USAR BaseService.get
      const response = await this.get(`/memberships/expiring-soon?days=${days}`);

      const data = response.data || response;
      const memberships = data.memberships || [];
      const total = data.total || memberships.length;

      console.log(`✅ ${total} membresías por vencer obtenidas`);

      return {
        success: true,
        memberships,
        total
      };

    } catch (error) {
      console.error('❌ Error en getExpiringSoonMemberships:', error);
      return {
        success: false,
        memberships: [],
        total: 0
      };
    }
  }

  // ============================================================================
  // PLANES DE MEMBRESÍA
  // ============================================================================

  /**
   * Obtener planes de membresía disponibles
   * USA: GET /api/memberships/plans
   */
  async getPlans() {
    try {
      console.log('📦 [membershipManagementService] Obteniendo planes...');

      // Verificar caché
      const cached = this.getCached('membership-plans');
      if (cached) return cached;

      // USAR BaseService.get
      const response = await this.get('/memberships/plans');

      const data = response.data || response;
      const plans = data.plans || data || [];

      console.log(`✅ ${plans.length} planes obtenidos`);

      const result = {
        success: true,
        plans
      };

      // Guardar en caché
      this.setCached('membership-plans', result);

      return result;

    } catch (error) {
      console.error('❌ Error en getPlans:', error);
      return {
        success: false,
        plans: []
      };
    }
  }

  // ============================================================================
  // CREAR Y EDITAR MEMBRESÍAS
  // ============================================================================

  /**
   * Crear nueva membresía
   * USA: POST /api/memberships/purchase
   */
  async createMembership(membershipData) {
    try {
      console.log('💰 [membershipManagementService] Creando membresía...', membershipData);

      // Validar datos requeridos
      if (!membershipData.planId) {
        throw new Error('planId es requerido');
      }
      if (!membershipData.userId) {
        throw new Error('userId es requerido');
      }

      const payload = {
        planId: membershipData.planId,
        selectedSchedule: membershipData.selectedSchedule || {},
        paymentMethod: membershipData.paymentMethod || 'cash',
        userId: membershipData.userId,
        notes: membershipData.notes || 'Membresía creada desde dashboard'
      };

      console.log('📤 Enviando payload:', payload);

      // USAR BaseService.post
      const response = await this.post('/memberships/purchase', payload);

      console.log('✅ Membresía creada exitosamente');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      const data = response.data || response;

      return {
        success: true,
        membership: data.membership,
        payment: data.payment,
        plan: data.plan,
        user: data.user
      };

    } catch (error) {
      console.error('❌ Error en createMembership:', error);
      throw error;
    }
  }

  /**
   * Actualizar membresía existente
   * USA: PUT /api/memberships/:id
   */
  async updateMembership(membershipId, updates) {
    try {
      console.log(`✏️ [membershipManagementService] Actualizando ${membershipId}...`, updates);

      // USAR BaseService.put
      const response = await this.put(`/memberships/${membershipId}`, updates);

      console.log('✅ Membresía actualizada');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      const data = response.data || response;

      return {
        success: true,
        membership: data.membership || data
      };

    } catch (error) {
      console.error('❌ Error en updateMembership:', error);
      throw error;
    }
  }

  // ============================================================================
  // RENOVAR Y CANCELAR
  // ============================================================================

  /**
   * Renovar membresía
   * USA: POST /api/memberships/:id/renew
   */
  async renewMembership(membershipId, renewalData = {}) {
    try {
      console.log(`🔄 [membershipManagementService] Renovando ${membershipId}...`, renewalData);

      const payload = {
        months: renewalData.months || 1,
        price: renewalData.price || 250,
        notes: renewalData.notes || 'Renovación desde dashboard'
      };

      // USAR BaseService.post
      const response = await this.post(`/memberships/${membershipId}/renew`, payload);

      console.log('✅ Membresía renovada');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      const data = response.data || response;

      return {
        success: true,
        membership: data.membership || data
      };

    } catch (error) {
      console.error('❌ Error en renewMembership:', error);
      throw error;
    }
  }

  /**
   * Cancelar membresía
   * USA: POST /api/memberships/:id/cancel
   */
  async cancelMembership(membershipId, reason = '') {
    try {
      console.log(`🚫 [membershipManagementService] Cancelando ${membershipId}...`);

      const payload = {
        reason: reason || 'Cancelación desde dashboard'
      };

      // USAR BaseService.post
      const response = await this.post(`/memberships/${membershipId}/cancel`, payload);

      console.log('✅ Membresía cancelada');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      const data = response.data || response;

      return {
        success: true,
        membership: data.membership || data
      };

    } catch (error) {
      console.error('❌ Error en cancelMembership:', error);
      throw error;
    }
  }

  /**
   * Eliminar membresía (solo admin)
   * USA: DELETE /api/memberships/:id
   */
  async deleteMembership(membershipId) {
    try {
      console.log(`🗑️ [membershipManagementService] Eliminando ${membershipId}...`);

      // USAR BaseService.delete
      const response = await this.delete(`/memberships/${membershipId}`);

      console.log('✅ Membresía eliminada');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      return {
        success: true,
        message: 'Membresía eliminada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error en deleteMembership:', error);
      throw error;
    }
  }

  // ============================================================================
  // CLIENTES Y USUARIOS
  // ============================================================================

  /**
   * Obtener lista de clientes para selector
   * USA: GET /api/users?role=cliente
   */
  async getClients(params = {}) {
    try {
      console.log('👥 [membershipManagementService] Obteniendo clientes...');

      const queryParams = new URLSearchParams();
      queryParams.append('role', 'cliente');
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

      const endpoint = `/users?${queryParams.toString()}`;

      // USAR BaseService.get
      const response = await this.get(endpoint);

      const data = response.data || response;
      const clients = data.users || data || [];

      console.log(`✅ ${clients.length} clientes obtenidos`);

      return {
        success: true,
        clients
      };

    } catch (error) {
      console.error('❌ Error en getClients:', error);
      return {
        success: false,
        clients: []
      };
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Calcular días hasta vencimiento
   */
  calculateDaysUntilExpiry(endDate) {
    if (!endDate) return null;

    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Obtener información de estado de membresía
   */
  getMembershipStatusInfo(membership) {
    const status = membership.status;
    const daysUntilExpiry = this.calculateDaysUntilExpiry(membership.endDate);

    const statusMap = {
      'active': {
        label: 'Activa',
        color: 'green',
        description: daysUntilExpiry <= 7 && daysUntilExpiry > 0 
          ? `Vence en ${daysUntilExpiry} días`
          : 'Membresía en uso'
      },
      'pending': {
        label: 'Pendiente',
        color: 'blue',
        description: 'En proceso de validación'
      },
      'expired': {
        label: 'Vencida',
        color: 'red',
        description: daysUntilExpiry !== null 
          ? `Venció hace ${Math.abs(daysUntilExpiry)} días`
          : 'Periodo expirado'
      },
      'cancelled': {
        label: 'Cancelada',
        color: 'gray',
        description: 'Membresía cancelada'
      },
      'suspended': {
        label: 'Suspendida',
        color: 'yellow',
        description: 'Membresía suspendida temporalmente'
      }
    };

    return statusMap[status] || {
      label: status || 'Desconocido',
      color: 'gray',
      description: 'Estado no definido'
    };
  }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================
const membershipManagementService = new MembershipManagementService();

export default membershipManagementService;

/*
 * ============================================================================
 * EJEMPLO DE USO EN COMPONENTES
 * ============================================================================
 * 
 * import membershipManagementService from '@/services/membershipManagementService';
 * 
 * // Obtener todas las membresías con filtros
 * const { memberships, pagination } = await membershipManagementService.getMemberships({
 *   page: 1,
 *   limit: 20,
 *   status: 'active',
 *   search: 'juan',
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 * 
 * // Obtener estadísticas
 * const stats = await membershipManagementService.getStatistics();
 * 
 * // Obtener vencidas y por vencer
 * const { memberships: expired } = await membershipManagementService.getExpiredMemberships(0);
 * const { memberships: expiring } = await membershipManagementService.getExpiringSoonMemberships(7);
 * 
 * // Obtener planes
 * const { plans } = await membershipManagementService.getPlans();
 * 
 * // Obtener clientes
 * const { clients } = await membershipManagementService.getClients({ search: 'juan' });
 * 
 * // Crear membresía
 * const result = await membershipManagementService.createMembership({
 *   planId: 'plan-id',
 *   userId: 'user-id',
 *   paymentMethod: 'cash',
 *   notes: 'Notas adicionales'
 * });
 * 
 * // Renovar
 * await membershipManagementService.renewMembership('membership-id', {
 *   months: 1,
 *   price: 250
 * });
 * 
 * // Cancelar
 * await membershipManagementService.cancelMembership('membership-id', 'Razón de cancelación');
 * 
 * ============================================================================
 */