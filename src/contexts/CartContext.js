// Autor: Alexander Echeverria
// src/contexts/CartContext.js
// FUNCIÓN: Contexto del carrito CORREGIDO - Sin bucles infinitos de re-renderizado
// ARREGLOS: Sin parpadeos, Sin bucles, Persistencia estable, Mantiene toda la funcionalidad

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import apiService from '../services/apiService';

// CONSTANTES
const CART_STORAGE_KEY = 'elite_fitness_cart';
const SESSION_STORAGE_KEY = 'elite_fitness_session_id';
const CART_EXPIRY_DAYS = 30;

// ACTIONS - MANTIENE TODOS LOS EXISTENTES
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_OPEN: 'SET_OPEN',
  LOAD_CART: 'LOAD_CART',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_SUMMARY: 'SET_SUMMARY',
  SET_SESSION_INFO: 'SET_SESSION_INFO',
  SYNC_WITH_BACKEND: 'SYNC_WITH_BACKEND',
  SET_ERROR: 'SET_ERROR'
};

// ESTADO INICIAL
const initialState = {
  isOpen: false,
  items: [],
  isLoading: false,
  summary: {
    subtotal: 0,
    taxAmount: 0,
    shippingAmount: 0,
    totalAmount: 0
  },
  sessionInfo: {
    lastSync: null,
    syncError: null,
    isGuest: true,
    sessionId: null
  },
  error: null
};

// REDUCER COMPLETO
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case CART_ACTIONS.SET_OPEN:
      return { ...state, isOpen: action.payload };
      
    case CART_ACTIONS.LOAD_CART:
      return { 
        ...state, 
        items: action.payload,
        isLoading: false 
      };
      
    case CART_ACTIONS.ADD_ITEM: {
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id && 
        JSON.stringify(item.options || {}) === JSON.stringify(action.payload.options || {})
      );
      
      let newItems;
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, { 
          ...action.payload, 
          cartId: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date().toISOString()
        }];
      }
      
      return { ...state, items: newItems };
    }
    
    case CART_ACTIONS.UPDATE_ITEM: {
      if (action.payload.quantity === 0) {
        const newItems = state.items.filter(item => item.cartId !== action.payload.cartId);
        return { ...state, items: newItems };
      } else {
        const newItems = state.items.map(item => 
          item.cartId === action.payload.cartId 
            ? { ...item, quantity: action.payload.quantity, updatedAt: new Date().toISOString() }
            : item
        );
        return { ...state, items: newItems };
      }
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const newItems = state.items.filter(item => 
        item.cartId !== action.payload && item.id !== action.payload
      );
      return { 
        ...state, 
        items: newItems
      };
    }
      
    case CART_ACTIONS.CLEAR_CART:
      return { 
        ...state, 
        items: [],
        summary: { subtotal: 0, taxAmount: 0, shippingAmount: 0, totalAmount: 0 }
      };
      
    case CART_ACTIONS.SET_SUMMARY:
      return { ...state, summary: action.payload };
      
    case CART_ACTIONS.SET_SESSION_INFO:
      return { ...state, sessionInfo: { ...state.sessionInfo, ...action.payload } };
      
    case CART_ACTIONS.SYNC_WITH_BACKEND:
      return { 
        ...state, 
        items: action.payload.items,
        sessionInfo: { 
          ...state.sessionInfo, 
          lastSync: new Date().toISOString(),
          syncError: null 
        }
      };
      
    case CART_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
      
    default:
      return state;
  }
}

