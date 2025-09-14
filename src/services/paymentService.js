// src/services/paymentService.js
// VERSIÓN CORREGIDA - Implementando endpoints exactos del manual

import { BaseService } from './baseService.js';

class PaymentService extends BaseService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 segundos
  }

  // ================================
  // 📋 HISTORIAL COMPLETO - TODOS LOS PAGOS (CORREGIDO)
  // ================================

  // GET /api/payments - TODOS los pagos (completados, pendientes, fallidos, etc.)
  async getPayments(params = {}) {
    try {
      console.log('💰 Obteniendo HISTORIAL COMPLETO de pagos con parámetros:', params);
      
      // ⚠️ IMPORTANTE: NO filtrar por status aquí - el backend debe devolver TODOS
      const cleanParams = { ...params };
      
      const response = await this.get('/api/payments', { params: cleanParams });
      
      console.log('✅ Historial completo obtenido:', response.data?.payments?.length || 0, 'pagos');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo historial completo:', error);
      throw error;
    }
  }

  // ================================
  // 🏦 TRANSFERENCIAS PENDIENTES (CORREGIDO SEGÚN MANUAL)
  // ================================

  // GET /api/payments/transfers/pending-detailed - Transferencias con detalles completos
  async getPendingTransfersDetailed(hoursFilter = null) {
    try {
      console.log('🏦 Obteniendo transferencias pendientes DETALLADAS...');
      
      const params = {};
      if (hoursFilter) {
        params.hoursFilter = hoursFilter;
      }
      
      const response = await this.get('/api/payments/transfers/pending-detailed', { params });
      
      const transfers = response.data?.transfers || [];
      console.log(`✅ ${transfers.length} transferencias pendientes con detalles obtenidas`);
      
      // ✅ VALIDACIÓN: Solo transferencias que realmente necesitan validación
      const validTransfers = transfers.filter(transfer => {
        const isValid = transfer.status === 'pending' && 
                       transfer.paymentMethod === 'transfer' && 
                       transfer.transferProof; // Debe tener comprobante
        
        if (!isValid) {
          console.log('⚠️ Transferencia filtrada (sin comprobante o no pendiente):', transfer.id);
        }
        
        return isValid;
      });
      
      console.log(`📋 ${validTransfers.length} transferencias válidas para validación`);
      
      return {
        ...response,
        data: {
          ...response.data,
          transfers: validTransfers
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo transferencias pendientes:', error);
      return {
        data: {
          transfers: [],
          total: 0,
          summary: {
            totalAmount: 0,
            averageWaitingHours: 0,
            criticalCount: 0
          }
        }
      };
    }
  }

  // GET /api/payments/transfers/pending - Transferencias básicas (fallback)
  async getPendingTransfersBasic() {
    try {
      console.log('🏦 Obteniendo transferencias pendientes BÁSICAS...');
      
      const response = await this.get('/api/payments/transfers/pending');
      
      console.log('✅ Transferencias básicas obtenidas');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo transferencias básicas:', error);
      return {
        data: {
          transfers: [],
          total: 0
        }
      };
    }
  }

  // ================================
  // 💵 EFECTIVO PENDIENTE (CORREGIDO SEGÚN MANUAL)
  // ================================

  // GET /api/payments/cash/pending - Pagos en efectivo pendientes de confirmación
  async getPendingCashPayments() {
    try {
      console.log('💵 Obteniendo pagos en efectivo PENDIENTES...');
      
      const response = await this.get('/api/payments/cash/pending');
      
      const cashPayments = response.data?.payments || [];
      console.log(`✅ ${cashPayments.length} pagos en efectivo pendientes obtenidos`);
      
      // ✅ VALIDACIÓN: Solo pagos en efectivo realmente pendientes
      const validCashPayments = cashPayments.filter(payment => {
        const isValid = payment.status === 'pending' && 
                       payment.paymentMethod === 'cash';
        
        if (!isValid) {
          console.log('⚠️ Pago en efectivo filtrado (no pendiente):', payment.id);
        }
        
        return isValid;
      });
      
      console.log(`💰 ${validCashPayments.length} pagos en efectivo válidos para confirmación`);
      
      return {
        ...response,
        data: {
          ...response.data,
          payments: validCashPayments
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo pagos en efectivo pendientes:', error);
      return {
        data: {
          payments: [],
          total: 0,
          summary: {
            totalAmount: 0,
            oldestHours: 0,
            averageWaitingHours: 0
          }
        }
      };
    }
  }

  // ================================
  // ✅ VALIDACIÓN DE TRANSFERENCIAS (SEGÚN MANUAL)
  // ================================

  // POST /api/payments/{id}/validate-transfer - Aprobar transferencia
  async validateTransfer(paymentId, approved, notes = '') {
    try {
      console.log(`${approved ? '✅ APROBANDO' : '❌ RECHAZANDO'} transferencia:`, paymentId);
      
      const response = await this.post(`/api/payments/${paymentId}/validate-transfer`, {
        approved,
        notes: notes || (approved ? 'Comprobante válido, transferencia confirmada' : 'Comprobante inválido')
      });
      
      console.log('✅ Transferencia validada exitosamente');
      this.invalidateCache();
      return response;
    } catch (error) {
      console.error('❌ Error validando transferencia:', error);
      throw error;
    }
  }

  // Método auxiliar para rechazar (usa el mismo endpoint con approved: false)
  async rejectTransfer(paymentId, reason = '') {
    return this.validateTransfer(paymentId, false, reason);
  }

  // ================================
  // 💰 ACTIVACIÓN DE EFECTIVO (SEGÚN MANUAL)
  // ================================

  // POST /api/payments/activate-cash-membership - Activar membresía en efectivo
  async activateCashMembership(paymentId) {
    try {
      console.log('💵 Activando pago en efectivo:', paymentId);
      
      const response = await this.post('/api/payments/activate-cash-membership', {
        paymentId // Cambio: usar paymentId en lugar de membershipId
      });
      
      console.log('✅ Pago en efectivo confirmado y membresía activada');
      this.invalidateCache();
      return response;
    } catch (error) {
      console.error('❌ Error activando pago en efectivo:', error);
      throw error;
    }
  }

  // ================================
  // 📊 DASHBOARD Y ESTADÍSTICAS
  // ================================

  // GET /api/payments/pending-dashboard - Dashboard unificado de pendientes
  async getPendingPaymentsDashboard() {
    try {
      console.log('📋 Obteniendo dashboard unificado de pendientes...');
      
      const response = await this.get('/api/payments/pending-dashboard');
      
      console.log('✅ Dashboard de pendientes obtenido');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo dashboard de pendientes:', error);
      return {
        data: {
          summary: {
            pendingTransfers: { count: 0, totalAmount: 0, oldestHours: 0 },
            pendingCashPayments: { count: 0, totalAmount: 0, oldestHours: 0 },
            todayActivity: {
              transferValidations: { approved: 0, rejected: 0, total: 0 },
              completedPayments: 0
            },
            totalPendingActions: 0
          },
          urgentItems: [],
          recentActivity: [],
          userRole: 'cliente',
          lastUpdated: new Date().toISOString()
        }
      };
    }
  }

  // GET /api/payments/statistics - Estadísticas de pagos
  async getPaymentStatistics(startDate = null, endDate = null) {
    try {
      console.log('📊 Obteniendo estadísticas de pagos...');
      
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.get('/api/payments/statistics', { params });
      
      console.log('✅ Estadísticas obtenidas');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        data: {
          totalIncome: 0,
          totalPayments: 0,
          averagePayment: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0,
          incomeByMethod: [],
          uniqueClients: 0,
          newClients: 0
        }
      };
    }
  }

  // GET /api/payments/reports - Reportes predefinidos por período
  async getPaymentReports(period = 'month') {
    try {
      console.log('📈 Obteniendo reportes para período:', period);
      
      const response = await this.get('/api/payments/reports', {
        params: { period }
      });
      
      console.log('✅ Reportes obtenidos');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo reportes:', error);
      return {
        data: {
          totalIncome: 0,
          totalPayments: 0,
          averagePayment: 0,
          incomeByMethod: [],
          incomeByType: [],
          dailyPayments: [],
          period
        }
      };
    }
  }

  // ================================
  // 📤 SUBIR COMPROBANTE (PARA CLIENTES)
  // ================================

  // POST /api/payments/{id}/transfer-proof - Subir comprobante de transferencia
  async uploadTransferProof(paymentId, file) {
    try {
      console.log('📤 Subiendo comprobante para pago:', paymentId);
      
      const formData = new FormData();
      formData.append('proof', file);
      
      const response = await this.post(`/api/payments/${paymentId}/transfer-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Comprobante subido exitosamente');
      this.invalidateCache();
      return response;
    } catch (error) {
      console.error('❌ Error subiendo comprobante:', error);
      throw error;
    }
  }

  // ================================
  // 🔧 UTILIDADES MEJORADAS
  // ================================

  // Configuración de prioridades para transferencias según tiempo de espera
  getTransferPriorityConfig(hoursWaiting) {
    if (hoursWaiting >= 72) {
      return {
        priority: 'critical',
        label: 'CRÍTICA',
        color: 'text-red-600',
        bg: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else if (hoursWaiting >= 48) {
      return {
        priority: 'high',
        label: 'ALTA',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    } else if (hoursWaiting >= 24) {
      return {
        priority: 'medium',
        label: 'MEDIA',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    } else {
      return {
        priority: 'normal',
        label: 'NORMAL',
        color: 'text-green-600',
        bg: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
  }

  // Configuración de métodos de pago
  getPaymentMethodConfig(method) {
    const configs = {
      cash: {
        label: 'Efectivo',
        icon: 'Banknote',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      card: {
        label: 'Tarjeta',
        icon: 'CreditCard',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      transfer: {
        label: 'Transferencia',
        icon: 'Building',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      mobile: {
        label: 'Pago Móvil',
        icon: 'Smartphone',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    };
    
    return configs[method] || configs.cash;
  }

  // ================================
  // 💾 CACHE MEJORADO
  // ================================

  getCachedData(key, maxAge = this.cacheTimeout) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      console.log(`📦 Usando datos desde cache: ${key}`);
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Datos guardados en cache: ${key}`);
  }

  invalidateCache() {
    this.cache.clear();
    console.log('🗑️ Cache de pagos completamente invalidado');
  }

  // Métodos con cache para optimización
  async getPendingPaymentsDashboardWithCache(maxAge = 30000) {
    const cacheKey = 'pending_dashboard';
    const cached = this.getCachedData(cacheKey, maxAge);
    
    if (cached) return cached;
    
    const data = await this.getPendingPaymentsDashboard();
    this.setCachedData(cacheKey, data);
    return data;
  }

  async getPendingTransfersDetailedWithCache(hoursFilter = null, maxAge = 15000) {
    const cacheKey = `pending_transfers_${hoursFilter || 'all'}`;
    const cached = this.getCachedData(cacheKey, maxAge);
    
    if (cached) return cached;
    
    const data = await this.getPendingTransfersDetailed(hoursFilter);
    this.setCachedData(cacheKey, data);
    return data;
  }

  // ================================
  // 🔍 DEBUGGING Y SALUD DEL SISTEMA
  // ================================

  async healthCheck() {
    try {
      console.log('🔍 Verificando salud del sistema de pagos...');
      
      const tests = {
        allPayments: false,
        pendingTransfers: false,
        pendingCash: false,
        dashboard: false,
        statistics: false
      };
      
      // Test historial completo
      try {
        const result = await this.getPayments({ limit: 1 });
        tests.allPayments = !!result.data;
        console.log('✅ Historial completo: OK');
      } catch (error) {
        console.warn('⚠️ Historial completo: ERROR');
      }
      
      // Test transferencias pendientes
      try {
        const result = await this.getPendingTransfersDetailed();
        tests.pendingTransfers = !!result.data;
        console.log('✅ Transferencias pendientes: OK');
      } catch (error) {
        console.warn('⚠️ Transferencias pendientes: ERROR');
      }
      
      // Test efectivo pendiente
      try {
        const result = await this.getPendingCashPayments();
        tests.pendingCash = !!result.data;
        console.log('✅ Efectivo pendiente: OK');
      } catch (error) {
        console.warn('⚠️ Efectivo pendiente: ERROR');
      }
      
      // Test dashboard
      try {
        const result = await this.getPendingPaymentsDashboard();
        tests.dashboard = !!result.data;
        console.log('✅ Dashboard: OK');
      } catch (error) {
        console.warn('⚠️ Dashboard: ERROR');
      }
      
      // Test estadísticas
      try {
        const result = await this.getPaymentStatistics();
        tests.statistics = !!result.data;
        console.log('✅ Estadísticas: OK');
      } catch (error) {
        console.warn('⚠️ Estadísticas: ERROR');
      }
      
      const passedTests = Object.values(tests).filter(Boolean).length;
      const totalTests = Object.keys(tests).length;
      const healthScore = (passedTests / totalTests) * 100;
      
      console.log(`💊 Salud del sistema: ${healthScore.toFixed(1)}% (${passedTests}/${totalTests})`);
      
      return {
        healthy: healthScore >= 60,
        score: healthScore,
        tests,
        passedTests,
        totalTests,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error en health check:', error);
      return {
        healthy: false,
        score: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  getServiceInfo() {
    return {
      name: 'PaymentService',
      version: '2.0.0',
      description: 'Servicio completo para gestión de pagos según manual oficial',
      endpoints: {
        historial: 'GET /api/payments',
        transferencias: 'GET /api/payments/transfers/pending-detailed',
        efectivo: 'GET /api/payments/cash/pending',
        dashboard: 'GET /api/payments/pending-dashboard',
        estadisticas: 'GET /api/payments/statistics',
        reportes: 'GET /api/payments/reports',
        validarTransfer: 'POST /api/payments/{id}/validate-transfer',
        activarEfectivo: 'POST /api/payments/activate-cash-membership',
        subirComprobante: 'POST /api/payments/{id}/transfer-proof'
      },
      implementedAccordingToManual: true,
      lastUpdated: '2025-11-15'
    };
  }
}

// Crear instancia singleton
const paymentService = new PaymentService();

export default paymentService;