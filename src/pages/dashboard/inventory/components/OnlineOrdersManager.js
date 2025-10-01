// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/OnlineOrdersManager.js
// FUNCIÓN: Gestión completa de órdenes online (página web)

import React, { useState, useEffect } from 'react';
import {
  Globe, Package, Truck, Clock, MapPin, User, Phone,
  Mail, CreditCard, Eye, CheckCircle, X, AlertCircle,
  RotateCcw, Loader, Search, Filter, Calendar, Download,
  Edit, MessageSquare, FileText, DollarSign, ShoppingCart,
  Home, Zap, ChevronRight, Check
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

const OnlineOrdersManager = ({ onSave, onUnsavedChanges }) => {
  const { user } = useAuth();
  const { showSuccess, showError, formatCurrency, formatDate } = useApp();
  
  // Estados principales
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  
  // Estados para modales
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Estados para transferencias
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [confirmingTransfer, setConfirmingTransfer] = useState(null);
  
  // Configuraciones
  const dateFilters = [
    { id: 'today', label: 'Hoy' },
    { id: 'yesterday', label: 'Ayer' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' }
  ];
  
  const statusFilters = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'confirmed', label: 'Confirmadas' },
    { id: 'preparing', label: 'En preparación' },
    { id: 'ready_pickup', label: 'Listas para recoger' },
    { id: 'shipped', label: 'Enviadas' },
    { id: 'delivered', label: 'Entregadas' }
  ];
  
  const deliveryFilters = [
    { id: 'all', label: 'Todos' },
    { id: 'pickup', label: 'Recogida' },
    { id: 'delivery', label: 'Entrega a domicilio' },
    { id: 'express', label: 'Express' }
  ];
  
  const validStatuses = [
    { value: 'pending', label: 'Pendiente', color: 'yellow', icon: Clock },
    { value: 'confirmed', label: 'Confirmada', color: 'blue', icon: CheckCircle },
    { value: 'preparing', label: 'En preparación', color: 'indigo', icon: Package },
    { value: 'ready_pickup', label: 'Lista para recoger', color: 'cyan', icon: ShoppingCart },
    { value: 'packed', label: 'Empacada', color: 'purple', icon: Package },
    { value: 'shipped', label: 'Enviada', color: 'violet', icon: Truck },
    { value: 'delivered', label: 'Entregada', color: 'green', icon: CheckCircle },
    { value: 'picked_up', label: 'Recogida', color: 'green', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelada', color: 'red', icon: X }
  ];
  
  // Cargar datos
  useEffect(() => {
    loadAllData();
  }, [dateFilter, statusFilter, deliveryFilter]);
  
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(false);
    }
  }, [onUnsavedChanges]);
  
  const loadAllData = async () => {
    setIsLoading(true);
    
    try {
      await Promise.all([
        loadOrders(),
        loadDashboardStats(),
        user?.role === 'admin' && loadPendingTransfers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadOrders = async () => {
    try {
      const params = { limit: 50 };
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (deliveryFilter !== 'all') params.deliveryType = deliveryFilter;
      
      const today = new Date();
      if (dateFilter === 'today') {
        params.startDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        params.startDate = yesterday.toISOString().split('T')[0];
        params.endDate = yesterday.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString().split('T')[0];
      }
      
      const response = await inventoryService.subOnlineOrders.getOnlineOrders(params);
      
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Error al cargar las órdenes');
    }
  };
  
  const loadDashboardStats = async () => {
    try {
      const response = await inventoryService.subOnlineOrders.getOrdersDashboard();
      
      if (response.success && response.data) {
        setDashboardStats(response.data.summary || response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };
  
  const loadPendingTransfers = async () => {
    try {
      const response = await inventoryService.subOnlineOrders.getPendingTransfers();
      
      if (response.success && response.data) {
        setPendingTransfers(response.data.transfers || response.data.orders || []);
      }
    } catch (error) {
      console.error('Error loading pending transfers:', error);
    }
  };
  
  // Handlers
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };
  
  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };
  
  const handleConfirmTransfer = async (orderId) => {
    setConfirmingTransfer(orderId);
    
    try {
      await inventoryService.subOnlineOrders.confirmOrderTransfer(orderId, {
        notes: 'Transferencia confirmada desde dashboard'
      });
      
      await loadAllData();
      showSuccess('Transferencia confirmada exitosamente');
    } catch (error) {
      console.error('Error confirming transfer:', error);
    } finally {
      setConfirmingTransfer(null);
    }
  };
  
  const handleStatusUpdate = async (newStatus, notes) => {
    if (!selectedOrder) return;
    
    setUpdatingStatus(true);
    
    try {
      await inventoryService.subOnlineOrders.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        notes
      );
      
      await loadAllData();
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const handleQuickAction = async (order, action) => {
    try {
      switch (action) {
        case 'confirm':
          await inventoryService.subOnlineOrders.updateOrderStatus(order.id, 'confirmed');
          break;
        case 'deliver':
          await inventoryService.subOnlineOrders.markAsDelivered(order.id);
          break;
        case 'pickup':
          await inventoryService.subOnlineOrders.markAsPickedUp(order.id);
          break;
        case 'cancel':
          const reason = window.prompt('Razón de cancelación:');
          if (reason) {
            await inventoryService.subOnlineOrders.cancelOrder(order.id, reason);
          }
          break;
      }
      
      await loadAllData();
    } catch (error) {
      console.error('Error in quick action:', error);
    }
  };
  
  // Filtros y cálculos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerInfo(order).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
  const ordersMetrics = {
    totalOrders: filteredOrders.length,
    totalAmount: filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    pendingCount: filteredOrders.filter(o => o.status === 'pending').length,
    inProgressCount: filteredOrders.filter(o => 
      ['confirmed', 'preparing', 'packed', 'shipped'].includes(o.status)
    ).length,
    completedCount: filteredOrders.filter(o => 
      ['delivered', 'picked_up'].includes(o.status)
    ).length,
    pendingTransfersCount: pendingTransfers.length
  };
  
  // Helpers
  const getCustomerInfo = (order) => {
    return inventoryService.subOnlineOrders.getCustomerInfo(order);
  };
  
  const getStatusBadge = (status) => {
    const statusConfig = validStatuses.find(s => s.value === status);
    if (!statusConfig) return { label: status, color: 'gray' };
    
    return {
      label: statusConfig.label,
      color: statusConfig.color
    };
  };
  
  const getDeliveryIcon = (deliveryType) => {
    switch (deliveryType) {
      case 'pickup': return Home;
      case 'delivery': return Truck;
      case 'express': return Zap;
      default: return Package;
    }
  };

  // Loading
  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando órdenes online...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Órdenes</p>
              <p className="text-3xl font-bold text-gray-900">{ordersMetrics.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Período seleccionado</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Ingresos Totales</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(ordersMetrics.totalAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Órdenes online</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">En Proceso</p>
              <p className="text-3xl font-bold text-gray-900">{ordersMetrics.inProgressCount}</p>
              <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Completadas</p>
              <p className="text-3xl font-bold text-gray-900">{ordersMetrics.completedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Entregadas/Recogidas</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
      </div>
      
      {/* ALERTAS */}
      {ordersMetrics.pendingCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-700">
                <span className="font-medium">{ordersMetrics.pendingCount}</span> {ordersMetrics.pendingCount === 1 ? 'orden pendiente' : 'órdenes pendientes'} de confirmación
              </p>
            </div>
          </div>
        </div>
      )}
      
      {ordersMetrics.pendingTransfersCount > 0 && user?.role === 'admin' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <CreditCard className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-medium">{ordersMetrics.pendingTransfersCount}</span> {ordersMetrics.pendingTransfersCount === 1 ? 'transferencia pendiente' : 'transferencias pendientes'} de confirmar
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* FILTROS */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar órdenes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {dateFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {deliveryFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
        </div>
      </div>
      
      {/* LISTA DE ÓRDENES */}
      <div className="bg-white rounded-lg shadow-lg">
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay órdenes online
            </h3>
            <p className="text-gray-600">
              Las órdenes de la tienda web aparecerán aquí
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando {filteredOrders.length} de {orders.length} órdenes
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const DeliveryIcon = getDeliveryIcon(order.deliveryType);
                const statusBadge = getStatusBadge(order.status);
                const isTransferPending = order.paymentMethod === 'transfer' && order.status === 'pending';
                
                return (
                  <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isTransferPending ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <DeliveryIcon className={`w-6 h-6 ${
                            isTransferPending ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-medium text-gray-900">
                              Orden #{order.orderNumber || order.id}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-800`}>
                              {statusBadge.label}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{getCustomerInfo(order)}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span>{order.itemsCount || 0} producto{(order.itemsCount || 0) !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          
                          {order.shippingAddress && (
                            <div className="flex items-start text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                              <span className="truncate">
                                {inventoryService.subOnlineOrders.getShippingAddress(order)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 ml-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(order.totalAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.deliveryType === 'pickup' ? 'Recogida' : 'Entrega'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isTransferPending && user?.role === 'admin' && (
                            <button
                              onClick={() => handleConfirmTransfer(order.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Confirmar transferencia"
                              disabled={confirmingTransfer === order.id}
                            >
                              {confirmingTransfer === order.id ? (
                                <Loader className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => handleUpdateStatus(order)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Actualizar estado"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* MODAL DE DETALLE (Placeholder - implementar después) */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Detalles de Orden #{selectedOrder.orderNumber || selectedOrder.id}
              </h3>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <p className="text-gray-600">Implementar vista detallada de orden...</p>
            
            <button
              onClick={() => setShowOrderDetail(false)}
              className="mt-4 w-full btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      
      {/* MODAL DE ACTUALIZACIÓN DE ESTADO (Placeholder - implementar después) */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Actualizar Estado</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Orden #{selectedOrder.orderNumber || selectedOrder.id}
            </p>
            
            <div className="space-y-2 mb-4">
              {validStatuses.map(status => (
                <button
                  key={status.value}
                  onClick={() => handleStatusUpdate(status.value, '')}
                  disabled={updatingStatus}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                    selectedOrder.status === status.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <status.icon className="w-5 h-5 mr-2" />
                    <span className="font-medium">{status.label}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full btn-secondary"
              disabled={updatingStatus}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default OnlineOrdersManager;