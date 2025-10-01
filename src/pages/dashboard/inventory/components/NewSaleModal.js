// Autor: Alexander Echeverria  
// Archivo: src/pages/dashboard/inventory/components/NewSaleModal.js
// Modal para crear nueva venta

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, X, User, CreditCard, Coins, Loader, Package, 
  Calculator, Minus, FileText, DollarSign, ShoppingCart, 
  Percent, Save
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';
import apiService from '../../../../services/apiService';

const NewSaleModal = ({ 
  isOpen, 
  onClose, 
  onSaveSuccess
}) => {
  const { showSuccess, showError, formatCurrency } = useApp();
  
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
  
  const paymentMethods = [
    { id: 'cash', label: 'Efectivo', icon: Coins, color: 'green' },
    { id: 'transfer', label: 'Transferencia', icon: FileText, color: 'blue' }
  ];
  
  // Click outside para cerrar dropdown de clientes
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  const resetForm = () => {
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
    setCustomerSearchTerm('');
    setCustomerSearchResults([]);
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
  
  // Búsqueda de clientes
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
        
        // Notificar al componente padre
        if (onSaveSuccess) {
          onSaveSuccess(savedSale);
        }
        
        // Cerrar modal
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
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header compacto */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nueva Venta</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Busca productos y completa la información
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white rounded-lg transition-colors"
            disabled={isSavingSale}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Productos y Carrito */}
            <div className="lg:col-span-2 space-y-3">
              
              {/* Búsqueda de productos */}
              <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  <Search className="w-4 h-4 mr-2 text-primary-600" />
                  Buscar Productos
                </h3>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, SKU o código de barras..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                    autoFocus
                  />
                </div>
                
                {productSearchTerm && (
                  <div className="mt-3 max-h-64 overflow-y-auto">
                    {isSearching ? (
                      <div className="text-center py-6">
                        <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                        <p className="text-xs text-gray-600">Buscando...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {searchResults.map(product => {
                          const image = productImages[product.id];
                          const isOutOfStock = (product.stockQuantity || 0) <= 0;
                          
                          return (
                            <button
                              key={product.id}
                              onClick={() => addProductToSale(product)}
                              className={`bg-white border rounded-lg p-2 text-left transition-all ${
                                isOutOfStock 
                                  ? 'border-red-200 opacity-50 cursor-not-allowed' 
                                  : 'border-primary-200 hover:border-primary-400 hover:shadow-md'
                              }`}
                              disabled={isOutOfStock}
                            >
                              <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                                {loadingImages[product.id] ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                                  </div>
                                ) : image?.imageUrl ? (
                                  <img 
                                    src={image.imageUrl} 
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                
                                {isOutOfStock && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">SIN STOCK</span>
                                  </div>
                                )}
                              </div>
                              
                              <h4 className="font-medium text-xs truncate mb-1" title={product.name}>
                                {product.name}
                              </h4>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-green-600">
                                  {formatCurrency(product.price || 0)}
                                </span>
                                <span className={`text-xs font-medium ${
                                  isOutOfStock ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {product.stockQuantity || 0}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Package className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                        <p className="text-xs">No se encontraron productos</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Carrito */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="px-3 py-2 bg-primary-600">
                  <h3 className="font-bold text-white flex items-center text-sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Carrito ({currentSale.items.length})
                  </h3>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {currentSale.items.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                      <p className="font-semibold text-sm">Carrito vacío</p>
                      <p className="text-xs mt-1">Busca y selecciona productos</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {currentSale.items.map(item => (
                        <div key={item.productId} className="p-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
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
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-900 truncate">
                                {item.productName}
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatCurrency(item.price)} c/u
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              
                              <div className="w-12 text-center">
                                <div className="text-lg font-bold text-gray-900">{item.quantity}</div>
                                <div className="text-xs text-gray-500">{item.maxStock}</div>
                              </div>
                              
                              <button
                                onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50"
                                disabled={item.quantity >= item.maxStock}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="text-right min-w-[80px]">
                                <div className="text-sm font-bold text-gray-900">
                                  {formatCurrency(item.total)}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeItemFromSale(item.productId)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <X className="w-4 h-4" />
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
            
            {/* Información lateral */}
            <div className="space-y-3">
              
              {/* Cliente */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  Cliente
                </h3>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nombre del cliente (opcional)"
                    value={currentSale.customerInfo.name}
                    onChange={(e) => setCurrentSale(prev => ({
                      ...prev,
                      customerInfo: { 
                        ...prev.customerInfo, 
                        type: 'cf',
                        name: e.target.value 
                      }
                    }))}
                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  <div className="relative" ref={customerSearchRef}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar cliente registrado..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    {showCustomerDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {isSearchingCustomers ? (
                          <div className="p-3 text-center">
                            <Loader className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-600" />
                            <span className="text-xs text-gray-600">Buscando...</span>
                          </div>
                        ) : customerSearchResults.length > 0 ? (
                          customerSearchResults.map(customer => (
                            <button
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="w-full p-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium text-sm text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-xs text-gray-600">{customer.email}</div>
                            </button>
                          ))
                        ) : customerSearchTerm.length >= 2 ? (
                          <div className="p-3 text-center text-gray-500 text-xs">
                            No se encontraron clientes
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {currentSale.customerInfo.userId && (
                    <div className="bg-white rounded-lg p-2 border border-blue-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {currentSale.customerInfo.name}
                          </div>
                          {currentSale.customerInfo.email && (
                            <div className="text-xs text-gray-600 truncate">
                              {currentSale.customerInfo.email}
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
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Método de pago */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                  <CreditCard className="w-4 h-4 mr-2 text-green-600" />
                  Método de Pago
                </h3>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {paymentMethods.map(method => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setCurrentSale(prev => ({ ...prev, paymentMethod: method.id }))}
                        className={`p-2 border rounded-lg transition-all ${
                          currentSale.paymentMethod === method.id
                            ? 'border-green-600 bg-white shadow-md'
                            : 'border-green-300 bg-white hover:border-green-400'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 mx-auto mb-1 ${
                          method.color === 'green' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                        <div className="text-xs font-medium">{method.label}</div>
                      </button>
                    );
                  })}
                </div>
                
                {currentSale.paymentMethod === 'cash' && (
                  <div className="bg-white rounded-lg p-2 border border-green-200">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Efectivo Recibido *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={currentSale.cashReceived}
                        onChange={(e) => setCurrentSale(prev => ({ ...prev, cashReceived: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base font-semibold"
                        required
                      />
                    </div>
                    
                    {currentSale.cashReceived && currentSale.total > 0 && (
                      <div className="mt-2 p-2 bg-green-100 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-700">Cambio:</span>
                          <span className="text-base font-bold text-green-700">
                            {formatCurrency(Math.max(0, parseFloat(currentSale.cashReceived) - currentSale.total))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {currentSale.paymentMethod === 'transfer' && (
                  <div className="space-y-2 bg-white rounded-lg p-2 border border-green-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Comprobante *
                      </label>
                      <textarea
                        placeholder="Detalles de la transferencia..."
                        value={currentSale.transferVoucher}
                        onChange={(e) => setCurrentSale(prev => ({ ...prev, transferVoucher: e.target.value }))}
                        rows={2}
                        className="w-full px-2 py-1.5 text-xs border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Referencia bancaria (opcional)"
                      value={currentSale.bankReference}
                      onChange={(e) => setCurrentSale(prev => ({ ...prev, bankReference: e.target.value }))}
                      className="w-full px-2 py-1.5 text-xs border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>
              
              {/* Descuento y notas */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
                    <Percent className="w-3 h-3 mr-1" />
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    placeholder="Notas adicionales..."
                    value={currentSale.notes}
                    onChange={(e) => setCurrentSale(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              {/* Resumen */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-3 text-white shadow-lg">
                <h3 className="font-bold mb-2 flex items-center text-sm">
                  <Calculator className="w-4 h-4 mr-2" />
                  Resumen
                </h3>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-primary-100 text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(currentSale.subtotal)}</span>
                  </div>
                  
                  {currentSale.discount > 0 && (
                    <div className="flex justify-between items-center text-yellow-200 text-sm">
                      <span>Descuento:</span>
                      <span className="font-semibold">-{formatCurrency(currentSale.discount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-white/30 pt-1.5 mt-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold">Total:</span>
                      <span className="text-2xl font-bold">
                        {formatCurrency(currentSale.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold"
                  disabled={isSavingSale}
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSaveSale}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold shadow-lg disabled:opacity-50"
                  disabled={isSavingSale || currentSale.items.length === 0}
                >
                  {isSavingSale ? (
                    <span className="flex items-center justify-center">
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Save className="w-4 h-4 mr-2" />
                      Registrar
                    </span>
                  )}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSaleModal;