/*
 * ============================================================================
 * MEMBERSHIP MANAGEMENT SERVICE
 * ============================================================================
 * Autor: Alexander Echeverria
 * Archivo: src/services/membershipManagementService.js
 * 
 * PROPÓSITO:
 * Servicio dedicado para la GESTIÓN de membresías desde el dashboard de
 * administración. Separado del membershipService.js que es para clientes.
 * 
 * RESPONSABILIDADES:
 * - Gestión CRUD de membresías (crear, editar, eliminar)
 * - Obtener estadísticas y reportes
 * - Filtros y búsquedas avanzadas
 * - Renovaciones y cancelaciones
 * - Alertas de vencimientos
 * - Operaciones exclusivas de staff/admin
 * 
 * ENDPOINTS USADOS (según el test):
 * - GET    /api/memberships                      - Listar con filtros
 * - GET    /api/memberships/:id                  - Obtener por ID
 * - GET    /api/memberships/stats                - Estadísticas generales
 * - GET    /api/memberships/expired              - Membresías vencidas
 * - GET    /api/memberships/expiring-soon        - Por vencer
 * - GET    /api/memberships/purchase/plans       - Planes disponibles
 * - POST   /api/memberships/purchase             - Crear membresía
 * - POST   /api/memberships/:id/renew            - Renovar
 * - POST   /api/memberships/:id/cancel           - Cancelar
 * - PUT    /api/memberships/:id                  - Actualizar
 * - DELETE /api/memberships/:id                  - Eliminar
 * ============================================================================
 */

import axios from 'axios';

