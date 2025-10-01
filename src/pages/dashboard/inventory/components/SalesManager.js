// Autor: Alexander Echeverria  
// Archivo: src/pages/dashboard/inventory/components/SalesManager.js
// VERSIÓN MEJORADA - Diseño Limpio y Compacto

import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, Plus, Search, X, User, Coins, Clock,
  Eye, Loader, Package, RotateCcw, 
  FileText, Printer, CheckCircle, CreditCard
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';
import NewSaleModal from './NewSaleModal';

const SalesManager = ({ onSave, onUnsavedChanges }) => {
  const { user } = useAuth();
  const { showSuccess, showError, formatCurrency, formatDate } = useApp();
  
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [confirmingTransfer, setConfirmingTransfer] = useState(null);
  
  const paymentMethods = [
    { id: 'cash', label: 'Efectivo', icon: Coins, color: 'green' },
    { id: 'transfer', label: 'Transferencia', icon: FileText, color: 'blue' }
  ];
  
  const dateFilters = [
    { id: 'today', label: 'Hoy' },
    { id: 'yesterday', label: 'Ayer' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' }
  ];
  
  const statusFilters = [
    { id: 'all', label: 'Todos' },
    { id: 'completed', label: 'Completadas' },
    { id: 'pending', label: 'Pendientes' }
  ];
  
  useEffect(() => {
    loadSalesData();
    if (user?.role === 'admin') {
      loadPendingTransfers();
    }
  }, [dateFilter, paymentFilter, statusFilter]);
  
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(false);
    }
  }, [onUnsavedChanges]);
  
  const loadSalesData = async () => {
    setIsLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      
      if (paymentFilter !== 'all') params.paymentMethod = paymentFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
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
        setSales(response.data.sales || []);
      } else {
        setSales([]);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
      showError('Error al cargar las ventas');
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadPendingTransfers = async () => {
    try {
      const response = await inventoryService.getPendingTransfers();
      if (response.success && response.data) {
        setPendingTransfers(response.data.transfers || []);
      }
    } catch (error) {
      console.error('Error loading pending transfers:', error);
      setPendingTransfers([]);
    }
  };
  
  const handleNewSale = () => {
    setShowNewSaleModal(true);
  };
  
  const handleSaveSuccess = async (savedSale) => {
    // Actualizar lista de ventas
    await loadSalesData();
    
    // Si es admin, recargar transferencias pendientes
    if (user?.role === 'admin') {
      await loadPendingTransfers();
    }
    
    // Mostrar recibo
    setCurrentReceipt(savedSale);
    setShowReceiptModal(true);
    
    // Notificar al componente padre si existe
    if (onSave) {
      onSave(savedSale);
    }
  };
  
  const handleConfirmTransfer = async (saleId) => {
    setConfirmingTransfer(saleId);
    try {
      const response = await inventoryService.confirmTransfer(saleId, 'Transferencia verificada y confirmada');
      
      if (response.success) {
        await loadSalesData();
        await loadPendingTransfers();
        showSuccess('Transferencia confirmada exitosamente');
      }
    } catch (error) {
      console.error('Error confirming transfer:', error);
      showError('Error al confirmar la transferencia');
    } finally {
      setConfirmingTransfer(null);
    }
  };
  
  const handlePrintReceipt = () => {
    setIsPrinting(true);
    
    setTimeout(() => {
      const printContent = receiptRef.current;
      const windowPrint = window.open('', '', 'width=800,height=600');
      
      windowPrint.document.write(`
        <html>
          <head>
            <title>Comprobante de Venta</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .receipt { max-width: 400px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
              .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .items-table th, .items-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
              .total-row { display: flex; justify-between; margin: 5px 0; font-weight: bold; }
              .footer { text-center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #000; }
            </style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      
      windowPrint.document.close();
      windowPrint.focus();
      windowPrint.print();
      windowPrint.close();
      
      setIsPrinting(false);
    }, 100);
  };
  
  const viewSaleReceipt = (sale) => {
    setCurrentReceipt(sale);
    setShowReceiptModal(true);
  };
  
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.saleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
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
  
  const getPaymentIcon = (method) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === method);
    return paymentMethod?.icon || CreditCard;
  };
  
  const getPaymentLabel = (method) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === method);
    return paymentMethod?.label || method;
  };

  // Loading optimizado
  if (isLoading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Cargando Ventas
          </h3>
          <p className="text-gray-600 text-sm">Preparando tu contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* HEADER COMPACTO */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Ventas Locales</h1>
            </div>
            
            <p className="text-gray-600 text-sm mb-2">
              Gestiona las ventas en efectivo y transferencia
            </p>
            
            {/* Estadísticas compactas */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                {salesMetrics.totalSales} ventas
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                {formatCurrency(salesMetrics.totalAmount)}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                💵 {salesMetrics.cashSales}
              </span>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">
                🏦 {salesMetrics.transferSales}
              </span>
              {salesMetrics.averageTicket > 0 && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                  Promedio: {formatCurrency(salesMetrics.averageTicket)}
                </span>
              )}
              {salesMetrics.pendingCount > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                  ⏳ {salesMetrics.pendingCount} pendientes
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadSalesData()}
              disabled={isLoading}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <RotateCcw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            
            <button
              onClick={handleNewSale}
              className="px-3 py-1 text-xs text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Nueva Venta
            </button>
          </div>
        </div>
      </div>
      
      {/* FILTROS COMPACTOS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ventas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {dateFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todos los métodos</option>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {statusFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* LISTA DE VENTAS COMPACTA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto bg-gradient-to-r from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchTerm || dateFilter !== 'today' || paymentFilter !== 'all'
                ? 'No se encontraron ventas'
                : 'No hay ventas registradas'
              }
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {searchTerm || dateFilter !== 'today' || paymentFilter !== 'all'
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Comienza registrando tu primera venta'
              }
            </p>
            {!searchTerm && dateFilter === 'today' && paymentFilter === 'all' && (
              <button
                onClick={handleNewSale}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primera Venta
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSales.map((sale) => {
              const PaymentIcon = getPaymentIcon(sale.paymentMethod);
              const isTransferPending = sale.paymentMethod === 'transfer' && sale.status === 'pending';
              
              return (
                <div key={sale.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isTransferPending ? 'bg-yellow-100' : 
                        sale.paymentMethod === 'cash' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <PaymentIcon className={`w-5 h-5 ${
                          isTransferPending ? 'text-yellow-600' : 
                          sale.paymentMethod === 'cash' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {sale.saleNumber || `Venta #${sale.id}`}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                            sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sale.status === 'completed' ? 'Completada' : 
                             sale.status === 'pending' ? 'Pendiente' : sale.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          {sale.customer?.name && (
                            <span className="flex items-center truncate">
                              <User className="w-3 h-3 mr-1 flex-shrink-0" />
                              {sale.customer.name}
                            </span>
                          )}
                          
                          <span className="flex items-center flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(sale.createdAt || sale.workDate)}
                          </span>
                          
                          <span className="flex items-center flex-shrink-0">
                            <Package className="w-3 h-3 mr-1" />
                            {sale.itemsCount || 0} item{(sale.itemsCount || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900">
                          {formatCurrency(sale.totalAmount || 0)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {isTransferPending && user?.role === 'admin' && (
                          <button
                            onClick={() => handleConfirmTransfer(sale.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                          onClick={() => viewSaleReceipt(sale)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver comprobante"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setCurrentReceipt(sale);
                            setShowReceiptModal(true);
                            setTimeout(() => handlePrintReceipt(), 100);
                          }}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* MODAL NUEVA VENTA */}
      <NewSaleModal
        isOpen={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
        onSaveSuccess={handleSaveSuccess}
      />
      
      {/* MODAL RECIBO - SIMPLIFICADO */}
      {showReceiptModal && currentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Comprobante de Venta</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div ref={receiptRef} className="border-2 border-gray-300 rounded-lg p-6 bg-white">
              
              <div className="text-center pb-4 mb-4 border-b-2 border-gray-800">
                <h1 className="text-2xl font-bold text-gray-900">ELITE FITNESS CLUB</h1>
                <p className="text-sm text-gray-600 mt-1">Comprobante de Venta</p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentReceipt.saleNumber || `Venta #${currentReceipt.id}`}
                </p>
              </div>
              
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{formatDate(currentReceipt.createdAt || currentReceipt.workDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{currentReceipt.customer?.name || 'Consumidor Final'}</span>
                </div>
                {currentReceipt.employee?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Atendió:</span>
                    <span className="font-medium">{currentReceipt.employee.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-medium">{getPaymentLabel(currentReceipt.paymentMethod)}</span>
                </div>
              </div>
              
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left py-2">Producto</th>
                    <th className="text-center py-2">Cant.</th>
                    <th className="text-right py-2">Precio</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReceipt.items?.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2">{item.productName}</td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2">{formatCurrency(item.price)}</td>
                      <td className="text-right py-2 font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="border-t-2 border-gray-800 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(currentReceipt.subtotalAmount || currentReceipt.totalAmount)}</span>
                </div>
                
                {currentReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Descuento:</span>
                    <span className="font-medium">-{formatCurrency(currentReceipt.discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xl font-bold border-t-2 border-gray-300 pt-2 mt-2">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(currentReceipt.totalAmount)}</span>
                </div>
                
                {currentReceipt.paymentMethod === 'cash' && currentReceipt.cashReceived && (
                  <div className="border-t border-gray-300 pt-2 mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efectivo recibido:</span>
                      <span className="font-medium">{formatCurrency(currentReceipt.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cambio:</span>
                      <span className="font-medium">{formatCurrency(currentReceipt.changeAmount || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-400">
                <p className="text-sm text-gray-600">¡Gracias por su compra!</p>
                <p className="text-xs text-gray-500 mt-2">
                  Este es un comprobante de venta válido
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cerrar
              </button>
              
              <button
                onClick={handlePrintReceipt}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center"
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Imprimiendo...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </>
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