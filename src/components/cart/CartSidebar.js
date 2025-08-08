// src/components/cart/CartSidebar.js
// FUNCIÓN: Sidebar del carrito MEJORADO - Productos se ven mejor + validaciones + ambas opciones
// MEJORAS: ✅ Diseño de productos mejorado ✅ Ambas opciones de checkout ✅ Layout optimizado

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
  Truck,
  UserPlus,
  User,
  LogIn
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
        
        {/* ✅ HEADER */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
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
        
        {/* ✅ ESTADOS DE CONEXIÓN */}
        <div className="flex-shrink-0">
          {sessionInfo?.syncError && (
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <WifiOff className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-800">Sin conexión al servidor</span>
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
          
          {!isAuthenticated && items.length > 0 && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Gift className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">¡Tienes opciones!</span>
                </div>
                <p className="text-xs text-blue-700">
                  Compra como invitado o inicia sesión
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ✅ CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* ✅ ÁREA DE ITEMS */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cargando carrito...</p>
                  </div>
                </div>
              )}
              
              {!isLoading && isEmpty ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tu carrito está vacío</h3>
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
                <div className="space-y-3">
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
                    <div className="pt-3 border-t border-gray-200">
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

          {/* ✅ FOOTER CON BOTONES */}
          {!isLoading && !isEmpty && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <div className="p-4 space-y-4">
                
                {/* Resumen */}
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
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío:</span>
                    <span className="font-medium">
                      {safeNumber(summary?.totalAmount || total, 0) >= 200 ? 'Gratis' : 'Q 25.00'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-primary-600">
                      {formatCurrency(safeNumber(summary?.totalAmount || total, 0))}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
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
                
                {/* Info sincronización */}
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
                
                {/* ✅ BOTONES SEGÚN AUTENTICACIÓN */}
                <div className="space-y-3">
                  
                  {isAuthenticated ? (
                    /* Usuario autenticado - un botón */
                    <button
                      onClick={handleAuthenticatedCheckout}
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
                          <span>Proceder al pago</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    /* Invitado - dos opciones */
                    <>
                      <button
                        onClick={handleGoToLogin}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Iniciar sesión para comprar</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">o</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleGuestCheckout}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 border border-gray-300"
                      >
                        <User className="w-4 h-4" />
                        <span>Comprar como invitado</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      
                      <div className="text-xs text-gray-500 text-center space-y-1">
                        <p>💡 Compra rápida sin registro</p>
                        <p>🎯 Inicia sesión para beneficios exclusivos</p>
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={closeCart}
                    className="w-full text-primary-600 hover:text-primary-700 py-2 text-sm font-medium hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Continuar comprando
                  </button>
                </div>
                
                {isMobile && <div className="pb-4" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ✅ COMPONENTE MEJORADO: Item del carrito con mejor diseño
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
  const itemImage = item.image || '/api/placeholder/80/80';

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm ${isUpdating ? 'opacity-50' : ''}`}>
      
      {/* ✅ DISEÑO MEJORADO - Layout vertical en móvil, horizontal en desktop */}
      <div className={`${isMobile ? 'space-y-3' : 'flex items-start space-x-3'}`}>
        
        {/* Imagen y info principal */}
        <div className={`flex space-x-3 ${isMobile ? 'w-full' : 'flex-1'}`}>
          <img 
            src={itemImage}
            alt={itemName}
            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              e.target.src = '/api/placeholder/80/80';
            }}
          />
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1">
              {itemName}
            </h4>
            <p className="text-sm text-primary-600 font-medium">
              {formatCurrency(itemPrice)}
            </p>
            
            {/* Opciones seleccionadas */}
            {item.options && Object.keys(item.options).length > 0 && (
              <div className="mt-1">
                {Object.entries(item.options).map(([key, value]) => (
                  key !== 'quantity' && value && (
                    <span key={key} className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mr-1 mb-1">
                      {key}: {value}
                    </span>
                  )
                )).filter(Boolean)}
              </div>
            )}
          </div>
        </div>
        
        {/* Controles de cantidad y precio */}
        <div className={`${isMobile ? 'flex justify-between items-center' : 'flex flex-col items-end space-y-2'}`}>
          
          {/* Controles de cantidad */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => handleQuantityChange(itemQuantity - 1)}
              disabled={isUpdating || itemQuantity <= 1}
              className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {isUpdating ? '...' : itemQuantity}
            </span>
            <button
              onClick={() => handleQuantityChange(itemQuantity + 1)}
              disabled={isUpdating}
              className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          {/* Subtotal y eliminar */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(itemPrice * itemQuantity)}
            </span>
            <button
              onClick={handleRemove}
              disabled={isUpdating}
              className="w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md flex items-center justify-center disabled:opacity-50 transition-colors"
              title="Eliminar producto"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;

// 📝 MEJORAS APLICADAS:
// 
// ✅ DISEÑO DE PRODUCTOS MEJORADO:
// - Fondo blanco con borde para cada producto
// - Imágenes más grandes (16x16) con borde
// - Layout responsive: vertical en móvil, horizontal en desktop
// - Controles de cantidad con fondo gris y botones con borde
// - Separación clara entre elementos
// - Opciones del producto como badges
// - Subtotal más destacado en negrita
// 
// ✅ AMBAS OPCIONES DE CHECKOUT MANTENIDAS:
// - "Iniciar sesión para comprar" (botón principal)
// - "Comprar como invitado" (botón secundario)
// - Separador visual con "o"
// - Info explicativa optimizada
// 
// ✅ LAYOUT OPTIMIZADO:
// - Mejor uso del espacio
// - Elementos más legibles
// - Colores contrastantes
// - Espaciado consistente