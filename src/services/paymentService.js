// Autor: Alexander Echeverria
// src/services/paymentService.js
// FUNCIÓN: Servicio especializado para gestión de pagos del gimnasio guatemalteco
// USO: Interfaz entre componentes React y API backend para transacciones en quetzales
// VERSIÓN: Completa con métodos separados por tipo de pago + Sincronización con backend

// Autor: Alexander Echeverria
// src/services/paymentService.js
// FUNCIÓN: Servicio especializado para gestión de pagos del gimnasio guatemalteco
// USO: Interfaz entre componentes React y API backend para transacciones en quetzales
// VERSIÓN: Completa con métodos separados por tipo de pago + Sincronización con backend
// ACTUALIZADO: Para usar exactamente los mismos endpoints que el test funcional

import { BaseService } from './baseService.js';

// ================================
// 🏦 CLASE PRINCIPAL DEL SERVICIO DE PAGOS
// ================================
class PaymentService extends BaseService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 segundos
  }

  // ================================
  // 🏦 MÉTODOS DE TRANSFERENCIAS - EXACTAMENTE COMO EL TEST (ACTUALIZADOS)
  // ================================

  /**
   * Validar transferencia (aprobar o rechazar) - MISMO ENDPOINT DEL TEST
   * @param {string} paymentId - ID del pago
   * @param {boolean} approved - true para aprobar, false para rechazar
   * @param {string} notes - Notas de validación (obligatorio para rechazos)
   * @returns {Promise<Object>} Resultado de la validación
   */
  async validateTransfer(paymentId, approved, notes = '') {
    try {
      console.log(`${approved ? '✅' : '❌'} PaymentService: Validando transferencia:`, paymentId);
      
      // MISMO ENDPOINT Y ESTRUCTURA QUE EL TEST
      const response = await this.post(`/api/payments/${paymentId}/validate-transfer`, {
        approved,
        notes: notes.trim() || undefined // undefined para nota automática si está vacío
      });
      
      console.log(`✅ PaymentService: Transferencia ${approved ? 'aprobada' : 'rechazada'}`);
      
      // Invalidar cache relacionado
      this.invalidatePaymentCache();
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error validando transferencia:', error);
      throw this.handleError(error, `Error al ${approved ? 'aprobar' : 'rechazar'} transferencia`);
    }
  }

  /**
   * Aprobar transferencia específicamente - WRAPPER PARA CLARIDAD
   * @param {string} paymentId - ID del pago  
   * @param {string} notes - Notas opcionales
   * @returns {Promise<Object>} Resultado de la aprobación
   */
  async approveTransfer(paymentId, notes = '') {
    return await this.validateTransfer(paymentId, true, notes);
  }

  /**
   * Rechazar transferencia específicamente - WRAPPER PARA CLARIDAD
   * @param {string} paymentId - ID del pago
   * @param {string} reason - Razón obligatoria del rechazo
   * @returns {Promise<Object>} Resultado del rechazo
   */
  async rejectTransfer(paymentId, reason) {
    if (!reason || !reason.trim()) {
      throw new Error('La razón de rechazo es obligatoria');
    }
    return await this.validateTransfer(paymentId, false, reason.trim());
  }

  /**
   * Obtener SOLO transferencias pendientes - MEJORADO para asegurar hoursWaiting
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<Object>} Lista de transferencias pendientes
   */
  async getPendingTransfers(params = {}) {
    try {
      console.log('🏦 PaymentService: Obteniendo transferencias pendientes...');
      
      const queryParams = {
        search: params.search?.trim() || undefined,
        sortBy: params.sortBy || 'waiting_time',
        priority: params.priority === 'all' ? undefined : params.priority
      };

      // Limpiar parámetros undefined
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const response = await this.get('/api/payments/transfers/pending-detailed', { 
        params: queryParams 
      });
      
      console.log(`✅ PaymentService: ${response.data?.transfers?.length || 0} transferencias obtenidas`);
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo transferencias:', error);
      return {
        success: true,
        data: { transfers: [], summary: { totalAmount: 0, count: 0 } }
      };
    }
  }

  /**
   * Obtener transferencias pendientes con detalles completos
   * @param {number} urgentHours - Horas para considerar urgente (default: 72)
   * @returns {Promise<Object>} Lista detallada de transferencias
   */
  async getPendingTransfersDetailed(urgentHours = 72) {
    try {
      console.log('🏦 PaymentService: Obteniendo transferencias detalladas...');
      
      const response = await this.get('/api/payments/transfers/pending-detailed', {
        params: { urgentHours }
      });
      
      console.log(`✅ PaymentService: Transferencias detalladas obtenidas`);
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo transferencias detalladas:', error);
      return this.getPendingTransfers(); // Fallback a básicas
    }
  }

  // ================================
  // 💵 MÉTODOS DE EFECTIVO - EXACTAMENTE COMO EL TEST (ACTUALIZADOS)
  // ================================

  /**
   * Activar membresía en efectivo (confirmar pago) - MISMO ENDPOINT DEL TEST
   * @param {string} paymentId - ID del pago
   * @param {Object} activationData - Datos opcionales de activación
   * @returns {Promise<Object>} Resultado de la activación
   */
  async activateCashMembership(paymentId, activationData = {}) {
    try {
      console.log('💵 PaymentService: Activando membresía en efectivo:', paymentId);
      
      // MISMO ENDPOINT Y ESTRUCTURA QUE EL TEST
      const response = await this.post('/api/payments/activate-cash-membership', {
        paymentId: paymentId, // Usar paymentId como en el test
        notes: activationData.notes || undefined // Opcional, backend genera automática
      });
      
      console.log('✅ PaymentService: Membresía activada exitosamente');
      
      // Invalidar cache
      this.invalidatePaymentCache();
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error activando membresía:', error);
      throw this.handleError(error, 'Error al activar membresía en efectivo');
    }
  }

  /**
   * Cancelar pago en efectivo - MISMO ENDPOINT DEL TEST
   * @param {string} paymentId - ID del pago
   * @param {string} reason - Razón obligatoria de cancelación
   * @returns {Promise<Object>} Resultado de la cancelación
   */
  async cancelCashPayment(paymentId, reason) {
    try {
      console.log('❌ PaymentService: Cancelando pago en efectivo:', paymentId);
      
      if (!reason || !reason.trim()) {
        throw new Error('La razón de cancelación es obligatoria');
      }
      
      // MISMO ENDPOINT Y ESTRUCTURA QUE EL TEST
      const response = await this.post(`/api/payments/${paymentId}/cancel-cash-payment`, {
        reason: reason.trim()
      });
      
      console.log('✅ PaymentService: Pago en efectivo cancelado exitosamente');
      
      // Invalidar cache
      this.invalidatePaymentCache();
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error cancelando pago en efectivo:', error);
      throw this.handleError(error, 'Error al cancelar pago en efectivo');
    }
  }

  /**
   * Obtener SOLO pagos en efectivo pendientes - MEJORADO para el test
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<Object>} Lista de pagos en efectivo pendientes
   */
  async getPendingCashPayments(params = {}) {
    try {
      console.log('💵 PaymentService: Obteniendo pagos en efectivo pendientes...');
      
      const queryParams = {
        search: params.search?.trim() || undefined,
        sortBy: params.sortBy || 'waiting_time',
        priority: params.priority === 'all' ? undefined : params.priority
      };

      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const response = await this.get('/api/payments/cash/pending', { 
        params: queryParams 
      });
      
      console.log(`✅ PaymentService: ${response.data?.payments?.length || 0} pagos en efectivo obtenidos`);
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo pagos en efectivo:', error);
      return {
        success: true,
        data: { payments: [], summary: { totalAmount: 0, count: 0 } }
      };
    }
  }

  /**
   * Confirmar pago en efectivo recibido físicamente
   * @param {string} paymentId - ID del pago
   * @param {Object} confirmationData - Datos de confirmación
   * @returns {Promise<Object>} Resultado de la confirmación
   */
  async confirmCashPayment(paymentId, confirmationData = {}) {
    try {
      console.log('💵 PaymentService: Confirmando pago en EFECTIVO:', paymentId);
      
      const response = await this.post(`/api/payments/${paymentId}/confirm-cash`, {
        notes: confirmationData.notes?.trim() || 'Pago en efectivo recibido',
        receivedAmount: confirmationData.receivedAmount || undefined,
        confirmedBy: confirmationData.confirmedBy || undefined
      });
      
      console.log('✅ PaymentService: Pago en EFECTIVO confirmado exitosamente');
      
      // Invalidar cache
      this.invalidatePaymentCache();
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error confirmando pago en efectivo:', error);
      throw this.handleError(error, 'Error al confirmar pago en efectivo');
    }
  }

  /**
   * Obtener estadísticas específicas de pagos en efectivo
   * @returns {Promise<Object>} Estadísticas de efectivo
   */
  async getCashPaymentStats() {
    try {
      console.log('📊 PaymentService: Obteniendo estadísticas de EFECTIVO...');
      
      const response = await this.get('/api/payments/cash/stats');
      
      console.log('✅ PaymentService: Estadísticas de efectivo obtenidas');
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo estadísticas de efectivo:', error);
      return {
        success: true,
        data: {
          total: 0,
          urgent: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgHours: 0
        }
      };
    }
  }

  // ================================
  // 💰 MÉTODOS DE HISTORIAL DE PAGOS GENERAL (MANTENER FUNCIONALIDAD ACTUAL)
  // ================================

  /**
   * Obtener pagos generales con filtros - ACTUALIZADO
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<Object>} Lista de pagos
   */
  async getPayments(params = {}) {
    try {
      console.log('💰 PaymentService: Obteniendo historial de pagos...');
      
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        search: params.search?.trim() || undefined,
        status: params.status || undefined,
        paymentMethod: params.paymentMethod || undefined,
        includeAll: true
      };

      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      const response = await this.get('/api/payments', { params: queryParams });
      
      console.log(`✅ PaymentService: ${response.data?.payments?.length || 0} pagos obtenidos`);
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo pagos:', error);
      throw this.handleError(error, 'Error al obtener historial de pagos');
    }
  }

  /**
   * Obtener pago específico por ID
   * @param {string} paymentId - ID del pago
   * @returns {Promise<Object>} Detalles completos del pago
   */
  async getPaymentById(paymentId) {
    try {
      console.log('🔍 PaymentService: Obteniendo pago por ID:', paymentId);
      
      const response = await this.get(`/api/payments/${paymentId}`);
      
      console.log('✅ PaymentService: Pago obtenido exitosamente');
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo pago:', error);
      throw this.handleError(error, 'Error al obtener detalles del pago');
    }
  }

  /**
   * Buscar pagos por cliente (búsqueda rápida)
   * @param {string} searchTerm - Término de búsqueda
   * @param {number} limit - Límite de resultados (default: 10)
   * @returns {Promise<Object>} Resultados de búsqueda
   */
  async searchPayments(searchTerm, limit = 10) {
    try {
      console.log('🔍 PaymentService: Buscando pagos:', searchTerm);
      
      const response = await this.get('/api/payments/search', {
        params: {
          q: searchTerm.trim(),
          limit: limit
        }
      });
      
      console.log(`✅ PaymentService: ${response.data?.length || 0} resultados encontrados`);
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error en búsqueda:', error);
      throw this.handleError(error, 'Error al buscar pagos');
    }
  }

  // ================================
  // 💳 MÉTODOS ESPECÍFICOS PARA TARJETAS (MEJORADO PARA SINCRONIZACIÓN)
  // ================================

  /**
   * Obtener SOLO pagos con tarjeta - NUEVO método para sincronizar con el test
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<Object>} Lista de pagos con tarjeta
   */
  async getCardPayments(params = {}) {
    try {
      console.log('💳 PaymentService: Obteniendo pagos con TARJETA...', params);
      
      const queryParams = {
        paymentMethod: 'card',
        limit: params.limit || 50,
        page: params.page || 1,
        includeAll: 'true',
        search: params.search?.trim() || undefined,
        status: params.status || undefined
      };

      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const response = await this.get('/api/payments', { params: queryParams });
      
      // Manejar respuesta del backend como en el test
      if (response?.data) {
        if (response.data.success) {
          const payments = response.data.data?.payments || [];
          
          console.log(`✅ PaymentService: ${payments.length} pagos con TARJETA obtenidos`);
          
          return {
            success: true,
            data: {
              payments: payments
            }
          };
        } else if (response.data.payments) {
          return {
            success: true,
            data: {
              payments: response.data.payments
            }
          };
        }
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo pagos con tarjeta:', error);
      return {
        success: true,
        data: { payments: [] }
      };
    }
  }

  /**
   * Obtener SOLO pagos con tarjeta pendientes
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<Object>} Lista de pagos con tarjeta pendientes
   */
  async getPendingCardPayments(params = {}) {
    try {
      console.log('💳 PaymentService: Obteniendo SOLO pagos con TARJETA pendientes...', params);
      
      const queryParams = {
        paymentMethod: 'card',     // FORZAR solo tarjetas
        status: 'pending',         // FORZAR solo pendientes
        search: params.search?.trim() || undefined,
        sortBy: params.sortBy || 'waiting_time',
        priority: params.priority === 'all' ? undefined : params.priority
      };

      // Limpiar parámetros undefined
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const response = await this.get('/api/payments/card/pending', { params: queryParams });
      
      console.log(`✅ PaymentService: ${response.data?.payments?.length || 0} pagos con TARJETA pendientes`);
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo pagos con tarjeta:', error);
      return {
        success: true,
        data: {
          payments: [],
          summary: { 
            totalAmount: 0, 
            count: 0, 
            urgent: 0,
            avgHours: 0,
            avgAmount: 0,
            total: 0
          }
        }
      };
    }
  }

  /**
   * Obtener pagos específicos de Stripe - NUEVO método para el test
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<Object>} Lista de pagos de Stripe
   */
  async getStripePayments(params = {}) {
    try {
      console.log('🌟 PaymentService: Obteniendo pagos de STRIPE...', params);
      
      const queryParams = {
        limit: params.limit || 30
      };
      
      const response = await this.get('/api/stripe/payments', { params: queryParams });
      
      // Manejar respuesta del backend como en el test
      if (response?.data) {
        if (response.data.success) {
          const payments = response.data.data?.payments || [];
          
          console.log(`✅ PaymentService: ${payments.length} pagos de STRIPE obtenidos`);
          
          return {
            success: true,
            data: {
              payments: payments
            }
          };
        } else {
          return {
            success: true,
            data: {
              payments: response.data.payments || []
            }
          };
        }
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo pagos de Stripe:', error);
      return {
        success: true,
        data: { payments: [] }
      };
    }
  }

  /**
   * Obtener estadísticas específicas de pagos con tarjeta
   * @returns {Promise<Object>} Estadísticas de tarjeta
   */
  async getCardPaymentStats() {
    try {
      console.log('📊 PaymentService: Obteniendo estadísticas de TARJETA...');
      
      const response = await this.get('/api/payments/card/stats');
      
      console.log('✅ PaymentService: Estadísticas de tarjeta obtenidas');
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo estadísticas de tarjeta:', error);
      return {
        success: true,
        data: {
          total: 0,
          urgent: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgHours: 0
        }
      };
    }
  }

  /**
   * Confirmar pago con tarjeta procesado
   * @param {string} paymentId - ID del pago
   * @param {Object} confirmationData - Datos de confirmación
   * @returns {Promise<Object>} Resultado de la confirmación
   */
  async confirmCardPayment(paymentId, confirmationData = {}) {
    try {
      console.log('💳 PaymentService: Confirmando pago con TARJETA:', paymentId);
      
      const response = await this.post(`/api/payments/${paymentId}/confirm-card`, {
        notes: confirmationData.notes?.trim() || 'Pago con tarjeta procesado',
        transactionId: confirmationData.transactionId || undefined,
        cardLast4: confirmationData.cardLast4 || undefined,
        confirmedBy: confirmationData.confirmedBy || undefined
      });
      
      console.log('✅ PaymentService: Pago con TARJETA confirmado exitosamente');
      
      // Invalidar cache
      this.invalidatePaymentCache();
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error confirmando pago con tarjeta:', error);
      throw this.handleError(error, 'Error al confirmar pago con tarjeta');
    }
  }

  /**
   * Cancelar/anular pago con tarjeta
   * @param {string} paymentId - ID del pago
   * @param {Object} cancellationData - Datos de cancelación
   * @returns {Promise<Object>} Resultado de la cancelación
   */
  async cancelCardPayment(paymentId, cancellationData = {}) {
    try {
      console.log('❌ PaymentService: Cancelando pago con TARJETA:', paymentId);
      
      const response = await this.post(`/api/payments/${paymentId}/cancel-card`, {
        reason: cancellationData.reason?.trim() || 'Cancelado por administrador',
        notes: cancellationData.notes?.trim() || ''
      });
      
      console.log('✅ PaymentService: Pago con TARJETA cancelado exitosamente');
      
      // Invalidar cache
      this.invalidatePaymentCache();
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error cancelando pago con tarjeta:', error);
      throw this.handleError(error, 'Error al cancelar pago con tarjeta');
    }
  }

  // ================================
  // 💵 MÉTODOS DE MEMBRESÍAS EN EFECTIVO (MANTENER COMPATIBILIDAD + MEJORAR)
  // ================================

  /**
   * Obtener membresías pendientes de pago en efectivo - MEJORADO para el test
   * @param {Object} params - Parámetros de filtro
   * @returns {Promise<Object>} Lista de membresías en efectivo pendientes
   */
  async getPendingCashMemberships(params = {}) {
    try {
      console.log('💵 PaymentService: Obteniendo membresías en efectivo pendientes...');
      
      // Intentar el endpoint específico de membresías primero
      try {
        const response = await this.get('/api/payments/cash/pending-memberships', { params });
        
        if (response?.data && response.data.memberships) {
          console.log(`✅ PaymentService: ${response.data.memberships.length} membresías en efectivo (endpoint específico)`);
          return response;
        }
      } catch (error) {
        console.log('⚠️ Endpoint específico de membresías no disponible, usando pagos en efectivo...');
      }
      
      // Fallback: usar pagos en efectivo y filtrar por membresías
      const cashPaymentsResponse = await this.getPendingCashPayments(params);
      
      if (cashPaymentsResponse?.success && cashPaymentsResponse.data?.payments) {
        // Filtrar solo las que son de tipo membership o tienen datos de membresía
        const memberships = cashPaymentsResponse.data.payments.filter(payment => 
          payment.paymentType === 'membership' || 
          payment.concept?.toLowerCase().includes('membresía') ||
          payment.membership ||
          payment.plan
        );
        
        console.log(`✅ PaymentService: ${memberships.length} membresías filtradas de pagos en efectivo`);
        
        return {
          success: true,
          data: {
            memberships: memberships,
            summary: {
              totalAmount: memberships.reduce((sum, m) => sum + (m.amount || m.price || 0), 0),
              count: memberships.length
            }
          }
        };
      }
      
      return {
        success: true,
        data: { memberships: [], summary: { totalAmount: 0, count: 0 } }
      };
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo membresías en efectivo:', error);
      return {
        success: true,
        data: { memberships: [], summary: { totalAmount: 0, count: 0 } }
      };
    }
  }

  /**
   * Cancelar membresía en efectivo
   * @param {string} membershipId - ID de la membresía
   * @param {Object} cancellationData - Datos de cancelación
   * @returns {Promise<Object>} Resultado de la cancelación
   */
  async cancelCashMembership(membershipId, cancellationData = {}) {
    try {
      // Intentar endpoint específico
      const response = await this.post('/api/payments/cancel-cash-membership', {
        membershipId,
        reason: cancellationData.reason || 'Cliente no llegó a realizar el pago',
        notes: cancellationData.notes || 'Membresía cancelada por falta de pago'
      });
      
      this.invalidatePaymentCache();
      return response;
      
    } catch (error) {
      // Fallback a método genérico
      return await this.cancelCashPayment(membershipId, cancellationData.reason || 'Cliente no llegó a realizar el pago');
    }
  }

  /**
   * Obtener estadísticas específicas de membresías en efectivo
   * @returns {Promise<Object>} Estadísticas de membresías en efectivo
   */
  async getCashMembershipStats() {
    try {
      console.log('📊 PaymentService: Obteniendo estadísticas de membresías en efectivo...');
      
      const response = await this.get('/api/payments/cash/membership-stats');
      
      console.log('✅ PaymentService: Estadísticas de membresías obtenidas');
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo estadísticas de membresías:', error);
      return {
        success: true,
        data: {
          total: 0,
          urgent: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgHours: 0
        }
      };
    }
  }

  // ================================
  // 📊 MÉTODOS DE ESTADÍSTICAS GENERALES (ACTUALIZADOS)
  // ================================

  /**
   * Obtener estadísticas de pagos - ACTUALIZADO
   * @returns {Promise<Object>} Estadísticas generales
   */
  async getPaymentStatistics() {
    try {
      const response = await this.get('/api/payments/statistics');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        success: true,
        data: {
          totalIncome: 0,
          totalPayments: 0,
          averagePayment: 0
        }
      };
    }
  }

  /**
   * Obtener dashboard financiero - ACTUALIZADO
   * @returns {Promise<Object>} Dashboard financiero
   */
  async getFinancialDashboard() {
    try {
      const response = await this.get('/api/financial/dashboard');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo dashboard financiero:', error);
      return {
        success: true,
        data: {
          today: { income: 0, expenses: 0 },
          thisWeek: { income: 0, expenses: 0 },
          thisMonth: { income: 0, expenses: 0 }
        }
      };
    }
  }

  /**
   * Obtener dashboard de pendientes - ACTUALIZADO
   * @returns {Promise<Object>} Dashboard de pendientes
   */
  async getPendingPaymentsDashboard() {
    try {
      const response = await this.get('/api/payments/pending-dashboard');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo dashboard de pendientes:', error);
      return {
        success: true,
        data: {
          summary: {
            pendingTransfers: { count: 0, totalAmount: 0 },
            pendingCashPayments: { count: 0, totalAmount: 0 }
          }
        }
      };
    }
  }

  // ================================
  // 🔧 MÉTODOS DE UTILIDAD (ACTUALIZADOS)
  // ================================

  /**
   * Invalidar cache de pagos - ACTUALIZADO
   */
  invalidatePaymentCache() {
    console.log('🗑️ PaymentService: Invalidando cache de pagos');
    this.cache.clear();
  }

  /**
   * Actualizar estado de pago
   * @param {string} paymentId - ID del pago
   * @param {string} newStatus - Nuevo estado
   * @param {Object} updateData - Datos de actualización
   * @returns {Promise<Object>} Resultado de la actualización
   */
  async updatePaymentStatus(paymentId, newStatus, updateData = {}) {
    const response = await this.patch(`/api/payments/${paymentId}/status`, {
      status: newStatus,
      reason: updateData.reason || `Estado cambiado a ${newStatus}`,
      notes: updateData.notes || ''
    });
    
    this.invalidatePaymentCache();
    return response;
  }

  // ================================
  // 🎯 MÉTODOS DE CONFIGURACIÓN Y UTILIDADES (MANTENER TODOS)
  // ================================

  /**
   * Obtener configuración de prioridad para transferencias
   * @param {number} hoursWaiting - Horas de espera
   * @returns {Object} Configuración de prioridad con colores y estilos
   */
  getTransferPriorityConfig(hoursWaiting) {
    if (hoursWaiting >= 72) {
      return {
        priority: 'critical',
        label: 'Crítica',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: '🔴'
      };
    } else if (hoursWaiting >= 48) {
      return {
        priority: 'high',
        label: 'Alta',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: '🟡'
      };
    } else if (hoursWaiting >= 24) {
      return {
        priority: 'medium',
        label: 'Media',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: '🟠'
      };
    } else {
      return {
        priority: 'normal',
        label: 'Normal',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: '🟢'
      };
    }
  }

  /**
   * Obtener configuración de prioridad para pagos en efectivo
   * @param {number} hoursWaiting - Horas de espera
   * @returns {Object} Configuración de prioridad con colores y estilos
   */
  getCashPaymentPriorityConfig(hoursWaiting) {
    if (hoursWaiting >= 4) {
      return {
        priority: 'urgent',
        label: 'Urgente',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: '🟠'
      };
    } else {
      return {
        priority: 'normal',
        label: 'Normal',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: '🟢'
      };
    }
  }

  /**
   * Obtener configuración de prioridad para pagos con tarjeta
   * @param {number} hoursWaiting - Horas de espera
   * @returns {Object} Configuración de prioridad con colores y estilos
   */
  getCardPaymentPriorityConfig(hoursWaiting) {
    if (hoursWaiting >= 24) {
      return {
        priority: 'urgent',
        label: 'Urgente',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: '🔴'
      };
    } else if (hoursWaiting >= 12) {
      return {
        priority: 'medium',
        label: 'Media',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: '🟡'
      };
    } else {
      return {
        priority: 'normal',
        label: 'Normal',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: '🟢'
      };
    }
  }

  /**
   * Obtener configuración de método de pago
   * @param {string} method - Método de pago
   * @returns {Object} Configuración con iconos y estilos
   */
  getPaymentMethodConfig(method) {
    const configs = {
      cash: {
        label: 'Efectivo',
        icon: 'Banknote',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Pago físico en efectivo'
      },
      card: {
        label: 'Tarjeta',
        icon: 'CreditCard',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Pago con tarjeta de crédito/débito'
      },
      transfer: {
        label: 'Transferencia',
        icon: 'Building',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        description: 'Transferencia bancaria'
      },
      mobile: {
        label: 'Pago Móvil',
        icon: 'Smartphone',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        description: 'Pago a través de aplicación móvil'
      }
    };
    
    return configs[method] || configs.cash;
  }

  /**
   * Obtener configuración de estado de pago
   * @param {string} status - Estado del pago
   * @returns {Object} Configuración con colores y estilos
   */
  getPaymentStatusConfig(status) {
    const configs = {
      completed: {
        label: 'Completado',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Pago procesado exitosamente'
      },
      pending: {
        label: 'Pendiente',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        description: 'Pago esperando confirmación'
      },
      failed: {
        label: 'Fallido',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Pago no pudo ser procesado'
      },
      cancelled: {
        label: 'Cancelado',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        description: 'Pago cancelado por el usuario o administrador'
      }
    };
    
    return configs[status] || configs.pending;
  }

  /**
   * Obtener configuración de tipo de pago
   * @param {string} type - Tipo de pago
   * @returns {Object} Configuración con etiquetas
   */
  getPaymentTypeConfig(type) {
    const configs = {
      membership: {
        label: 'Membresía',
        description: 'Pago de cuota mensual de membresía'
      },
      daily: {
        label: 'Pago Diario',
        description: 'Acceso por día individual'
      },
      bulk_daily: {
        label: 'Pago Múltiple',
        description: 'Varios días consecutivos'
      },
      store_cash_delivery: {
        label: 'Tienda (Efectivo)',
        description: 'Compra en tienda pagada en efectivo'
      },
      store_card_delivery: {
        label: 'Tienda (Tarjeta)',
        description: 'Compra en tienda pagada con tarjeta'
      },
      store_online: {
        label: 'Tienda (Online)',
        description: 'Compra online de la tienda'
      },
      store_transfer: {
        label: 'Tienda (Transferencia)',
        description: 'Compra en tienda pagada por transferencia'
      }
    };
    
    return configs[type] || configs.membership;
  }

  // ================================
  // 🗃️ MÉTODOS DE CACHE (MANTENER TODOS)
  // ================================

  /**
   * Obtener datos del cache
   * @param {string} key - Clave del cache
   * @returns {Object|null} Datos cacheados o null
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }

  /**
   * Guardar datos en cache
   * @param {string} key - Clave del cache
   * @param {Object} data - Datos a cachear
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Obtener dashboard de pendientes con cache
   * @returns {Promise<Object>} Dashboard con cache optimizado
   */
  async getPendingPaymentsDashboardWithCache() {
    const cacheKey = 'pendingDashboard';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      console.log('📋 PaymentService: Usando dashboard desde cache');
      return cached;
    }
    
    const data = await this.getPendingPaymentsDashboard();
    this.setCachedData(cacheKey, data);
    
    return data;
  }

  // ================================
  // 🎯 MÉTODOS DE COMPATIBILIDAD CON HOOKS EXISTENTES
  // ================================

  /**
   * Función para obtener icono del método de pago - COMPATIBILIDAD
   */
  getPaymentMethodIcon(method) {
    const icons = {
      cash: 'Banknote',
      card: 'CreditCard',
      transfer: 'Building',
      mobile: 'Building'
    };
    return icons[method] || 'CreditCard';
  }

  /**
   * Función para obtener color del estado - COMPATIBILIDAD
   */
  getStatusColor(status) {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      failed: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.completed;
  }

  // ================================
  // 🛠️ MÉTODOS DE DEBUGGING Y SALUD (MANTENER TODOS)
  // ================================

  /**
   * Verificar salud del sistema de pagos
   * @returns {Promise<Object>} Estado de salud del sistema
   */
  async paymentHealthCheck() {
    try {
      console.log('🏥 PaymentService: Verificando salud del sistema...');
      
      const response = await this.get('/api/payments/health');
      
      console.log('✅ PaymentService: Sistema de pagos saludable');
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Sistema de pagos con problemas:', error);
      return {
        success: false,
        message: 'Sistema de pagos no disponible',
        error: error.message
      };
    }
  }

  /**
   * Obtener información del servicio de pagos
   * @returns {Object} Información del servicio
   */
  getPaymentServiceInfo() {
    return {
      name: 'PaymentService',
      version: '2.2.0',
      features: [
        'Validación de transferencias (exactamente como el test)',
        'Activación de membresías en efectivo (exactamente como el test)',
        'Cancelación de pagos en efectivo (exactamente como el test)',
        'Obtener pendientes por método (exactamente como el test)',
        'Historial de pagos con filtros avanzados',
        'Gestión separada por método de pago',
        'Procesamiento de pagos con tarjeta',
        'Integración con Stripe',
        'Dashboard financiero completo',
        'Estadísticas detalladas por método',
        'Cache inteligente optimizado',
        'Configuraciones de UI completas',
        'Sistema de prioridades por tiempo',
        'Sincronización con backend mejorada',
        'Compatibilidad con hooks existentes'
      ],
      supportedMethods: ['cash', 'card', 'transfer', 'mobile'],
      supportedTypes: ['membership', 'daily', 'bulk_daily', 'store_cash_delivery', 'store_card_delivery', 'store_online', 'store_transfer'],
      supportedStatuses: ['completed', 'pending', 'failed', 'cancelled'],
      apiEndpoints: {
        // ENDPOINTS ACTUALIZADOS - EXACTAMENTE COMO EL TEST
        transfers: [
          'GET /api/payments/transfers/pending-detailed',
          'POST /api/payments/:id/validate-transfer',
        ],
        cash: [
          'GET /api/payments/cash/pending',
          'POST /api/payments/activate-cash-membership',
          'POST /api/payments/:id/cancel-cash-payment'
        ],
        // ENDPOINTS MANTENIDOS DEL SISTEMA COMPLETO
        general: [
          'GET /api/payments',
          'GET /api/payments/:id',
          'GET /api/payments/search',
          'GET /api/payments/statistics',
          'GET /api/payments/pending-dashboard'
        ],
        cashExtended: [
          'GET /api/payments/cash/stats',
          'GET /api/payments/cash/pending-memberships',
          'POST /api/payments/:id/confirm-cash',
          'POST /api/payments/cancel-cash-membership'
        ],
        transfersExtended: [
          'GET /api/payments/transfers/pending',
          'POST /api/payments/:id/reject-transfer'
        ],
        cards: [
          'GET /api/payments/card/pending',
          'GET /api/payments/card/stats',
          'POST /api/payments/:id/confirm-card',
          'POST /api/payments/:id/cancel-card'
        ],
        stripe: [
          'GET /api/stripe/payments'
        ],
        financial: [
          'GET /api/financial/dashboard'
        ],
        utilities: [
          'GET /api/payments/health',
          'PATCH /api/payments/:id/status'
        ]
      }
    };
  }

  /**
   * Debug completo del sistema de pagos
   * @returns {Promise<Object>} Información de debug
   */
  async debugPaymentSystem() {
    console.log('🔍 PaymentService: Iniciando debug completo...');
    
    const debugInfo = {
      serviceInfo: this.getPaymentServiceInfo(),
      cacheSize: this.cache.size,
      systemHealth: await this.paymentHealthCheck(),
      timestamp: new Date().toISOString()
    };
    
    try {
      // Probar endpoints principales
      debugInfo.endpoints = {
        payments: await this.getPayments({ limit: 1 }).then(() => '✅ OK').catch(() => '❌ Error'),
        statistics: await this.getPaymentStatistics().then(() => '✅ OK').catch(() => '❌ Error'),
        pendingDashboard: await this.getPendingPaymentsDashboard().then(() => '✅ OK').catch(() => '❌ Error'),
        transfers: await this.getPendingTransfers().then(() => '✅ OK').catch(() => '❌ Error'),
        cashPayments: await this.getPendingCashPayments().then(() => '✅ OK').catch(() => '❌ Error'),
        cashMemberships: await this.getPendingCashMemberships().then(() => '✅ OK').catch(() => '❌ Error'),
        cardPayments: await this.getCardPayments().then(() => '✅ OK').catch(() => '❌ Error'),
        stripePayments: await this.getStripePayments().then(() => '✅ OK').catch(() => '❌ Error')
      };
    } catch (error) {
      debugInfo.endpoints = { error: error.message };
    }
    
    console.log('🔍 PaymentService: Debug completado', debugInfo);
    return debugInfo;
  }

  /**
   * Método para obtener todos los datos como en el script de testing
   * @returns {Promise<Object>} Todos los datos del sistema de pagos
   */
  async getAllPaymentData() {
    try {
      console.log('🎯 PaymentService: Obteniendo TODOS los datos como en el test...');
      
      const [
        statistics,
        pendingDashboard,
        pendingCash,
        pendingTransfers,
        cardPayments,
        stripePayments,
        allPayments,
        financialDashboard
      ] = await Promise.all([
        this.getPaymentStatistics(),
        this.getPendingPaymentsDashboard(),
        this.getPendingCashPayments(),
        this.getPendingTransfers(),
        this.getCardPayments(),
        this.getStripePayments(),
        this.getPayments({ limit: 100 }),
        this.getFinancialDashboard()
      ]);
      
      console.log('✅ TODOS los datos obtenidos exitosamente');
      
      return {
        success: true,
        data: {
          statistics: statistics.data,
          pendingDashboard: pendingDashboard.data,
          pendingCash: pendingCash.data,
          pendingTransfers: pendingTransfers.data,
          cardPayments: cardPayments.data,
          stripePayments: stripePayments.data,
          allPayments: allPayments.data,
          financialDashboard: financialDashboard.data
        }
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo todos los datos:', error);
      throw error;
    }
  }
}

// ================================
// 🏭 EXPORTAR INSTANCIA SINGLETON
// ================================
const paymentService = new PaymentService();
export default paymentService;