// src/services/subStatsService.js
// SUB-SERVICIO PARA ESTADÍSTICAS E INVENTARIO

export class SubStatsService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 📊 MÉTODOS DE ESTADÍSTICAS E INVENTARIO
  // ================================

  // Obtener estadísticas principales del dashboard
  async getInventoryStats(period = 'month') {
    console.log('📊 SubStatsService: Getting inventory stats...', { period });
    
    try {
      const response = await this.baseService.get('/api/inventory/stats', { 
        params: { period } 
      });
      
      console.log('✅ Inventory stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting inventory stats:', error);
      
      // Fallback con datos ejemplo si el endpoint no está disponible
      console.warn('⚠️ Using fallback inventory stats');
      return {
        success: true,
        data: {
          inventory: {
            totalProducts: 0,
            lowStockProducts: 0,
            outOfStockProducts: 0,
            totalValue: 0
          },
          sales: {
            period: period,
            data: []
          },
          products: {
            topSelling: []
          },
          alerts: {
            pendingTransfers: { total: 0, online: 0, local: 0 },
            lowStockProducts: 0
          },
          categories: []
        }
      };
    }
  }

  // Dashboard completo de inventario
  async getInventoryDashboard() {
    console.log('📊 SubStatsService: Getting inventory dashboard...');
    
    try {
      const response = await this.baseService.get('/api/inventory/dashboard');
      console.log('✅ Inventory dashboard response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting inventory dashboard:', error);
      throw error;
    }
  }

  // Reporte financiero
  async getFinancialReport(startDate, endDate) {
    console.log('💰 SubStatsService: Getting financial report...', { startDate, endDate });
    
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.baseService.get('/api/inventory/financial-report', { params });
      console.log('✅ Financial report response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting financial report:', error);
      throw error;
    }
  }

  // Productos con stock bajo
  async getLowStockProducts() {
    console.log('⚠️ SubStatsService: Getting low stock products...');
    
    try {
      const response = await this.baseService.get('/api/inventory/low-stock');
      console.log('✅ Low stock products response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting low stock products:', error);
      throw error;
    }
  }

  // Performance de empleados (solo admin)
  async getEmployeePerformance(startDate, endDate) {
    console.log('👥 SubStatsService: Getting employee performance...', { startDate, endDate });
    
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.baseService.get('/api/inventory/employee-performance', { params });
      console.log('✅ Employee performance response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting employee performance:', error);
      throw error;
    }
  }
}