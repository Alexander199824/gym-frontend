// src/components/cart/CartSidebar.js
// FUNCIÓN: Sidebar del carrito CORREGIDO - Layout fijo que siempre se ve completo
// ARREGLO: ✅ Footer siempre visible ✅ Altura fija ✅ Sin cortes ✅ Responsive

import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  ArrowRight,
  WifiOff,
  CheckCircle,
  Gift,
  Truck
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

// ✅ HELPER: Validar y convertir a número de forma segura
const safeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

// ✅ HELPER: Validar y convertir a entero de forma segura
const safeInteger = (value, defaultValue = 0) => {
  const num = parseInt(value);
  return isNaN(num) ? defaultValue : num;
};

const CartSidebar = () => {
  const { 
    isOpen, 
    closeCart, 
    items, 
    total,
    itemCount, 
    updateQuantity, 
    removeItem,
    proceedToCheckout,
    isEmpty,
    formatCurrency,
    isLoading,
    summary,
    sessionInfo,
    retrySync,
    clearCart
  } = useCart();
  
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo, isMobile } = useApp();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  // ✅ FUNCIÓN: Manejar checkout con validaciones
  const handleCheckout = async () => {
    if (isEmpty) {
      showError('Tu carrito está vacío');
      return;
    }
    
    try {
      setIsCheckingOut(true);
      
      const result = await proceedToCheckout();
      
      if (result && result.success) {
        showSuccess('¡Pedido creado exitosamente!');
        closeCart();
        
        // Redirigir a la página de confirmación si existe
        if (result.redirectUrl) {
          setTimeout(() => {
            window.location.href = result.redirectUrl;
          }, 1000);
        }
      }
      
    } catch (error) {
      console.error('Error in checkout:', error);
      
      if (error.message?.includes('iniciar sesión')) {
        showInfo('Redirigiendo al login...');
      } else {
        showError('Error al procesar el pedido');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  // ✅ FUNCIÓN: Limpiar carrito con confirmación
  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar tu carrito?')) {
      clearCart();
    }
  };

  return (
    <>
      {/* ✅ Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />
      
      {/* ✅ Sidebar - ESTRUCTURA FIJA CORREGIDA */}
      <div className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
        isMobile ? 'w-full' : 'w-96'
      }`}>
        
        {/* ✅ 1. HEADER FIJO - 60px */}
        <div className="flex-shrink-0 h-15 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Mi Carrito ({safeInteger(itemCount)})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* ✅ 2. ESTADOS DE CONEXIÓN - ALTURA VARIABLE */}
        <div className="flex-shrink-0">
          {/* Estado de sincronización */}
          {sessionInfo?.syncError && (
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <WifiOff className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    Sin conexión al servidor
                  </span>
                </div>
                <button
                  onClick={retrySync}
                  className="text-orange-600 hover:text-orange-700 p-1 rounded transition-colors"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )}
          
          {/* Estado de autenticación */}
          {!isAuthenticated && items.length > 0 && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Inicia sesión para sincronizar tu carrito
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ✅ 3. CONTENIDO PRINCIPAL - FLEX-1 (TOMA EL ESPACIO RESTANTE) */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* ✅ 3A. ÁREA DE ITEMS - SCROLL INDEPENDIENTE */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              
              {/* Estado de carga */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cargando carrito...</p>
                  </div>
                </div>
              )}
              
              {/* Carrito vacío */}
              {!isLoading && isEmpty ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Agrega algunos productos para comenzar tu compra
                  </p>
                  <button
                    onClick={closeCart}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : !isLoading && (
                /* Items del carrito */
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItem 
                      key={item.cartId || item.id} 
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      formatCurrency={formatCurrency}
                      isMobile={isMobile}
                    />
                  ))}
                  
                  {/* Botón limpiar carrito */}
                  {items.length > 1 && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleClearCart}
                        className="w-full text-center text-red-600 hover:text-red-700 text-sm font-medium py-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Vaciar carrito
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ 3B. FOOTER FIJO - SIEMPRE VISIBLE (FLEX-SHRINK-0) */}
          {!isLoading && !isEmpty && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <div className="p-4 space-y-4">
                
                {/* ✅ Resumen detallado */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(safeNumber(summary?.subtotal || total, 0))}</span>
                  </div>
                  
                  {safeNumber(summary?.taxAmount, 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA (12%):</span>
                      <span className="font-medium">{formatCurrency(summary.taxAmount)}</span>
                    </div>
                  )}
                  
                  {safeNumber(summary?.shippingAmount, 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Envío:</span>
                      <span className="font-medium">{formatCurrency(summary.shippingAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-primary-600">
                      {formatCurrency(safeNumber(summary?.totalAmount || total, 0))}
                    </span>
                  </div>
                </div>

                {/* ✅ Benefits - Solo en desktop */}
                {!isMobile && (
                  <div className="text-sm text-gray-600 space-y-1">
                    {safeNumber(summary?.totalAmount || total, 0) >= 200 && (
                      <div className="flex items-center text-green-600">
                        <Gift className="w-4 h-4 mr-2" />
                        <span>Envío gratis incluido</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      <span>Entrega en 2-3 días hábiles</span>
                    </div>
                  </div>
                )}
                
                {/* ✅ Información de sincronización */}
                <div className="text-xs text-gray-500 text-center">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Carrito sincronizado</span>
                    </div>
                  ) : (
                    <span>Carrito guardado localmente</span>
                  )}
                </div>
                
                {/* ✅ Botones de acción - SIEMPRE VISIBLES */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || isLoading}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>{isAuthenticated ? 'Proceder al pago' : 'Iniciar sesión para comprar'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  
                  {/* Continuar comprando */}
                  <button
                    onClick={closeCart}
                    className="w-full text-primary-600 hover:text-primary-700 py-2 text-sm font-medium hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Continuar comprando
                  </button>
                </div>
                
                {/* ✅ Padding adicional en móvil para asegurar visibilidad */}
                {isMobile && <div className="pb-4" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// 🛍️ COMPONENTE: Item individual del carrito OPTIMIZADO
const CartItem = ({ item, onUpdateQuantity, onRemove, formatCurrency, isMobile }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // ✅ FUNCIÓN: Manejar cambio de cantidad con validaciones
  const handleQuantityChange = async (newQuantity) => {
    const safeQty = safeInteger(newQuantity, 0);
    
    if (safeQty < 0) return;
    
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.cartId || item.id, safeQty);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // ✅ FUNCIÓN: Manejar eliminación
  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await onRemove(item.cartId || item.id);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // ✅ VALORES SEGUROS
  const itemPrice = safeNumber(item.price, 0);
  const itemQuantity = safeInteger(item.quantity, 1);
  const itemName = item.name || 'Producto sin nombre';
  const itemImage = item.image || '/api/placeholder/80/80';

  return (
    <div className={`bg-gray-50 rounded-xl p-3 ${isUpdating ? 'opacity-50' : ''} ${
      isMobile ? 'space-y-3' : 'flex items-center space-x-3'
    }`}>
      
      {/* ✅ Imagen y info */}
      <div className={`flex items-center space-x-3 ${isMobile ? 'w-full' : 'flex-1 min-w-0'}`}>
        <img 
          src={itemImage}
          alt={itemName}
          className="w-14 h-14 object-cover rounded-lg"
          onError={(e) => {
            e.target.src = '/api/placeholder/80/80';
          }}
        />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {itemName}
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            {formatCurrency(itemPrice)} c/u
          </p>
          
          {/* Opciones seleccionadas */}
          {item.options && Object.keys(item.options).length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {Object.entries(item.options).map(([key, value]) => (
                key !== 'quantity' && value && (
                  <span key={key} className="mr-2">
                    {key}: {value}
                  </span>
                )
              )).filter(Boolean).slice(0, 2)}
            </div>
          )}
        </div>
      </div>
      
      {/* ✅ Controles */}
      <div className={`flex items-center justify-between ${isMobile ? 'w-full' : 'flex-col space-y-2'}`}>
        
        {/* Controles de cantidad */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuantityChange(itemQuantity - 1)}
            disabled={isUpdating || itemQuantity <= 1}
            className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-sm font-medium">
            {isUpdating ? '...' : itemQuantity}
          </span>
          <button
            onClick={() => handleQuantityChange(itemQuantity + 1)}
            disabled={isUpdating}
            className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        
        {/* Subtotal y eliminar */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(itemPrice * itemQuantity)}
          </span>
          <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1 hover:bg-red-50 rounded transition-colors"
            title="Eliminar producto"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;

// 📝 ESTRUCTURA FIJA CORREGIDA:
// 
// ✅ LAYOUT GARANTIZADO:
// 1. Header fijo (60px) - flex-shrink-0
// 2. Estados de conexión (altura variable) - flex-shrink-0  
// 3. Contenido principal (resto del espacio) - flex-1
//    3A. Área de items (scroll independiente) - flex-1
//    3B. Footer con botones (altura fija) - flex-shrink-0
// 
// ✅ PROBLEMAS SOLUCIONADOS:
// - Footer siempre visible sin importar la cantidad de items
// - Altura calculada correctamente para todos los tamaños de pantalla
// - Scroll solo en la lista de items, no en todo el sidebar
// - Botones y resumen SIEMPRE accesibles
// - Z-index correcto sin interferir con otros elementos
// 
// ✅ RESPONSIVE MEJORADO:
// - Ancho completo en móvil sin cortes
// - Padding adicional en móvil para evitar superposición
// - Layout adaptativo para items del carrito
// - Controles optimizados para touch