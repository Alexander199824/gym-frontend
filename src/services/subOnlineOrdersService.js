// src/services/subOnlineOrdersService.js
// SUB-SERVICIO PARA ÓRDENES ONLINE (PÁGINA WEB)
// ✅ Basado en el test funcional del backend

import toast from 'react-hot-toast';

export class SubOnlineOrdersService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  // ================================
  // 📦 MÉTODOS DE ÓRDENES ONLINE
  // ================================

  /**
   * Listar órdenes online con filtros
   * @param {Object} params - Parámetros de filtrado
   * @param {number} params.limit - Límite de resultados
   * @param {number} params.page - Página actual
   * @param {string} params.status - Filtrar por estado
   * @param {string} params.deliveryType - Filtrar por tipo de entrega
   * @param {string} params.startDate - Fecha inicio
   * @param {string} params.endDate - Fecha fin
   */
  async getOnlineOrders(params = {}) {
    console.log('📦 SubOnlineOrdersService: Getting online orders...', params);
    
    try {
      // ✅ RUTA CORRECTA según test funcional
      const response = await this.baseService.get('/api/store/management/orders', { params });
      console.log('✅ Online orders response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting online orders:', error);
      throw error;
    }
  }

  /**
   * Obtener una orden específica por ID
   * @param {number} orderId - ID de la orden
   */
  async getOrderById(orderId) {
    console.log('📦 SubOnlineOrdersService: Getting order by ID...', orderId);
    
    try {
      const response = await this.baseService.get(`/api/store/management/orders/${orderId}`);
      console.log('✅ Order detail response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting order detail:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de una orden
   * @param {number} orderId - ID de la orden
   * @param {string} status - Nuevo estado
   * @param {string} notes - Notas opcionales
   */
  async updateOrderStatus(orderId, status, notes = '') {
    console.log('📦 SubOnlineOrdersService: Updating order status...', { orderId, status, notes });
    
    try {
      // ✅ RUTA CORRECTA según test funcional
      const response = await this.baseService.patch(`/api/order-management/${orderId}/status`, {
        status,
        notes
      });
      
      if (response.success) {
        console.log('✅ Order status updated successfully');
        toast.success(`Estado actualizado a: ${this.getStatusLabel(status)}`);
        this.baseService.invalidateCache(); // Invalidar cache relacionado
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar estado de la orden';
      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Confirmar transferencia de una orden online
   * @param {number} orderId - ID de la orden
   * @param {Object} transferData - Datos de la transferencia
   */
  async confirmOrderTransfer(orderId, transferData = {}) {
    console.log('📦 SubOnlineOrdersService: Confirming order transfer...', { orderId, transferData });
    
    try {
      // ✅ RUTA CORRECTA según test funcional
      const response = await this.baseService.post(`/api/order-management/${orderId}/confirm-transfer`, {
        voucherDetails: transferData.voucherDetails || 'Transferencia confirmada',
        bankReference: transferData.bankReference || '',
        notes: transferData.notes || 'Confirmada desde dashboard'
      });
      
      if (response.success) {
        console.log('✅ Order transfer confirmed successfully');
        toast.success('Transferencia confirmada exitosamente');
        this.baseService.invalidateCache();
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error confirming order transfer:', error);
      const errorMessage = error.response?.data?.message || 'Error al confirmar transferencia';
      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Obtener órdenes con transferencias pendientes
   */
  async getPendingTransfers() {
    console.log('📦 SubOnlineOrdersService: Getting pending transfers...');
    
    try {
      // ✅ Intentar ambas rutas según el test
      let response;
      
      try {
        response = await this.baseService.get('/api/order-management/pending-transfers');
      } catch (firstError) {
        // Si falla la primera ruta, intentar la alternativa
        console.log('⚠️ First route failed, trying alternative...');
        response = await this.baseService.get('/api/store/management/orders/pending-transfers');
      }
      
      console.log('✅ Pending transfers response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting pending transfers:', error);
      // No lanzar error, retornar lista vacía
      return {
        success: true,
        data: { transfers: [], orders: [] }
      };
    }
  }

  /**
   * Obtener dashboard de órdenes (estadísticas)
   */
  async getOrdersDashboard() {
    console.log('📦 SubOnlineOrdersService: Getting orders dashboard...');
    
    try {
      // ✅ RUTA CORRECTA según test funcional
      const response = await this.baseService.get('/api/order-management/dashboard');
      console.log('✅ Orders dashboard response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting orders dashboard:', error);
      // Retornar estructura vacía en caso de error
      return {
        success: true,
        data: {
          summary: {
            totalOrders: 0,
            pendingOrders: 0,
            confirmedOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0
          }
        }
      };
    }
  }

  /**
   * Buscar órdenes por criterios
   * @param {string} searchTerm - Término de búsqueda
   * @param {string} searchType - Tipo de búsqueda (number, customer, product)
   */
  async searchOrders(searchTerm, searchType = 'number') {
    console.log('📦 SubOnlineOrdersService: Searching orders...', { searchTerm, searchType });
    
    try {
      const params = {
        limit: 50
      };
      
      switch (searchType) {
        case 'number':
          params.orderNumber = searchTerm;
          break;
        case 'customer':
          params.customerName = searchTerm;
          break;
        case 'product':
          params.productName = searchTerm;
          break;
      }
      
      const response = await this.baseService.get('/api/store/management/orders', { params });
      console.log('✅ Search orders response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error searching orders:', error);
      throw error;
    }
  }

  /**
   * Cancelar una orden
   * @param {number} orderId - ID de la orden
   * @param {string} reason - Razón de cancelación
   */
  async cancelOrder(orderId, reason = '') {
    console.log('📦 SubOnlineOrdersService: Cancelling order...', { orderId, reason });
    
    try {
      const response = await this.updateOrderStatus(orderId, 'cancelled', reason);
      
      if (response.success) {
        toast.success('Orden cancelada exitosamente');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Marcar orden como entregada
   * @param {number} orderId - ID de la orden
   * @param {string} notes - Notas de entrega
   */
  async markAsDelivered(orderId, notes = '') {
    console.log('📦 SubOnlineOrdersService: Marking order as delivered...', { orderId, notes });
    
    try {
      const response = await this.updateOrderStatus(orderId, 'delivered', notes);
      
      if (response.success) {
        toast.success('Orden marcada como entregada');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error marking order as delivered:', error);
      throw error;
    }
  }

  /**
   * Marcar orden como recogida
   * @param {number} orderId - ID de la orden
   * @param {string} notes - Notas de recogida
   */
  async markAsPickedUp(orderId, notes = '') {
    console.log('📦 SubOnlineOrdersService: Marking order as picked up...', { orderId, notes });
    
    try {
      const response = await this.updateOrderStatus(orderId, 'picked_up', notes);
      
      if (response.success) {
        toast.success('Orden marcada como recogida');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Error marking order as picked up:', error);
      throw error;
    }
  }

  /**
   * Obtener reporte de órdenes por fecha
   * @param {string} startDate - Fecha inicio
   * @param {string} endDate - Fecha fin
   */
  async getOrdersReport(startDate, endDate) {
    console.log('📦 SubOnlineOrdersService: Getting orders report...', { startDate, endDate });
    
    try {
      const response = await this.baseService.get('/api/order-management/reports/range', {
        params: { startDate, endDate }
      });
      console.log('✅ Orders report response:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Error getting orders report:', error);
      throw error;
    }
  }

  // ================================
  // 🔧 MÉTODOS AUXILIARES
  // ================================

  /**
   * Obtener etiqueta traducida del estado
   */
  getStatusLabel(status) {
    const statusLabels = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'preparing': 'En preparación',
      'ready_pickup': 'Lista para recoger',
      'packed': 'Empacada',
      'shipped': 'Enviada',
      'delivered': 'Entregada',
      'picked_up': 'Recogida',
      'cancelled': 'Cancelada',
      'refunded': 'Reembolsada'
    };
    return statusLabels[status] || status;
  }

  /**
   * Obtener color del estado para UI
   */
  getStatusColor(status) {
    const statusColors = {
      'pending': 'yellow',
      'confirmed': 'blue',
      'preparing': 'indigo',
      'ready_pickup': 'cyan',
      'packed': 'purple',
      'shipped': 'violet',
      'delivered': 'green',
      'picked_up': 'green',
      'cancelled': 'red',
      'refunded': 'orange'
    };
    return statusColors[status] || 'gray';
  }

  /**
   * Obtener icono del estado
   */
  getStatusIcon(status) {
    const statusIcons = {
      'pending': '⏳',
      'confirmed': '✅',
      'preparing': '👨‍🍳',
      'ready_pickup': '📦',
      'packed': '📦',
      'shipped': '🚚',
      'delivered': '✅',
      'picked_up': '✅',
      'cancelled': '❌',
      'refunded': '💸'
    };
    return statusIcons[status] || '❓';
  }

  /**
   * Obtener siguiente estado válido
   */
  getNextValidStatus(currentStatus, deliveryType) {
    const statusFlow = {
      'pickup': {
        'pending': 'confirmed',
        'confirmed': 'preparing',
        'preparing': 'ready_pickup',
        'ready_pickup': 'picked_up'
      },
      'delivery': {
        'pending': 'confirmed',
        'confirmed': 'preparing',
        'preparing': 'packed',
        'packed': 'shipped',
        'shipped': 'delivered'
      }
    };
    
    return statusFlow[deliveryType]?.[currentStatus] || null;
  }

  /**
   * Validar si el estado es válido
   */
  isValidStatus(status) {
    const validStatuses = [
      'pending', 'confirmed', 'preparing', 'ready_pickup',
      'packed', 'shipped', 'delivered', 'picked_up',
      'cancelled', 'refunded'
    ];
    return validStatuses.includes(status);
  }

  /**
   * Obtener información del cliente de una orden
   */
  getCustomerInfo(order) {
    if (order.user && (order.user.firstName || order.user.lastName)) {
      return `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
    } else if (order.customerInfo && order.customerInfo.name) {
      return order.customerInfo.name;
    } else if (order.customerName) {
      return order.customerName;
    } else if (order.customer && order.customer.name) {
      return order.customer.name;
    } else {
      return 'Cliente anónimo';
    }
  }

  /**
   * Obtener dirección de envío formateada
   */
  getShippingAddress(order) {
    if (!order.shippingAddress) return 'Sin dirección';
    
    if (typeof order.shippingAddress === 'string') {
      return order.shippingAddress;
    }
    
    const addr = order.shippingAddress;
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.zipCode,
      addr.country
    ].filter(Boolean);
    
    return parts.join(', ') || 'Sin dirección';
  }

  /**
   * Calcular tiempo transcurrido desde la orden
   */
  getTimeSince(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    }
  }
}

export default SubOnlineOrdersService;