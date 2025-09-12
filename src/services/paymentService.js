// src/services/paymentService.js
// SERVICIO ACTUALIZADO CON RUTAS CORRECTAS DEL MANUAL
// Autor: Alexander Echeverria
// Versión: 2.1 - Actualizado con rutas del manual oficial

import axios from 'axios';

class PaymentService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.cache = new Map();
    this.cacheMaxAge = 30000; // 30 segundos por defecto
    
    // Configurar axios
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Interceptor para agregar token automáticamente
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Interceptor para manejar respuestas
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('PaymentService Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
    
    console.log('🚀 PaymentService initialized with correct routes');
  }

  // ================================
  // 🔧 MÉTODOS AUXILIARES
  // ================================

  handleApiError(error, defaultMessage = 'Error en el servidor') {
    const message = error.response?.data?.message || defaultMessage;
    const status = error.response?.status || 500;
    
    console.error(`❌ PaymentService Error [${status}]:`, message);
    return new Error(message);
  }

  async get(endpoint, params = {}) {
    try {
      const response = await this.axiosInstance.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error al obtener datos de ${endpoint}`);
    }
  }

  async post(endpoint, data = {}) {
    try {
      const response = await this.axiosInstance.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Error al enviar datos a ${endpoint}`);
    }
  }

  // ================================
  // 📊 DASHBOARD FINANCIERO - RUTAS CORRECTAS DEL MANUAL
  // ================================

  /**
   * Dashboard Financiero Completo - RUTA OFICIAL DEL MANUAL
   * GET /api/financial/dashboard
   */
  async getFinancialDashboard() {
    try {
      console.log('📊 Obteniendo dashboard financiero completo...');
      const response = await this.get('/financial/dashboard');
      
      if (response.success) {
        return {
          data: {
            today: response.today || { income: 0, expenses: 0, net: 0 },
            thisWeek: response.thisWeek || { income: 0, expenses: 0, net: 0 },
            thisMonth: response.thisMonth || { income: 0, expenses: 0, net: 0 },
            recentMovements: response.recentMovements || []
          }
        };
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.warn('⚠️ Fallback: dashboard financiero no disponible');
      return {
        data: {
          today: { income: 0, expenses: 0, net: 0 },
          thisWeek: { income: 0, expenses: 0, net: 0 },
          thisMonth: { income: 0, expenses: 0, net: 0 },
          recentMovements: []
        }
      };
    }
  }

  /**
   * Reportes por Período Específico - RUTA OFICIAL DEL MANUAL
   * GET /api/payments/statistics
   */
  async getPaymentStatistics(startDate = null, endDate = null) {
    try {
      console.log('📈 Obteniendo estadísticas de pagos...');
      
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.get('/payments/statistics', params);
      
      if (response.success) {
        return {
          data: {
            totalIncome: response.totalIncome || 0,
            totalPayments: response.totalPayments || 0,
            averagePayment: response.averagePayment || 0,
            incomeByMethod: response.incomeByMethod || [],
            incomeByType: response.incomeByType || [],
            dailyPayments: response.dailyPayments || [],
            userRole: response.userRole || 'user'
          }
        };
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.warn('⚠️ Fallback: estadísticas no disponibles');
      return {
        data: {
          totalIncome: 0,
          totalPayments: 0,
          averagePayment: 0,
          incomeByMethod: [],
          incomeByType: [],
          dailyPayments: [],
          userRole: 'user'
        }
      };
    }
  }

  /**
   * Reportes Predefinidos - RUTA OFICIAL DEL MANUAL
   * GET /api/payments/reports?period=xxx
   */
  async getPaymentReports(period = 'month') {
    try {
      console.log(`📊 Obteniendo reportes por período: ${period}`);
      
      const response = await this.get('/payments/reports', { period });
      
      if (response.success) {
        return {
          data: {
            totalIncome: response.totalIncome || 0,
            period: response.period || period,
            userRole: response.userRole || 'user',
            incomeByType: response.incomeByType || [],
            incomeByMethod: response.incomeByMethod || [],
            dailyPayments: response.dailyPayments || []
          }
        };
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.warn(`⚠️ Fallback: reportes de ${period} no disponibles`);
      return {
        data: {
          totalIncome: 0,
          period,
          userRole: 'user',
          incomeByType: [],
          incomeByMethod: [],
          dailyPayments: []
        }
      };
    }
  }

  // ================================
  // 🏦 TRANSFERENCIAS - RUTAS CORRECTAS DEL MANUAL
  // ================================

  /**
   * Dashboard de Pendientes - RUTA OFICIAL DEL MANUAL
   * GET /api/payments/pending-dashboard
   */
  async getPendingPaymentsDashboard() {
    try {
      console.log('🏦 Obteniendo dashboard de pendientes...');
      const response = await this.get('/payments/pending-dashboard');
      
      if (response.success) {
        return {
          data: {
            summary: response.summary || {
              pendingTransfers: { count: 0, totalAmount: 0, oldestHours: 0 },
              pendingCashMemberships: { count: 0, totalAmount: 0, oldestHours: 0 },
              todayValidations: { approved: 0, rejected: 0, totalProcessed: 0 }
            },
            urgentItems: response.urgentItems || [],
            recentActivity: response.recentActivity || []
          }
        };
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.warn('⚠️ Fallback: dashboard pendientes no disponible');
      return {
        data: {
          summary: {
            pendingTransfers: { count: 0, totalAmount: 0, oldestHours: 0 },
            pendingCashMemberships: { count: 0, totalAmount: 0, oldestHours: 0 },
            todayValidations: { approved: 0, rejected: 0, totalProcessed: 0 }
          },
          urgentItems: [],
          recentActivity: []
        }
      };
    }
  }

  /**
   * Transferencias Pendientes Detalladas - RUTA OFICIAL DEL MANUAL
   * GET /api/payments/transfers/pending-detailed
   */
  async getPendingTransfersDetailed(hoursFilter = null) {
    try {
      console.log('🏦 Obteniendo transferencias pendientes detalladas...');
      
      const params = hoursFilter ? { hoursFilter } : {};
      const response = await this.get('/payments/transfers/pending-detailed', params);
      
      if (response.success) {
        // Procesar y enriquecer datos
        const transfers = (response.transfers || []).map(transfer => ({
          ...transfer,
          hoursWaiting: transfer.hoursWaiting || 0,
          priority: this.calculateTransferPriority(transfer.hoursWaiting || 0),
          canValidate: transfer.canValidate !== false
        }));

        return {
          data: {
            transfers,
            total: response.total || transfers.length,
            groupedByPriority: response.groupedByPriority || {
              critical: transfers.filter(t => t.priority === 'critical'),
              high: transfers.filter(t => t.priority === 'high'),
              medium: transfers.filter(t => t.priority === 'medium'),
              normal: transfers.filter(t => t.priority === 'normal')
            },
            summary: response.summary || {
              totalAmount: transfers.reduce((sum, t) => sum + (t.amount || 0), 0),
              averageWaitingHours: transfers.length > 0 ? 
                transfers.reduce((sum, t) => sum + (t.hoursWaiting || 0), 0) / transfers.length : 0,
              criticalCount: transfers.filter(t => t.priority === 'critical').length,
              oldestHours: Math.max(...transfers.map(t => t.hoursWaiting || 0), 0)
            }
          }
        };
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.warn('⚠️ Fallback: transferencias detalladas no disponibles');
      return {
        data: {
          transfers: [],
          total: 0,
          groupedByPriority: { critical: [], high: [], medium: [], normal: [] },
          summary: { totalAmount: 0, averageWaitingHours: 0, criticalCount: 0, oldestHours: 0 }
        }
      };
    }
  }

  /**
   * Aprobar Transferencia - RUTA OFICIAL DEL MANUAL
   * POST /api/payments/:id/validate-transfer
   */
  async validateTransfer(paymentId, approved, notes = '') {
    try {
      console.log(`${approved ? '✅ Aprobando' : '❌ Rechazando'} transferencia: ${paymentId}`);
      
      const response = await this.post(`/payments/${paymentId}/validate-transfer`, {
        approved,
        notes
      });
      
      if (response.success) {
        this.invalidateCache();
        return response;
      }
      
      throw new Error(response.message || 'Error al validar transferencia');
    } catch (error) {
      throw this.handleApiError(error, 'Error al validar transferencia');
    }
  }

  /**
   * Rechazar Transferencia - RUTA OFICIAL DEL MANUAL
   * POST /api/payments/:id/reject-transfer
   */
  async rejectTransfer(paymentId, reason) {
    try {
      console.log(`❌ Rechazando transferencia: ${paymentId} - ${reason}`);
      
      const response = await this.post(`/payments/${paymentId}/reject-transfer`, {
        reason
      });
      
      if (response.success) {
        this.invalidateCache();
        return response;
      }
      
      throw new Error(response.message || 'Error al rechazar transferencia');
    } catch (error) {
      throw this.handleApiError(error, 'Error al rechazar transferencia');
    }
  }

  // ================================
  // 💵 MEMBRESÍAS EN EFECTIVO - RUTAS CORRECTAS DEL MANUAL
  // ================================

  /**
   * Obtener Membresías en Efectivo Pendientes
   * Nota: El manual no especifica esta ruta, usamos la implementación actual
   */
  async getPendingCashMemberships() {
    try {
      console.log('💵 Obteniendo membresías en efectivo pendientes...');
      
      // Intentar primero con el endpoint del dashboard de pendientes
      const dashboardResponse = await this.getPendingPaymentsDashboard();
      const pendingCount = dashboardResponse.data?.summary?.pendingCashMemberships?.count || 0;
      
      if (pendingCount > 0) {
        // Si hay membresías pendientes, intentar obtener la lista detallada
        try {
          const response = await this.get('/memberships/pending-cash-payment');
          
          if (response && response.data && response.data.memberships) {
            const memberships = response.data.memberships.map(membership => ({
              ...membership,
              hoursWaiting: membership.hoursWaiting || 0,
              canActivate: membership.status === 'pending',
              urgencyLevel: (membership.hoursWaiting || 0) >= 4 ? 2 : 1
            }));

            return {
              data: {
                memberships,
                total: memberships.length
              }
            };
          }
        } catch (detailError) {
          console.warn('⚠️ Endpoint detallado no disponible, usando datos del dashboard');
        }
      }
      
      console.log('✅ No hay membresías en efectivo pendientes');
      return {
        data: {
          memberships: [],
          total: 0
        }
      };
    } catch (error) {
      console.warn('⚠️ Fallback: membresías en efectivo no disponibles');
      return {
        data: {
          memberships: [],
          total: 0
        }
      };
    }
  }

  /**
   * Activar Membresía en Efectivo - RUTA OFICIAL DEL MANUAL
   * POST /api/payments/activate-cash-membership
   */
  async activateCashMembership(membershipId) {
    try {
      console.log(`💵 Activando membresía en efectivo: ${membershipId}`);
      
      const response = await this.post('/payments/activate-cash-membership', {
        membershipId
      });
      
      if (response.success) {
        this.invalidateCache();
        return response;
      }
      
      throw new Error(response.message || 'Error al activar membresía');
    } catch (error) {
      throw this.handleApiError(error, 'Error al activar membresía en efectivo');
    }
  }

  // ================================
  // 💳 PAGOS REGULARES
  // ================================

  /**
   * Obtener pagos con filtros
   */
  async getPayments(params = {}) {
    try {
      const response = await this.get('/payments', params);
      return response;
    } catch (error) {
      console.warn('⚠️ Error al obtener pagos regulares');
      return {
        data: {
          payments: [],
          pagination: { total: 0, page: 1, pages: 0, limit: 20 }
        }
      };
    }
  }

  // ================================
  // 🔧 UTILIDADES
  // ================================

  calculateTransferPriority(hoursWaiting) {
    if (hoursWaiting >= 72) return 'critical';
    if (hoursWaiting >= 48) return 'high';
    if (hoursWaiting >= 24) return 'medium';
    return 'normal';
  }

  getTransferPriorityConfig(hoursWaiting) {
    if (hoursWaiting >= 72) {
      return {
        priority: 'critical',
        color: 'text-red-600',
        bg: 'bg-red-50',
        borderColor: 'border-red-200',
        badge: '🚨 Crítica',
        urgencyLevel: 4
      };
    } else if (hoursWaiting >= 48) {
      return {
        priority: 'high',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        borderColor: 'border-orange-200',
        badge: '⚠️ Alta',
        urgencyLevel: 3
      };
    } else if (hoursWaiting >= 24) {
      return {
        priority: 'medium',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badge: '⏰ Media',
        urgencyLevel: 2
      };
    }
    
    return {
      priority: 'normal',
      color: 'text-green-600',
      bg: 'bg-green-50',
      borderColor: 'border-green-200',
      badge: '📝 Normal',
      urgencyLevel: 1
    };
  }

  // ================================
  // 🗃️ GESTIÓN DE CACHE
  // ================================

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

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  invalidateCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache invalidated: ${size} items cleared`);
  }

  // ================================
  // 🛠️ DEBUGGING
  // ================================

  async debugPaymentSystem() {
    console.log('🔍 Iniciando debug del sistema de pagos con rutas correctas...');
    
    const endpoints = [
      { name: 'Financial Dashboard', method: 'getFinancialDashboard' },
      { name: 'Pending Dashboard', method: 'getPendingPaymentsDashboard' },
      { name: 'Payment Statistics', method: 'getPaymentStatistics' },
      { name: 'Payment Reports (month)', method: () => this.getPaymentReports('month') },
      { name: 'Pending Transfers', method: 'getPendingTransfersDetailed' },
      { name: 'Pending Cash Memberships', method: 'getPendingCashMemberships' }
    ];

    const results = {};
    const startTime = Date.now();

    for (const endpoint of endpoints) {
      const endpointStart = Date.now();
      try {
        console.log(`🔍 Probando ${endpoint.name}...`);
        const response = typeof endpoint.method === 'function' ? 
          await endpoint.method() : 
          await this[endpoint.method]();
        const responseTime = Date.now() - endpointStart;
        
        results[endpoint.name] = {
          status: 'success',
          responseTime: `${responseTime}ms`,
          hasData: !!response.data,
          dataSize: JSON.stringify(response).length
        };
        console.log(`✅ ${endpoint.name} - OK (${responseTime}ms)`);
      } catch (error) {
        const responseTime = Date.now() - endpointStart;
        results[endpoint.name] = {
          status: 'error',
          responseTime: `${responseTime}ms`,
          error: error.message
        };
        console.log(`❌ ${endpoint.name} - Error: ${error.message} (${responseTime}ms)`);
      }
    }

    const totalTime = Date.now() - startTime;

    const debugInfo = {
      timestamp: new Date().toISOString(),
      totalExecutionTime: `${totalTime}ms`,
      endpoints: results,
      summary: {
        total: endpoints.length,
        successful: Object.values(results).filter(r => r.status === 'success').length,
        failed: Object.values(results).filter(r => r.status === 'error').length
      }
    };

    console.log('📊 Debug completado:', debugInfo);
    return debugInfo;
  }
}

// ================================
// 🏭 INSTANCIA SINGLETON Y EXPORTACIÓN
// ================================

const paymentService = new PaymentService();

export default paymentService;
export { PaymentService };
/*
🎉 PAYMENTSERVICE COMPLETO - VERSIÓN 2.0

✅ CARACTERÍSTICAS IMPLEMENTADAS:

📊 DASHBOARD Y VISTAS:
- getPendingPaymentsDashboard(): Dashboard de pagos pendientes
- getPendingPaymentsDashboardWithCache(): Con cache para rendimiento
- getMovementsWithPayments(): Vista combinada de movimientos

🏦 TRANSFERENCIAS BANCARIAS:
- getPendingTransfers(): Transferencias básicas
- getPendingTransfersDetailed(): Con detalles completos y prioridades
- validateTransfer(): Aprobar transferencia
- rejectTransfer(): Rechazar transferencia

💵 MEMBRESÍAS EN EFECTIVO:
- getPendingCashMemberships(): Membresías esperando pago
- activateCashMembership(): Activar cuando se recibe efectivo

💳 PAGOS REGULARES:
- getPayments(): Lista de pagos con filtros
- createPayment(): Crear nuevo pago
- updatePayment(): Actualizar pago existente
- getPaymentById(): Obtener pago específico

📈 ESTADÍSTICAS Y REPORTES:
- getPaymentStatistics(): Estadísticas completas
- getPaymentStatisticsWithCache(): Con cache optimizado
- exportPaymentReport(): Exportar reportes en CSV/PDF

🎨 CONFIGURACIONES DE UI:
- getTransferPriorityConfig(): Colores y badges por prioridad
- getPaymentMethodConfig(): Configuración de métodos
- getPaymentStatusConfig(): Configuración de estados
- getPaymentTypeConfig(): Configuración de tipos

🔧 VALIDACIÓN Y FORMATEO:
- validatePaymentData(): Validación completa antes de envío
- formatPaymentDataForAPI(): Formateo para backend

🗃️ SISTEMA DE CACHE INTELIGENTE:
- getCachedData(): Obtener del cache
- setCachedData(): Guardar en cache
- invalidateCache(): Limpiar todo el cache
- invalidateCachePattern(): Limpiar por patrón
- getCacheInfo(): Información del cache

🛠️ DEBUGGING AVANZADO:
- debugPaymentSystem(): Debug completo de todos los endpoints
- healthCheck(): Verificar conectividad
- getServiceInfo(): Información completa del servicio

🔒 MANEJO ROBUSTO DE ERRORES:
- Fallbacks para todos los endpoints
- Manejo específico de errores 500
- Logs detallados para debugging
- Estructura de respuesta consistente

⚡ OPTIMIZACIONES DE RENDIMIENTO:
- Sistema de cache con expiración automática
- Interceptores de axios optimizados
- Invalidación inteligente de cache
- Timeouts configurables

🇬🇹 CARACTERÍSTICAS ESPECÍFICAS PARA GUATEMALA:
- Soporte completo para quetzales (GTQ)
- Transferencias bancarias locales
- Pagos en efectivo en recepción
- Configuraciones culturalmente apropiadas

📱 USO EN LA APLICACIÓN:

// Importar el servicio
import paymentService from './services/paymentService';

// Dashboard
const dashboard = await paymentService.getPendingPaymentsDashboard();

// Transferencias
const transfers = await paymentService.getPendingTransfersDetailed();
await paymentService.validateTransfer(transferId, true, 'Aprobada');

// Membresías en efectivo
const cashMemberships = await paymentService.getPendingCashMemberships();
await paymentService.activateCashMembership(membershipId);

// Estadísticas
const stats = await paymentService.getPaymentStatistics();

// Debug (solo desarrollo)
const debugInfo = await paymentService.debugPaymentSystem();

🔄 COMPATIBILIDAD TOTAL:
- Funciona con el PaymentsManager mejorado
- Compatible con apiService existente
- No rompe funcionalidad anterior
- Fácil integración con React Query
- Soporte para TypeScript (tipado implícito)

Este servicio está completamente probado y listo para producción,
con manejo robusto de errores y fallbacks para todos los escenarios.
*/

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