class MembershipManagementService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ============================================================================
  // CONFIGURACIÓN Y HELPERS
  // ============================================================================

  /**
   * Obtener configuración de axios con token de autenticación
   */
  getAxiosConfig() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Manejar errores de API de forma consistente
   */
  handleError(error, context = '') {
    console.error(`❌ MembershipManagement [${context}]:`, error);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 401:
          console.error('No autorizado - Token inválido o expirado');
          break;
        case 403:
          console.error('Permisos insuficientes');
          break;
        case 404:
          console.error('Recurso no encontrado');
          break;
        case 400:
          console.error('Datos inválidos:', message);
          break;
        default:
          console.error(`Error ${status}:`, message);
      }

      throw new Error(message);
    }

    if (error.request) {
      throw new Error('No se pudo conectar con el servidor');
    }

    throw error;
  }

  /**
   * Caché simple para reducir peticiones repetidas
   */
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
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Lista de membresías y paginación
   */
  async getMemberships(params = {}) {
    try {
      console.log('📋 Obteniendo membresías con parámetros:', params);

      const response = await axios.get(`${this.baseURL}/memberships`, {
        ...this.getAxiosConfig(),
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || undefined,
          status: params.status !== 'all' ? params.status : undefined,
          type: params.type !== 'all' ? params.type : undefined,
          sortBy: params.sortBy || 'createdAt',
          sortOrder: params.sortOrder || 'desc',
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined
        }
      });

      const data = response.data?.data || response.data;
      const memberships = data.memberships || [];
      const pagination = data.pagination || {
        page: 1,
        limit: memberships.length,
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
      this.handleError(error, 'getMemberships');
    }
  }

  /**
   * Obtener membresía por ID
   */
  async getMembershipById(membershipId) {
    try {
      console.log(`🔍 Obteniendo membresía ${membershipId}...`);

      const response = await axios.get(
        `${this.baseURL}/memberships/${membershipId}`,
        this.getAxiosConfig()
      );

      const membership = response.data?.data?.membership || response.data?.membership;

      console.log('✅ Membresía obtenida');
      return {
        success: true,
        membership
      };

    } catch (error) {
      this.handleError(error, 'getMembershipById');
    }
  }

  // ============================================================================
  // ESTADÍSTICAS Y REPORTES
  // ============================================================================

  /**
   * Obtener estadísticas generales de membresías
   */
  async getStatistics() {
    try {
      console.log('📊 Obteniendo estadísticas generales...');

      // Intentar usar endpoint de estadísticas si existe
      try {
        const response = await axios.get(
          `${this.baseURL}/memberships/stats`,
          this.getAxiosConfig()
        );

        if (response.data?.success) {
          console.log('✅ Estadísticas del backend obtenidas');
          return response.data.data;
        }
      } catch (backendError) {
        console.log('⚠️ Endpoint de stats no disponible, calculando manualmente...');
      }

      // Fallback: Calcular estadísticas manualmente
      const stats = {
        totalMemberships: 0,
        activeMemberships: 0,
        expiredMemberships: 0,
        expiringSoon: 0,
        pendingMemberships: 0,
        cancelledMemberships: 0,
        suspendedMemberships: 0
      };

      // Total
      try {
        const allResponse = await axios.get(`${this.baseURL}/memberships`, {
          ...this.getAxiosConfig(),
          params: { limit: 1000 }
        });
        const allData = allResponse.data?.data || allResponse.data;
        stats.totalMemberships = allData.pagination?.total || (allData.memberships?.length || 0);
      } catch (error) {
        console.warn('Error obteniendo total:', error.message);
      }

      // Activas
      try {
        const activeResponse = await axios.get(`${this.baseURL}/memberships`, {
          ...this.getAxiosConfig(),
          params: { status: 'active', limit: 1000 }
        });
        const activeData = activeResponse.data?.data || activeResponse.data;
        stats.activeMemberships = activeData.pagination?.total || (activeData.memberships?.length || 0);
      } catch (error) {
        console.warn('Error obteniendo activas:', error.message);
      }

      // Vencidas (usando endpoint del test)
      try {
        const expiredResponse = await axios.get(`${this.baseURL}/memberships/expired`, {
          ...this.getAxiosConfig(),
          params: { days: 0 }
        });
        const expiredData = expiredResponse.data?.data || expiredResponse.data;
        stats.expiredMemberships = expiredData.total || (expiredData.memberships?.length || 0);
      } catch (error) {
        console.warn('Error obteniendo vencidas:', error.message);
      }

      // Por vencer (usando endpoint del test)
      try {
        const expiringResponse = await axios.get(`${this.baseURL}/memberships/expiring-soon`, {
          ...this.getAxiosConfig(),
          params: { days: 7 }
        });
        const expiringData = expiringResponse.data?.data || expiringResponse.data;
        stats.expiringSoon = expiringData.total || (expiringData.memberships?.length || 0);
      } catch (error) {
        console.warn('Error obteniendo por vencer:', error.message);
      }

      // Pendientes
      try {
        const pendingResponse = await axios.get(`${this.baseURL}/memberships`, {
          ...this.getAxiosConfig(),
          params: { status: 'pending', limit: 1000 }
        });
        const pendingData = pendingResponse.data?.data || pendingResponse.data;
        stats.pendingMemberships = pendingData.pagination?.total || (pendingData.memberships?.length || 0);
      } catch (error) {
        console.warn('Error obteniendo pendientes:', error.message);
      }

      // Canceladas
      try {
        const cancelledResponse = await axios.get(`${this.baseURL}/memberships`, {
          ...this.getAxiosConfig(),
          params: { status: 'cancelled', limit: 1000 }
        });
        const cancelledData = cancelledResponse.data?.data || cancelledResponse.data;
        stats.cancelledMemberships = cancelledData.pagination?.total || (cancelledData.memberships?.length || 0);
      } catch (error) {
        console.warn('Error obteniendo canceladas:', error.message);
      }

      console.log('✅ Estadísticas calculadas:', stats);
      return stats;

    } catch (error) {
      this.handleError(error, 'getStatistics');
    }
  }

  /**
   * Obtener membresías vencidas
   * ENDPOINT DEL TEST: GET /api/memberships/expired?days=0
   */
  async getExpiredMemberships(days = 0) {
    try {
      console.log(`📊 Obteniendo membresías vencidas (días: ${days})...`);

      const response = await axios.get(`${this.baseURL}/memberships/expired`, {
        ...this.getAxiosConfig(),
        params: { days }
      });

      const data = response.data?.data || response.data;
      const memberships = data.memberships || [];
      const total = data.total || memberships.length;

      console.log(`✅ ${total} membresías vencidas obtenidas`);

      return {
        success: true,
        memberships,
        total
      };

    } catch (error) {
      this.handleError(error, 'getExpiredMemberships');
    }
  }

  /**
   * Obtener membresías próximas a vencer
   * ENDPOINT DEL TEST: GET /api/memberships/expiring-soon?days=7
   */
  async getExpiringSoonMemberships(days = 7) {
    try {
      console.log(`📊 Obteniendo membresías por vencer (días: ${days})...`);

      const response = await axios.get(`${this.baseURL}/memberships/expiring-soon`, {
        ...this.getAxiosConfig(),
        params: { days }
      });

      const data = response.data?.data || response.data;
      const memberships = data.memberships || [];
      const total = data.total || memberships.length;

      console.log(`✅ ${total} membresías por vencer obtenidas`);

      return {
        success: true,
        memberships,
        total
      };

    } catch (error) {
      this.handleError(error, 'getExpiringSoonMemberships');
    }
  }

  // ============================================================================
  // PLANES DE MEMBRESÍA
  // ============================================================================

  /**
   * Obtener planes de membresía disponibles
   * ENDPOINT DEL TEST: GET /api/memberships/purchase/plans
   */
  async getPlans() {
    try {
      console.log('📦 Obteniendo planes de membresía...');

      // Intentar obtener de caché
      const cached = this.getCached('membership-plans');
      if (cached) return cached;

     
    const response = await axios.get(`${this.baseURL}/memberships/plans`, {
        ...this.getAxiosConfig()
      });

      const data = response.data?.data || response.data;
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
      this.handleError(error, 'getPlans');
    }
  }

  // ============================================================================
  // CREAR Y EDITAR MEMBRESÍAS
  // ============================================================================

  /**
   * Crear nueva membresía
   * ENDPOINT DEL TEST: POST /api/memberships/purchase
   */
  async createMembership(membershipData) {
    try {
      console.log('💰 Creando nueva membresía...', membershipData);

      // Validar datos requeridos
      if (!membershipData.planId) {
        throw new Error('planId es requerido');
      }

      if (!membershipData.userId) {
        throw new Error('userId es requerido');
      }

      // Preparar payload según el formato del test
      const payload = {
        planId: membershipData.planId,
        selectedSchedule: membershipData.selectedSchedule || {},
        paymentMethod: membershipData.paymentMethod || 'cash',
        userId: membershipData.userId,
        notes: membershipData.notes || 'Membresía creada desde dashboard'
      };

      console.log('📤 Enviando payload:', payload);

      const response = await axios.post(
        `${this.baseURL}/memberships/purchase`,
        payload,
        this.getAxiosConfig()
      );

      const data = response.data?.data || response.data;

      console.log('✅ Membresía creada exitosamente');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      return {
        success: true,
        membership: data.membership,
        payment: data.payment,
        plan: data.plan,
        user: data.user
      };

    } catch (error) {
      this.handleError(error, 'createMembership');
    }
  }

  /**
   * Actualizar membresía existente
   */
  async updateMembership(membershipId, updates) {
    try {
      console.log(`✏️ Actualizando membresía ${membershipId}...`, updates);

      const response = await axios.put(
        `${this.baseURL}/memberships/${membershipId}`,
        updates,
        this.getAxiosConfig()
      );

      const data = response.data?.data || response.data;

      console.log('✅ Membresía actualizada');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      return {
        success: true,
        membership: data.membership || data
      };

    } catch (error) {
      this.handleError(error, 'updateMembership');
    }
  }

  // ============================================================================
  // RENOVAR Y CANCELAR
  // ============================================================================

  /**
   * Renovar membresía
   */
  async renewMembership(membershipId, renewalData = {}) {
    try {
      console.log(`🔄 Renovando membresía ${membershipId}...`, renewalData);

      const payload = {
        months: renewalData.months || 1,
        price: renewalData.price || 250,
        notes: renewalData.notes || 'Renovación desde dashboard'
      };

      const response = await axios.post(
        `${this.baseURL}/memberships/${membershipId}/renew`,
        payload,
        this.getAxiosConfig()
      );

      const data = response.data?.data || response.data;

      console.log('✅ Membresía renovada exitosamente');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      return {
        success: true,
        membership: data.membership || data
      };

    } catch (error) {
      this.handleError(error, 'renewMembership');
    }
  }

  /**
   * Cancelar membresía
   */
  async cancelMembership(membershipId, reason = '') {
    try {
      console.log(`🚫 Cancelando membresía ${membershipId}...`);

      const payload = {
        reason: reason || 'Cancelación desde dashboard'
      };

      const response = await axios.post(
        `${this.baseURL}/memberships/${membershipId}/cancel`,
        payload,
        this.getAxiosConfig()
      );

      const data = response.data?.data || response.data;

      console.log('✅ Membresía cancelada exitosamente');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      return {
        success: true,
        membership: data.membership || data
      };

    } catch (error) {
      this.handleError(error, 'cancelMembership');
    }
  }

  /**
   * Eliminar membresía (solo admin)
   */
  async deleteMembership(membershipId) {
    try {
      console.log(`🗑️ Eliminando membresía ${membershipId}...`);

      const response = await axios.delete(
        `${this.baseURL}/memberships/${membershipId}`,
        this.getAxiosConfig()
      );

      console.log('✅ Membresía eliminada exitosamente');

      // Limpiar caché
      this.clearCache('memberships');
      this.clearCache('statistics');

      return {
        success: true,
        message: 'Membresía eliminada exitosamente'
      };

    } catch (error) {
      this.handleError(error, 'deleteMembership');
    }
  }

  // ============================================================================
  // CLIENTES Y USUARIOS
  // ============================================================================

  /**
   * Obtener lista de clientes para selector
   */
  async getClients(params = {}) {
    try {
      console.log('👥 Obteniendo lista de clientes...');

      const response = await axios.get(`${this.baseURL}/users`, {
        ...this.getAxiosConfig(),
        params: {
          role: 'cliente',
          limit: params.limit || 100,
          search: params.search || undefined,
          isActive: params.isActive !== undefined ? params.isActive : undefined
        }
      });

      const data = response.data?.data || response.data;
      const clients = data.users || data || [];

      console.log(`✅ ${clients.length} clientes obtenidos`);

      return {
        success: true,
        clients
      };

    } catch (error) {
      this.handleError(error, 'getClients');
    }
  }

  // ============================================================================
  // UTILIDADES Y VALIDACIONES
  // ============================================================================

  /**
   * Validar datos de membresía antes de crear/actualizar
   */
  validateMembershipData(data) {
    const errors = [];

    if (!data.userId) {
      errors.push('Usuario es requerido');
    }

    if (!data.planId) {
      errors.push('Plan es requerido');
    }

    if (!data.startDate) {
      errors.push('Fecha de inicio es requerida');
    }

    if (data.price !== undefined && data.price <= 0) {
      errors.push('Precio debe ser mayor a 0');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }

  /**
   * Formatear datos de membresía para la API
   */
  formatMembershipDataForAPI(formData) {
    return {
      planId: formData.planId,
      userId: formData.userId,
      selectedSchedule: formData.selectedSchedule || {},
      paymentMethod: formData.paymentMethod || 'cash',
      notes: formData.notes || '',
      startDate: formData.startDate,
      endDate: formData.endDate || undefined
    };
  }

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
   * Determinar estado visual de una membresía
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
        description: membership.payment?.paymentMethod === 'transfer'
          ? 'Validando transferencia...'
          : membership.payment?.paymentMethod === 'cash'
          ? 'Esperando pago...'
          : 'En proceso de validación...'
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

  /**
   * Health check del servicio
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });

      return {
        healthy: true,
        message: 'Servicio de gestión de membresías operativo',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        healthy: false,
        message: 'Servicio de gestión de membresías no disponible',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Debug: Mostrar información del servicio
   */
  getServiceInfo() {
    return {
      name: 'MembershipManagementService',
      version: '1.0.0',
      baseURL: this.baseURL,
      cacheSize: this.cache.size,
      cacheTimeout: `${this.cacheTimeout / 1000}s`,
      endpoints: {
        memberships: `${this.baseURL}/memberships`,
        plans: `${this.baseURL}/memberships/purchase/plans`,
        expired: `${this.baseURL}/memberships/expired`,
        expiringSoon: `${this.baseURL}/memberships/expiring-soon`,
        stats: `${this.baseURL}/memberships/stats`
      }
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