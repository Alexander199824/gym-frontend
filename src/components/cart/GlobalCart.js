// src/components/cart/GlobalCart.js
// FUNCIÓN: Wrapper global para el carrito - Se integra con CartSidebar existente
// FEATURES: ✅ Usa CartSidebar existente ✅ Icono flotante opcional ✅ Sin duplicación

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import CartSidebar from './CartSidebar'; // ✅ Usa el CartSidebar existente

const GlobalCart = () => {
  const { itemCount, toggleCart, isEmpty } = useCart();
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      {/* ✅ CartSidebar existente - Se renderiza globalmente */}
      <CartSidebar />
      
      {/* ✅ Icono flotante del carrito (opcional - solo en ciertas páginas) */}
      {!isEmpty && (
        <FloatingCartIcon 
          itemCount={itemCount}
          onClick={toggleCart}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
};

// 🛒 COMPONENTE: Icono flotante del carrito
const FloatingCartIcon = ({ itemCount, onClick, isAuthenticated }) => {
  // Solo mostrar el icono flotante en ciertas rutas
  const currentPath = window.location.pathname;
  const showFloatingCart = ['/store', '/'].includes(currentPath) && !currentPath.includes('/dashboard');
  
  if (!showFloatingCart) return null;
  
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 animate-bounce"
      title="Ver carrito"
      style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default GlobalCart;

// 📝 FUNCIONALIDAD:
// 
// ✅ INTEGRACIÓN PERFECTA:
// - Usa el CartSidebar existente sin modificarlo
// - No duplica funcionalidad, solo la organiza
// - Agrega icono flotante para mejor UX
// 
// ✅ CARACTERÍSTICAS:
// - Icono flotante solo en páginas públicas (/store, /)
// - Animaciones sutiles para atraer atención
// - Contador de items con badge
// - Se oculta cuando el carrito está vacío
// 
// ✅ COMPATIBILIDAD:
// - No interfiere con CartSidebar existente
// - Respeta la funcionalidad original
// - Solo agrega valor sin cambiar lo existente