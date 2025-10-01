// Autor: Alexander Echeverria  
// Archivo: src/pages/dashboard/inventory/components/NewSaleModal.js
// Modal para crear nueva venta - VERSIÓN CORREGIDA
// ✅ Z-index correcto, tamaño compacto, colores del sistema

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, X, User, CreditCard, Coins, Loader, Package, 
  Calculator, Minus, FileText, ShoppingCart, 
  Receipt, CheckCircle, Trash2, Archive, Phone, Edit2
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
  
  // Estados de búsqueda de productos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [productImages, setProductImages] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  
  // Estados para clientes
  const [allCustomers, setAllCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  
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
    setProductSearchTerm('');
    setSearchResults([]);
    setProductImages({});
    setSelectedCustomerId(null);
    setCustomerSearchTerm('');
    setShowCustomerPanel(false);
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
  
  // Filtrar clientes por búsqueda
  const filteredCustomers = allCustomers.filter(customer => {
    if (!customerSearchTerm) return true;
    
    const searchLower = customerSearchTerm.toLowerCase();
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const email = (customer.email || '').toLowerCase();
    const phone = (customer.phone || '').toLowerCase();
    
    return fullName.includes(searchLower) || 
           email.includes(searchLower) || 
           phone.includes(searchLower);
  });
  
  // Seleccionar cliente
  const selectCustomerFromList = (customer) => {
    if (!customer) {
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
    setShowCustomerPanel(false);
    setCustomerSearchTerm('');
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
    if (productImages[productId] || loadingImages[productId]) return;
    
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
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-2 md:p-4">
      <div className={`bg-white w-full h-full md:h-auto md:max-h-[92vh] md:rounded-xl shadow-2xl flex flex-col ${
        isMobile ? '' : 'md:max-w-4xl'
      }`}>
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">
                  Nueva Venta
                </h1>
                <p className="text-xs text-purple-100">
                  Registra un nuevo comprobante
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              disabled={isSavingSale}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-3 md:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* COLUMNA IZQUIERDA */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* CLIENTE */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="border-b border-gray-200 px-3 py-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <h3 className="font-semibold text-gray-800 text-sm">Cliente</h3>
                      </div>
                      <button
                        onClick={() => setShowCustomerPanel(!showCustomerPanel)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        {showCustomerPanel ? 'Cerrar' : 'Cambiar'}
                      </button>
                    </div>
                  </div>
                  
                  {showCustomerPanel ? (
                    <div className="p-3">
                      {/* BUSCADOR DE CLIENTES */}
                      <div className="mb-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar cliente o escribir 'Consumidor Final'..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          />
                        </div>
                      </div>
                      
                      {/* CONSUMIDOR FINAL - Siempre visible o en resultados de búsqueda */}
                      {(!customerSearchTerm || 'consumidor final'.includes(customerSearchTerm.toLowerCase())) && (
                        <>
                          <button
                            onClick={() => selectCustomerFromList(null)}
                            className={`w-full mb-2 p-2 rounded-lg border-2 transition-all text-left ${
                              selectedCustomerId === null
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-primary-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                selectedCustomerId === null ? 'bg-primary-500' : 'bg-gray-200'
                              }`}>
                                <User className={`w-3.5 h-3.5 ${selectedCustomerId === null ? 'text-white' : 'text-gray-600'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800 text-sm">Consumidor Final</div>
                                <div className="text-xs text-gray-600">Sin cliente registrado</div>
                              </div>
                              {selectedCustomerId === null && (
                                <CheckCircle className="w-4 h-4 text-primary-500" />
                              )}
                            </div>
                          </button>
                          
                          {/* CAMPOS COMPACTOS PARA CONSUMIDOR FINAL */}
                          {selectedCustomerId === null && (
                            <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Nombre (opcional)"
                                  value={currentSale.customerInfo.name}
                                  onChange={(e) => setCurrentSale(prev => ({
                                    ...prev,
                                    customerInfo: { ...prev.customerInfo, name: e.target.value }
                                  }))}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500"
                                />
                                <input
                                  type="tel"
                                  placeholder="Teléfono (opcional)"
                                  value={currentSale.customerInfo.phone}
                                  onChange={(e) => setCurrentSale(prev => ({
                                    ...prev,
                                    customerInfo: { ...prev.customerInfo, phone: e.target.value }
                                  }))}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Dirección (opcional)"
                                  value={currentSale.customerInfo.address}
                                  onChange={(e) => setCurrentSale(prev => ({
                                    ...prev,
                                    customerInfo: { ...prev.customerInfo, address: e.target.value }
                                  }))}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* LISTA DE CLIENTES */}
                      {isLoadingCustomers ? (
                        <div className="text-center py-6">
                          <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600" />
                          <p className="text-xs text-gray-600">Cargando clientes...</p>
                        </div>
                      ) : filteredCustomers.length > 0 ? (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1.5 px-0.5">
                            {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} {customerSearchTerm && 'encontrado(s)'}
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-1.5">
                            {filteredCustomers.map(customer => (
                              <button
                                key={customer.id}
                                onClick={() => selectCustomerFromList(customer)}
                                className={`w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                                  selectedCustomerId === customer.id
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-primary-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    selectedCustomerId === customer.id ? 'bg-primary-500' : 'bg-gray-200'
                                  }`}>
                                    <User className={`w-4 h-4 ${
                                      selectedCustomerId === customer.id ? 'text-white' : 'text-gray-600'
                                    }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-800 truncate text-sm">
                                      {customer.firstName} {customer.lastName}
                                    </div>
                                    <div className="text-xs text-gray-600 truncate">
                                      {customer.email || customer.phone || 'Sin contacto'}
                                    </div>
                                  </div>
                                  {selectedCustomerId === customer.id && (
                                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <User className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs">
                            {customerSearchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">
                            {currentSale.customerInfo.name || 'Consumidor Final'}
                          </div>
                          {currentSale.customerInfo.phone && (
                            <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {currentSale.customerInfo.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* PRODUCTOS */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="border-b border-gray-200 px-3 py-2 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-800 text-sm">Productos</h3>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    {/* BÚSQUEDA DE PRODUCTOS */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar productos por nombre o SKU..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* RESULTADOS DE BÚSQUEDA */}
                    {productSearchTerm && (
                      <div className="mb-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {isSearching ? (
                          <div className="text-center py-6">
                            <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600" />
                            <p className="text-xs text-gray-600">Buscando...</p>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {searchResults.map(product => {
                              const image = productImages[product.id];
                              const isOutOfStock = (product.stockQuantity || 0) <= 0;
                              const isLowStock = (product.stockQuantity || 0) > 0 && (product.stockQuantity || 0) <= 5;
                              
                              return (
                                <button
                                  key={product.id}
                                  onClick={() => addProductToSale(product)}
                                  disabled={isOutOfStock}
                                  className={`w-full p-2.5 text-left transition-colors ${
                                    isOutOfStock 
                                      ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                      {loadingImages[product.id] ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Loader className="w-5 h-5 animate-spin text-gray-400" />
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
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-800 truncate text-sm">
                                        {product.name}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                                        <span className="font-semibold text-green-700">
                                          Q{(product.price || 0).toFixed(2)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Archive className="w-3 h-3" />
                                          <span className={`font-medium ${
                                            isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-600'
                                          }`}>
                                            {product.stockQuantity || 0}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
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
                    
                    {/* CARRITO */}
                    {currentSale.items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="font-medium text-sm">Carrito vacío</p>
                        <p className="text-xs mt-1">Busca y agrega productos</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentSale.items.map((item) => (
                          <div key={item.productId} className="border border-gray-200 rounded-lg p-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.productImage ? (
                                  <img 
                                    src={item.productImage} 
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-800 truncate text-sm">
                                  {item.productName}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  Q{item.price.toFixed(2)} × {item.quantity} = <span className="font-semibold text-gray-800">Q{item.total.toFixed(2)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                
                                <div className="w-8 text-center font-bold text-gray-800 text-sm">
                                  {item.quantity}
                                </div>
                                
                                <button
                                  onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= item.maxStock}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => removeItemFromSale(item.productId)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 ml-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* DESCUENTO Y NOTAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Descuento (Opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-sm">
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
                        className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Notas (Opcional)
                    </label>
                    <textarea
                      placeholder="Notas adicionales..."
                      value={currentSale.notes}
                      onChange={(e) => setCurrentSale(prev => ({ ...prev, notes: e.target.value }))}
                      rows={1}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
              
              {/* COLUMNA DERECHA - RESUMEN Y PAGO */}
              <div className="space-y-4">
                
                {/* RESUMEN */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-2">
                  <div className="border-b border-gray-200 px-3 py-2 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-800 text-sm">Resumen</h3>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between text-gray-700 text-sm">
                      <span>Productos:</span>
                      <span className="font-semibold">{currentSale.items.length}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-700 text-sm">
                      <span>Subtotal:</span>
                      <span className="font-semibold">Q{currentSale.subtotal.toFixed(2)}</span>
                    </div>
                    
                    {currentSale.discount > 0 && (
                      <div className="flex justify-between text-orange-600 text-sm">
                        <span>Descuento:</span>
                        <span className="font-semibold">-Q{parseFloat(currentSale.discount).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-800">TOTAL:</span>
                        <span className="text-xl font-bold text-gray-900">
                          Q{currentSale.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* MÉTODO DE PAGO */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="border-b border-gray-200 px-3 py-2 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-800 text-sm">Método de Pago</h3>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {/* SELECTOR */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCurrentSale(prev => ({ ...prev, paymentMethod: 'cash' }))}
                        className={`p-2.5 border-2 rounded-lg transition-all ${
                          currentSale.paymentMethod === 'cash'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <Coins className="w-5 h-5 mx-auto mb-1 text-green-600" />
                        <div className="text-xs font-semibold text-gray-800">Efectivo</div>
                        {currentSale.paymentMethod === 'cash' && (
                          <CheckCircle className="w-3.5 h-3.5 text-primary-500 mx-auto mt-0.5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => setCurrentSale(prev => ({ ...prev, paymentMethod: 'transfer' }))}
                        className={`p-2.5 border-2 rounded-lg transition-all ${
                          currentSale.paymentMethod === 'transfer'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <FileText className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                        <div className="text-xs font-semibold text-gray-800">Transferencia</div>
                        {currentSale.paymentMethod === 'transfer' && (
                          <CheckCircle className="w-3.5 h-3.5 text-primary-500 mx-auto mt-0.5" />
                        )}
                      </button>
                    </div>
                    
                    {/* CAMPOS DE PAGO */}
                    {currentSale.paymentMethod === 'cash' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Efectivo Recibido *
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-sm">
                              Q
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={currentSale.cashReceived}
                              onChange={(e) => setCurrentSale(prev => ({ ...prev, cashReceived: e.target.value }))}
                              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right font-semibold"
                            />
                          </div>
                        </div>
                        
                        {currentSale.cashReceived && currentSale.total > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-gray-700">Cambio:</span>
                              <span className="text-lg font-bold text-green-700">
                                Q{Math.max(0, parseFloat(currentSale.cashReceived) - currentSale.total).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {currentSale.paymentMethod === 'transfer' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Comprobante *
                          </label>
                          <textarea
                            placeholder="Detalles del comprobante..."
                            value={currentSale.transferVoucher}
                            onChange={(e) => setCurrentSale(prev => ({ ...prev, transferVoucher: e.target.value }))}
                            rows={2}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Referencia Bancaria
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: REF123456"
                            value={currentSale.bankReference}
                            onChange={(e) => setCurrentSale(prev => ({ ...prev, bankReference: e.target.value }))}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* BOTÓN GUARDAR */}
                <button
                  onClick={handleSaveSale}
                  disabled={isSavingSale || currentSale.items.length === 0 || 
                    (currentSale.paymentMethod === 'cash' && parseFloat(currentSale.cashReceived) < currentSale.total) ||
                    (currentSale.paymentMethod === 'transfer' && !currentSale.transferVoucher.trim())}
                  className="w-full px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSavingSale ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Registrar Venta
                    </>
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