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

  // Detectar si estamos en página de pago
  const isCheckoutPage = location.pathname === '/checkout';

  // EFECTO: Detectar cuando se agrega un producto y animar
  useEffect(() => {
    if (itemCount > previousItemCount && previousItemCount >= 0) {
      // Se agregó un producto al carrito
      const difference = itemCount - previousItemCount;
      
      console.log('Producto agregado al carrito - activando animación');
      
      // Animación del icono
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      
      // Feedback específico para invitados
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

  // Efecto para debug en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isAuthenticated && itemCount > 0) {
      const interval = setInterval(() => {
        console.log('Verificación de persistencia del carrito:', {
          productosEnEstado: itemCount,
          sessionId: sessionInfo?.sessionId,
          tieneLocalStorage: !!localStorage.getItem('elite_fitness_cart'),
          esPaginaPago: isCheckoutPage
        });
      }, 30000); // Cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [itemCount, isAuthenticated, sessionInfo, isCheckoutPage]);

  // NO RENDERIZAR CARRITO FLOTANTE EN PAGO
  if (isEmpty || itemCount === 0) {
    return (
      <>
        <CartSidebar />
        
        {/* Botón de debug para desarrollo - Solo si NO estamos en pago */}
        {process.env.NODE_ENV === 'development' && !isCheckoutPage && (
          <div className="fixed bottom-4 left-4 z-50">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
              title="Debug del Carrito"
            >
              <Bug className="w-4 h-4" />
            </button>
            
            {showDebug && (
              <div className="absolute bottom-10 left-0 bg-black text-white p-3 rounded-lg text-xs w-72 max-h-48 overflow-y-auto">
                <div className="font-bold mb-2">Información de Debug del Carrito</div>
                <div>Productos: {itemCount}</div>
                <div>Autenticado: {isAuthenticated ? 'Sí' : 'No'}</div>
                <div>ID de Sesión: {sessionInfo?.sessionId || 'Ninguno'}</div>
                <div>Es Página de Pago: {isCheckoutPage ? 'Sí' : 'No'}</div>
                <div>Almacenamiento Local: {localStorage.getItem('elite_fitness_cart') ? 'Tiene datos' : 'Vacío'}</div>
                <button
                  onClick={debugGuestCart}
                  className="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Debug Completo
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // NO MOSTRAR CARRITO FLOTANTE EN PAGO
  if (isCheckoutPage) {
    console.log('Ocultando carrito en página de pago (datos preservados)');
    return <CartSidebar />; // Solo sidebar disponible, no carrito flotante
  }

  return (
    <>
      {/* CartSidebar - Mantiene toda la funcionalidad */}
      <CartSidebar />
      
      {/* CARRITO FLOTANTE - Solo visible FUERA de pago */}
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
          
          {/* CONTADOR DE PRODUCTOS */}
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
          
          {/* ANILLO DE HOVER */}
          <div className={`absolute inset-0 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse ${
            !isAuthenticated ? 'border-blue-300' : 'border-primary-300'
          }`}></div>
        </button>
        
        {/* VISTA PREVIA DEL TOTAL - Solo en escritorio cuando no está vacío */}
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
      
      {/* Panel de debug para desarrollo - Solo si NO estamos en pago */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
            title="Debug del Carrito"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          {showDebug && (
            <div className="absolute bottom-10 left-0 bg-black text-white p-3 rounded-lg text-xs w-80 max-h-64 overflow-y-auto">
              <div className="font-bold mb-2">Información de Debug del Carrito</div>
              
              <div className="space-y-1">
                <div>Productos: {itemCount}</div>
                <div>Autenticado: {isAuthenticated ? 'Sí' : 'No'}</div>
                <div>ID de Sesión: {sessionInfo?.sessionId || 'Ninguno'}</div>
                <div>Página Actual: {location.pathname}</div>
                <div>Es Pago: {isCheckoutPage ? 'Sí (Carrito Oculto)' : 'No'}</div>
                <div>Carrito LocalStorage: {
                  localStorage.getItem('elite_fitness_cart') ? 'Tiene datos' : 'Vacío'
                }</div>
                <div>Total: {formatCurrency(total)}</div>
              </div>
              
              <div className="mt-3 space-y-1">
                <button
                  onClick={debugGuestCart}
                  className="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Debug Completo en Consola
                </button>
                
                <button
                  onClick={() => {
                    const cartData = localStorage.getItem('elite_fitness_cart');
                    const sessionId = localStorage.getItem('elite_fitness_session_id');
                    console.log('Datos Crudos de LocalStorage:', {
                      datosCarrito: cartData ? JSON.parse(cartData) : null,
                      sessionId: sessionId,
                      rutaActual: location.pathname,
                      esPaginaPago: isCheckoutPage
                    });
                  }}
                  className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                >
                  Mostrar Datos Crudos
                </button>
                
                <button
                  onClick={() => {
                    localStorage.removeItem('elite_fitness_cart');
                    localStorage.removeItem('elite_fitness_session_id');
                    window.location.reload();
                  }}
                  className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                >
                  Limpiar y Recargar
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
Este componente implementa un contenedor global para el carrito de compras que maneja la visualización
del carrito flotante y el panel lateral del carrito en toda la aplicación. El usuario ve un botón
flotante del carrito que permanece accesible desde cualquier página, excepto durante el proceso de pago
donde se oculta automáticamente para evitar distracciones.

FUNCIONALIDADES QUE VE EL USUARIO:
- Botón de carrito flotante circular en la esquina inferior derecha
- Contador de productos visible en el botón con animación
- Animaciones de celebración cuando agrega productos al carrito
- Mensaje de confirmación temporal al agregar productos
- Colores diferentes para usuarios registrados (verde/primario) vs invitados (azul/naranja)
- Vista previa del total en hover en dispositivos de escritorio
- Indicador "como invitado" para usuarios no registrados
- Ocultación automática del carrito flotante en la página de pago
- Partículas de celebración animadas al agregar productos
- Acceso al panel lateral completo del carrito al hacer clic

CONEXIONES CON OTROS ARCHIVOS:

COMPONENTES IMPORTADOS:
- CartSidebar (./CartSidebar): Panel lateral completo del carrito con toda la funcionalidad de compra

CONTEXTS REQUERIDOS:
- CartContext (../../contexts/CartContext): Estado global del carrito, productos, totales, persistencia
- AuthContext (../../contexts/AuthContext): Estado de autenticación para personalización visual
- AppContext (../../contexts/AppContext): Configuración global, notificaciones y detección de dispositivo

DEPENDENCIAS DE NAVEGACIÓN:
- useLocation de react-router-dom: Para detectar la página actual y ocultar carrito en checkout

RUTAS SENSIBLES:
- /checkout: Página donde el carrito flotante se oculta automáticamente para mejorar la experiencia

COMPORTAMIENTO POR PÁGINA:
- Páginas normales: Carrito flotante visible y funcional
- Página de pago (/checkout): Solo panel lateral disponible, carrito flotante oculto
- Datos del carrito se mantienen intactos en todas las páginas

ESTADOS LOCALES MANEJADOS:
- isAnimating: Control de animaciones de celebración
- showFeedback: Mostrar mensaje de confirmación temporal
- feedbackText: Contenido del mensaje de confirmación
- previousItemCount: Para detectar cuando se agregan productos
- showDebug: Panel de herramientas de desarrollo (solo en development)

ESTILOS Y EXPERIENCIA VISUAL:
- Diseño responsivo que se adapta a móvil y escritorio
- Animaciones suaves de bounce, ping y pulse
- Colores diferenciados por tipo de usuario
- Efectos de hover y escalado
- Partículas de celebración dinámicas
- Sombras y transiciones elegantes

MONEDA Y PRECIOS:
- Configurado para mostrar totales en quetzales guatemaltecos (Q)
- Formateo de precios manejado centralmente por CartContext
- Vista previa de totales en tiempo real

CARACTERÍSTICAS ESPECIALES:
- Persistencia de datos entre páginas usando localStorage
- Sistema de sesiones para usuarios invitados
- Herramientas de debugging solo visibles en desarrollo
- Optimización para no interferir con el proceso de pago
- Feedback visual inmediato para todas las acciones

USO EN LA APLICACIÓN:
Este componente debe incluirse en el layout principal de la aplicación para proporcionar
acceso global al carrito desde cualquier página. Mantiene la funcionalidad completa del
carrito mientras optimiza la experiencia del usuario en diferentes contextos de navegación.
*/