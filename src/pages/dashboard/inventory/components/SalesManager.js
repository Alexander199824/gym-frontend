// Autor: Alexander Echeverria  
// Archivo: src/pages/dashboard/inventory/components/SalesManager.js
// FUNCIÓN: Gestión completa de ventas en tienda física y registro de transacciones

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Plus, Search, Filter, Calendar, 
  User, CreditCard, Coins, Receipt, Clock,
  Edit, Trash2, Eye, Download, TrendingUp,
  AlertCircle, CheckCircle, XCircle, Loader,
  Package, Calculator, Star, Tag
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';

const SalesManager = ({ sales, products, isLoading, onSave, onUnsavedChanges }) => {
  const { showSuccess, showError, formatCurrency, formatDate, isMobile } = useApp();
  
  // Estados locales
  const [localSales, setLocalSales] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estados para nueva venta
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [currentSale, setCurrentSale] = useState({
    id: null,
    items: [],
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash', // 'cash', 'card', 'transfer'
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: ''
  });
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState({ start: '', end: '' });
  
  // Métodos de pago
  const paymentMethods = [
    { id: 'all', label: 'Todos los métodos', icon: CreditCard },
    { id: 'cash', label: 'Efectivo', icon: Coins },
    { id: 'card', label: 'Tarjeta', icon: CreditCard },
    { id: 'transfer', label: 'Transferencia', icon: Receipt }
  ];
  
  // Filtros de fecha
  const dateFilters = [
    { id: 'today', label: 'Hoy' },
    { id: 'yesterday', label: 'Ayer' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
    { id: 'custom', label: 'Rango personalizado' }
  ];
  
  // INICIALIZAR DATOS DE VENTAS
  useEffect(() => {
    console.log('SalesManager - Verificando datos de ventas:', {
      hasSales: !!sales,
      isLoading,
      isArray: Array.isArray(sales),
      length: Array.isArray(sales) ? sales.length : 0
    });
    
    if (!isLoading) {
      if (sales && Array.isArray(sales)) {
        console.log('SalesManager - Cargando ventas desde backend:', sales);
        
        const mappedSales = sales.map((sale, index) => ({
          id: sale.id || `sale_${index}`,
          date: sale.date || new Date().toISOString(),
          customerName: sale.customerName || 'Cliente',
          customerPhone: sale.customerPhone || '',
          items: Array.isArray(sale.items) ? sale.items : [],
          paymentMethod: sale.paymentMethod || 'cash',
          subtotal: parseFloat(sale.subtotal) || 0,
          tax: parseFloat(sale.tax) || 0,
          discount: parseFloat(sale.discount) || 0,
          total: parseFloat(sale.total) || 0,
          notes: sale.notes || '',
          status: sale.status || 'completed'
        }));
        
        setLocalSales(mappedSales);
        setIsDataLoaded(true);
        
      } else {
        console.log('SalesManager - Sin datos de ventas, creando datos de ejemplo');
        // Datos de ejemplo para desarrollo
        const exampleSales = [
          {
            id: 'sale_001',
            date: new Date().toISOString(),
            customerName: 'María González',
            customerPhone: '+502 1234-5678',
            items: [
              { productId: 1, productName: 'Proteína Whey Premium', quantity: 1, price: 250.00, total: 250.00 }
            ],
            paymentMethod: 'cash',
            subtotal: 250.00,
            tax: 0,
            discount: 0,
            total: 250.00,
            notes: 'Venta en tienda física',
            status: 'completed'
          },
          {
            id: 'sale_002',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            customerName: 'Carlos Ruiz',
            customerPhone: '+502 9876-5432',
            items: [
              { productId: 2, productName: 'Creatina Monohidratada', quantity: 2, price: 85.00, total: 170.00 }
            ],
            paymentMethod: 'card',
            subtotal: 170.00,
            tax: 0,
            discount: 0,
            total: 170.00,
            notes: '',
            status: 'completed'
          }
        ];
        
        setLocalSales(exampleSales);
        setIsDataLoaded(true);
      }
    } else {
      setIsDataLoaded(false);
    }
  }, [sales, isLoading]);
  
  // Notificar cambios sin guardar
  useEffect(() => {
    onUnsavedChanges(hasChanges);
  }, [hasChanges, onUnsavedChanges]);
  
  // Filtrar ventas
  const filteredSales = localSales.filter(sale => {
    const matchesSearch = sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;
    
    // Filtro de fecha (simplificado)
    let matchesDate = true;
    const saleDate = new Date(sale.date);
    const today = new Date();
    
    switch (dateFilter) {
      case 'today':
        matchesDate = saleDate.toDateString() === today.toDateString();
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = saleDate.toDateString() === yesterday.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = saleDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = saleDate >= monthAgo;
        break;
    }
    
    return matchesSearch && matchesPayment && matchesDate;
  });
  
  // Calcular métricas de ventas
  const salesMetrics = {
    totalSales: filteredSales.length,
    totalAmount: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    averageTicket: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length 
      : 0,
    cashSales: filteredSales.filter(sale => sale.paymentMethod === 'cash').length,
    cardSales: filteredSales.filter(sale => sale.paymentMethod === 'card').length
  };
  
  // Iniciar nueva venta
  const handleNewSale = () => {
    setCurrentSale({
      id: null,
      items: [],
      customerName: '',
      customerPhone: '',
      paymentMethod: 'cash',
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: ''
    });
    setShowNewSaleModal(true);
  };
  
  // Guardar venta
  const handleSaveSale = async () => {
    try {
      if (currentSale.items.length === 0) {
        showError('Debe agregar al menos un producto a la venta');
        return;
      }
      
      const newSale = {
        ...currentSale,
        id: `sale_${Date.now()}`,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      setLocalSales([newSale, ...localSales]);
      setHasChanges(true);
      setShowNewSaleModal(false);
      showSuccess('Venta registrada exitosamente');
      
    } catch (error) {
      console.error('Error guardando venta:', error);
      showError('Error al registrar la venta');
    }
  };
  
  // Guardar todos los cambios
  const handleSaveAll = async () => {
    try {
      await onSave({ type: 'sales', data: localSales });
      setHasChanges(false);
      showSuccess('Ventas guardadas exitosamente');
    } catch (error) {
      console.error('Error guardando ventas:', error);
      showError('Error al guardar las ventas');
    }
  };
  
  // Obtener icono del método de pago
  const getPaymentIcon = (method) => {
    const icons = {
      cash: Coins,
      card: CreditCard,
      transfer: Receipt
    };
    return icons[method] || CreditCard;
  };
  
  // Obtener label del método de pago
  const getPaymentLabel = (method) => {
    const labels = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia'
    };
    return labels[method] || method;
  };

  // Mostrar loading
  if (isLoading || !isDataLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER CON MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
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
                  <CreditCard className="w-3 h-3 text-blue-600 mr-1" />
                  <span>{salesMetrics.cardSales}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleNewSale}
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva Venta
            </button>
          </div>
        </div>
        
      </div>
      
      {/* CONTROLES Y FILTROS */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ventas, cliente..."
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
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
          
          {/* Acciones */}
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleSaveAll}
                className="btn-primary btn-sm"
              >
                Guardar
              </button>
            )}
            <button className="btn-secondary btn-sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </button>
          </div>
          
        </div>
      </div>
      
      {/* LISTA DE VENTAS */}
      <div className="bg-white rounded-lg shadow-sm">
        
        {filteredSales.length === 0 ? (
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
                  Mostrando {filteredSales.length} de {localSales.length} ventas
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
                
                return (
                  <div key={sale.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      
                      {/* Información principal */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-green-600" />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {sale.id}
                            </h3>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Completada
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {sale.customerName}
                            </span>
                            
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(sale.date)}
                            </span>
                            
                            <span className="flex items-center">
                              <PaymentIcon className="w-3 h-3 mr-1" />
                              {getPaymentLabel(sale.paymentMethod)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Monto y acciones */}
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(sale.total)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
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
                    
                    {/* Productos vendidos (resumen) */}
                    {sale.items.length > 0 && (
                      <div className="mt-3 ml-14">
                        <div className="text-xs text-gray-500">
                          Productos: {sale.items.map(item => `${item.productName} (${item.quantity})`).join(', ')}
                        </div>
                        {sale.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            Notas: {sale.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* MODAL PARA NUEVA VENTA - Placeholder */}
      {showNewSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Nueva Venta</h3>
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h4 className="text-xl font-semibold text-gray-900 mb-4">
                Sistema de Ventas en Desarrollo
              </h4>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                El sistema completo de punto de venta (POS) estará disponible próximamente. 
                Incluirá todas las funcionalidades necesarias para registrar ventas en tienda física.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h5 className="font-semibold text-gray-900 mb-2">Selección de Productos</h5>
                  <p className="text-sm text-gray-600">
                    Búsqueda rápida por nombre, código o escaneo de código de barras
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <User className="w-8 h-8 text-green-600 mx-auto mb-4" />
                  <h5 className="font-semibold text-gray-900 mb-2">Datos del Cliente</h5>
                  <p className="text-sm text-gray-600">
                    Registro rápido de cliente o selección de base de datos
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <CreditCard className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h5 className="font-semibold text-gray-900 mb-2">Métodos de Pago</h5>
                  <p className="text-sm text-gray-600">
                    Efectivo, tarjeta, transferencias y pagos mixtos
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <Calculator className="w-8 h-8 text-orange-600 mx-auto mb-4" />
                  <h5 className="font-semibold text-gray-900 mb-2">Cálculos Automáticos</h5>
                  <p className="text-sm text-gray-600">
                    Subtotales, descuentos, impuestos y cambio automático
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <Receipt className="w-8 h-8 text-red-600 mx-auto mb-4" />
                  <h5 className="font-semibold text-gray-900 mb-2">Recibos e Impresión</h5>
                  <p className="text-sm text-gray-600">
                    Generación e impresión de recibos personalizados
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
                  <h5 className="font-semibold text-gray-900 mb-2">Reportes en Tiempo Real</h5>
                  <p className="text-sm text-gray-600">
                    Actualización automática de inventario y estadísticas
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SalesManager;