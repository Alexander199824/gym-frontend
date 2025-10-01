// Autor: Alexander Echeverria  
// Archivo: src/pages/dashboard/inventory/components/NewSaleModal.js
// Modal para crear nueva venta - VERSIÓN FINAL CORREGIDA
// ✅ Z-index 99999, sin símbolos de dólar, título "Nueva Venta" con mancuerna

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, X, User, CreditCard, Coins, Loader, Package, 
  Calculator, Minus, FileText, ShoppingCart, 
  Percent, Save, Store, Mail, Phone, MapPin,
  TrendingUp, Receipt, CheckCircle, AlertCircle,
  Tag, Archive, ChevronRight, ChevronLeft,
  Users, Home, Dumbbell
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';
import apiService from '../../../../services/apiService';

const NewSaleModal = ({ 
  isOpen, 
  onClose, 
  onSaveSuccess
}) => {
  const { showSuccess, showError, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [currentSale, setCurrentSale] = useState({
    items: [],
    customerInfo: { type: 'cf', name: '', phone: '', address: '' },
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
  const [currentStep, setCurrentStep] = useState(1); // 1: Cliente, 2: Productos, 3: Pago
  
  // Estados de búsqueda de productos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [productImages, setProductImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  
  // Estados para listado de clientes
  const [allCustomers, setAllCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  const paymentMethods = [
    { id: 'cash', label: 'Efectivo', icon: Coins, color: 'green', description: 'Pago en efectivo' },
    { id: 'transfer', label: 'Transferencia', icon: FileText, color: 'blue', description: 'Transferencia bancaria' }
  ];
  
  // Cargar clientes al abrir el modal
  useEffect(() => {
    if (isOpen) {
      resetForm();
      loadAllCustomers();
    }
  }, [isOpen]);
  
  const resetForm = () => {
    setCurrentSale({
      items: [],
      customerInfo: { type: 'cf', name: '', phone: '', address: '' },
      paymentMethod: 'cash',
      subtotal: 0,
      discount: 0,
      total: 0,
      notes: '',
      cashReceived: '',
      transferVoucher: '',
      bankReference: ''
    });
    setCurrentStep(1);
    setProductSearchTerm('');
    setSearchResults([]);
    setProductImages({});
    setSelectedCustomerId(null);
  };
  
  // Cargar todos los clientes activos
  const loadAllCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const response = await apiService.get('/users', {
        params: { role: 'cliente', isActive: true, limit: 100 }
      });
      
      const userData = response.data || response;
      setAllCustomers(userData.users || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setAllCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  // Seleccionar cliente del listado
  const selectCustomerFromList = (customer) => {
    if (!customer) {
      // Cliente CF o sin nombre
      setSelectedCustomerId(null);
      setCurrentSale(prev => ({
        ...prev,
        customerInfo: { type: 'cf', name: '', phone: '', address: '' }
      }));
    } else {
      setSelectedCustomerId(customer.id);
      setCurrentSale(prev => ({
        ...prev,
        customerInfo: {
          type: 'registered',
          userId: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone || '',
          address: customer.address || ''
        }
      }));
    }
  };
  
  // Búsqueda de productos
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
  
  // Gestión del carrito
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
  
  // Guardar venta
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
        
        if (currentSale.paymentMethod === 'transfer') {
          showSuccess('Venta por transferencia registrada. Requiere confirmación de admin.');
        } else {
          showSuccess('Venta en efectivo registrada exitosamente');
        }
        
        if (onSaveSuccess) {
          onSaveSuccess(savedSale);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      showError('Error al guardar la venta');
    } finally {
      setIsSavingSale(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Determinar si puede avanzar de paso
  const canAdvanceFromStep1 = true; // Cliente es opcional
  const canAdvanceFromStep2 = currentSale.items.length > 0;
  const canSave = currentSale.items.length > 0 && 
    (currentSale.paymentMethod === 'cash' 
      ? parseFloat(currentSale.cashReceived) >= currentSale.total
      : currentSale.transferVoucher.trim() !== '');
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-0 md:p-4">
      <div className={`bg-white w-full h-full md:h-auto md:max-h-[95vh] md:rounded-2xl shadow-2xl flex flex-col ${
        isMobile ? '' : 'md:max-w-6xl'
      }`}>
        
        {/* HEADER - Nueva Venta con icono de mancuerna */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 px-4 md:px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-6 h-6 text-white" />
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Nueva Venta
                </h1>
              </div>
              <p className="text-sm text-white/90">
                Completa la información para registrar la venta
              </p>
            </div>
            
            <button
              onClick={onClose}
              disabled={isSavingSale}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Indicador de Pasos */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mt-4">
            {[
              { num: 1, label: 'Cliente', icon: User },
              { num: 2, label: 'Productos', icon: ShoppingCart },
              { num: 3, label: 'Pago', icon: CreditCard }
            ].map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              
              return (
                <React.Fragment key={step.num}>
                  <button
                    onClick={() => {
                      if (step.num < currentStep || 
                          (step.num === 2 && canAdvanceFromStep1) ||
                          (step.num === 3 && canAdvanceFromStep2)) {
                        setCurrentStep(step.num);
                      }
                    }}
                    disabled={isSavingSale}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-white text-primary-600 shadow-lg scale-105' 
                        : isCompleted
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-primary-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-white/20'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="text-sm font-semibold hidden sm:inline">
                      {step.label}
                    </span>
                  </button>
                  
                  {idx < 2 && (
                    <div className={`hidden md:block w-8 h-0.5 ${
                      currentStep > step.num ? 'bg-green-400' : 'bg-white/20'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto">
          
          {/* PASO 1: CLIENTE */}
          {currentStep === 1 && (
            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 md:p-6 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Seleccionar Cliente</h2>
                    <p className="text-sm text-gray-600">Elige un cliente o continúa como consumidor final</p>
                  </div>
                </div>
                
                {/* Botón CF destacado */}
                <button
                  onClick={() => selectCustomerFromList(null)}
                  className={`w-full mb-4 p-4 rounded-xl border-2 transition-all ${
                    selectedCustomerId === null
                      ? 'border-green-500 bg-green-50 shadow-lg'
                      : 'border-gray-300 bg-white hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedCustomerId === null ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      <User className={`w-6 h-6 ${selectedCustomerId === null ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-gray-900">Consumidor Final (CF)</div>
                      <div className="text-sm text-gray-600">Sin nombre o cliente no registrado</div>
                    </div>
                    {selectedCustomerId === null && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                </button>
                
                {/* Lista de clientes */}
                {isLoadingCustomers ? (
                  <div className="text-center py-8">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                    <p className="text-sm text-gray-600">Cargando clientes...</p>
                  </div>
                ) : allCustomers.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-700 text-sm mb-2">Clientes Registrados:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                      {allCustomers.map(customer => (
                        <button
                          key={customer.id}
                          onClick={() => selectCustomerFromList(customer)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            selectedCustomerId === customer.id
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selectedCustomerId === customer.id ? 'bg-green-500' : 'bg-blue-100'
                            }`}>
                              <User className={`w-5 h-5 ${
                                selectedCustomerId === customer.id ? 'text-white' : 'text-blue-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {customer.email || customer.phone || 'Sin contacto'}
                              </div>
                            </div>
                            {selectedCustomerId === customer.id && (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay clientes registrados</p>
                  </div>
                )}
                
                {/* Campos adicionales para cliente no registrado (solo si es CF) */}
                {selectedCustomerId === null && (
                  <div className="mt-4 p-4 bg-white rounded-xl border-2 border-gray-200">
                    <h3 className="font-semibold text-gray-700 text-sm mb-3">
                      Información Adicional (Opcional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          placeholder="Ej: 5555-5555"
                          value={currentSale.customerInfo.phone}
                          onChange={(e) => setCurrentSale(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, phone: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Dirección
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Zona 10"
                          value={currentSale.customerInfo.address}
                          onChange={(e) => setCurrentSale(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, address: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    Continuar a Productos
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* PASO 2: PRODUCTOS */}
          {currentStep === 2 && (
            <div className="p-4 md:p-6 space-y-4">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Búsqueda de productos */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                        <Search className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Buscar Productos</h3>
                        <p className="text-sm text-gray-600">Busca por nombre, SKU o código de barras</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                      <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-base font-medium"
                        autoFocus
                      />
                    </div>
                    
                    {productSearchTerm && (
                      <div className="mt-4 max-h-80 overflow-y-auto">
                        {isSearching ? (
                          <div className="text-center py-12">
                            <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
                            <p className="text-sm text-gray-600 font-medium">Buscando productos...</p>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {searchResults.map(product => {
                              const image = productImages[product.id];
                              const isOutOfStock = (product.stockQuantity || 0) <= 0;
                              const isLowStock = (product.stockQuantity || 0) > 0 && (product.stockQuantity || 0) <= 5;
                              
                              return (
                                <button
                                  key={product.id}
                                  onClick={() => addProductToSale(product)}
                                  disabled={isOutOfStock}
                                  className={`bg-white border-2 rounded-xl p-3 text-left transition-all ${
                                    isOutOfStock 
                                      ? 'border-red-300 opacity-50 cursor-not-allowed' 
                                      : 'border-purple-200 hover:border-purple-400 hover:shadow-lg hover:scale-105'
                                  }`}
                                >
                                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                                    {loadingImages[product.id] ? (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Loader className="w-6 h-6 animate-spin text-gray-400" />
                                      </div>
                                    ) : image?.imageUrl ? (
                                      <img 
                                        src={image.imageUrl} 
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}
                                    
                                    {isOutOfStock && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">SIN STOCK</span>
                                      </div>
                                    )}
                                    
                                    {isLowStock && !isOutOfStock && (
                                      <div className="absolute top-2 right-2">
                                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                          ¡Bajo!
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <h4 className="font-semibold text-sm truncate mb-2" title={product.name}>
                                    {product.name}
                                  </h4>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-base font-bold text-green-600">
                                      Q{(product.price || 0).toFixed(2)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Archive className="w-3 h-3 text-gray-400" />
                                      <span className={`text-xs font-semibold ${
                                        isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'
                                      }`}>
                                        {product.stockQuantity || 0}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <Package className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                            <p className="font-semibold">No se encontraron productos</p>
                            <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Carrito de productos */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-white" />
                          <h3 className="font-bold text-white">
                            Productos Agregados
                          </h3>
                        </div>
                        <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {currentSale.items.length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {currentSale.items.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                          <ShoppingCart className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                          <p className="font-semibold text-lg mb-2">Carrito vacío</p>
                          <p className="text-sm">Busca y selecciona productos para agregar</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {currentSale.items.map((item, idx) => (
                            <div key={item.productId} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  {idx + 1}
                                </div>
                                
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-200">
                                  {item.productImage ? (
                                    <img 
                                      src={item.productImage} 
                                      alt={item.productName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900 mb-1 truncate">
                                    {item.productName}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <span className="font-semibold text-green-600">
                                      Q{item.price.toFixed(2)}
                                    </span>
                                    <span className="text-gray-400">×</span>
                                    <span>{item.quantity}</span>
                                    <span className="text-gray-400">=</span>
                                    <span className="font-bold text-gray-900">
                                      Q{item.total.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  
                                  <div className="w-14 text-center">
                                    <div className="text-xl font-bold text-gray-900">{item.quantity}</div>
                                    <div className="text-xs text-gray-500">de {item.maxStock}</div>
                                  </div>
                                  
                                  <button
                                    onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                    disabled={item.quantity >= item.maxStock}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => removeItemFromSale(item.productId)}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-2"
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
                
                {/* PANEL DE TOTALES VISIBLE EN PASO 2 */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl p-4 text-white shadow-xl sticky top-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="w-5 h-5" />
                      <h4 className="font-bold text-lg">Resumen</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-white/90">
                        <span>Productos:</span>
                        <span className="font-semibold">
                          {currentSale.items.length}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-white/90">
                        <span>Subtotal:</span>
                        <span className="font-semibold text-lg">
                          Q{currentSale.subtotal.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="border-t border-white/30 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold">TOTAL:</span>
                          <span className="text-3xl font-bold">
                            Q{currentSale.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navegación */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Atrás
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canAdvanceFromStep2}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar al Pago
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* PASO 3: PAGO */}
          {currentStep === 3 && (
            <div className="p-4 md:p-6 space-y-4">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Método de pago */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Método de Pago</h3>
                        <p className="text-sm text-gray-600">Selecciona cómo realizará el pago</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {paymentMethods.map(method => {
                        const IconComponent = method.icon;
                        const isSelected = currentSale.paymentMethod === method.id;
                        
                        return (
                          <button
                            key={method.id}
                            onClick={() => setCurrentSale(prev => ({ ...prev, paymentMethod: method.id }))}
                            className={`p-4 border-2 rounded-xl transition-all ${
                              isSelected
                                ? 'border-green-600 bg-white shadow-lg scale-105'
                                : 'border-green-300 bg-white hover:border-green-400 hover:shadow-md'
                            }`}
                          >
                            <IconComponent className={`w-8 h-8 mx-auto mb-2 ${
                              method.color === 'green' ? 'text-green-600' : 'text-blue-600'
                            }`} />
                            <div className="font-bold text-gray-900 mb-1">{method.label}</div>
                            <div className="text-xs text-gray-600">{method.description}</div>
                            {isSelected && (
                              <div className="mt-2">
                                <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Campos específicos del método de pago */}
                    {currentSale.paymentMethod === 'cash' && (
                      <div className="bg-white rounded-xl p-4 border-2 border-green-300">
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                          <Coins className="w-4 h-4 inline mr-1" />
                          Efectivo Recibido *
                        </label>
                        <div className="relative mb-4">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">
                            Q
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={currentSale.cashReceived}
                            onChange={(e) => setCurrentSale(prev => ({ ...prev, cashReceived: e.target.value }))}
                            className="w-full pl-10 pr-4 py-4 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xl font-bold text-right"
                            required
                          />
                        </div>
                        
                        {currentSale.cashReceived && currentSale.total > 0 && (
                          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border-2 border-green-300">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-gray-700">Cambio a Entregar:</span>
                              <span className="text-2xl font-bold text-green-700">
                                Q{Math.max(0, parseFloat(currentSale.cashReceived) - currentSale.total).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {currentSale.paymentMethod === 'transfer' && (
                      <div className="space-y-3 bg-white rounded-xl p-4 border-2 border-green-300">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Comprobante de Transferencia *
                          </label>
                          <textarea
                            placeholder="Ingresa los detalles del comprobante de transferencia..."
                            value={currentSale.transferVoucher}
                            onChange={(e) => setCurrentSale(prev => ({ ...prev, transferVoucher: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Referencia Bancaria (Opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: REF123456789"
                            value={currentSale.bankReference}
                            onChange={(e) => setCurrentSale(prev => ({ ...prev, bankReference: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Descuento y notas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        <Percent className="w-4 h-4 inline mr-1" />
                        Descuento (Opcional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                          Q
                        </span>
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
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold text-right"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Notas (Opcional)
                      </label>
                      <textarea
                        placeholder="Notas adicionales..."
                        value={currentSale.notes}
                        onChange={(e) => setCurrentSale(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Panel de resumen */}
                <div className="space-y-4">
                  
                  {/* Resumen del cliente */}
                  <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-gray-900">Cliente</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="font-semibold text-gray-900">
                        {currentSale.customerInfo.name || 'Consumidor Final'}
                      </div>
                      {currentSale.customerInfo.phone && (
                        <div className="text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {currentSale.customerInfo.phone}
                        </div>
                      )}
                      {currentSale.customerInfo.address && (
                        <div className="text-gray-600 flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {currentSale.customerInfo.address}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Resumen de productos */}
                  <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                      <h4 className="font-bold text-gray-900">Productos</h4>
                    </div>
                    <div className="space-y-2">
                      {currentSale.items.map(item => (
                        <div key={item.productId} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {item.productName}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {item.quantity} × Q{item.price.toFixed(2)}
                            </div>
                          </div>
                          <div className="font-bold text-gray-900 ml-2">
                            Q{item.total.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Resumen financiero */}
                  <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl p-4 text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="w-5 h-5" />
                      <h4 className="font-bold text-lg">Total a Pagar</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-white/90">
                        <span>Subtotal:</span>
                        <span className="font-semibold text-lg">
                          Q{currentSale.subtotal.toFixed(2)}
                        </span>
                      </div>
                      
                      {currentSale.discount > 0 && (
                        <div className="flex justify-between items-center text-yellow-200">
                          <span>Descuento:</span>
                          <span className="font-semibold text-lg">
                            -Q{parseFloat(currentSale.discount).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t border-white/30 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold">TOTAL:</span>
                          <span className="text-3xl font-bold">
                            Q{currentSale.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navegación y acción */}
                  <div className="space-y-3">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Volver a Productos
                    </button>
                    
                    <button
                      onClick={handleSaveSale}
                      disabled={isSavingSale || !canSave}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSavingSale ? (
                        <>
                          <Loader className="w-6 h-6 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Receipt className="w-6 h-6" />
                          Registrar Venta
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
        
      </div>
    </div>
  );
};

export default NewSaleModal;

/**
 * 🎯 CORRECCIONES FINALES APLICADAS
 * 
 * ✅ 1. Z-INDEX MÁXIMO:
 *    - z-[99999] para estar por encima de TODO (igual que modal de planes)
 * 
 * ✅ 2. TÍTULO CORRECTO:
 *    - "Nueva Venta" con icono de Dumbbell (mancuerna) 🏋️
 *    - Sin mencionar "comprobante" o "factura"
 * 
 * ✅ 3. ELIMINADOS TODOS LOS SÍMBOLOS DE DÓLAR:
 *    - Removido DollarSign de imports
 *    - Icono de Coins en lugar de DollarSign para efectivo
 *    - Formato "Q" en todos los precios
 * 
 * ✅ 4. BOTÓN DE REGISTRAR:
 *    - Usa icono de Receipt (comprobante)
 *    - Texto: "Registrar Venta"
 *    - Sin símbolos de dólar
 * 
 * ✅ 5. FORMATO QUETZALES CONSISTENTE:
 *    - Q150.00 en todos lados
 *    - Q en inputs con span absoluto
 *    - toFixed(2) en todos los números
 */