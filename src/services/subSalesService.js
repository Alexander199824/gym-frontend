// src/services/subSalesService.js
// SUB-SERVICIO PARA VENTAS LOCALES

import toast from 'react-hot-toast';

export class SubSalesService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 💰 MÉTODOS DE VENTAS LOCALES
  // ================================

  // Listar ventas locales
  async getLocalSales(params = {}) {
    console.log('💰 SubSalesService: Getting local sales...', params);
    
    try {
      const response = await this.baseService.get('/api/local-sales', { params });
      console.log('✅ Local sales response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting local sales:', error);
      throw error;
    }
  }

  // Crear venta en efectivo
  async createCashSale(saleData) {
    console.log('💰 SubSalesService: Creating cash sale...', saleData);
    
    try {
      const response = await this.baseService.post('/api/local-sales/cash', saleData);
      
      if (response.success) {
        console.log('✅ Cash sale created successfully');
        toast.success('Venta en efectivo registrada');
        this.baseService.invalidateSalesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating cash sale:', error);
      const errorMessage = error.response?.data?.message || 'Error al registrar venta';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Crear venta por transferencia
  async createTransferSale(saleData) {
    console.log('💰 SubSalesService: Creating transfer sale...', saleData);
    
    try {
      const response = await this.baseService.post('/api/local-sales/transfer', saleData);
      
      if (response.success) {
        console.log('✅ Transfer sale created successfully');
        toast.success('Venta por transferencia registrada');
        this.baseService.invalidateSalesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error creating transfer sale:', error);
      const errorMessage = error.response?.data?.message || 'Error al registrar venta por transferencia';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Confirmar transferencia (solo admin)
  async confirmTransfer(saleId, notes = '') {
    console.log('💰 SubSalesService: Confirming transfer...', { saleId, notes });
    
    try {
      const response = await this.baseService.post(`/api/local-sales/${saleId}/confirm-transfer`, { notes });
      
      if (response.success) {
        console.log('✅ Transfer confirmed successfully');
        toast.success('Transferencia confirmada');
        this.baseService.invalidateSalesCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error confirming transfer:', error);
      const errorMessage = error.response?.data?.message || 'Error al confirmar transferencia';
      toast.error(errorMessage);
      throw error;
    }
  }

  // Obtener transferencias pendientes
  async getPendingTransfers() {
    console.log('💰 SubSalesService: Getting pending transfers...');
    
    try {
      const response = await this.baseService.get('/api/local-sales/pending-transfers');
      console.log('✅ Pending transfers response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting pending transfers:', error);
      throw error;
    }
  }

  // Buscar productos para venta
  async searchProductsForSale(query, limit = 10) {
    console.log('💰 SubSalesService: Searching products for sale...', { query, limit });
    
    try {
      const response = await this.baseService.get('/api/local-sales/products/search', {
        params: { q: query, limit }
      });
      console.log('✅ Products for sale search response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error searching products for sale:', error);
      throw error;
    }
  }

  // Reporte diario de ventas
  async getDailySalesReport(date) {
    console.log('💰 SubSalesService: Getting daily sales report...', { date });
    
    try {
      const response = await this.baseService.get('/api/local-sales/reports/daily', {
        params: { date }
      });
      console.log('✅ Daily sales report response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting daily sales report:', error);
      throw error;
    }
  }

  // Estadísticas personales (colaborador)
  async getMySalesStats() {
    console.log('💰 SubSalesService: Getting my sales stats...');
    
    try {
      const response = await this.baseService.get('/api/local-sales/my-stats');
      console.log('✅ My sales stats response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting my sales stats:', error);
      throw error;
    }
  }
}