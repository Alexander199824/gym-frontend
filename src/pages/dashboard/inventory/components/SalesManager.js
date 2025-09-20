// Autor: Alexander Echeverria  
// Archivo: src/pages/dashboard/inventory/components/SalesManager.js
// FUNCIÓN: Gestión completa de ventas conectado al backend real
// ACTUALIZADO: Para usar inventoryService con rutas correctas del manual

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Plus, Search, Filter, Calendar, 
  User, CreditCard, Coins, Receipt, Clock,
  Edit, Trash2, Eye, Download, TrendingUp,
  AlertCircle, CheckCircle, XCircle, Loader,
  Package, Calculator, Star, Tag, X, Save,
  Minus, RotateCcw, FileText, Users
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

const SalesManager = ({ onSave, onUnsavedChanges }) => {
  const { user } = useAuth();
  const { showSuccess, showError, formatCurrency, formatDate, isMobile } = useApp();
  
  // Estados principales
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estados para nueva venta
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [currentSale, setCurrentSale] = useState({
    items: [],
    customerInfo: {
      name: '',
      phone: '',
      email: ''
    },
    paymentMethod: 'cash',
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: '',
    cashReceived: '',
    transferVoucher: '',
    bankReference: ''
  });
  const [isSavingSale, setIsSavingSale] = useState(false);
  
  // Estados para búsqueda de productos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estados para filtros de ventas
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estados para transferencias pendientes
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [showPendingTransfers, setShowPendingTransfers] = useState(false);
  const [confirmingTransfer, setConfirmingTransfer] = useState(null);
  
  // Métodos de pago
  const paymentMethods = [
    { id: 'cash', label: 'Efectivo', icon: Coins, color: 'green' },
    { id: 'transfer', label: 'Transferencia', icon: FileText, color: 'blue' }
  ];
  
  // Filtros de fecha
  const dateFilters = [
    { id: 'today', label: 'Hoy' },
    { id: 'yesterday', label: 'Ayer' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
    { id: 'custom', label: 'Rango personalizado' }
  ];
  
  // Filtros de estado
  const statusFilters = [
    { id: 'all', label: 'Todos los estados' },
    { id: 'completed', label: 'Completadas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'cancelled', label: 'Canceladas' }
  ];
  
  // CARGAR DATOS INICIALES
  useEffect(() => {
    loadSalesData();
    if (user?.role === 'admin') {
      loadPendingTransfers();
    }
  }, [dateFilter, paymentFilter, statusFilter]);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasChanges);
    }
  }, [hasChanges, onUnsavedChanges]);
  
  const loadSalesData = async () => {
    setIsLoading(true);
    
    try {
      console.log('📊 Loading sales data...');
      
      // Construir parámetros de filtro
      const params = {
        page: 1,
        limit: 50
      };
      
      // Agregar filtros
      if (paymentFilter !== 'all') {
        params.paymentMethod = paymentFilter;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      // Filtros de fecha
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
      
      const response = await inventoryService.getLocalSales(params);
      
      if (response.success && response.data) {
        const salesData = response.data.sales || [];
        setSales(salesData);
        console.log(`✅ Loaded ${salesData.length} sales`);
      } else {
        console.log('⚠️ No sales data available');
        setSales([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading sales:', error);
      showError('Error al cargar las ventas');
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadPendingTransfers = async () => {
    try {
      console.log('💰 Loading pending transfers...');
      const response = await inventoryService.getPendingTransfers();
      
      if (response.success && response.data) {
        const transfers = response.data.transfers || [];
        setPendingTransfers(transfers);
        console.log(`✅ Loaded ${transfers.length} pending transfers`);
      }
      
    } catch (error) {
      console.error('❌ Error loading pending transfers:', error);
      setPendingTransfers([]);
    }
  };
  
  // BÚSQUEDA DE PRODUCTOS PARA VENTA
  const searchProducts = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await inventoryService.searchProductsForSale(query, 10);
      
      if (response.success && response.data) {
        const products = response.data.products || [];
        setSearchResults(products);
      } else {
        setSearchResults([]);
      }
      
    } catch (error) {
      console.error('❌ Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Debounce para búsqueda de productos
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(productSearchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [productSearchTerm]);
  
  // AGREGAR PRODUCTO A LA VENTA
  const addProductToSale = (product) => {
    const existingItem = currentSale.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Incrementar cantidad si ya existe
      updateItemQuantity(existingItem.productId, existingItem.quantity + 1);
    } else {
      // Agregar nuevo item
      const newItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price || 0,
        total: product.price || 0
      };
      
      setCurrentSale(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
    
    setProductSearchTerm('');
    setSearchResults([]);
    calculateSaleTotal();
  };
  
  // ACTUALIZAR CANTIDAD DE ITEM
  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromSale(productId);
      return;
    }
    
    setCurrentSale(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
          : item
      )
    }));
    
    calculateSaleTotal();
  };
  
  // ELIMINAR ITEM DE LA VENTA
  const removeItemFromSale = (productId) => {
    setCurrentSale(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
    
    calculateSaleTotal();
  };
  
  // CALCULAR TOTAL DE LA VENTA
  const calculateSaleTotal = () => {
    setTimeout(() => {
      setCurrentSale(prev => {
        const subtotal = prev.items.reduce((sum, item) => sum + item.total, 0);
        const discount = parseFloat(prev.discount) || 0;
        const tax = 0; // No hay impuestos en Guatemala para este tipo de ventas
        const total = subtotal - discount + tax;
        
        return {
          ...prev,
          subtotal,
          tax,
          total: Math.max(0, total)
        };
      });
    }, 100);
  };
  
  // INICIAR NUEVA VENTA
  const handleNewSale = () => {
    setCurrentSale({
      items: [],
      customerInfo: {
        name: '',
        phone: '',
        email: ''
      },
      paymentMethod: 'cash',
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: '',
      cashReceived: '',
      transferVoucher: '',
      bankReference: ''
    });
    setShowNewSaleModal(true);
  };
  
  // GUARDAR VENTA
  const handleSaveSale = async () => {
    if (currentSale.items.length === 0) {
      showError('Debe agregar al menos un producto a la venta');
      return;
    }
    
    if (!currentSale.customerInfo.name.trim()) {
      showError('Debe ingresar el nombre del cliente');
      return;
    }
    
    if (currentSale.paymentMethod === 'cash') {
      const cashReceived = parseFloat(currentSale.cashReceived);
      if (!cashReceived || cashReceived < currentSale.total) {
        showError('El efectivo recibido debe ser mayor o igual al total');
        return;
      }
    }
    
    if (currentSale.paymentMethod === 'transfer' && !currentSale.transferVoucher.trim()) {
      showError('Debe ingresar el comprobante de transferencia');
      return;
    }
    
    setIsSavingSale(true);
    
    try {
      console.log('💰 Saving sale...', currentSale);
      
      let response;
      
      if (currentSale.paymentMethod === 'cash') {
        const saleData = {
          items: currentSale.items,
          cashReceived: parseFloat(currentSale.cashReceived),
          customerInfo: currentSale.customerInfo,
          discountAmount: parseFloat(currentSale.discount) || 0,
          notes: currentSale.notes
        };
        
        response = await inventoryService.createCashSale(saleData);
        
      } else if (currentSale.paymentMethod === 'transfer') {
        const saleData = {
          items: currentSale.items,
          transferVoucher: currentSale.transferVoucher,
          bankReference: currentSale.bankReference,
          customerInfo: currentSale.customerInfo,
          notes: currentSale.notes
        };
        
        response = await inventoryService.createTransferSale(saleData);
      }
      
      if (response && response.success) {
        setShowNewSaleModal(false);
        await loadSalesData();
        
        if (currentSale.paymentMethod === 'transfer') {
          await loadPendingTransfers();
          showSuccess('Venta por transferencia registrada. Requiere confirmación de admin.');
        } else {
          showSuccess('Venta registrada exitosamente');
        }
      }
      
    } catch (error) {
      console.error('❌ Error saving sale:', error);
      // El error se muestra automáticamente en el servicio
    } finally {
      setIsSavingSale(false);
    }
  };
  
  // CONFIRMAR TRANSFERENCIA (solo admin)
  const handleConfirmTransfer = async (saleId, notes = '') => {
    setConfirmingTransfer(saleId);
    
    try {
      const response = await inventoryService.confirmTransfer(saleId, notes);
      
      if (response.success) {
        await loadSalesData();
        await loadPendingTransfers();
        showSuccess('Transferencia confirmada exitosamente');
      }
      
    } catch (error) {
      console.error('❌ Error confirming transfer:', error);
    } finally {
      setConfirmingTransfer(null);
    }
  };
  
  // FILTRAR VENTAS
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.saleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
  // CALCULAR MÉTRICAS
  const salesMetrics = {
    totalSales: filteredSales.length,
    totalAmount: filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
    averageTicket: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / filteredSales.length 
      : 0,
    cashSales: filteredSales.filter(sale => sale.paymentMethod === 'cash').length,
    transferSales: filteredSales.filter(sale => sale.paymentMethod === 'transfer').length,
    pendingCount: pendingTransfers.length
  };
  
  // OBTENER ICONO DEL MÉTODO DE PAGO
  const getPaymentIcon = (method) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === method);
    return paymentMethod?.icon || CreditCard;
  };
  
  // OBTENER LABEL DEL MÉTODO DE PAGO
  const getPaymentLabel = (method) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === method);
    return paymentMethod?.label || method;
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CON MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{salesMetrics.totalSales}</div>
              <div className="text-sm text-gray-600">Ventas totales</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesMetrics.totalAmount)}
              </div>
              <div className="text-sm text-gray-600">Ingresos totales</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesMetrics.averageTicket)}
              </div>
              <div className="text-sm text-gray-600">Ticket promedio</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Métodos de pago</div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center">
                  <Coins className="w-3 h-3 text-green-600 mr-1" />
                  <span>{salesMetrics.cashSales}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-3 h-3 text-blue-600 mr-1" />
                  <span>{salesMetrics.transferSales}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleNewSale}
                className="btn-primary btn-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nueva Venta
              </button>
              
              {user?.role === 'admin' && salesMetrics.pendingCount > 0 && (
                <button
                  onClick={() => setShowPendingTransfers(true)}
                  className="btn-secondary btn-sm text-xs"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {salesMetrics.pendingCount} Pendientes
                </button>
              )}
            </div>
          </div>
        </div>
        
      </div>
      
      {/* CONTROLES Y FILTROS */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ventas, cliente, empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          {/* Filtro de fecha */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {dateFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          {/* Filtro de método de pago */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">Todos los métodos</option>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
          
          {/* Filtro de estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {statusFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          {/* Acciones */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadSalesData}
              className="btn-secondary btn-sm"
              disabled={isLoading}
            >
              <RotateCcw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
          
        </div>
      </div>
      
      {/* LISTA DE VENTAS */}
      <div className="bg-white rounded-lg shadow-sm">
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando ventas...</p>
            </div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || dateFilter !== 'today' || paymentFilter !== 'all'
                ? 'No se encontraron ventas'
                : 'No hay ventas registradas'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || dateFilter !== 'today' || paymentFilter !== 'all'
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Comienza registrando tu primera venta'
              }
            </p>
            {!searchTerm && dateFilter === 'today' && paymentFilter === 'all' && (
              <button
                onClick={handleNewSale}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primera Venta
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header de resultados */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredSales.length} de {sales.length} ventas
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Total: {formatCurrency(salesMetrics.totalAmount)}
                </p>
              </div>
            </div>
            
            {/* Lista de ventas */}
            <div className="divide-y divide-gray-200">
              {filteredSales.map((sale) => {
                const PaymentIcon = getPaymentIcon(sale.paymentMethod);
                const isTransferPending = sale.paymentMethod === 'transfer' && sale.status === 'pending';
                
                return (
                  <div key={sale.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      
                      {/* Información principal */}
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isTransferPending ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <PaymentIcon className={`w-5 h-5 ${
                            isTransferPending ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {sale.saleNumber || `Venta #${sale.id}`}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                              sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {sale.status === 'completed' ? 'Completada' : 
                               sale.status === 'pending' ? 'Pendiente' : sale.status}
                            </span>
                            {isTransferPending && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                Requiere confirmación
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            {sale.customer?.name && (
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {sale.customer.name}
                              </span>
                            )}
                            
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(sale.createdAt || sale.workDate)}
                            </span>
                            
                            <span className="flex items-center">
                              <PaymentIcon className="w-3 h-3 mr-1" />
                              {getPaymentLabel(sale.paymentMethod)}
                            </span>
                            
                            {sale.employee?.name && (
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {sale.employee.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Monto y acciones */}
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(sale.totalAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {sale.itemsCount || 0} producto{(sale.itemsCount || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isTransferPending && user?.role === 'admin' && (
                            <button
                              onClick={() => handleConfirmTransfer(sale.id)}
                              className="p-2 text-green-600 hover:text-green-800 transition-colors"
                              title="Confirmar transferencia"
                              disabled={confirmingTransfer === sale.id}
                            >
                              {confirmingTransfer === sale.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Imprimir recibo"
                          >
                            <Receipt className="w-4 h-4" />
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
      
      {/* MODAL PARA NUEVA VENTA */}
      {showNewSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Nueva Venta</h3>
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSavingSale}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* PRODUCTOS */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Productos</h4>
                
                {/* Búsqueda de productos */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos por nombre o SKU..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  
                  {/* Resultados de búsqueda */}
                  {(isSearching || searchResults.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <Loader className="w-4 h-4 animate-spin mx-auto mb-2" />
                          <span className="text-sm text-gray-600">Buscando productos...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map(product => (
                          <button
                            key={product.id}
                            onClick={() => addProductToSale(product)}
                            className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-600">
                                  Stock: {product.stockQuantity} • SKU: {product.sku}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-600">
                                  {formatCurrency(product.price)}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : productSearchTerm.length >= 2 && (
                        <div className="p-4 text-center text-gray-500">
                          No se encontraron productos
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Lista de productos en la venta */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h5 className="font-medium text-gray-900">Productos en la venta</h5>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {currentSale.items.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No hay productos agregados</p>
                        <p className="text-sm">Busca y selecciona productos arriba</p>
                      </div>
                    ) : (
                      currentSale.items.map(item => (
                        <div key={item.productId} className="p-4 border-b border-gray-100 last:border-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              <div className="text-sm text-gray-600">
                                {formatCurrency(item.price)} c/u
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                className="p-1 text-gray-500 hover:text-red-600"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                className="p-1 text-gray-500 hover:text-green-600"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              
                              <div className="w-20 text-right font-bold">
                                {formatCurrency(item.total)}
                              </div>
                              
                              <button
                                onClick={() => removeItemFromSale(item.productId)}
                                className="p-1 text-gray-500 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* INFORMACIÓN DE VENTA */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Información de Venta</h4>
                
                {/* Información del cliente */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Cliente</h5>
                  
                  <input
                    type="text"
                    placeholder="Nombre del cliente *"
                    value={currentSale.customerInfo.name}
                    onChange={(e) => setCurrentSale(prev => ({
                      ...prev,
                      customerInfo: { ...prev.customerInfo, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                  
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={currentSale.customerInfo.phone}
                    onChange={(e) => setCurrentSale(prev => ({
                      ...prev,
                      customerInfo: { ...prev.customerInfo, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Método de pago */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Método de Pago</h5>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => {
                      const IconComponent = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setCurrentSale(prev => ({ ...prev, paymentMethod: method.id }))}
                          className={`p-3 border-2 rounded-lg transition-colors ${
                            currentSale.paymentMethod === method.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent className={`w-6 h-6 mx-auto mb-2 ${
                            method.color === 'green' ? 'text-green-600' : 'text-blue-600'
                          }`} />
                          <div className="text-sm font-medium">{method.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Campos específicos del método de pago */}
                {currentSale.paymentMethod === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Efectivo Recibido *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={currentSale.cashReceived}
                      onChange={(e) => setCurrentSale(prev => ({ ...prev, cashReceived: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                    {currentSale.cashReceived && currentSale.total > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Cambio: </span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(Math.max(0, parseFloat(currentSale.cashReceived) - currentSale.total))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {currentSale.paymentMethod === 'transfer' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comprobante de Transferencia *
                      </label>
                      <textarea
                        placeholder="Ingrese los detalles del comprobante de transferencia..."
                        value={currentSale.transferVoucher}
                        onChange={(e) => setCurrentSale(prev => ({ ...prev, transferVoucher: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referencia Bancaria
                      </label>
                      <input
                        type="text"
                        placeholder="Número de referencia"
                        value={currentSale.bankReference}
                        onChange={(e) => setCurrentSale(prev => ({ ...prev, bankReference: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
                
                {/* Descuento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={currentSale.discount}
                    onChange={(e) => {
                      setCurrentSale(prev => ({ ...prev, discount: e.target.value }));
                      calculateSaleTotal();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    placeholder="Notas adicionales sobre la venta..."
                    value={currentSale.notes}
                    onChange={(e) => setCurrentSale(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Resumen de totales */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(currentSale.subtotal)}</span>
                  </div>
                  {currentSale.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Descuento:</span>
                      <span>-{formatCurrency(currentSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(currentSale.total)}</span>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="btn-secondary"
                disabled={isSavingSale}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveSale}
                className="btn-primary"
                disabled={isSavingSale || currentSale.items.length === 0 || !currentSale.customerInfo.name.trim()}
              >
                {isSavingSale ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Registrar Venta
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SalesManager;