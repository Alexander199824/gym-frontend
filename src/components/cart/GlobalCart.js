// Autor: Alexander Echeverria
// src/components/cart/GlobalCart.js


import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingCart, Plus, Zap, Eye, Bug } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import CartSidebar from './CartSidebar';

const GlobalCart = () => {
  const location = useLocation();
  
  const { 
    toggleCart, 
    itemCount, 
    formatCurrency, 
    total, 
    isEmpty, 
    sessionInfo,
    debugGuestCart
  } = useCart();
  
  const { isAuthenticated } = useAuth();
  const { isMobile, showSuccess } = useApp();
  
  // Estados para animaciones
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [previousItemCount, setPreviousItemCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  // NUEVO: Detectar si estamos en página de checkout
  const isCheckoutPage = location.pathname === '/checkout';

  // EFECTO: Detectar cuando se agrega un item y animar
  useEffect(() => {
    if (itemCount > previousItemCount && previousItemCount >= 0) {
      // Se agregó un item al carrito
      const difference = itemCount - previousItemCount;
      
      console.log('Item added to cart - triggering animation');
      
      // Animación del icono
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      
      // MEJORADO: Feedback específico para invitados
      if (!isAuthenticated) {
        setFeedbackText(difference === 1 ? 'Agregado como invitado' : `+${difference} productos (invitado)`);
        showSuccess('Producto agregado al carrito (puedes comprar sin registro)');
      } else {
        setFeedbackText(difference === 1 ? 'Agregado' : `+${difference} productos`);
        showSuccess('Producto agregado al carrito');
      }
      
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
    }
    
    setPreviousItemCount(itemCount);
  }, [itemCount, previousItemCount, isAuthenticated, showSuccess]);

  // NUEVO: Efecto para debug en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isAuthenticated && itemCount > 0) {
      const interval = setInterval(() => {
        console.log('Cart persistence check:', {
          itemsInState: itemCount,
          sessionId: sessionInfo?.sessionId,
          hasLocalStorage: !!localStorage.getItem('elite_fitness_cart'),
          isCheckoutPage: isCheckoutPage
        });
      }, 30000); // Cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [itemCount, isAuthenticated, sessionInfo, isCheckoutPage]);

  // CRÍTICO: NO RENDERIZAR CARRITO FLOTANTE EN CHECKOUT
  if (isEmpty || itemCount === 0) {
    return (
      <>
        <CartSidebar />
        
        {/* Debug button para desarrollo - Solo si NO estamos en checkout */}
        {process.env.NODE_ENV === 'development' && !isCheckoutPage && (
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
                <div className="font-bold mb-2">Cart Debug Info</div>
                <div>Items: {itemCount}</div>
                <div>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
                <div>Session ID: {sessionInfo?.sessionId || 'None'}</div>
                <div>Is Checkout Page: {isCheckoutPage ? 'Yes' : 'No'}</div>
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

  // CRÍTICO: NO MOSTRAR CARRITO FLOTANTE EN CHECKOUT
  if (isCheckoutPage) {
    console.log('Hiding cart on checkout page (data preserved)');
    return <CartSidebar />; // Solo sidebar disponible, no carrito flotante
  }

  return (
    <>
      {/* CartSidebar - Mantiene toda la funcionalidad */}
      <CartSidebar />
      
      {/* CARRITO FLOTANTE - Solo visible FUERA de checkout */}
      <div className={`fixed z-50 transition-all duration-300 ${
        isMobile 
          ? 'bottom-4 right-4' 
          : 'bottom-6 right-6'
      }`}>
        
        {/* FEEDBACK VISUAL - Aparece cuando se agrega algo */}
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
        
        {/* BOTÓN PRINCIPAL DEL CARRITO */}
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
          
          {/* ICONO DEL CARRITO */}
          <ShoppingCart className={`
            transition-all duration-300
            ${isMobile ? 'w-6 h-6' : 'w-7 h-7'}
            ${isAnimating ? 'animate-pulse' : ''}
          `} />
          
          {/* CONTADOR DE ITEMS */}
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
          
          {/* EFECTO DE PULSO CUANDO ESTÁ VACÍO */}
          {isEmpty && (
            <div className={`absolute inset-0 rounded-full opacity-75 animate-pulse ${
              !isAuthenticated ? 'bg-blue-400' : 'bg-primary-400'
            }`}></div>
          )}
          
          {/* RING DE HOVER */}
          <div className={`absolute inset-0 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse ${
            !isAuthenticated ? 'border-blue-300' : 'border-primary-300'
          }`}></div>
        </button>
        
        {/* PREVIEW DEL TOTAL - Solo en desktop cuando no está vacío */}
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
              
              {/* Indicador específico para invitados */}
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
      
      {/* ANIMACIÓN DE CELEBRACIÓN - Aparece ocasionalmente */}
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
      
      {/* Debug panel para desarrollo - Solo si NO estamos en checkout */}
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
              <div className="font-bold mb-2">Cart Debug Info</div>
              
              <div className="space-y-1">
                <div>Items: {itemCount}</div>
                <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
                <div>Session ID: {sessionInfo?.sessionId || 'None'}</div>
                <div>Current Page: {location.pathname}</div>
                <div>Is Checkout: {isCheckoutPage ? 'Yes (Cart Hidden)' : 'No'}</div>
                <div>LocalStorage Cart: {
                  localStorage.getItem('elite_fitness_cart') ? 'Has data' : 'Empty'
                }</div>
                <div>Total: {formatCurrency(total)}</div>
              </div>
              
              <div className="mt-3 space-y-1">
                <button
                  onClick={debugGuestCart}
                  className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Full Debug Console
                </button>
                
                <button
                  onClick={() => {
                    const cartData = localStorage.getItem('elite_fitness_cart');
                    const sessionId = localStorage.getItem('elite_fitness_session_id');
                    console.log('Raw LocalStorage Data:', {
                      cartData: cartData ? JSON.parse(cartData) : null,
                      sessionId: sessionId,
                      currentRoute: location.pathname,
                      isCheckoutPage: isCheckoutPage
                    });
                  }}
                  className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                >
                  Show Raw Data
                </button>
                
                <button
                  onClick={() => {
                    localStorage.removeItem('elite_fitness_cart');
                    localStorage.removeItem('elite_fitness_session_id');
                    window.location.reload();
                  }}
                  className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                >
                  Clear & Reload
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

/*
DOCUMENTACIÓN DEL COMPONENTE GlobalCart

PROPÓSITO:
Este componente implementa un wrapper global para el carrito de compras que maneja la visualización
del carrito flotante y el sidebar del carrito en toda la aplicación. Incluye lógica especial para
ocultar el carrito flotante en la página de checkout mientras mantiene los datos persistentes.

FUNCIONALIDADES PRINCIPALES:
- Carrito flotante con animaciones y feedback visual
- Contador de productos con indicadores visuales
- Manejo diferenciado para usuarios autenticados e invitados
- Ocultación automática del carrito flotante en checkout
- Animaciones de celebración al agregar productos
- Sistema de debug para desarrollo
- Preview de totales en hover (desktop)
- Persistencia de datos del carrito entre páginas

CONEXIONES CON OTROS ARCHIVOS:

COMPONENTS IMPORTADOS:
- CartSidebar (./CartSidebar): Componente del sidebar del carrito

CONTEXTS REQUERIDOS:
- CartContext (../../contexts/CartContext): Estado global del carrito
- AuthContext (../../contexts/AuthContext): Estado de autenticación
- AppContext (../../contexts/AppContext): Configuración de la aplicación

DEPENDENCIAS REACT:
- useLocation de react-router-dom: Para detectar la ruta actual

RUTAS SENSIBLES:
- /checkout: Página donde se oculta el carrito flotante

COMPORTAMIENTO POR RUTA:
- Rutas normales: Muestra carrito flotante + sidebar disponible
- Ruta /checkout: Solo sidebar disponible, carrito flotante oculto
- Datos del carrito se preservan en todas las rutas

ESTADOS LOCALES MANEJADOS:
- isAnimating: Control de animaciones al agregar productos
- showFeedback: Mostrar mensaje de confirmación
- feedbackText: Texto del mensaje de feedback
- previousItemCount: Para detectar cambios en cantidad
- showDebug: Panel de debugging en desarrollo

FUNCIONES DE CALLBACK:
- toggleCart: Abre/cierra el sidebar del carrito
- debugGuestCart: Función de debug para desarrollo

ESTILOS Y ANIMACIONES:
- Tailwind CSS para diseño responsivo
- Animaciones de bounce, ping y pulse
- Efectos de hover y transiciones
- Partículas de celebración al agregar productos

MONEDA:
- Configurado para mostrar totales en quetzales (Q)
- Formateo manejado por CartContext

CARACTERÍSTICAS ESPECIALES:
- Indicadores visuales diferentes para usuarios autenticados vs invitados
- Colores azules para invitados, primarios para autenticados
- Sistema de localStorage para persistencia de datos
- Debugging tools solo en modo desarrollo
- Responsivo para móvil y desktop

USO EN LA APLICACIÓN:
Este componente debe estar incluido en el layout principal de la aplicación para
proporcionar acceso global al carrito desde cualquier página.
*/