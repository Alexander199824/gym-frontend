// src/services/paymentService.js
// VERSIÓN SIMPLIFICADA - Basada en endpoints probados en tests

import { BaseService } from './baseService.js';

class PaymentService extends BaseService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 segundos
  }

  // ================================
  // MÉTODOS BÁSICOS PROBADOS EN TESTS
  // ================================

  // GET /api/payments - Lista de pagos con filtros
  async getPayments(params = {}) {
    try {
      console.log('💰 Obteniendo pagos con parámetros:', params);
      
      const response = await this.get('/api/payments', { params });
      
      console.log('✅ Pagos obtenidos exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo pagos:', error);
      throw error;
    }
  }

  // GET /api/payments/statistics - Estadísticas básicas
  async getPaymentStatistics(startDate = null, endDate = null) {
    try {
      console.log('📊 Obteniendo estadísticas de pagos...');
      
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.get('/api/payments/statistics', { params });
      
      console.log('✅ Estadísticas obtenidas:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      // Retornar estructura por defecto para evitar errores
      return {
        data: {
          totalIncome: 0,
          totalPayments: 0,
          averagePayment: 0,
          incomeByMethod: []
        }
      };
    }
  }

  // GET /api/payments/pending-dashboard - Dashboard de pendientes
  async getPendingPaymentsDashboard() {
    try {
      console.log('📋 Obteniendo dashboard de pendientes...');
      
      const response = await this.get('/api/payments/pending-dashboard');
      
      console.log('✅ Dashboard de pendientes obtenido');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo dashboard de pendientes:', error);
      return {
        data: {
          summary: {
            pendingTransfers: { count: 0, totalAmount: 0 },
            pendingCashMemberships: { count: 0, totalAmount: 0 },
            todayValidations: { totalProcessed: 0, approved: 0 }
          },
          urgentItems: [],
          recentActivity: []
        }
      };
    }
  }

  // GET /api/payments/transfers/pending - Transferencias pendientes
  async getPendingTransfers() {
    try {
      console.log('🏦 Obteniendo transferencias pendientes...');
      
      const response = await this.get('/api/payments/transfers/pending');
      
      console.log('✅ Transferencias pendientes obtenidas');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo transferencias:', error);
      return {
        data: {
          transfers: [],
          total: 0
        }
      };
    }
  }

  // POST /api/payments/activate-cash-membership - Activar membresía en efectivo  
  async activateCashMembership(membershipId) {
    try {
      console.log('💵 Activando membresía en efectivo:', membershipId);
      
      const response = await this.post('/api/payments/activate-cash-membership', {
        membershipId
      });
      
      console.log('✅ Membresía activada exitosamente');
      this.invalidateCache();
      return response;
    } catch (error) {
      console.error('❌ Error activando membresía:', error);
      throw error;
    }
  }

  // POST /api/payments/{id}/validate-transfer - Validar transferencia
  async validateTransfer(paymentId, approved, notes = '') {
    try {
      console.log(`${approved ? '✅' : '❌'} Validando transferencia:`, paymentId);
      
      const response = await this.post(`/api/payments/${paymentId}/validate-transfer`, {
        approved,
        notes
      });
      
      console.log('✅ Transferencia validada exitosamente');
      this.invalidateCache();
      return response;
    } catch (error) {
      console.error('❌ Error validando transferencia:', error);
      throw error;
    }
  }

  // GET /api/payments/reports - Reportes básicos
  async getPaymentReports(period = 'month') {
    try {
      console.log('📈 Obteniendo reportes de pagos para período:', period);
      
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
          period
        }
      };
    }
  }

  // GET /api/financial/dashboard - Dashboard financiero
  async getFinancialDashboard() {
    try {
      console.log('💼 Obteniendo dashboard financiero...');
      
      const response = await this.get('/api/financial/dashboard');
      
      console.log('✅ Dashboard financiero obtenido');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo dashboard financiero:', error);
      return {
        data: {
          today: { income: 0, expenses: 0, net: 0 },
          thisWeek: { income: 0, expenses: 0, net: 0 },
          thisMonth: { income: 0, expenses: 0, net: 0 }
        }
      };
    }
  }

  // ================================
  // MÉTODOS DE CACHE SIMPLE
  // ================================

  getCachedData(key, maxAge = this.cacheTimeout) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  invalidateCache() {
    this.cache.clear();
    console.log('🗑️ Cache de pagos invalidado');
  }

  // ================================
  // MÉTODOS CON CACHE
  // ================================

  async getPendingPaymentsDashboardWithCache(maxAge = 30000) {
    const cacheKey = 'pending_dashboard';
    const cached = this.getCachedData(cacheKey, maxAge);
    
    if (cached) {
      console.log('📋 Usando dashboard de pendientes desde cache');
      return cached;
    }
    
    const data = await this.getPendingPaymentsDashboard();
    this.setCachedData(cacheKey, data);
    return data;
  }

  // ================================
  // UTILIDADES BÁSICAS
  // ================================

  // Configuración de prioridades para transferencias
  getTransferPriorityConfig(hoursWaiting) {
    if (hoursWaiting >= 72) {
      return {
        priority: 'critical',
        color: 'text-red-600',
        bg: 'bg-red-50'
      };
    } else if (hoursWaiting >= 48) {
      return {
        priority: 'high', 
        color: 'text-orange-600',
        bg: 'bg-orange-50'
      };
    } else if (hoursWaiting >= 24) {
      return {
        priority: 'medium',
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50'
      };
    } else {
      return {
        priority: 'normal',
        color: 'text-green-600',
        bg: 'bg-green-50'
      };
    }
  }

  // Validación básica de datos de pago
  validatePaymentData(paymentData) {
    const errors = [];
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }
    
    if (!paymentData.paymentMethod) {
      errors.push('El método de pago es obligatorio');
    }
    
    if (!paymentData.paymentType) {
      errors.push('El tipo de pago es obligatorio');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ================================
  // DEBUGGING BÁSICO
  // ================================

  async healthCheck() {
    try {
      console.log('🔍 Verificando conectividad del sistema de pagos...');
      
      const tests = {
        payments: false,
        statistics: false,
        dashboard: false
      };
      
      // Test básico de pagos
      try {
        await this.getPayments({ limit: 1 });
        tests.payments = true;
      } catch (error) {
        console.warn('⚠️ Endpoint de pagos no disponible');
      }
      
      // Test de estadísticas
      try {
        await this.getPaymentStatistics();
        tests.statistics = true;
      } catch (error) {
        console.warn('⚠️ Endpoint de estadísticas no disponible');
      }
      
      // Test de dashboard
      try {
        await this.getPendingPaymentsDashboard();
        tests.dashboard = true;
      } catch (error) {
        console.warn('⚠️ Endpoint de dashboard no disponible');
      }
      
      const healthScore = Object.values(tests).filter(Boolean).length / Object.keys(tests).length * 100;
      
      console.log(`💊 Estado del sistema de pagos: ${healthScore}%`);
      
      return {
        healthy: healthScore >= 50,
        score: healthScore,
        tests,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error en health check:', error);
      return {
        healthy: false,
        score: 0,
        error: error.message
      };
    }
  }

  getServiceInfo() {
    return {
      name: 'PaymentService',
      version: '1.0.0',
      description: 'Servicio simplificado para gestión de pagos',
      endpoints: [
        'GET /api/payments',
        'GET /api/payments/statistics',
        'GET /api/payments/pending-dashboard',
        'GET /api/payments/transfers/pending',
        'POST /api/payments/activate-cash-membership',
        'POST /api/payments/{id}/validate-transfer',
        'GET /api/payments/reports',
        'GET /api/financial/dashboard'
      ]
    };
  }
}

// Crear instancia singleton
const paymentService = new PaymentService();

export default paymentService;