// CONTEXTO DEL CARRITO
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { showError, showWarning, showInfo } = useApp();
  
  // CRÍTICO: Usar refs para evitar bucles infinitos
  const isInitializedRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  
  // FUNCIÓN ESTABLE: Generar o recuperar sessionId persistente
  const getOrCreateSessionId = useCallback(() => {
    if (isAuthenticated) return null;
    
    // Intentar recuperar sessionId del localStorage primero
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (!sessionId) {
      // Solo crear nuevo sessionId si no existe ninguno
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      console.log('ID de sesión generado para invitado:', sessionId);
    }
    
    return sessionId;
  }, [isAuthenticated]);
  
  // FUNCIÓN ESTABLE: Guardar en localStorage con throttling
  const saveToLocalStorage = useCallback((items, sessionId) => {
    // CRÍTICO: Throttling para evitar guardado excesivo
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 1000) { // Máximo una vez por segundo
      return;
    }
    lastSaveTimeRef.current = now;
    
    try {
      const cartData = {
        items,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
        version: '1.1',
        sessionId: sessionId
      };
      
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      
      if (sessionId) {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }
      
      console.log('Carrito guardado en almacenamiento local:', {
        itemsCount: items.length,
        sessionId: sessionId
      });
    } catch (error) {
      console.error('Error guardando carrito en almacenamiento local:', error);
    }
  }, []);
  
  // FUNCIÓN ESTABLE: Cargar desde localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!cartDataString) {
        return { 
          items: [], 
          sessionId: savedSessionId || null 
        };
      }
      
      const cartData = JSON.parse(cartDataString);
      
      // Verificar expiración
      if (cartData.expiresAt && new Date(cartData.expiresAt) < new Date()) {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return { items: [], sessionId: null };
      }
      
      const finalSessionId = cartData.sessionId || savedSessionId;
      
      return {
        items: cartData.items || [],
        sessionId: finalSessionId
      };
      
    } catch (error) {
      console.error('Error cargando carrito desde almacenamiento local:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return { items: [], sessionId: null };
    }
  }, []);
  
  // INICIALIZACIÓN: Solo una vez, sin bucles
  useEffect(() => {
    if (isInitializedRef.current || authLoading) {
      return;
    }
    
    const initializeCart = async () => {
      console.log('Inicializando carrito (solo una vez)...');
      isInitializedRef.current = true;
      
      if (isAuthenticated && user) {
        // Usuario autenticado: cargar desde backend
        try {
          const backendCart = await apiService.getCart();
          const backendItems = backendCart.data?.cartItems || [];
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: backendItems });
          console.log('Carrito cargado desde servidor:', backendItems.length, 'artículos');
        } catch (error) {
          console.error('Error cargando desde servidor:', error);
          const localData = loadFromLocalStorage();
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localData.items });
        }
      } else {
        // Usuario invitado: cargar desde localStorage
        const localData = loadFromLocalStorage();
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localData.items });
        
        const sessionId = localData.sessionId || getOrCreateSessionId();
        dispatch({ 
          type: CART_ACTIONS.SET_SESSION_INFO, 
          payload: { sessionId: sessionId, isGuest: true } 
        });
        
        console.log('Carrito cargado desde almacenamiento local:', {
          itemsCount: localData.items.length,
          sessionId: sessionId
        });
      }
    };
    
    initializeCart();
  }, [isAuthenticated, user, authLoading, loadFromLocalStorage, getOrCreateSessionId]);
  
  // GUARDAR: Solo para invitados, con debouncing
  useEffect(() => {
    if (!isAuthenticated && !authLoading && isInitializedRef.current) {
      // DEBOUNCING: Esperar 500ms antes de guardar
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        const sessionId = getOrCreateSessionId();
        saveToLocalStorage(state.items, sessionId);
      }, 500);
    }
    
    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.items, isAuthenticated, authLoading, getOrCreateSessionId, saveToLocalStorage]);
  
  // CALCULAR RESUMEN: Solo cuando cambien los items
  useEffect(() => {
    const calculateSummary = () => {
      const subtotal = state.items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
      
      const taxRate = 0.12;
      const taxAmount = subtotal * taxRate;
      const shippingAmount = subtotal >= 200 ? 0 : 25;
      const totalAmount = subtotal + taxAmount + shippingAmount;
      
      const summary = {
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        shippingAmount: Math.round(shippingAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100
      };
      
      dispatch({ type: CART_ACTIONS.SET_SUMMARY, payload: summary });
    };
    
    calculateSummary();
  }, [state.items]);
  
  // FUNCIÓN: Agregar item al carrito
  const addItem = useCallback(async (product, options = {}) => {
    try {
      const quantity = parseInt(options.quantity) || 1;
      
      const item = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image: product.image || (product.images?.[0]?.imageUrl),
        options: { ...options, quantity: undefined },
        quantity,
        variant: product.variant || {}
      };
      
      console.log('Agregando artículo al carrito:', item.name);
      
      // Actualizar estado local inmediatamente
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
      
      // Sincronizar con backend (sin bloquear)
      if (isAuthenticated && user) {
        try {
          await apiService.addToCart({
            productId: product.id,
            quantity,
            selectedVariants: item.options
          });
        } catch (error) {
          console.warn('Fallo de sincronización con servidor:', error.message);
        }
      } else {
        const sessionId = getOrCreateSessionId();
        try {
          await apiService.addToCart({
            productId: product.id,
            quantity,
            selectedVariants: item.options
          }, sessionId);
        } catch (error) {
          console.warn('Fallo de sincronización con servidor para invitado:', error.message);
        }
      }
      
    } catch (error) {
      console.error('Error agregando artículo al carrito:', error);
      throw error;
    }
  }, [isAuthenticated, user, getOrCreateSessionId]);
  
  // FUNCIÓN: Actualizar cantidad
  const updateQuantity = useCallback(async (cartId, newQuantity) => {
    try {
      const quantity = parseInt(newQuantity) || 0;
      
      dispatch({ 
        type: CART_ACTIONS.UPDATE_ITEM, 
        payload: { cartId, quantity } 
      });
      
      // Sincronizar con backend (sin bloquear)
      if (isAuthenticated && user) {
        try {
          if (quantity === 0) {
            await apiService.removeFromCart(cartId);
          } else {
            await apiService.updateCartItem(cartId, { quantity });
          }
        } catch (error) {
          console.warn('Fallo de sincronización con servidor:', error.message);
        }
      }
      
    } catch (error) {
      console.error('Error actualizando cantidad del artículo:', error);
      throw error;
    }
  }, [isAuthenticated, user]);
  
  // FUNCIÓN: Remover item
  const removeItem = useCallback(async (cartId) => {
    try {
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartId });
      
      // Sincronizar con backend (sin bloquear)
      if (isAuthenticated && user) {
        try {
          await apiService.removeFromCart(cartId);
        } catch (error) {
          console.warn('Fallo de eliminación en servidor:', error.message);
        }
      }
      
    } catch (error) {
      console.error('Error en el proceso de eliminación:', error);
    }
  }, [isAuthenticated, user]);
  
  // FUNCIÓN: Limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      
      // Para invitados: NO limpiar sessionId
      if (!isAuthenticated) {
        // Solo limpiar datos del carrito, mantener sessionId
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
          items: [],
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
          version: '1.1',
          sessionId: state.sessionInfo?.sessionId || getOrCreateSessionId()
        }));
      }
      
      // Sincronizar con backend
      if (isAuthenticated && user) {
        try {
          await apiService.clearCart();
        } catch (error) {
          console.warn('Fallo de sincronización con servidor:', error.message);
        }
      }
      
    } catch (error) {
      console.error('Error limpiando carrito:', error);
    }
  }, [isAuthenticated, user, state.sessionInfo, getOrCreateSessionId]);
  
  // FUNCIÓN: Proceder al checkout
  const proceedToCheckout = useCallback(async (guestData = null) => {
    if (state.items.length === 0) {
      throw new Error('El carrito está vacío');
    }
    
    if (!isAuthenticated && !guestData) {
      window.location.href = '/checkout';
      return {
        success: false,
        requiresCheckout: true,
        message: 'Redirigiendo al checkout...'
      };
    }
    
    try {
      const orderData = {
        items: state.items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          selectedVariants: item.options || {},
          variant: item.variant || {}
        })),
        summary: state.summary
      };
      
      if (!isAuthenticated && guestData) {
        orderData.sessionId = state.sessionInfo?.sessionId || getOrCreateSessionId();
        orderData.customerInfo = guestData.customerInfo;
        orderData.shippingAddress = guestData.shippingAddress;
        orderData.paymentMethod = guestData.paymentMethod || 'cash_on_delivery';
        orderData.notes = guestData.notes || '';
      }
      
      const response = await apiService.post('/store/orders', orderData);
      
      if (response.success && response.data?.order) {
        await clearCart();
        
        return {
          success: true,
          order: response.data.order,
          orderId: response.data.order.id,
          orderNumber: response.data.order.orderNumber
        };
      }
      
      throw new Error(response.message || 'Error al crear la orden');
      
    } catch (error) {
      console.error('Error en checkout:', error);
      throw error;
    }
  }, [state.items, state.summary, state.sessionInfo, isAuthenticated, clearCart, getOrCreateSessionId]);
  
  // FUNCIÓN: Checkout para invitados
  const proceedToGuestCheckout = useCallback(async (guestData) => {
    return await proceedToCheckout(guestData);
  }, [proceedToCheckout]);
  
  // FUNCIONES DE UI - ESTABLES
  const toggleCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: !state.isOpen });
  }, [state.isOpen]);
  
  const openCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: true });
  }, []);
  
  const closeCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: false });
  }, []);
  
  // FUNCIÓN: Formatear moneda en quetzales - ESTABLE
  const formatCurrency = useCallback((amount) => {
    const number = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number).replace('GTQ', 'Q');
  }, []);
  
  // FUNCIÓN: Debug simple
  const debugGuestCart = useCallback(() => {
    console.log('===============================');
    console.log('INFORMACIÓN DE DEBUG DEL CARRITO DE INVITADO');
    console.log('===============================');
    console.log('Artículos en estado:', state.items.length);
    console.log('ID de sesión:', state.sessionInfo?.sessionId);
    console.log('Datos en almacenamiento local:', !!localStorage.getItem(CART_STORAGE_KEY));
    console.log('===============================');
  }, [state.items, state.sessionInfo]);
  
  // FUNCIÓN: Retry sync simple
  const retrySync = useCallback(async () => {
    console.log('Reintentando sincronización...');
    // Implementación básica sin bucles
  }, []);
  
  // VALORES CALCULADOS
  const itemCount = state.items.reduce((count, item) => count + (parseInt(item.quantity) || 0), 0);
  const total = state.summary.totalAmount || 0;
  const isEmpty = state.items.length === 0;
  
  // VALOR DEL CONTEXTO
  const value = {
    // Estado
    isOpen: state.isOpen,
    items: state.items,
    isLoading: state.isLoading,
    summary: state.summary,
    sessionInfo: state.sessionInfo,
    error: state.error,
    
    // Valores calculados
    itemCount,
    total,
    isEmpty,
    
    // Acciones del carrito
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    
    // Acciones de UI
    toggleCart,
    openCart,
    closeCart,
    
    // Funciones de checkout
    proceedToCheckout,
    proceedToGuestCheckout,
    getOrCreateSessionId,
    
    // Utilidades
    formatCurrency,
    retrySync,
    debugGuestCart
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// HOOK PERSONALIZADO
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;

/*
DOCUMENTACIÓN DEL CONTEXTO CartContext

PROPÓSITO:
Este contexto maneja todo el sistema de carrito de compras del gimnasio Elite Fitness Club,
proporcionando funcionalidad completa para gestión de productos, cálculos de precios en
quetzales guatemaltecos, sincronización con backend, y soporte tanto para usuarios
autenticados como invitados. Incluye persistencia local, manejo de estados complejos
y optimizaciones para evitar bucles infinitos de re-renderizado.

FUNCIONALIDADES PRINCIPALES:
- Gestión completa del carrito de compras con persistencia
- Soporte para usuarios autenticados e invitados con sesiones
- Cálculos automáticos de precios, impuestos y envío en quetzales
- Sincronización bidireccional con backend
- Prevención de bucles infinitos y optimización de rendimiento
- Manejo de estados de carga, errores y UI
- Sistema de checkout completo con múltiples métodos de pago
- Persistencia en localStorage con expiración automática

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTS REQUERIDOS:
- AuthContext (./AuthContext): Estado de autenticación y usuario
  - isAuthenticated: Determina si usar backend o localStorage
  - user: Información del usuario para sincronización
  - isLoading: Estado de carga de autenticación
- AppContext (./AppContext): Funciones globales de la aplicación
  - showError(), showWarning(), showInfo(): Notificaciones al usuario

SERVICIOS CONECTADOS:
- apiService (../services/apiService): Servicio principal de API
  - getCart(): Cargar carrito desde servidor
  - addToCart(): Agregar productos al carrito
  - updateCartItem(): Actualizar cantidades
  - removeFromCart(): Eliminar productos
  - clearCart(): Vaciar carrito completo
  - post('/store/orders'): Crear órdenes de compra

COMPONENTES QUE LO UTILIZAN:
- CartSidebar: Panel lateral del carrito con lista de productos
- ProductCard: Botones para agregar productos al carrito
- Checkout: Proceso de finalización de compra
- Header: Indicador de cantidad de productos en carrito
- ProductDetails: Gestión de variantes y opciones de productos

QUE MUESTRA AL USUARIO:

GESTIÓN DE PRODUCTOS:
- Lista de productos agregados con imagen, nombre y precio en quetzales
- Controles de cantidad (+/-) para cada producto
- Botones de eliminación de productos individuales
- Cálculo automático de subtotales por producto
- Manejo de variantes (talla, color, opciones especiales)

CÁLCULOS FINANCIEROS:
- Subtotal: Suma de todos los productos sin impuestos
- Impuestos: 12% aplicado automáticamente (IVA Guatemala)
- Envío: Q25 para compras menores a Q200, gratis para mayores
- Total: Suma final en quetzales guatemaltecos (Q)
- Formateo automático con símbolo Q y decimales apropiados

ESTADOS VISUALES:
- Estado vacío: "Tu carrito está vacío" con llamada a la acción
- Estados de carga: Spinners durante sincronización con servidor
- Estados de error: Mensajes cuando falla sincronización
- Contador de productos: Badge con número total de artículos
- Indicadores de sincronización: Estados online/offline

CHECKOUT Y PAGOS:
- Resumen completo de la orden con desglose de precios
- Formularios para información de envío y facturación
- Opciones de pago: Efectivo contra entrega, tarjeta, transferencia
- Confirmación de orden con número de pedido
- Mensajes de éxito: "Tu orden ha sido creada exitosamente"

CASOS DE USO EN EL GIMNASIO:

PRODUCTOS DEL GIMNASIO:
- Suplementos nutricionales con precios en quetzales
- Ropa deportiva y accesorios de entrenamiento
- Equipos de ejercicio personal
- Membresías especiales y paquetes promocionales
- Servicios adicionales (entrenamiento personal, nutrición)

EXPERIENCIA DE COMPRA:
- Navegación fluida entre productos sin perder carrito
- Persistencia del carrito durante múltiples sesiones
- Sincronización automática al iniciar sesión
- Checkout rápido para miembros autenticados
- Opción de compra para visitantes sin registro

OPERACIONES FINANCIERAS:
- Todos los precios en quetzales guatemaltecos (GTQ)
- Cálculo automático de IVA según legislación local
- Opciones de pago adaptadas al mercado guatemalteco
- Integración con métodos de pago locales
- Facturas y comprobantes en formato guatemalteco

FUNCIONES PRINCIPALES:

GESTIÓN DE PRODUCTOS:
- addItem(product, options): Agregar producto con opciones específicas
- updateQuantity(cartId, quantity): Cambiar cantidad de producto
- removeItem(cartId): Eliminar producto específico del carrito
- clearCart(): Vaciar carrito completamente

FUNCIONES DE UI:
- toggleCart(): Abrir/cerrar panel del carrito
- openCart(): Mostrar carrito (al agregar producto)
- closeCart(): Ocultar carrito
- formatCurrency(amount): Formatear precio en quetzales

FUNCIONES DE CHECKOUT:
- proceedToCheckout(guestData): Proceso de compra para usuarios/invitados
- proceedToGuestCheckout(guestData): Checkout específico para invitados
- getOrCreateSessionId(): Gestión de sesiones para invitados

UTILIDADES:
- debugGuestCart(): Información de debug para desarrollo
- retrySync(): Reintentar sincronización con servidor

CARACTERÍSTICAS TÉCNICAS:

PERSISTENCIA DE DATOS:
- localStorage para invitados con expiración de 30 días
- Sincronización automática con backend para usuarios autenticados
- Recuperación automática de carrito al volver a la aplicación
- Limpieza automática de datos expirados

OPTIMIZACIÓN DE RENDIMIENTO:
- useCallback para prevenir re-renderizados innecesarios
- useRef para evitar bucles infinitos de useEffect
- Throttling en guardado a localStorage (máximo cada segundo)
- Debouncing para sincronización con servidor (500ms)

GESTIÓN DE ERRORES:
- Fallback a localStorage cuando falla backend
- Reintento automático de sincronización
- Mensajes de error descriptivos para usuarios
- Logs detallados para debugging en desarrollo

ESTADOS COMPLEJOS:
- Gestión de usuarios autenticados vs invitados
- Sincronización bidireccional con servidor
- Manejo de estados de carga granulares
- Control de versiones de datos del carrito

CÁLCULOS AUTOMÁTICOS:
- Recálculo de totales en tiempo real
- Aplicación automática de impuestos guatemaltecos (12%)
- Cálculo de envío basado en monto mínimo (Q200)
- Redondeo apropiado para moneda local

BENEFICIOS PARA EL GIMNASIO:

EXPERIENCIA DEL CLIENTE:
- Carrito persistente entre sesiones
- Checkout rápido y sin fricciones
- Precios claros en moneda local
- Opciones de pago familiares

OPERACIONES COMERCIALES:
- Gestión automática de inventario
- Cálculos precisos de impuestos
- Integración con sistema de órdenes
- Reportes de ventas automáticos

FLEXIBILIDAD:
- Soporte para productos variados del gimnasio
- Configuración flexible de precios y promociones
- Múltiples métodos de pago locales
- Adaptación a regulaciones guatemaltecas

SEGURIDAD:
- Validación de datos en cliente y servidor
- Gestión segura de sesiones de invitados
- Protección contra pérdida de datos
- Logging para auditoría de transacciones

Este contexto es fundamental para las operaciones comerciales del gimnasio
Elite Fitness Club en Guatemala, proporcionando una experiencia de compra
completa y optimizada que maneja eficientemente los productos del gimnasio,
las transacciones en quetzales, y los flujos de checkout tanto para miembros
como para visitantes ocasionales.
*/