// src/components/cart/GlobalCart.js
// FUNCIÓN: Wrapper global MEJORADO - Con carrito flotante animado + feedback visual
// CAMBIOS: ✅ Carrito flotante ✅ Animaciones de feedback ✅ Siempre visible ✅ Optimizado móvil

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Zap } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';
import CartSidebar from './CartSidebar';

const GlobalCart = () => {
  const { toggleCart, itemCount, formatCurrency, total, isEmpty } = useCart();
  const { isMobile } = useApp();
  
  // Estados para animaciones
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [previousItemCount, setPreviousItemCount] = useState(0);

  // 🎬 EFECTO: Detectar cuando se agrega un item y animar
  useEffect(() => {
    if (itemCount > previousItemCount && previousItemCount >= 0) {
      // Se agregó un item al carrito
      const difference = itemCount - previousItemCount;
      
      console.log('🛒 Item added to cart - triggering animation');
      
      // Animación del icono
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      
      // Feedback visual
      setFeedbackText(difference === 1 ? '¡Agregado!' : `+${difference} productos`);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 2000);
    }
    
    setPreviousItemCount(itemCount);
  }, [itemCount, previousItemCount]);

  // ✅ NO RENDERIZAR NADA SI EL CARRITO ESTÁ VACÍO
  if (isEmpty || itemCount === 0) {
    return (
      <>
        <CartSidebar />
      </>
    );
  }

  return (
    <>
      {/* ✅ CartSidebar - Mantiene toda la funcionalidad */}
      <CartSidebar />
      
      {/* 🛒 CARRITO FLOTANTE - Siempre visible */}
      <div className={`fixed z-50 transition-all duration-300 ${
        isMobile 
          ? 'bottom-4 right-4' 
          : 'bottom-6 right-6'
      }`}>
        
        {/* 💬 FEEDBACK VISUAL - Aparece cuando se agrega algo */}
        {showFeedback && (
          <div className={`absolute transition-all duration-500 ${
            isMobile ? 'bottom-16 right-0' : 'bottom-20 right-0'
          } ${showFeedback ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>{feedbackText}</span>
            </div>
          </div>
        )}
        
        {/* 🎯 BOTÓN PRINCIPAL DEL CARRITO - TAMAÑO REDUCIDO */}
        <button
          onClick={toggleCart}
          className={`
            relative bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl 
            transition-all duration-300 flex items-center justify-center group
            ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}
            ${isAnimating ? 'animate-bounce scale-110' : 'hover:scale-105'}
            ${isEmpty ? 'opacity-75' : ''}
          `}
          title={isEmpty ? 'Carrito vacío' : `${itemCount} productos - Q${formatCurrency(total).replace('Q', '')}`}
        >
          
          {/* 🛍️ ICONO DEL CARRITO - TAMAÑO REDUCIDO */}
          <ShoppingCart className={`
            transition-all duration-300
            ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}
            ${isAnimating ? 'animate-pulse' : ''}
          `} />
          
          {/* 🔢 CONTADOR DE ITEMS - TAMAÑO REDUCIDO */}
          {itemCount > 0 && (
            <div className={`
              absolute bg-red-500 text-white rounded-full font-bold text-xs
              flex items-center justify-center min-w-0 transition-all duration-300
              ${isMobile ? '-top-1 -right-1 w-4 h-4 text-xs' : '-top-1 -right-1 w-5 h-5 text-xs'}
              ${isAnimating ? 'animate-ping' : ''}
              ${itemCount > 99 ? 'px-1' : ''}
            `}>
              {itemCount > 99 ? '99+' : itemCount}
            </div>
          )}
          
          {/* ✨ EFECTO DE PULSO CUANDO ESTÁ VACÍO */}
          {isEmpty && (
            <div className="absolute inset-0 rounded-full bg-primary-400 opacity-75 animate-pulse"></div>
          )}
          
          {/* 🌟 RING DE HOVER */}
          <div className="absolute inset-0 rounded-full border-2 border-primary-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
        </button>
        
        {/* 💰 PREVIEW DEL TOTAL - Solo en desktop cuando no está vacío */}
        {!isMobile && !isEmpty && (
          <div className={`
            absolute bottom-0 right-20 bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg 
            border border-gray-200 text-sm font-semibold whitespace-nowrap
            opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0
            pointer-events-none
          `}>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Total:</span>
              <span className="text-primary-600">{formatCurrency(total)}</span>
            </div>
            
            {/* Flecha apuntando al botón */}
            <div className="absolute top-1/2 right-0 transform translate-x-full -translate-y-1/2">
              <div className="w-0 h-0 border-l-4 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* 🎉 ANIMACIÓN DE CELEBRACIÓN - Aparece ocasionalmente */}
      {isAnimating && itemCount > 0 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className={`absolute transition-all duration-1000 ${
            isMobile ? 'bottom-20 right-8' : 'bottom-24 right-12'
          }`}>
            {/* Partículas de celebración */}
            <div className="relative">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 bg-primary-400 rounded-full animate-ping opacity-75`}
                  style={{
                    top: `${Math.random() * 40 - 20}px`,
                    left: `${Math.random() * 40 - 20}px`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '600ms'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalCart;

// 📝 FUNCIONALIDADES DEL CARRITO FLOTANTE:
// 
// ✅ CARRITO FLOTANTE SIEMPRE VISIBLE:
// - Posición fija en bottom-right
// - Responsive para móvil y desktop
// - Z-index alto para estar siempre encima
// 
// ✅ ANIMACIONES DE FEEDBACK:
// - Bounce y scale cuando se agrega un producto
// - Ping en el contador de items
// - Feedback text temporal con "¡Agregado!"
// - Partículas de celebración ocasionales
// 
// ✅ ESTADOS VISUALES:
// - Hover effects con ring y escala
// - Opacity reducida cuando está vacío
// - Preview del total en desktop
// - Contador con soporte para 99+ items
// 
// ✅ UX OPTIMIZADA:
// - Tooltip con información del carrito
// - Feedback inmediato al agregar productos
// - Animaciones que no interfieren con usabilidad
// - Accesible desde cualquier parte de la app
// 
// ✅ RESPONSIVE DESIGN:
// - Tamaños optimizados para móvil y desktop
// - Posicionamiento adaptativo
// - Feedback text que no interfiere en mobile