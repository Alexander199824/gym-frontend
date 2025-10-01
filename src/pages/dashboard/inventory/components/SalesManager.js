// Autor: Alexander Echeverria  
// Archivo: src/pages/dashboard/inventory/components/SalesManager.js
// VERSIÓN MEJORADA: Búsqueda avanzada, selector de clientes y comprobante PDF

import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, Plus, Search, Filter, Calendar, 
  User, CreditCard, Coins, Receipt, Clock,
  Edit, Trash2, Eye, Download, TrendingUp,
  AlertCircle, CheckCircle, XCircle, Loader,
  Package, Calculator, Star, Tag, X, Save,
  Minus, RotateCcw, FileText, Users, Printer,
  UserPlus, UserCheck, ChevronDown, Image,
  Barcode, Hash, DollarSign, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';
import apiService from '../../../../services/apiService';

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
      type: 'cf', // 'cf', 'registered', 'custom'
      userId: null,
      name: 'Consumidor Final',
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
  
  // Estados para búsqueda de productos (MEJORADO)
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productSearchRef = useRef(null);
  
  // Estados para selector de clientes (NUEVO)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef(null);
  
  // Estados para comprobante de pago (NUEVO)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef(null);
  
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
  
  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
      
      const params = {
        page: 1,
        limit: 50
      };
      
      if (paymentFilter !== 'all') {
        params.paymentMethod = paymentFilter;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
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
  
  // ============================================
  // BÚSQUEDA MEJORADA DE PRODUCTOS
  // ============================================
  
  const searchProducts = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await inventoryService.searchProductsForSale(query, 15);
      
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
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearchTerm) {
        searchProducts(productSearchTerm);
        setShowProductDropdown(true);
      } else {
        setSearchResults([]);
        setShowProductDropdown(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [productSearchTerm]);
  
  // ============================================
  // BÚSQUEDA DE CLIENTES (NUEVO)
  // ============================================
  
  const searchCustomers = async (query) => {
    if (!query || query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    
    setIsSearchingCustomers(true);
    
    try {
      const response = await apiService.get('/users', {
        params: {
          search: query,
          role: 'cliente',
          isActive: true,
          limit: 10
        }
      });
      
      const userData = response.data || response;
      const customers = userData.users || [];
      
      setCustomerSearchResults(customers);
      
    } catch (error) {
      console.error('❌ Error searching customers:', error);
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
  
  const setConsumidorFinal = () => {
    setCurrentSale(prev => ({
      ...prev,
      customerInfo: {
        type: 'cf',
        userId: null,
        name: 'Consumidor Final',
        phone: '',
        email: ''
      }
    }));
  };
  
  const setCustomCustomer = () => {
    setCurrentSale(prev => ({
      ...prev,
      customerInfo: {
        type: 'custom',
        userId: null,
        name: '',
        phone: '',
        email: ''
      }
    }));
  };
  
  // ============================================
  // GESTIÓN DE PRODUCTOS EN VENTA
  // ============================================
  
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
      const newItem = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImage: product.imageUrl,
        quantity: 1,
        price: product.price || 0,
        total: product.price || 0,
        maxStock: product.stockQuantity || 0
      };
      
      setCurrentSale(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
    
    setProductSearchTerm('');
    setSearchResults([]);
    setShowProductDropdown(false);
    calculateSaleTotal();
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
        const tax = 0;
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
  
  // ============================================
  // GESTIÓN DE VENTAS
  // ============================================
  
  const handleNewSale = () => {
    setCurrentSale({
      items: [],
      customerInfo: {
        type: 'cf',
        userId: null,
        name: 'Consumidor Final',
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
  
  const handleSaveSale = async () => {
    if (currentSale.items.length === 0) {
      showError('Debe agregar al menos un producto a la venta');
      return;
    }
    
    if (currentSale.customerInfo.type === 'custom' && !currentSale.customerInfo.name.trim()) {
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
        const savedSale = response.data?.sale;
        
        // Mostrar comprobante
        setCurrentReceipt(savedSale);
        setShowReceiptModal(true);
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
    } finally {
      setIsSavingSale(false);
    }
  };
  
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
  
  // ============================================
  // COMPROBANTE DE PAGO (NUEVO)
  // ============================================
  
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
              .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #000; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      
      windowPrint.document.close();
      windowPrint.focus();
      windowPrint.print();
      windowPrint.close();
      
      setIsPrinting(false);
    }, 100);
  };
  
  const handleDownloadPDF = async () => {
    try {
      // Aquí puedes usar jsPDF o html2pdf
      // Por simplicidad, mostramos un mensaje
      showSuccess('Función de descarga PDF en desarrollo. Use la opción de imprimir y guardar como PDF desde su navegador.');
    } catch (error) {
      showError('Error al generar PDF');
    }
  };
  
  const viewSaleReceipt = (sale) => {
    setCurrentReceipt(sale);
    setShowReceiptModal(true);
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
  
  const getPaymentIcon = (method) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === method);
    return paymentMethod?.icon || CreditCard;
  };
  
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
            
            <div className="divide-y divide-gray-200">
              {filteredSales.map((sale) => {
                const PaymentIcon = getPaymentIcon(sale.paymentMethod);
                const isTransferPending = sale.paymentMethod === 'transfer' && sale.status === 'pending';
                
                return (
                  <div key={sale.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      
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
                            onClick={() => viewSaleReceipt(sale)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
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
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Imprimir recibo"
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
      
      {/* MODAL PARA NUEVA VENTA - MEJORADO */}
      {showNewSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Nueva Venta</h3>
                <p className="text-sm text-gray-600 mt-1">Registra una nueva venta de productos</p>
              </div>
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSavingSale}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COLUMNA 1: BÚSQUEDA Y PRODUCTOS */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* BÚSQUEDA MEJORADA DE PRODUCTOS */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-purple-600" />
                    Buscar y Agregar Productos
                  </h4>
                  
                  <div className="relative" ref={productSearchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, SKU, código de barras..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                        autoFocus
                      />
                    </div>
                    
                    {/* DROPDOWN DE RESULTADOS MEJORADO */}
                    {showProductDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-6 text-center">
                            <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                            <span className="text-sm text-gray-600">Buscando productos...</span>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                              <span className="text-sm font-medium text-gray-700">
                                {searchResults.length} producto{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {searchResults.map(product => (
                              <button
                                key={product.id}
                                onClick={() => addProductToSale(product)}
                                className="w-full p-4 text-left hover:bg-purple-50 border-b border-gray-100 last:border-0 transition-colors"
                                disabled={(product.stockQuantity || 0) <= 0}
                              >
                                <div className="flex items-center space-x-4">
                                  {/* Imagen del producto */}
                                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                    {product.imageUrl ? (
                                      <img 
                                        src={product.imageUrl} 
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Info del producto */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                          {product.sku && (
                                            <span className="flex items-center">
                                              <Barcode className="w-3 h-3 mr-1" />
                                              {product.sku}
                                            </span>
                                          )}
                                          {product.category?.name && (
                                            <span className="flex items-center">
                                              <Tag className="w-3 h-3 mr-1" />
                                              {product.category.name}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="text-right ml-4">
                                        <div className="text-xl font-bold text-green-600">
                                          {formatCurrency(product.price)}
                                        </div>
                                        <div className={`text-sm ${
                                          (product.stockQuantity || 0) > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          Stock: {product.stockQuantity || 0}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : productSearchTerm.length >= 2 && (
                          <div className="p-6 text-center text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p className="font-medium">No se encontraron productos</p>
                            <p className="text-sm">Intenta con otro término de búsqueda</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* LISTA DE PRODUCTOS EN LA VENTA */}
                <div className="border-2 border-gray-200 rounded-lg">
                  <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                    <h5 className="font-semibold text-gray-900 flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2 text-purple-600" />
                      Productos en la Venta ({currentSale.items.length})
                    </h5>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {currentSale.items.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium text-lg">No hay productos agregados</p>
                        <p className="text-sm mt-1">Busca y selecciona productos arriba</p>
                      </div>
                    ) : (
                      currentSale.items.map(item => (
                        <div key={item.productId} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <div className="flex items-center space-x-4">
                            {/* Imagen pequeña */}
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden">
                              {item.productImage ? (
                                <img 
                                  src={item.productImage} 
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{item.productName}</div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{formatCurrency(item.price)} c/u</span>
                                {item.productSku && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      <Barcode className="w-3 h-3 mr-1" />
                                      {item.productSku}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Controles de cantidad */}
                            <div className="flex items-center space-x-3">
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
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                disabled={item.quantity >= item.maxStock}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Subtotal y eliminar */}
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {formatCurrency(item.total)}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeItemFromSale(item.productId)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* COLUMNA 2: INFORMACIÓN DE VENTA */}
              <div className="space-y-4">
                
                {/* SELECTOR DE CLIENTE MEJORADO */}
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Cliente
                  </h4>
                  
                  {/* Tipo de cliente */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={setConsumidorFinal}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentSale.customerInfo.type === 'cf'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      CF
                    </button>
                    <button
                      onClick={() => {
                        setCurrentSale(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, type: 'registered' }
                        }));
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentSale.customerInfo.type === 'registered'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Registrado
                    </button>
                    <button
                      onClick={setCustomCustomer}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentSale.customerInfo.type === 'custom'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Otro
                    </button>
                  </div>
                  
                  {/* Consumidor Final */}
                  {currentSale.customerInfo.type === 'cf' && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center text-gray-700">
                        <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-medium">Consumidor Final</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Cliente sin información específica
                      </p>
                    </div>
                  )}
                  
                  {/* Cliente Registrado */}
                  {currentSale.customerInfo.type === 'registered' && (
                    <div>
                      <div className="relative mb-3" ref={customerSearchRef}>
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar cliente por nombre, email o ID..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        
                        {showCustomerDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {isSearchingCustomers ? (
                              <div className="p-4 text-center">
                                <Loader className="w-4 h-4 animate-spin mx-auto mb-2" />
                                <span className="text-sm text-gray-600">Buscando clientes...</span>
                              </div>
                            ) : customerSearchResults.length > 0 ? (
                              customerSearchResults.map(customer => (
                                <button
                                  key={customer.id}
                                  onClick={() => selectCustomer(customer)}
                                  className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                                >
                                  <div className="font-medium text-gray-900">
                                    {customer.firstName} {customer.lastName}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {customer.email}
                                  </div>
                                  {customer.phone && (
                                    <div className="text-sm text-gray-500">
                                      Tel: {customer.phone}
                                    </div>
                                  )}
                                </button>
                              ))
                            ) : customerSearchTerm.length >= 2 && (
                              <div className="p-4 text-center text-gray-500">
                                No se encontraron clientes
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {currentSale.customerInfo.userId && (
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {currentSale.customerInfo.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {currentSale.customerInfo.email}
                              </div>
                              {currentSale.customerInfo.phone && (
                                <div className="text-sm text-gray-500">
                                  {currentSale.customerInfo.phone}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setCurrentSale(prev => ({
                                ...prev,
                                customerInfo: { type: 'registered', userId: null, name: '', phone: '', email: '' }
                              }))}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Cliente Personalizado */}
                  {currentSale.customerInfo.type === 'custom' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nombre del cliente *"
                        value={currentSale.customerInfo.name}
                        onChange={(e) => setCurrentSale(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      
                      <input
                        type="tel"
                        placeholder="Teléfono (opcional)"
                        value={currentSale.customerInfo.phone}
                        onChange={(e) => setCurrentSale(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <input
                        type="email"
                        placeholder="Email (opcional)"
                        value={currentSale.customerInfo.email}
                        onChange={(e) => setCurrentSale(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, email: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
                
                {/* MÉTODO DE PAGO */}
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Método de Pago
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {paymentMethods.map(method => {
                      const IconComponent = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setCurrentSale(prev => ({ ...prev, paymentMethod: method.id }))}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            currentSale.paymentMethod === method.id
                              ? 'border-green-600 bg-green-100 shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300'
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
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium"
                          required
                        />
                      </div>
                      {currentSale.cashReceived && currentSale.total > 0 && (
                        <div className="mt-3 p-3 bg-green-100 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Cambio:</span>
                            <span className="text-xl font-bold text-green-700">
                              {formatCurrency(Math.max(0, parseFloat(currentSale.cashReceived) - currentSale.total))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {currentSale.paymentMethod === 'transfer' && (
                    <div className="space-y-3 bg-white rounded-lg p-3 border border-green-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comprobante de Transferencia *
                        </label>
                        <textarea
                          placeholder="Ingrese los detalles del comprobante..."
                          value={currentSale.transferVoucher}
                          onChange={(e) => setCurrentSale(prev => ({ ...prev, transferVoucher: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* DESCUENTO Y NOTAS */}
                <div className="space-y-3">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas
                    </label>
                    <textarea
                      placeholder="Notas adicionales..."
                      value={currentSale.notes}
                      onChange={(e) => setCurrentSale(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                {/* RESUMEN DE TOTALES */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
                  <h5 className="font-semibold text-gray-900 mb-3">Resumen de Venta</h5>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(currentSale.subtotal)}</span>
                    </div>
                    {currentSale.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuento:</span>
                        <span className="font-medium">-{formatCurrency(currentSale.discount)}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-purple-300 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-purple-700">
                          {formatCurrency(currentSale.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* BOTONES DE ACCIÓN */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewSaleModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={isSavingSale}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleSaveSale}
                    className="flex-1 btn-primary"
                    disabled={isSavingSale || currentSale.items.length === 0 || 
                      (currentSale.customerInfo.type === 'custom' && !currentSale.customerInfo.name.trim())}
                  >
                    {isSavingSale ? (
                      <div className="flex items-center justify-center">
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                        Guardando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="w-5 h-5 mr-2" />
                        Registrar Venta
                      </div>
                    )}
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL DE COMPROBANTE DE PAGO (NUEVO) */}
      {showReceiptModal && currentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Comprobante de Venta</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* CONTENIDO DEL COMPROBANTE */}
            <div ref={receiptRef} className="receipt bg-white p-6 border-2 border-gray-300 rounded-lg">
              {/* Header */}
              <div className="header text-center pb-4 mb-4 border-b-2 border-gray-800">
                <h1 className="text-2xl font-bold text-gray-900">TU GIMNASIO</h1>
                <p className="text-sm text-gray-600 mt-1">Comprobante de Venta</p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentReceipt.saleNumber || `Venta #${currentReceipt.id}`}
                </p>
              </div>
              
              {/* Información de la venta */}
              <div className="info-section mb-4 space-y-2 text-sm">
                <div className="info-row flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{formatDate(currentReceipt.createdAt || currentReceipt.workDate)}</span>
                </div>
                <div className="info-row flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{currentReceipt.customer?.name || 'Consumidor Final'}</span>
                </div>
                {currentReceipt.employee?.name && (
                  <div className="info-row flex justify-between">
                    <span className="text-gray-600">Atendió:</span>
                    <span className="font-medium">{currentReceipt.employee.name}</span>
                  </div>
                )}
                <div className="info-row flex justify-between">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-medium">{getPaymentLabel(currentReceipt.paymentMethod)}</span>
                </div>
              </div>
              
              {/* Productos */}
              <div className="items-section mb-4">
                <table className="items-table w-full">
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
              </div>
              
              {/* Totales */}
              <div className="totals border-t-2 border-gray-800 pt-3 space-y-2">
                <div className="total-row flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(currentReceipt.subtotalAmount || currentReceipt.totalAmount)}</span>
                </div>
                {currentReceipt.discountAmount > 0 && (
                  <div className="total-row flex justify-between text-sm text-red-600">
                    <span>Descuento:</span>
                    <span className="font-medium">-{formatCurrency(currentReceipt.discountAmount)}</span>
                  </div>
                )}
                <div className="total-row flex justify-between text-xl border-t-2 border-gray-300 pt-2 mt-2">
                  <span className="font-bold">TOTAL:</span>
                  <span className="font-bold">{formatCurrency(currentReceipt.totalAmount)}</span>
                </div>
                
                {currentReceipt.paymentMethod === 'cash' && currentReceipt.cashReceived && (
                  <div className="mt-3 pt-3 border-t border-gray-300 space-y-1 text-sm">
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
              
              {/* Footer */}
              <div className="footer text-center mt-6 pt-4 border-t border-dashed border-gray-400">
                <p className="text-sm text-gray-600">¡Gracias por su compra!</p>
                <p className="text-xs text-gray-500 mt-2">
                  Este es un comprobante de venta válido
                </p>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 btn-secondary"
              >
                Cerrar
              </button>
              
              <button
                onClick={handlePrintReceipt}
                className="flex-1 btn-primary"
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <div className="flex items-center justify-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Imprimiendo...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </div>
                )}
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default SalesManager;