// Autor: Alexander Echeverria  
// Archivo: src/pages/dashboard/inventory/components/SalesManager.js
// VERSIÓN COMPLETA Y DEFINITIVA - Sistema de Ventas Locales Premium

import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, Plus, Search, X, User, CreditCard, Coins, Clock,
  Eye, TrendingUp, Loader, Package, Calculator, Minus, RotateCcw, 
  FileText, Printer, AlertCircle, CheckCircle, Barcode, DollarSign, 
  ShoppingCart, Percent, Save
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';
import apiService from '../../../../services/apiService';

const SalesManager = ({ onSave, onUnsavedChanges }) => {
  const { user } = useAuth();
  const { showSuccess, showError, formatCurrency, formatDate } = useApp();
  
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [currentSale, setCurrentSale] = useState({
    items: [],
    customerInfo: { type: 'cf', name: '', phone: '', email: '' },
    paymentMethod: 'cash',
    subtotal: 0,
    discount: 0,
    total: 0,
    notes: '',
    cashReceived: '',
    transferVoucher: '',
    bankReference: ''
  });
  const [isSavingSale, setIsSavingSale] = useState(false);
  
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [productImages, setProductImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef(null);
  
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
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
  
  const searchProducts = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await inventoryService.searchProductsForSale(query, 20);
      
      if (response.success && response.data) {
        const products = response.data.products || [];
        setSearchResults(products);
        products.forEach(product => {
          if (product.id) {
            loadProductImage(product.id);
          }
        });
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const loadProductImage = async (productId) => {
    if (productImages[productId] || loadingImages[productId]) {
      return;
    }
    
    setLoadingImages(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await inventoryService.getProductImages(productId);
      if (response.success && response.data) {
        const images = response.data.images || [];
        const primaryImage = images.find(img => img.isPrimary) || images[0];
        
        if (primaryImage) {
          setProductImages(prev => ({ ...prev, [productId]: primaryImage }));
        }
      }
    } catch (error) {
      console.warn(`Could not load image for product ${productId}`);
    } finally {
      setLoadingImages(prev => ({ ...prev, [productId]: false }));
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearchTerm) {
        searchProducts(productSearchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearchTerm]);
  
  const searchCustomers = async (query) => {
    if (!query || query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    
    setIsSearchingCustomers(true);
    try {
      const response = await apiService.get('/users', {
        params: { search: query, role: 'cliente', isActive: true, limit: 10 }
      });
      
      const userData = response.data || response;
      setCustomerSearchResults(userData.users || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchTerm) {
        searchCustomers(customerSearchTerm);
        setShowCustomerDropdown(true);
      } else {
        setCustomerSearchResults([]);
        setShowCustomerDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchTerm]);
  
  const selectCustomer = (customer) => {
    setCurrentSale(prev => ({
      ...prev,
      customerInfo: {
        type: 'registered',
        userId: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone || '',
        email: customer.email || ''
      }
    }));
    setCustomerSearchTerm('');
    setShowCustomerDropdown(false);
  };
  
  const addProductToSale = (product) => {
    if ((product.stockQuantity || 0) <= 0) {
      showError(`${product.name} no tiene stock disponible`);
      return;
    }
    
    const existingItem = currentSale.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= (product.stockQuantity || 0)) {
        showError(`No hay más stock disponible de ${product.name}`);
        return;
      }
      updateItemQuantity(existingItem.productId, existingItem.quantity + 1);
    } else {
      const image = productImages[product.id];
      const newItem = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImage: image?.imageUrl || null,
        quantity: 1,
        price: product.price || 0,
        total: product.price || 0,
        maxStock: product.stockQuantity || 0
      };
      
      setCurrentSale(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      
      calculateSaleTotal();
    }
    
    setProductSearchTerm('');
    setSearchResults([]);
  };
  
  const updateItemQuantity = (productId, newQuantity) => {
    const item = currentSale.items.find(i => i.productId === productId);
    
    if (newQuantity <= 0) {
      removeItemFromSale(productId);
      return;
    }
    
    if (item && newQuantity > item.maxStock) {
      showError(`Stock máximo disponible: ${item.maxStock}`);
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
  
  const removeItemFromSale = (productId) => {
    setCurrentSale(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
    
    calculateSaleTotal();
  };
  
  const calculateSaleTotal = () => {
    setTimeout(() => {
      setCurrentSale(prev => {
        const subtotal = prev.items.reduce((sum, item) => sum + item.total, 0);
        const discount = parseFloat(prev.discount) || 0;
        const total = subtotal - discount;
        
        return {
          ...prev,
          subtotal,
          total: Math.max(0, total)
        };
      });
    }, 100);
  };
  
  const handleNewSale = () => {
    setCurrentSale({
      items: [],
      customerInfo: { type: 'cf', name: '', phone: '', email: '' },
      paymentMethod: 'cash',
      subtotal: 0,
      discount: 0,
      total: 0,
      notes: '',
      cashReceived: '',
      transferVoucher: '',
      bankReference: ''
    });
    setProductSearchTerm('');
    setSearchResults([]);
    setProductImages({});
    setShowNewSaleModal(true);
  };
  
  const handleSaveSale = async () => {
    if (currentSale.items.length === 0) {
      showError('Debe agregar al menos un producto a la venta');
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
      let response;
      
      const customerInfo = {
        type: currentSale.customerInfo.type,
        name: currentSale.customerInfo.name || 'Consumidor Final',
        phone: currentSale.customerInfo.phone || '',
        email: currentSale.customerInfo.email || ''
      };
      
      if (currentSale.customerInfo.userId) {
        customerInfo.userId = currentSale.customerInfo.userId;
      }
      
      if (currentSale.paymentMethod === 'cash') {
        const saleData = {
          items: currentSale.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          cashReceived: parseFloat(currentSale.cashReceived),
          customerInfo,
          discountAmount: parseFloat(currentSale.discount) || 0,
          notes: currentSale.notes
        };
        
        response = await inventoryService.createCashSale(saleData);
        
      } else if (currentSale.paymentMethod === 'transfer') {
        const saleData = {
          items: currentSale.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          transferVoucher: currentSale.transferVoucher,
          bankReference: currentSale.bankReference,
          customerInfo,
          notes: currentSale.notes
        };
        
        response = await inventoryService.createTransferSale(saleData);
      }
      
      if (response && response.success) {
        const savedSale = response.data?.sale;
        
        setCurrentReceipt(savedSale);
        setShowReceiptModal(true);
        setShowNewSaleModal(false);
        
        await loadSalesData();
        
        if (currentSale.paymentMethod === 'transfer') {
          await loadPendingTransfers();
          showSuccess('Venta por transferencia registrada. Requiere confirmación de admin.');
        } else {
          showSuccess('Venta en efectivo registrada exitosamente');
        }
        
        if (onSave) {
          onSave(savedSale);
        }
      }
    } catch (error) {
      console.error('Error saving sale:', error);
    } finally {
      setIsSavingSale(false);
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

  return (
    <div className="space-y-4">
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Ventas Locales</h1>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Registra ventas en efectivo y transferencia
            </p>
            
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                {salesMetrics.totalSales} ventas
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                {formatCurrency(salesMetrics.totalAmount)}
              </span>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                💵 {salesMetrics.cashSales} | 🏦 {salesMetrics.transferSales}
              </span>
              {salesMetrics.averageTicket > 0 && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                  Promedio: {formatCurrency(salesMetrics.averageTicket)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSalesData()}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center transition-colors"
            >
              <RotateCcw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            
            {user?.role === 'admin' && salesMetrics.pendingCount > 0 && (
              <span className="px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {salesMetrics.pendingCount}
              </span>
            )}
            
            <button
              onClick={handleNewSale}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva Venta
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ventas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          >
            {statusFilters.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600 text-sm">Cargando ventas...</p>
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
            <p className="text-gray-600 mb-4 text-sm">
              {searchTerm || dateFilter !== 'today' || paymentFilter !== 'all'
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Comienza registrando tu primera venta'
              }
            </p>
            {!searchTerm && dateFilter === 'today' && paymentFilter === 'all' && (
              <button
                onClick={handleNewSale}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primera Venta
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredSales.length} de {sales.length} ventas
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Total: {formatCurrency(salesMetrics.totalAmount)}
                </p>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredSales.map((sale) => {
                const PaymentIcon = getPaymentIcon(sale.paymentMethod);
                const isTransferPending = sale.paymentMethod === 'transfer' && sale.status === 'pending';
                
                return (
                  <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isTransferPending ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <PaymentIcon className={`w-5 h-5 ${
                            isTransferPending ? 'text-yellow-600' : 'text-green-600'
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
                            {isTransferPending && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full flex-shrink-0">
                                Confirmar
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            {sale.customer?.name && (
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{sale.customer.name}</span>
                              </span>
                            )}
                            
                            <span className="flex items-center flex-shrink-0">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(sale.createdAt || sale.workDate)}
                            </span>
                            
                            <span className="flex items-center flex-shrink-0">
                              <PaymentIcon className="w-3 h-3 mr-1" />
                              {getPaymentLabel(sale.paymentMethod)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <div className="text-base font-bold text-gray-900">
                            {formatCurrency(sale.totalAmount || 0)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {sale.itemsCount || 0} producto{(sale.itemsCount || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {isTransferPending && user?.role === 'admin' && (
                            <button
                              onClick={() => handleConfirmTransfer(sale.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
          </>
        )}
      </div>
      
      {showNewSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl">
            
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Nueva Venta</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Busca productos, completa la información y registra la venta
                </p>
              </div>
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                disabled={isSavingSale}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                
                <div className="lg:col-span-2 space-y-4">
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Search className="w-5 h-5 mr-2 text-purple-600" />
                      Buscar Productos
                    </h3>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, SKU o código de barras..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-base"
                        autoFocus
                      />
                    </div>
                    
                    {productSearchTerm && (
                      <div className="mt-4 max-h-96 overflow-y-auto">
                        {isSearching ? (
                          <div className="text-center py-8">
                            <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
                            <p className="text-sm text-gray-600">Buscando productos...</p>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {searchResults.map(product => {
                              const image = productImages[product.id];
                              const isOutOfStock = (product.stockQuantity || 0) <= 0;
                              
                              return (
                                <button
                                  key={product.id}
                                  onClick={() => addProductToSale(product)}
                                  className={`bg-white border-2 rounded-lg p-3 text-left transition-all ${
                                    isOutOfStock 
                                      ? 'border-red-200 opacity-50 cursor-not-allowed' 
                                      : 'border-purple-200 hover:border-purple-400 hover:shadow-lg'
                                  }`}
                                  disabled={isOutOfStock}
                                >
                                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                                    {loadingImages[product.id] ? (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Loader className="w-6 h-6 animate-spin text-gray-400" />
                                      </div>
                                    ) : image?.imageUrl ? (
                                      <img 
                                        src={image.imageUrl} 
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    
                                    <div className={`w-full h-full flex items-center justify-center ${
                                      image?.imageUrl ? 'hidden' : ''
                                    }`}>
                                      <Package className="w-8 h-8 text-gray-400" />
                                    </div>
                                    
                                    {isOutOfStock && (
                                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">SIN STOCK</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <h4 className="font-medium text-sm truncate mb-1" title={product.name}>
                                    {product.name}
                                  </h4>
                                  
                                  {product.sku && (
                                    <p className="text-xs text-gray-500 mb-2 truncate flex items-center">
                                      <Barcode className="w-3 h-3 mr-1" />
                                      {product.sku}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-green-600">
                                      {formatCurrency(product.price || 0)}
                                    </span>
                                    <span className={`text-xs font-medium ${
                                      isOutOfStock ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      Stock: {product.stockQuantity || 0}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="font-medium">No se encontraron productos</p>
                            <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600">
                      <h3 className="font-bold text-white flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Carrito de Venta ({currentSale.items.length})
                      </h3>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                      {currentSale.items.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                          <ShoppingCart className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                          <p className="font-semibold text-lg">Carrito vacío</p>
                          <p className="text-sm mt-1">Busca y selecciona productos arriba</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {currentSale.items.map(item => (
                            <div key={item.productId} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-200">
                                  {item.productImage ? (
                                    <img 
                                      src={item.productImage} 
                                      alt={item.productName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  
                                  <div className={`w-full h-full flex items-center justify-center ${
                                    item.productImage ? 'hidden' : ''
                                  }`}>
                                    <Package className="w-8 h-8 text-gray-400" />
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate" title={item.productName}>
                                    {item.productName}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    <span className="font-medium">{formatCurrency(item.price)} c/u</span>
                                    {item.productSku && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center truncate">
                                          <Barcode className="w-3 h-3 mr-1 flex-shrink-0" />
                                          {item.productSku}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  
                                  <div className="w-16 text-center">
                                    <div className="text-2xl font-bold text-gray-900">{item.quantity}</div>
                                    <div className="text-xs text-gray-500">de {item.maxStock}</div>
                                  </div>
                                  
                                  <button
                                    onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={item.quantity >= item.maxStock}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="text-right min-w-[100px]">
                                    <div className="text-lg font-bold text-gray-900">
                                      {formatCurrency(item.total)}
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => removeItemFromSale(item.productId)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar producto"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Cliente
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre (opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Escribe el nombre del cliente..."
                          value={currentSale.customerInfo.name}
                          onChange={(e) => setCurrentSale(prev => ({
                            ...prev,
                            customerInfo: { 
                              ...prev.customerInfo, 
                              type: 'cf',
                              name: e.target.value 
                            }
                          }))}
                          className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Deja vacío para "Consumidor Final"
                        </p>
                      </div>
                      
                      <div className="relative" ref={customerSearchRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          O buscar cliente registrado
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        
                        {showCustomerDropdown && (
                          <div className="absolute z-20 w-full mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {isSearchingCustomers ? (
                              <div className="p-4 text-center">
                                <Loader className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-600" />
                                <span className="text-sm text-gray-600">Buscando clientes...</span>
                              </div>
                            ) : customerSearchResults.length > 0 ? (
                              customerSearchResults.map(customer => (
                                <button
                                  key={customer.id}
                                  onClick={() => selectCustomer(customer)}
                                  className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                                >
                                  <div className="font-medium text-gray-900">
                                    {customer.firstName} {customer.lastName}
                                  </div>
                                  <div className="text-sm text-gray-600">{customer.email}</div>
                                  {customer.phone && (
                                    <div className="text-sm text-gray-500 mt-0.5">Tel: {customer.phone}</div>
                                  )}
                                </button>
                              ))
                            ) : customerSearchTerm.length >= 2 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                No se encontraron clientes
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                      
                      {currentSale.customerInfo.userId && (
                        <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {currentSale.customerInfo.name}
                              </div>
                              {currentSale.customerInfo.email && (
                                <div className="text-sm text-gray-600">
                                  {currentSale.customerInfo.email}
                                </div>
                              )}
                              {currentSale.customerInfo.phone && (
                                <div className="text-sm text-gray-500">
                                  {currentSale.customerInfo.phone}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setCurrentSale(prev => ({
                                  ...prev,
                                  customerInfo: { type: 'cf', name: '', phone: '', email: '' }
                                }));
                                setCustomerSearchTerm('');
                              }}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                      Método de Pago
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {paymentMethods.map(method => {
                        const IconComponent = method.icon;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setCurrentSale(prev => ({ ...prev, paymentMethod: method.id }))}
                            className={`p-3 border-2 rounded-lg transition-all ${
                              currentSale.paymentMethod === method.id
                                ? 'border-green-600 bg-white shadow-lg scale-105'
                                : 'border-green-300 bg-white hover:border-green-400'
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
                    
                    {currentSale.paymentMethod === 'cash' && (
                      <div className="bg-white rounded-lg p-3 border-2 border-green-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Efectivo Recibido *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={currentSale.cashReceived}
                            onChange={(e) => setCurrentSale(prev => ({ ...prev, cashReceived: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                            required
                          />
                        </div>
                        
                        {currentSale.cashReceived && currentSale.total > 0 && (
                          <div className="mt-3 p-3 bg-green-100 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-700">Cambio:</span>
                              <span className="text-xl font-bold text-green-700">
                                {formatCurrency(Math.max(0, parseFloat(currentSale.cashReceived) - currentSale.total))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {currentSale.paymentMethod === 'transfer' && (
                      <div className="space-y-3 bg-white rounded-lg p-3 border-2 border-green-200">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Comprobante de Transferencia *
                          </label>
                          <textarea
                            placeholder="Ej: Transferencia desde BAC, cuenta 1234567890, referencia ABC123..."
                            value={currentSale.transferVoucher}
                            onChange={(e) => setCurrentSale(prev => ({ ...prev, transferVoucher: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Referencia Bancaria (opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Número de referencia..."
                            value={currentSale.bankReference}
                            onChange={(e) => setCurrentSale(prev => ({ ...prev, bankReference: e.target.value }))}
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Percent className="w-4 h-4 mr-1" />
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
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notas (opcional)
                      </label>
                      <textarea
                        placeholder="Notas adicionales sobre la venta..."
                        value={currentSale.notes}
                        onChange={(e) => setCurrentSale(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-4 text-white shadow-2xl">
                    <h3 className="font-bold text-lg mb-3 flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      Resumen de Venta
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-purple-100">
                        <span className="text-sm">Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(currentSale.subtotal)}</span>
                      </div>
                      
                      {currentSale.discount > 0 && (
                        <div className="flex justify-between items-center text-yellow-200">
                          <span className="text-sm">Descuento:</span>
                          <span className="font-semibold">-{formatCurrency(currentSale.discount)}</span>
                        </div>
                      )}
                      
                      <div className="border-t-2 border-white/30 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold">Total:</span>
                          <span className="text-3xl font-bold">
                            {formatCurrency(currentSale.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowNewSaleModal(false)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                      disabled={isSavingSale}
                    >
                      Cancelar
                    </button>
                    
                    <button
                      onClick={handleSaveSale}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSavingSale || currentSale.items.length === 0}
                    >
                      {isSavingSale ? (
                        <span className="flex items-center justify-center">
                          <Loader className="w-5 h-5 animate-spin mr-2" />
                          Guardando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <Save className="w-5 h-5 mr-2" />
                          Registrar Venta
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showReceiptModal && currentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Comprobante de Venta</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
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
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cerrar
              </button>
              
              <button
                onClick={handlePrintReceipt}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
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