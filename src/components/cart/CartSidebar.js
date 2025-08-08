// src/components/cart/CartSidebar.js
// FUNCIÓN: Sidebar del carrito OPTIMIZADO - Diseño compacto que prioriza mostrar productos
// MEJORAS: ✅ Header compacto ✅ Botones lado a lado ✅ Más espacio para productos ✅ Diseño limpio

import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Loader2,
  RefreshCw,
  Package,
  ArrowRight,
  WifiOff,
  CheckCircle,
  Gift,
  Truck,
  LogIn,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { 
    isOpen, 
    closeCart, 
    items, 
    total,
    itemCount, 
    updateQuantity, 
    removeItem,
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

  // ✅ FUNCIÓN: Ir al checkout (para invitados)
  const handleGuestCheckout = () => {
    if (isEmpty) {
      showError('Tu carrito está vacío');
      return;
    }
    
    console.log('🎫 Redirecting to guest checkout...');
    closeCart();
    navigate('/checkout');
  };

  // ✅ FUNCIÓN: Ir al login (para usuarios que quieren autenticarse)
  const handleGoToLogin = () => {
    console.log('🔐 Redirecting to login...');
    closeCart();
    navigate('/login', { state: { from: '/store', returnToCart: true } });
  };

  // ✅ FUNCIÓN: Checkout para usuarios autenticados
  const handleAuthenticatedCheckout = () => {
    if (isEmpty) {
      showError('Tu carrito está vacío');
      return;
    }
    
    console.log('👤 Redirecting authenticated user to checkout...');
    closeCart();
    navigate('/checkout');
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
        className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
        onClick={closeCart}
      />
      
      {/* ✅ Sidebar */}
      <div className={`fixed top-0 right-0 h-full z-[70] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
        isMobile ? 'w-full' : 'w-96'
      }`}>
        
        {/* ✅ HEADER COMPACTO */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Mi Carrito ({safeInteger(itemCount)})
          </h2>
          <div className="flex items-center space-x-2">
            {/* Estado de conexión compacto */}
            {sessionInfo?.syncError ? (
              <button
                onClick={retrySync}
                className="text-orange-600 hover:text-orange-700 p-1 rounded transition-colors"
                disabled={isLoading}
                title="Sin conexión - Reintentar"
              >
                <WifiOff className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            ) : isAuthenticated ? (
              <CheckCircle className="w-4 h-4 text-green-500" title="Sincronizado" />
            ) : null}
            
            <button
              onClick={closeCart}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* ✅ NOTIFICACIÓN COMPACTA (solo para invitados con productos) */}
        {!isAuthenticated && items.length > 0 && (
          <div className="flex-shrink-0 px-3 py-2 bg-blue-50 border-b border-blue-200 text-center">
            <div className="flex items-center justify-center space-x-1">
              <Gift className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-700">
                Inicia sesión para beneficios exclusivos
              </span>
            </div>
          </div>
        )}

        {/* ✅ CONTENIDO PRINCIPAL - MÁS ESPACIO PARA PRODUCTOS */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* ✅ ÁREA DE ITEMS - PRIORIZADA */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cargando...</p>
                  </div>
                </div>
              )}
              
              {!isLoading && isEmpty ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">Carrito vacío</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Agrega productos para comenzar
                  </p>
                  <button
                    onClick={closeCart}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Ir a la tienda
                  </button>
                </div>
              ) : !isLoading && (
                <div className="space-y-2">
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
                  
                  {items.length > 1 && (
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={handleClearCart}
                        className="w-full text-center text-red-600 hover:text-red-700 text-xs font-medium py-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Vaciar carrito
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ FOOTER COMPACTO */}
          {!isLoading && !isEmpty && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <div className="p-3 space-y-3">
                
                {/* Resumen compacto */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(safeNumber(summary?.subtotal || total, 0))}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Envío:
                      {safeNumber(summary?.totalAmount || total, 0) >= 200 && (
                        <span className="text-green-600 ml-1">Gratis</span>
                      )}
                    </span>
                    <span className="font-medium">
                      {safeNumber(summary?.totalAmount || total, 0) >= 200 ? 'Q 0.00' : 'Q 25.00'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-primary-600">
                      {formatCurrency(safeNumber(summary?.totalAmount || total, 0))}
                    </span>
                  </div>
                </div>

                {/* Info rápida */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center">
                    <Truck className="w-3 h-3 mr-1" />
                    <span>2-3 días</span>
                  </div>
                  {safeNumber(summary?.totalAmount || total, 0) >= 200 && (
                    <div className="flex items-center text-green-600">
                      <Gift className="w-3 h-3 mr-1" />
                      <span>Envío gratis</span>
                    </div>
                  )}
                </div>
                
                {/* ✅ BOTONES OPTIMIZADOS - LADO A LADO */}
                <div className="space-y-2">
                  
                  {isAuthenticated ? (
                    /* Usuario autenticado - un botón */
                    <button
                      onClick={handleAuthenticatedCheckout}
                      disabled={isCheckingOut || isLoading}
                      className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      {isCheckingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Proceder al pago</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  ) : (
                    /* Invitado - dos botones lado a lado */
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleGoToLogin}
                          className="bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-1 text-xs"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Iniciar sesión</span>
                        </button>
                        
                        <button
                          onClick={handleGuestCheckout}
                          className="bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1 border border-gray-300 text-xs"
                        >
                          <User className="w-3 h-3" />
                          <span>Como invitado</span>
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        💡 Rápido sin registro | 🎯 Sesión = beneficios
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={closeCart}
                    className="w-full text-primary-600 hover:text-primary-700 py-2 text-xs font-medium hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Continuar comprando
                  </button>
                </div>
                
                {isMobile && <div className="pb-2" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ✅ COMPONENTE OPTIMIZADO: Item del carrito más compacto
const CartItem = ({ item, onUpdateQuantity, onRemove, formatCurrency, isMobile }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleQuantityChange = async (newQuantity) => {
    const safeQty = safeInteger(newQuantity, 0);
    if (safeQty < 0 || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.cartId || item.id, safeQty);
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleRemove = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onRemove(item.cartId || item.id);
    } catch (error) {
      console.error('❌ Error removing item:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const itemPrice = safeNumber(item.price, 0);
  const itemQuantity = safeInteger(item.quantity, 1);
  const itemName = item.name || 'Producto sin nombre';
  const itemImage = item.image || '/api/placeholder/60/60';

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm ${isUpdating ? 'opacity-50' : ''}`}>
      
      {/* ✅ LAYOUT HORIZONTAL COMPACTO */}
      <div className="flex items-start space-x-2.5">
        
        {/* Imagen más pequeña */}
        <img 
          src={itemImage}
          alt={itemName}
          className="w-12 h-12 object-cover rounded-md border border-gray-200 flex-shrink-0"
          onError={(e) => {
            e.target.src = '/api/placeholder/60/60';
          }}
        />
        
        {/* Info del producto */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 leading-tight mb-0.5 truncate">
            {itemName}
          </h4>
          <p className="text-sm text-primary-600 font-medium mb-1">
            {formatCurrency(itemPrice)}
          </p>
          
          {/* Opciones compactas */}
          {item.options && Object.keys(item.options).length > 0 && (
            <div className="space-y-0.5">
              {Object.entries(item.options).map(([key, value]) => (
                key !== 'quantity' && value && (
                  <span key={key} className="inline-block text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-1">
                    {key}: {value}
                  </span>
                )
              )).filter(Boolean)}
            </div>
          )}
        </div>
        
        {/* Controles a la derecha */}
        <div className="flex flex-col items-end space-y-1.5">
          
          {/* Controles de cantidad compactos */}
          <div className="flex items-center space-x-1 bg-gray-50 rounded-md p-0.5">
            <button
              onClick={() => handleQuantityChange(itemQuantity - 1)}
              disabled={isUpdating || itemQuantity <= 1}
              className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="w-6 text-center text-xs font-medium">
              {isUpdating ? '...' : itemQuantity}
            </span>
            <button
              onClick={() => handleQuantityChange(itemQuantity + 1)}
              disabled={isUpdating}
              className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
          
          {/* Subtotal y eliminar */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-gray-900">
              {formatCurrency(itemPrice * itemQuantity)}
            </span>
            <button
              onClick={handleRemove}
              disabled={isUpdating}
              className="w-6 h-6 text-red-500 hover:text-red-700 hover:bg-red-50 rounded flex items-center justify-center disabled:opacity-50 transition-colors"
              title="Eliminar"
            >
              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;

// 📝 OPTIMIZACIONES APLICADAS:
// 
// ✅ HEADER MÁS COMPACTO:
// - Reducido padding de 4 a 3
// - Iconos más pequeños (4x4)
// - Estado de conexión integrado en el header
// 
// ✅ BOTONES LADO A LADO:
// - Grid de 2 columnas para invitados
// - Botones más pequeños (py-2.5)
// - Texto más compacto (text-xs)
// - Iconos más pequeños (w-3 h-3)
// 
// ✅ MÁS ESPACIO PARA PRODUCTOS:
// - Padding reducido en contenedores (p-3)
// - Items más compactos con imágenes 12x12
// - Controles de cantidad más pequeños (6x6)
// - Espaciado optimizado (space-y-2)
// 
// ✅ DISEÑO GENERAL LIMPIO:
// - Menos elementos decorativos
// - Texto más pequeño pero legible
// - Mejor proporción entre elementos
// - Prioriza la visualización de productos