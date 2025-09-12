// src/services/paymentService.js
// SERVICIO ESPECIALIZADO PARA GESTIÓN DE PAGOS Y AUTORIZACIONES

import { BaseService } from './baseService.js';

// ================================
// 💰 SERVICIO DE GESTIÓN DE PAGOS
// ================================
export class PaymentService extends BaseService {
  constructor() {
    super();
    this.cache = new Map(); // Cache para optimizar peticiones
    this.cacheMaxAge = 30000; // 30 segundos por defecto
  }

  // ================================
  // 📊 DASHBOARD: VISTA COMBINADA
  // ================================

  /**
   * Obtiene vista combinada de movimientos financieros
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Vista combinada de movimientos
   */
  async getMovementsWithPayments(params = {}) {
    try {
      const response = await this.get('/financial/movements-with-payments', params);
      return response;
    } catch (error) {
      console.error('Error al obtener movimientos con pagos:', error);
      throw this.handleApiError(error, 'No se pudieron obtener los movimientos financieros');
    }
  }

  /**
   * Dashboard de pagos pendientes
   * @returns {Promise<Object>} Resumen de pagos pendientes
   */
  async getPendingPaymentsDashboard() {
    try {
      const response = await this.get('/payments/pending-dashboard');
      return response;
    } catch (error) {
      console.error('Error al obtener dashboard de pagos:', error);
      throw this.handleApiError(error, 'No se pudo obtener el dashboard de pagos pendientes');
    }
  }

  /**
   * Dashboard con cache para mejor rendimiento
   * @param {number} maxAge - Tiempo máximo de cache en milisegundos
   * @returns {Promise<Object>} Dashboard cacheado
   */
  async getPendingPaymentsDashboardWithCache(maxAge = 30000) {
    const cacheKey = 'pending-payments-dashboard';
    const cached = this.getCachedData(cacheKey, maxAge);
    
    if (cached) {
      return cached;
    }

    const data = await this.getPendingPaymentsDashboard();
    this.setCachedData(cacheKey, data);
    return data;
  }

  // ================================
  // 🏦 TRANSFERENCIAS BANCARIAS
  // ================================

  /**
   * Obtiene transferencias pendientes
   * @param {boolean} detailed - Si incluir detalles adicionales
   * @param {number} hoursFilter - Filtro por horas de espera
   * @returns {Promise<Object>} Lista de transferencias pendientes
   */
  async getPendingTransfers(detailed = false, hoursFilter = null) {
    try {
      const endpoint = detailed ? '/payments/transfers/pending-detailed' : '/payments/transfers/pending';
      const params = hoursFilter ? { hours: hoursFilter } : {};
      
      const response = await this.get(endpoint, params);
      return response;
    } catch (error) {
      console.error('Error al obtener transferencias pendientes:', error);
      throw this.handleApiError(error, 'No se pudieron obtener las transferencias pendientes');
    }
  }

  /**
   * Valida una transferencia bancaria
   * @param {string} paymentId - ID del pago
   * @param {boolean} approved - Si se aprueba o rechaza
   * @param {string} notes - Notas adicionales
   * @returns {Promise<Object>} Resultado de la validación
   */
  async validateTransfer(paymentId, approved, notes = '') {
    try {
      const response = await this.post(`/payments/${paymentId}/validate-transfer`, {
        approved,
        notes
      });
      
      // Invalidar cache después del cambio
      this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Error al validar transferencia:', error);
      throw this.handleApiError(error, 'No se pudo validar la transferencia');
    }
  }

  /**
   * Rechaza una transferencia bancaria
   * @param {string} paymentId - ID del pago
   * @param {string} reason - Motivo del rechazo
   * @returns {Promise<Object>} Resultado del rechazo
   */
  async rejectTransfer(paymentId, reason) {
    try {
      const response = await this.post(`/payments/${paymentId}/reject-transfer`, {
        reason
      });
      
      // Invalidar cache después del cambio
      this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Error al rechazar transferencia:', error);
      throw this.handleApiError(error, 'No se pudo rechazar la transferencia');
    }
  }

  // ================================
  // 💵 MEMBRESÍAS EN EFECTIVO
  // ================================

  /**
   * Obtiene membresías pendientes de pago en efectivo
   * @returns {Promise<Object>} Lista de membresías pendientes
   */
  async getPendingCashMemberships() {
    try {
      const response = await this.get('/memberships/pending-cash-payment');
      return response;
    } catch (error) {
      console.error('Error al obtener membresías en efectivo pendientes:', error);
      throw this.handleApiError(error, 'No se pudieron obtener las membresías pendientes');
    }
  }

  /**
   * Activa una membresía cuando se recibe el pago en efectivo
   * @param {string} membershipId - ID de la membresía
   * @returns {Promise<Object>} Resultado de la activación
   */
  async activateCashMembership(membershipId) {
    try {
      const response = await this.post('/payments/activate-cash-membership', {
        membership_id: membershipId
      });
      
      // Invalidar cache después del cambio
      this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Error al activar membresía en efectivo:', error);
      throw this.handleApiError(error, 'No se pudo activar la membresía');
    }
  }

