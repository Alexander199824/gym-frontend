// src/components/cart/CartSidebar.js
// FUNCIÓN: Sidebar del carrito de compras

import React from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

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
    formatCurrency
  } = useCart();
  
  const { isAuthenticated } = useAuth();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-96 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Mi Carrito ({itemCount})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          
          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {isEmpty ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-600 mb-4">
                  Agrega productos para comenzar
                </p>
                <button
                  onClick={closeCart}
                  className="btn-primary"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem 
                    key={item.cartId} 
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isEmpty && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Total:
                </span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Benefits */}
              <div className="text-sm text-gray-600 space-y-1">
                {total >= 200 && (
                  <div className="flex items-center text-green-600">
                    <span>✅ Envío gratis incluido</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span>🚚 Entrega en 2-3 días hábiles</span>
                </div>
              </div>
              
              {/* Checkout Button */}
              <button
                onClick={proceedToCheckout}
                className="w-full btn-primary py-3 font-semibold"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {isAuthenticated ? 'Proceder al pago' : 'Iniciar sesión para comprar'}
              </button>
              
              <button
                onClick={closeCart}
                className="w-full btn-secondary py-2"
              >
                Continuar comprando
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// 🛍️ COMPONENTE: Item individual del carrito
const CartItem = ({ item, onUpdateQuantity, onRemove, formatCurrency }) => {
  return (
    <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-3">
      
      {/* Imagen */}
      <img 
        src={item.image}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-lg"
      />
      
      {/* Información */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {item.name}
        </h4>
        <p className="text-xs text-gray-600 mt-1">
          {formatCurrency(item.price)} c/u
        </p>
        
        {/* Opciones seleccionadas */}
        {item.options && (
          <div className="text-xs text-gray-500 mt-1">
            {Object.entries(item.options).map(([key, value]) => (
              key !== 'quantity' && value && (
                <span key={key} className="mr-2">
                  {key}: {value}
                </span>
              )
            ))}
          </div>
        )}
      </div>
      
      {/* Controles */}
      <div className="flex flex-col items-end space-y-2">
        
        {/* Cantidad */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        
        {/* Subtotal y eliminar */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(item.price * item.quantity)}
          </span>
          <button
            onClick={() => onRemove(item.cartId)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;