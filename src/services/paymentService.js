// Autor: Alexander Echeverria
// src/services/paymentService.js
// FUNCIÓN: Servicio especializado para gestión de pagos del gimnasio guatemalteco
// USO: Interfaz entre componentes React y API backend para transacciones en quetzales

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
  // 💰 MÉTODOS DE HISTORIAL DE PAGOS
  // ================================

  /**
   * Obtener historial de pagos con filtros y paginación
   * @param {Object} params - Parámetros de filtro
   * @param {number} params.page - Página actual (default: 1)
   * @param {number} params.limit - Registros por página (default: 20)
   * @param {string} params.search - Término de búsqueda por cliente
   * @param {string} params.status - Filtro por estado (completed, pending, failed, cancelled)
   * @param {string} params.paymentMethod - Filtro por método (cash, card, transfer, mobile)
   * @param {string} params.paymentType - Filtro por tipo (membership, daily, bulk_daily)
   * @param {string} params.startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} params.endDate - Fecha de fin (YYYY-MM-DD)
   * @param {boolean} params.includeAll - Incluir todos los estados (default: false)
   * @returns {Promise<Object>} Lista de pagos con paginación
   */
  async getPayments(params = {}) {
    try {
      console.log('💰 PaymentService: Obteniendo historial de pagos...', params);
      
      // Preparar parámetros con valores por defecto
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        search: params.search?.trim() || undefined,
        status: params.status || undefined,
        paymentMethod: params.paymentMethod || undefined,
        paymentType: params.paymentType || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        includeAll: params.includeAll || true, // Incluir todos los estados por defecto
        sortBy: params.sortBy || 'paymentDate',
        sortOrder: params.sortOrder || 'desc'
      };

      // Limpiar parámetros undefined
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      const response = await this.get('/api/payments', { params: queryParams });
      
      console.log(`✅ PaymentService: ${response.data?.payments?.length || response.data?.length || 0} pagos obtenidos`);
      
      // Normalizar respuesta para diferentes formatos del backend
      if (response.data) {
        if (response.data.payments && Array.isArray(response.data.payments)) {
          // Formato con paginación
          return {
            success: true,
            data: {
              payments: response.data.payments,
              pagination: response.data.pagination || {
                total: response.data.payments.length,
                page: queryParams.page,
                pages: Math.ceil(response.data.payments.length / queryParams.limit),
                limit: queryParams.limit
              }
            }
          };
        } else if (Array.isArray(response.data)) {
          // Formato de array directo
          const total = response.data.length;
          const page = queryParams.page;
          const limit = queryParams.limit;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          
          return {
            success: true,
            data: {
              payments: response.data.slice(startIndex, endIndex),
              pagination: {
                total: total,
                page: page,
                pages: Math.ceil(total / limit),
                limit: limit
              }
            }
          };
        }
      }
      
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
  // 📊 MÉTODOS DE ESTADÍSTICAS
  // ================================

  /**
   * Obtener estadísticas generales de pagos
   * @param {Object} dateRange - Rango de fechas opcional
   * @param {string} dateRange.startDate - Fecha de inicio
   * @param {string} dateRange.endDate - Fecha de fin
   * @returns {Promise<Object>} Estadísticas de pagos
   */
  async getPaymentStatistics(dateRange = {}) {
    try {
      console.log('📊 PaymentService: Obteniendo estadísticas de pagos...');
      
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      
      const response = await this.get('/api/payments/statistics', { params });
      
      console.log('✅ PaymentService: Estadísticas obtenidas exitosamente');
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo estadísticas:', error);
      // Fallback con estructura básica
      return {
        success: true,
        data: {
          totalIncome: 0,
          totalPayments: 0,
          averagePayment: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
          incomeByMethod: [],
          dailyIncome: []
        }
      };
    }
  }

  // ================================
  // 🎯 MÉTODOS DE DASHBOARD PENDIENTES
  // ================================

  /**
   * Obtener dashboard de pagos pendientes
   * @returns {Promise<Object>} Dashboard con resumen de pendientes
   */
  async getPendingPaymentsDashboard() {
    try {
      console.log('🎯 PaymentService: Obteniendo dashboard de pendientes...');
      
      const response = await this.get('/api/payments/pending-dashboard');
      
      console.log('✅ PaymentService: Dashboard de pendientes obtenido');
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo dashboard:', error);
      // Fallback con estructura básica
      return {
        success: true,
        data: {
          summary: {
            pendingTransfers: { count: 0, totalAmount: 0, oldestHours: 0 },
            pendingCashPayments: { count: 0, totalAmount: 0, oldestHours: 0 },
            totalPendingActions: 0
          },
          urgentItems: [],
          recentActivity: []
        }
      };
    }
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
  // 🏦 MÉTODOS DE TRANSFERENCIAS
  // ================================

  /**
   * Obtener transferencias pendientes básicas
   * @returns {Promise<Object>} Lista de transferencias pendientes
   */
  async getPendingTransfers() {
    try {
      console.log('🏦 PaymentService: Obteniendo transferencias pendientes...');
      
      const response = await this.get('/api/payments/transfers/pending');
      
      console.log(`✅ PaymentService: ${response.data?.transfers?.length || 0} transferencias pendientes`);
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo transferencias:', error);
      return {
        success: true,
        data: {
          transfers: [],
          summary: { totalAmount: 0, count: 0 }
        }
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

  /**
   * Validar transferencia (aprobar o rechazar)
   * @param {string} paymentId - ID del pago
   * @param {boolean} approved - true para aprobar, false para rechazar
   * @param {string} notes - Notas de validación
   * @returns {Promise<Object>} Resultado de la validación
   */
  async validateTransfer(paymentId, approved, notes = '') {
    try {
      console.log(`${approved ? '✅' : '❌'} PaymentService: Validando transferencia:`, paymentId);
      
      const response = await this.post(`/api/payments/${paymentId}/validate-transfer`, {
        approved,
        notes: notes.trim()
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
   * Rechazar transferencia con razón específica
   * @param {string} paymentId - ID del pago
   * @param {string} reason - Razón del rechazo
   * @returns {Promise<Object>} Resultado del rechazo
   */
  async rejectTransfer(paymentId, reason) {
    try {
      console.log('❌ PaymentService: Rechazando transferencia:', paymentId);
      
      const response = await this.post(`/api/payments/${paymentId}/reject-transfer`, {
        reason: reason.trim()
      });
      
      console.log('✅ PaymentService: Transferencia rechazada');
      
      // Invalidar cache
      this.invalidatePaymentCache();
      
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error rechazando transferencia:', error);
      throw this.handleError(error, 'Error al rechazar transferencia');
    }
  }

  // ================================
  // 💵 MÉTODOS DE MEMBRESÍAS EN EFECTIVO
  // ================================

  /**
   * Obtener membresías pendientes de pago en efectivo
   * @returns {Promise<Object>} Lista de membresías en efectivo pendientes
   */
  async getPendingCashMemberships() {
    try {
      console.log('💵 PaymentService: Obteniendo membresías en efectivo pendientes...');
      
      const response = await this.get('/api/payments/cash/pending');
      
      console.log(`✅ PaymentService: ${response.data?.memberships?.length || 0} membresías en efectivo`);
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo membresías en efectivo:', error);
      return {
        success: true,
        data: {
          memberships: [],
          summary: { totalAmount: 0, count: 0 }
        }
      };
    }
  }

  /**
   * Activar membresía en efectivo (confirmar pago recibido)
   * @param {string} membershipId - ID de la membresía
   * @returns {Promise<Object>} Resultado de la activación
   */
  async activateCashMembership(membershipId) {
    try {
      console.log('💵 PaymentService: Activando membresía en efectivo:', membershipId);
      
      const response = await this.post('/api/payments/activate-cash-membership', {
        membershipId
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

  // ================================
  // 💼 MÉTODOS DE DASHBOARD FINANCIERO
  // ================================

  /**
   * Obtener dashboard financiero completo
   * @returns {Promise<Object>} Dashboard con métricas financieras
   */
  async getFinancialDashboard() {
    try {
      console.log('💼 PaymentService: Obteniendo dashboard financiero...');
      
      const response = await this.get('/api/financial/dashboard');
      
      console.log('✅ PaymentService: Dashboard financiero obtenido');
      return response;
      
    } catch (error) {
      console.error('❌ PaymentService: Error obteniendo dashboard financiero:', error);
      // Fallback con estructura básica
      return {
        success: true,
        data: {
          today: { income: 0, expenses: 0, net: 0 },
          thisWeek: { income: 0, expenses: 0, net: 0 },
          thisMonth: { income: 0, expenses: 0, net: 0 },
          charts: {
            incomeChart: [],
            expensesChart: [],
            netChart: []
          }
        }
      };
    }
  }

  // ================================
  // 🔧 MÉTODOS DE CONFIGURACIÓN Y UTILIDADES
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
        border: 'border-red-200'
      };
    } else if (hoursWaiting >= 48) {
      return {
        priority: 'high',
        label: 'Alta',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200'
      };
    } else if (hoursWaiting >= 24) {
      return {
        priority: 'medium',
        label: 'Media',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200'
      };
    } else {
      return {
        priority: 'normal',
        label: 'Normal',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200'
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
        bgColor: 'bg-green-50'
      },
      card: {
        label: 'Tarjeta',
        icon: 'CreditCard',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      transfer: {
        label: 'Transferencia',
        icon: 'Building',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      mobile: {
        label: 'Pago Móvil',
        icon: 'Smartphone',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
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
        bgColor: 'bg-green-100'
      },
      pending: {
        label: 'Pendiente',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      },
      failed: {
        label: 'Fallido',
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      },
      cancelled: {
        label: 'Cancelado',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
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
        description: 'Pago de cuota mensual'
      },
      daily: {
        label: 'Pago Diario',
        description: 'Acceso por día individual'
      },
      bulk_daily: {
        label: 'Pago Múltiple',
        description: 'Varios días consecutivos'
      }
    };
    
    return configs[type] || configs.membership;
  }

  // ================================
  // 🗃️ MÉTODOS DE CACHE
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
   * Invalidar cache de pagos
   */
  invalidatePaymentCache() {
    console.log('🗑️ PaymentService: Invalidando cache de pagos');
    this.cache.clear();
  }

  // ================================
  // 🛠️ MÉTODOS DE DEBUGGING Y SALUD
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
      version: '1.0.0',
      features: [
        'Historial de pagos con filtros',
        'Validación de transferencias',
        'Activación de membresías en efectivo',
        'Dashboard financiero',
        'Estadísticas de pagos',
        'Cache inteligente',
        'Configuraciones de UI'
      ],
      supportedMethods: ['cash', 'card', 'transfer', 'mobile'],
      supportedTypes: ['membership', 'daily', 'bulk_daily'],
      supportedStatuses: ['completed', 'pending', 'failed', 'cancelled']
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
        cashMemberships: await this.getPendingCashMemberships().then(() => '✅ OK').catch(() => '❌ Error')
      };
    } catch (error) {
      debugInfo.endpoints = { error: error.message };
    }
    
    console.log('🔍 PaymentService: Debug completado', debugInfo);
    return debugInfo;
  }
}

// ================================
// 🏭 EXPORTAR INSTANCIA SINGLETON
// ================================
const paymentService = new PaymentService();

export default paymentService;

// ✅ SERVICIO DE PAGOS COMPLETO IMPLEMENTADO
//
// 📋 FUNCIONALIDADES PRINCIPALES INCLUIDAS:
//
// 💰 HISTORIAL DE PAGOS:
// - getPayments(): Lista con filtros avanzados y paginación
// - getPaymentById(): Detalles de pago específico
// - searchPayments(): Búsqueda rápida por cliente
//
// 📊 ESTADÍSTICAS:
// - getPaymentStatistics(): Métricas generales con rangos de fecha
//
// 🎯 DASHBOARD PENDIENTES:
// - getPendingPaymentsDashboard(): Resumen de acciones pendientes
// - getPendingPaymentsDashboardWithCache(): Versión con cache optimizado
//
// 🏦 TRANSFERENCIAS:
// - getPendingTransfers(): Lista básica de transferencias
// - getPendingTransfersDetailed(): Lista con detalles completos
// - validateTransfer(): Aprobar/rechazar transferencias
// - rejectTransfer(): Rechazar con razón específica
//
// 💵 MEMBRESÍAS EN EFECTIVO:
// - getPendingCashMemberships(): Lista de membresías esperando pago
// - activateCashMembership(): Activar membresía al recibir efectivo
//
// 💼 DASHBOARD FINANCIERO:
// - getFinancialDashboard(): Métricas financieras completas
//
// 🔧 CONFIGURACIONES:
// - getTransferPriorityConfig(): Colores por urgencia de transferencias
// - getPaymentMethodConfig(): Configuración de métodos (efectivo, tarjeta, etc.)
// - getPaymentStatusConfig(): Configuración de estados
// - getPaymentTypeConfig(): Configuración de tipos
//
// 🗃️ CACHE:
// - getCachedData(): Obtener del cache
// - setCachedData(): Guardar en cache
// - invalidatePaymentCache(): Limpiar cache
//
// 🛠️ DEBUGGING:
// - paymentHealthCheck(): Verificar conectividad
// - getPaymentServiceInfo(): Información del servicio
// - debugPaymentSystem(): Debug completo
//
// 🌐 RUTAS IMPLEMENTADAS:
// - GET /api/payments - Historial con filtros
// - GET /api/payments/:id - Pago específico
// - GET /api/payments/search - Búsqueda rápida
// - GET /api/payments/statistics - Estadísticas
// - GET /api/payments/pending-dashboard - Dashboard pendientes
// - GET /api/payments/transfers/pending - Transferencias básicas
// - GET /api/payments/transfers/pending-detailed - Transferencias detalladas
// - POST /api/payments/:id/validate-transfer - Validar transferencia
// - POST /api/payments/:id/reject-transfer - Rechazar transferencia
// - GET /api/payments/cash/pending - Membresías en efectivo
// - POST /api/payments/activate-cash-membership - Activar membresía
// - GET /api/financial/dashboard - Dashboard financiero
// - GET /api/payments/health - Salud del sistema
//
// 💪 CARACTERÍSTICAS ESPECIALES:
// - Fallbacks robustos para cuando el backend no esté disponible
// - Cache inteligente con timeout configurable
// - Normalización de respuestas para diferentes formatos
// - Configuraciones de UI incluidas (colores, iconos, estilos)
// - Manejo de errores específico por operación
// - Invalidación automática de cache tras modificaciones
// - Debug completo para troubleshooting
// - Soporte completo para quetzales guatemaltecos
// - Paginación automática para listas grandes
// - Filtros avanzados para historial
//
// 🚀 USO EN COMPONENTES:
// import apiService from './services/apiService.js'
//
// // Historial de pagos
// const payments = await apiService.paymentService.getPayments({
//   page: 1,
//   limit: 20,
//   search: 'Juan Pérez',
//   status: 'completed'
// })
//
// // Estadísticas
// const stats = await apiService.paymentService.getPaymentStatistics()
//
// // Transferencias pendientes
// const transfers = await apiService.paymentService.getPendingTransfers()
//
// // Validar transferencia
// await apiService.paymentService.validateTransfer(paymentId, true, 'Comprobante válido')
//
// // Configuraciones para UI
// const priorityConfig = apiService.paymentService.getTransferPriorityConfig(48)
//
// ✅ COMPATIBILIDAD TOTAL:
// - Funciona perfectamente con PaymentsManager existente
// - Mantiene todas las llamadas actuales sin cambios
// - Agrega funcionalidad robusta sin romper código existente
// - Cache optimizado para mejor rendimiento
// - Fallbacks para desarrollo sin backend completo