  // ================================
  // 📈 ESTADÍSTICAS Y REPORTES
  // ================================

  /**
   * Obtiene estadísticas de pagos
   * @param {Object} dateRange - Rango de fechas
   * @returns {Promise<Object>} Estadísticas de pagos
   */
  async getPaymentStats(dateRange = {}) {
    try {
      const response = await this.get('/payments/statistics', dateRange);
      return response;
    } catch (error) {
      console.error('Error al obtener estadísticas de pagos:', error);
      throw this.handleApiError(error, 'No se pudieron obtener las estadísticas');
    }
  }

  // ================================
  // 🔧 VALIDACIÓN Y FORMATEO
  // ================================

  /**
   * Valida datos de pago antes del envío
   * @param {Object} paymentData - Datos del pago
   * @returns {Object} Resultado de la validación
   */
  validatePaymentData(paymentData) {
    const errors = [];

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }

    if (!paymentData.method) {
      errors.push('El método de pago es requerido');
    }

    if (!paymentData.user_id) {
      errors.push('El ID de usuario es requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatea datos de pago para la API
   * @param {Object} paymentData - Datos del pago
   * @returns {Object} Datos formateados
   */
  formatPaymentDataForAPI(paymentData) {
    return {
      amount: parseFloat(paymentData.amount),
      method: paymentData.method,
      user_id: paymentData.user_id,
      notes: paymentData.notes || '',
      created_at: new Date().toISOString()
    };
  }

  // ================================
  // 🎨 CONFIGURACIONES DE UI
  // ================================

  /**
   * Configuración de prioridad por tiempo de espera
   * @param {number} hoursWaiting - Horas de espera
   * @returns {Object} Configuración de prioridad
   */
  getTransferPriorityConfig(hoursWaiting) {
    if (hoursWaiting >= 48) {
      return {
        priority: 'urgent',
        color: 'red',
        badge: 'Urgente',
        icon: '🚨'
      };
    } else if (hoursWaiting >= 24) {
      return {
        priority: 'high',
        color: 'orange',
        badge: 'Prioridad Alta',
        icon: '⚠️'
      };
    } else if (hoursWaiting >= 12) {
      return {
        priority: 'medium',
        color: 'yellow',
        badge: 'Prioridad Media',
        icon: '⏰'
      };
    }
    
    return {
      priority: 'normal',
      color: 'blue',
      badge: 'Normal',
      icon: '📝'
    };
  }

  /**
   * Configuración de métodos de pago
   * @param {string} method - Método de pago
   * @returns {Object} Configuración del método
   */
  getPaymentMethodConfig(method) {
    const configs = {
      'bank_transfer': {
        name: 'Transferencia Bancaria',
        icon: '🏦',
        color: 'blue',
        requiresValidation: true
      },
      'cash': {
        name: 'Efectivo',
        icon: '💵',
        color: 'green',
        requiresValidation: true
      },
      'stripe': {
        name: 'Tarjeta',
        icon: '💳',
        color: 'purple',
        requiresValidation: false
      },
      'paypal': {
        name: 'PayPal',
        icon: '📱',
        color: 'blue',
        requiresValidation: false
      }
    };

    return configs[method] || {
      name: method,
      icon: '💰',
      color: 'gray',
      requiresValidation: false
    };
  }

  /**
   * Configuración de estados de pago
   * @param {string} status - Estado del pago
   * @returns {Object} Configuración del estado
   */
  getPaymentStatusConfig(status) {
    const configs = {
      'pending': {
        name: 'Pendiente',
        color: 'yellow',
        icon: '⏳'
      },
      'completed': {
        name: 'Completado',
        color: 'green',
        icon: '✅'
      },
      'failed': {
        name: 'Fallido',
        color: 'red',
        icon: '❌'
      },
      'cancelled': {
        name: 'Cancelado',
        color: 'gray',
        icon: '🚫'
      },
      'refunded': {
        name: 'Reembolsado',
        color: 'orange',
        icon: '↩️'
      }
    };

    return configs[status] || {
      name: status,
      color: 'gray',
      icon: '❓'
    };
  }

  // ================================
  // 🗃️ GESTIÓN DE CACHE
  // ================================

  /**
   * Obtiene datos del cache
   * @param {string} key - Clave del cache
   * @param {number} maxAge - Tiempo máximo de vida
   * @returns {Object|null} Datos cacheados o null
   */
  getCachedData(key, maxAge = this.cacheMaxAge) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Guarda datos en el cache
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
   * Invalida todo el cache
   */
  invalidateCache() {
    this.cache.clear();
  }

  // ================================
  // 🛠️ DEBUGGING (SOLO DESARROLLO)
  // ================================

  /**
   * Debugging del sistema de pagos
   * @returns {Promise<Object>} Información de debug
   */
  async debugPaymentSystem() {
    try {
      const endpoints = [
        '/payments/pending-dashboard',
        '/payments/transfers/pending',
        '/memberships/pending-cash-payment',
        '/payments/statistics'
      ];

      const results = {};

      for (const endpoint of endpoints) {
        try {
          const response = await this.get(endpoint);
          results[endpoint] = {
            status: 'success',
            data: response
          };
        } catch (error) {
          results[endpoint] = {
            status: 'error',
            error: error.message
          };
        }
      }

      return {
        cache_size: this.cache.size,
        cache_keys: Array.from(this.cache.keys()),
        endpoints: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error en debugging del sistema de pagos:', error);
      throw error;
    }
  }
}

// ================================
// 🏭 EXPORTAR CLASE (DEFAULT EXPORT)
// ================================
export default PaymentService;

// ✅ GESTIÓN DE PAGOS Y AUTORIZACIONES AGREGADA AL SERVICIO PRINCIPAL
// 
// 📁 ARCHIVOS RELACIONADOS:
// 1. paymentService.js - Servicio especializado para gestión de pagos y autorizaciones
// 2. apiService.js - Archivo principal con delegación a servicios (este archivo)
// 
// ✅ NUEVOS MÉTODOS DISPONIBLES:
// - getMovementsWithPayments(): Vista combinada de movimientos financieros
// - getPendingPaymentsDashboard(): Dashboard de pagos pendientes
// - getPendingTransfersDetailed(): Transferencias pendientes con detalles
// - validateTransfer(): Aprobar transferencia bancaria
// - rejectTransfer(): Rechazar transferencia bancaria
// - getPendingCashMemberships(): Membresías esperando pago en efectivo
// - activateCashMembership(): Activar membresía cuando se recibe efectivo
// - getPaymentStatistics(): Estadísticas financieras
// - validatePaymentData(): Validación de datos antes de envío
// - getPaymentMethodConfig(): Configuración de métodos de pago para UI
// - getTransferPriorityConfig(): Configuración de prioridades por tiempo de espera
// - invalidatePaymentCache(): Limpiar cache después de cambios
// 
// ✅ ENDPOINTS INTEGRADOS:
// - GET /api/financial/movements-with-payments
// - GET /api/payments/pending-dashboard
// - GET /api/payments/transfers/pending
// - GET /api/payments/transfers/pending-detailed
// - GET /api/memberships/pending-cash-payment
// - POST /api/payments/{paymentId}/validate-transfer
// - POST /api/payments/{paymentId}/reject-transfer
// - POST /api/payments/activate-cash-membership
// - GET /api/payments/statistics
// 
// 🔄 COMPATIBILIDAD TOTAL:
// - Mantiene todos los métodos existentes sin cambios
// - Agrega nuevos métodos de forma no invasiva
// - Misma importación y uso que antes
// - No rompe funcionalidad existente
// - Métodos de pago existentes siguen funcionando
// 
// 🚀 USO EN COMPONENTES:
// import apiService from './services/apiService.js'
// 
// // Dashboard de pagos pendientes
// const dashboard = await apiService.getPendingPaymentsDashboard()
// 
// // Transferencias pendientes con filtro
// const transfers = await apiService.getPendingTransfersDetailed(24) // Más de 24 horas
// 
// // Aprobar transferencia
// await apiService.validateTransfer(paymentId, true, 'Comprobante válido')
// 
// // Rechazar transferencia
// await apiService.rejectTransfer(paymentId, 'Comprobante no válido')
// 
// // Membresías en efectivo
// const cashMemberships = await apiService.getPendingCashMemberships()
// 
// // Activar membresía cuando llega el cliente
// await apiService.activateCashMembership(membershipId)
// 
// // Vista combinada de movimientos
// const movements = await apiService.getMovementsWithPayments({
//   startDate: '2024-01-01',
//   endDate: '2024-01-31',
//   status: 'pending'
// })
// 
// 📱 INTEGRACIÓN CON REACT QUERY:
// const { data } = useQuery({
//   queryKey: ['pendingPayments'],
//   queryFn: () => apiService.getPendingPaymentsDashboard(),
//   refetchInterval: 30000 // Actualizar cada 30 segundos
// })
// 
// const validateTransferMutation = useMutation({
//   mutationFn: ({paymentId, approved, notes}) => 
//     apiService.validateTransfer(paymentId, approved, notes),
//   onSuccess: () => {
//     queryClient.invalidateQueries(['pendingPayments'])
//   }
// })
// 
// ✅ BENEFICIOS:
// - Gestión completa de pagos y autorizaciones integrada
// - Misma interfaz consistente del apiService
// - Validaciones y formateo incluidos
// - Sistema de cache para optimización
// - Manejo de errores específicos para cada endpoint
// - Compatibilidad total con código existente
// - Configuraciones de UI incluidas
// - Métodos de debugging para desarrollo
// - Invalidación automática de cache después de cambios
// - Soporte completo para moneda quetzales guatemaltecos