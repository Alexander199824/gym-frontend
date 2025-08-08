// src/components/cart/GlobalCart.js
// FUNCIÓN: Wrapper global MEJORADO - Con carrito flotante persistente + mejor feedback visual
// MEJORAS: ✅ Mejor feedback para invitados ✅ Indicador de persistencia ✅ Debug visual ✅ Animaciones suaves

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Zap, Wifi, WifiOff, Eye, Bug } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import CartSidebar from './CartSidebar';

const GlobalCart = () => {
  const { 
    toggleCart, 
    itemCount, 
    formatCurrency, 
    total, 
    isEmpty, 
    sessionInfo,
    debugGuestCart // ✅ Nueva función de debug
  } = useCart();
  
  const { isAuthenticated } = useAuth();
  const { isMobile, showSuccess } = useApp();
  
  // Estados para animaciones
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [previousItemCount, setPreviousItemCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  // 🎬 EFECTO: Detectar cuando se agrega un item y animar
  useEffect(() => {
    if (itemCount > previousItemCount && previousItemCount >= 0) {
      // Se agregó un item al carrito
      const difference = itemCount - previousItemCount;
      
      console.log('🛒 Item added to cart - triggering animation');
      
      // Animación del icono
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      
      // ✅ MEJORADO: Feedback específico para invitados
      if (!isAuthenticated) {
        setFeedbackText(difference === 1 ? '¡Agregado como invitado!' : `+${difference} productos (invitado)`);
        showSuccess('Producto agregado al carrito (puedes comprar sin registro)');
      } else {
        setFeedbackText(difference === 1 ? '¡Agregado!' : `+${difference} productos`);
        showSuccess('Producto agregado al carrito');
      }
      
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000); // ✅ Más tiempo visible
    }
    
    setPreviousItemCount(itemCount);
  }, [itemCount, previousItemCount, isAuthenticated, showSuccess]);

  // ✅ NUEVO: Efecto para mostrar info de persistencia en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isAuthenticated && itemCount > 0) {
      const interval = setInterval(() => {
        console.log('🔍 Cart persistence check:', {
          itemsInState: itemCount,
          sessionId: sessionInfo?.sessionId,
          hasLocalStorage: !!localStorage.getItem('elite_fitness_cart'),
          hasSeparateSessionId: !!localStorage.getItem('elite_fitness_session_id')
        });
      }, 30000); // Cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [itemCount, isAuthenticated, sessionInfo]);

  // ✅ NO RENDERIZAR NADA SI EL CARRITO ESTÁ VACÍO
  if (isEmpty || itemCount === 0) {
    return (
      <>
        <CartSidebar />
        
        {/* ✅ NUEVO: Debug button para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
              title="Debug Cart"
            >
              <Bug className="w-4 h-4" />
            </button>
            
            {showDebug && (
              <div className="absolute bottom-10 left-0 bg-black text-white p-3 rounded-lg text-xs w-72 max-h-48 overflow-y-auto">
                <div className="font-bold mb-2">🔍 Cart Debug Info</div>
                <div>Items: {itemCount}</div>
                <div>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
                <div>Session ID: {sessionInfo?.sessionId || 'None'}</div>
                <div>Local Storage: {localStorage.getItem('elite_fitness_cart') ? 'Has data' : 'Empty'}</div>
                <button
                  onClick={debugGuestCart}
                  className="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Full Debug
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* ✅ CartSidebar - Mantiene toda la funcionalidad */}
      <CartSidebar />
      
      {/* 🛒 CARRITO FLOTANTE - Siempre visible CON MEJORAS */}
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
            <div className={`text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap flex items-center space-x-2 ${
              !isAuthenticated ? 'bg-blue-500' : 'bg-green-500'
            }`}>
              <Zap className="w-4 h-4" />
              <span>{feedbackText}</span>
            </div>
          </div>
        )}
        
        {/* ✅ NUEVO: Indicador de persistencia para invitados */}
        {!isAuthenticated && !isEmpty && (
          <div className={`absolute transition-all duration-300 ${
            isMobile ? 'bottom-16 left-0' : 'bottom-20 left-0'
          }`}>
            <div className="bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-lg shadow-lg text-xs flex items-center space-x-1">
              {sessionInfo?.sessionId ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span>Guardado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-orange-500" />
                  <span>Local</span>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* 🎯 BOTÓN PRINCIPAL DEL CARRITO - MEJORADO PARA INVITADOS */}
        <button
          onClick={toggleCart}
          className={`
            relative text-white rounded-full shadow-lg hover:shadow-xl 
            transition-all duration-300 flex items-center justify-center group
            ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}
            ${isAnimating ? 'animate-bounce scale-110' : 'hover:scale-105'}
            ${!isAuthenticated ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary-600 hover:bg-primary-700'}
            ${isEmpty ? 'opacity-75' : ''}
          `}
          title={
            isEmpty 
              ? 'Carrito vacío' 
              : !isAuthenticated 
                ? `${itemCount} productos (como invitado) - Q${formatCurrency(total).replace('Q', '')}`
                : `${itemCount} productos - Q${formatCurrency(total).replace('Q', '')}`
          }
        >
          
          {/* 🛍️ ICONO DEL CARRITO */}
          <ShoppingCart className={`
            transition-all duration-300
            ${isMobile ? 'w-6 h-6' : 'w-7 h-7'}
            ${isAnimating ? 'animate-pulse' : ''}
          `} />
          
          {/* 🔢 CONTADOR DE ITEMS - MEJORADO PARA INVITADOS */}
          {itemCount > 0 && (
            <div className={`
              absolute text-white rounded-full font-bold
              flex items-center justify-center min-w-0 transition-all duration-300
              ${isMobile ? '-top-1 -right-1 w-5 h-5 text-xs' : '-top-2 -right-2 w-6 h-6 text-sm'}
              ${isAnimating ? 'animate-ping' : ''}
              ${itemCount > 99 ? 'px-1' : ''}
              ${!isAuthenticated ? 'bg-orange-500' : 'bg-red-500'}
            `}>
              {itemCount > 99 ? '99+' : itemCount}
            </div>
          )}
          
          {/* ✨ EFECTO DE PULSO CUANDO ESTÁ VACÍO */}
          {isEmpty && (
            <div className={`absolute inset-0 rounded-full opacity-75 animate-pulse ${
              !isAuthenticated ? 'bg-blue-400' : 'bg-primary-400'
            }`}></div>
          )}
          
          {/* 🌟 RING DE HOVER - Color específico para invitados */}
          <div className={`absolute inset-0 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse ${
            !isAuthenticated ? 'border-blue-300' : 'border-primary-300'
          }`}></div>
        </button>
        
        {/* 💰 PREVIEW DEL TOTAL - Solo en desktop cuando no está vacío */}
        {!isMobile && !isEmpty && (
          <div className={`
            absolute bottom-0 right-20 bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg 
            border border-gray-200 text-sm font-semibold whitespace-nowrap
            opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0
            pointer-events-none
          `}>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Total:</span>
                <span className={!isAuthenticated ? 'text-blue-600' : 'text-primary-600'}>
                  {formatCurrency(total)}
                </span>
              </div>
              
              {/* ✅ NUEVO: Indicador específico para invitados */}
              {!isAuthenticated && (
                <div className="text-xs text-blue-600 flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  <span>Como invitado</span>
                </div>
              )}
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
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full animate-ping opacity-75 ${
                    !isAuthenticated 
                      ? i % 2 === 0 ? 'bg-blue-400' : 'bg-orange-400'
                      : i % 2 === 0 ? 'bg-primary-400' : 'bg-green-400'
                  }`}
                  style={{
                    top: `${Math.random() * 40 - 20}px`,
                    left: `${Math.random() * 40 - 20}px`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '800ms'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* ✅ NUEVO: Debug panel para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
            title="Debug Cart"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          {showDebug && (
            <div className="absolute bottom-10 left-0 bg-black text-white p-3 rounded-lg text-xs w-80 max-h-64 overflow-y-auto">
              <div className="font-bold mb-2">🔍 Cart Debug Info</div>
              
              <div className="space-y-1">
                <div>📊 Items: {itemCount}</div>
                <div>👤 Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
                <div>🆔 Session ID: {sessionInfo?.sessionId || 'None'}</div>
                <div>💾 LocalStorage Cart: {
                  localStorage.getItem('elite_fitness_cart') ? 'Has data' : 'Empty'
                }</div>
                <div>🔑 LocalStorage SessionId: {
                  localStorage.getItem('elite_fitness_session_id') || 'None'
                }</div>
                <div>🔄 Last Sync: {sessionInfo?.lastSync || 'Never'}</div>
                <div>❌ Sync Error: {sessionInfo?.syncError || 'None'}</div>
                <div>💰 Total: {formatCurrency(total)}</div>
              </div>
              
              <div className="mt-3 space-y-1">
                <button
                  onClick={debugGuestCart}
                  className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  🔍 Full Debug Console
                </button>
                
                <button
                  onClick={() => {
                    const cartData = localStorage.getItem('elite_fitness_cart');
                    const sessionId = localStorage.getItem('elite_fitness_session_id');
                    console.log('📋 Raw LocalStorage Data:', {
                      cartData: cartData ? JSON.parse(cartData) : null,
                      sessionId: sessionId
                    });
                  }}
                  className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                >
                  📋 Show Raw Data
                </button>
                
                <button
                  onClick={() => {
                    localStorage.removeItem('elite_fitness_cart');
                    localStorage.removeItem('elite_fitness_session_id');
                    window.location.reload();
                  }}
                  className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                >
                  🗑️ Clear & Reload
                </button>
              </div>
            </div>
          )}
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