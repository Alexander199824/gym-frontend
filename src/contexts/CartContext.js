// src/contexts/CartContext.js
// FUNCIÓN: Contexto del carrito COMPLETO - Con checkout para invitados + todas las funcionalidades existentes
// MANTIENE: ✅ TODA la funcionalidad original ✅ Agregado checkout para invitados ✅ SessionId para guests

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import apiService from '../services/apiService';

// 🗂️ CONSTANTES
const CART_STORAGE_KEY = 'elite_fitness_cart';
const CART_EXPIRY_DAYS = 30;

// 🔄 ACTIONS - MANTIENE TODOS LOS EXISTENTES
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

// 📊 ESTADO INICIAL - MANTIENE TODO LO EXISTENTE
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
    sessionId: null // ✅ NUEVO: Para tracking de invitados
  },
  error: null
};

// ⚙️ REDUCER COMPLETO - MANTIENE TODA LA LÓGICA EXISTENTE
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
      console.log('🗑️ Reducer: Removing item. Before:', state.items.length, 'After:', newItems.length);
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

// 🛒 CONTEXTO DEL CARRITO
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { showError, showWarning, showInfo } = useApp();
  
  // 💾 FUNCIÓN: Guardar en localStorage - MANTIENE FUNCIONALIDAD COMPLETA
  const saveToLocalStorage = useCallback((items) => {
    try {
      const cartData = {
        items,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
        version: '1.0',
        sessionId: state.sessionInfo?.sessionId // ✅ NUEVO: Guardar sessionId
      };
      
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      console.log('🛒 Cart saved to localStorage:', items.length, 'items');
    } catch (error) {
      console.error('❌ Error saving cart to localStorage:', error);
    }
  }, [state.sessionInfo]);
  
  // 📥 FUNCIÓN: Cargar desde localStorage - MANTIENE FUNCIONALIDAD COMPLETA + sessionId
  const loadFromLocalStorage = useCallback(() => {
    try {
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      if (!cartDataString) return { items: [], sessionId: null };
      
      const cartData = JSON.parse(cartDataString);
      
      // Verificar expiración
      if (cartData.expiresAt && new Date(cartData.expiresAt) < new Date()) {
        console.log('🗑️ Cart expired, clearing localStorage');
        localStorage.removeItem(CART_STORAGE_KEY);
        return { items: [], sessionId: null };
      }
      
      console.log('📥 Cart loaded from localStorage:', cartData.items?.length || 0, 'items');
      
      return {
        items: cartData.items || [],
        sessionId: cartData.sessionId || null
      };
      
    } catch (error) {
      console.error('❌ Error loading cart from localStorage:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
      return { items: [], sessionId: null };
    }
  }, []);
  
  // 🔄 FUNCIÓN: Sincronizar con backend - MANTIENE FUNCIONALIDAD COMPLETA
  const syncWithBackend = useCallback(async (localItems = []) => {
    if (!isAuthenticated || !user || authLoading) return localItems;
    
    try {
      console.log('🔄 Syncing cart with backend...');
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const sessionId = getOrCreateSessionId();
      
      // 1. Obtener carrito del backend
      const backendCart = await apiService.getCart(sessionId).catch(() => ({ data: { cartItems: [] } }));
      const backendItems = backendCart.data?.cartItems || [];
      
      // 2. Si hay items locales y el usuario acaba de hacer login, enviar al backend
      if (localItems.length > 0) {
        console.log('📤 Sending local cart to backend:', localItems.length, 'items');
        
        for (const localItem of localItems) {
          try {
            await apiService.addToCart({
              productId: localItem.id,
              quantity: localItem.quantity,
              selectedVariants: localItem.options || {}
            }, sessionId);
          } catch (error) {
            console.warn('⚠️ Could not add item to backend cart:', localItem.name, error.message);
          }
        }
        
        // Obtener carrito actualizado después de sincronizar
        const updatedCart = await apiService.getCart(sessionId).catch(() => ({ data: { cartItems: [] } }));
        const finalItems = updatedCart.data?.cartItems || [];
        
        dispatch({ 
          type: CART_ACTIONS.SYNC_WITH_BACKEND, 
          payload: { items: finalItems } 
        });
        
        // Limpiar localStorage ya que está sincronizado
        localStorage.removeItem(CART_STORAGE_KEY);
        
        if (finalItems.length > 0) {
          showInfo(`Carrito sincronizado: ${finalItems.length} productos`);
        }
        
        return finalItems;
      } else {
        // Solo cargar desde backend
        dispatch({ 
          type: CART_ACTIONS.SYNC_WITH_BACKEND, 
          payload: { items: backendItems } 
        });
        
        return backendItems;
      }
      
    } catch (error) {
      console.error('❌ Error syncing with backend:', error);
      
      dispatch({ 
        type: CART_ACTIONS.SET_SESSION_INFO, 
        payload: { syncError: error.message } 
      });
      
      return localItems;
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  }, [isAuthenticated, user, authLoading, showInfo]);
  
  // ✅ NUEVO: Generar sessionId para invitados
  const getOrCreateSessionId = useCallback(() => {
    if (isAuthenticated) return null;
    
    let sessionId = state.sessionInfo?.sessionId;
    
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch({ 
        type: CART_ACTIONS.SET_SESSION_INFO, 
        payload: { sessionId, isGuest: true } 
      });
      
      console.log('🆔 Generated new session ID for guest:', sessionId);
    }
    
    return sessionId;
  }, [isAuthenticated, state.sessionInfo]);
  
  // 🚀 EFECTO: Inicialización del carrito - MANTIENE LÓGICA COMPLETA + sessionId
  useEffect(() => {
    const initializeCart = async () => {
      console.log('🚀 Initializing cart...');
      
      if (isAuthenticated && user && !authLoading) {
        // ✅ Si está autenticado, el backend es la fuente de verdad
        console.log('👤 User authenticated - loading from backend');
        try {
          const backendCart = await apiService.getCart();
          const backendItems = backendCart.data?.cartItems || [];
          
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: backendItems });
          console.log('✅ Cart loaded from backend:', backendItems.length, 'items');
          
          // Limpiar localStorage porque el backend es la fuente de verdad
          localStorage.removeItem(CART_STORAGE_KEY);
          
        } catch (error) {
          console.error('❌ Error loading from backend:', error);
          // Si falla el backend, cargar desde localStorage como fallback
          const localData = loadFromLocalStorage();
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localData.items });
          
          // Restaurar sessionId si existe
          if (localData.sessionId) {
            dispatch({ 
              type: CART_ACTIONS.SET_SESSION_INFO, 
              payload: { sessionId: localData.sessionId, isGuest: true } 
            });
          }
        }
      } else {
        // ✅ Si no está autenticado, cargar desde localStorage
        console.log('👤 User not authenticated - loading from localStorage');
        const localData = loadFromLocalStorage();
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localData.items });
        
        // Restaurar sessionId o crear uno nuevo
        if (localData.sessionId) {
          dispatch({ 
            type: CART_ACTIONS.SET_SESSION_INFO, 
            payload: { sessionId: localData.sessionId, isGuest: true } 
          });
          console.log('✅ Restored session ID:', localData.sessionId);
        } else {
          // Crear sessionId inmediatamente para invitados
          const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          dispatch({ 
            type: CART_ACTIONS.SET_SESSION_INFO, 
            payload: { sessionId: newSessionId, isGuest: true } 
          });
          console.log('🆔 Created new session ID for guest:', newSessionId);
        }
        
        console.log('✅ Cart loaded from localStorage:', localData.items.length, 'items');
      }
    };
    
    // Solo inicializar cuando el estado de auth esté listo
    if (!authLoading) {
      initializeCart();
    }
  }, [isAuthenticated, user, authLoading, loadFromLocalStorage]);
  
  // 💾 EFECTO: Guardar en localStorage - MANTIENE LÓGICA COMPLETA
  useEffect(() => {
    if (!isAuthenticated) {
      saveToLocalStorage(state.items);
      console.log('💾 LocalStorage updated with', state.items.length, 'items');
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [state.items, isAuthenticated, saveToLocalStorage]);
  
  // 📊 EFECTO: Calcular resumen - MANTIENE LÓGICA COMPLETA
  useEffect(() => {
    const calculateSummary = () => {
      const subtotal = state.items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
      
      const taxRate = 0.12; // 12% IVA
      const taxAmount = subtotal * taxRate;
      const shippingAmount = subtotal >= 200 ? 0 : 25; // Envío gratis +Q200
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
  
  // 🛍️ FUNCIÓN: Agregar item al carrito - MANTIENE FUNCIONALIDAD COMPLETA + sessionId
  const addItem = useCallback(async (product, options = {}) => {
    try {
      const quantity = parseInt(options.quantity) || 1;
      const sessionId = getOrCreateSessionId();
      
      const item = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image: product.image || (product.images?.[0]?.imageUrl),
        options: { ...options, quantity: undefined },
        quantity,
        variant: product.variant || {}
      };
      
      console.log('🛒 Adding item to cart:', item);
      console.log('🆔 Using session ID:', sessionId);
      
      // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
      
      // Luego sincronizar con backend
      if (isAuthenticated && user) {
        try {
          await apiService.addToCart({
            productId: product.id,
            quantity,
            selectedVariants: item.options
          });
          console.log('✅ Item added to backend successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed, keeping local state:', backendError.message);
        }
      } else if (sessionId) {
        // Para invitados, también intentar sincronizar con backend usando sessionId
        try {
          await apiService.addToCart({
            productId: product.id,
            quantity,
            selectedVariants: item.options
          }, sessionId);
          console.log('✅ Item added to backend for guest successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed for guest, keeping local state:', backendError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error adding item to cart:', error);
      throw error;
    }
  }, [isAuthenticated, user, getOrCreateSessionId]);
  
  // ✏️ FUNCIÓN: Actualizar cantidad - MANTIENE FUNCIONALIDAD COMPLETA + sessionId
  const updateQuantity = useCallback(async (cartId, newQuantity) => {
    try {
      const quantity = parseInt(newQuantity) || 0;
      const sessionId = getOrCreateSessionId();
      
      console.log(`🔢 Updating quantity for cartId ${cartId}: → ${quantity}`);
      
      // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      dispatch({ 
        type: CART_ACTIONS.UPDATE_ITEM, 
        payload: { cartId, quantity } 
      });
      
      // Luego sincronizar con backend
      if (isAuthenticated && user) {
        try {
          if (quantity === 0) {
            await apiService.removeFromCart(cartId);
          } else {
            await apiService.updateCartItem(cartId, { quantity });
          }
          console.log('✅ Quantity updated in backend successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed, keeping local state:', backendError.message);
        }
      } else if (sessionId) {
        try {
          if (quantity === 0) {
            await apiService.removeFromCart(cartId, sessionId);
          } else {
            await apiService.updateCartItem(cartId, { quantity }, sessionId);
          }
          console.log('✅ Quantity updated in backend for guest successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed for guest, keeping local state:', backendError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error updating item quantity:', error);
      throw error;
    }
  }, [isAuthenticated, user, getOrCreateSessionId]);
  
  // 🗑️ FUNCIÓN: Remover item - MANTIENE FUNCIONALIDAD COMPLETA + sessionId
  const removeItem = useCallback(async (cartId) => {
    try {
      const sessionId = getOrCreateSessionId();
      console.log('🗑️ Starting removal process for:', cartId);
      console.log('🆔 Using session ID:', sessionId);
      
      // 1. ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartId });
      console.log('✅ Item removed from local state immediately');
      
      // 2. Si está autenticado, eliminar del backend
      if (isAuthenticated && user) {
        try {
          await apiService.removeFromCart(cartId);
          console.log('✅ Item removed from backend successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend removal failed, keeping local removal:', backendError.message);
        }
      } else if (sessionId) {
        // Para invitados, también eliminar del backend usando sessionId
        try {
          await apiService.removeFromCart(cartId, sessionId);
          console.log('✅ Item removed from backend for guest successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend removal failed for guest, keeping local removal:', backendError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in removal process:', error);
    }
  }, [isAuthenticated, user, getOrCreateSessionId]);
  
  // 🧹 FUNCIÓN: Limpiar carrito - MANTIENE FUNCIONALIDAD COMPLETA + sessionId
  const clearCart = useCallback(async () => {
    try {
      const sessionId = getOrCreateSessionId();
      
      // ✅ LIMPIAR ESTADO LOCAL INMEDIATAMENTE
      localStorage.removeItem(CART_STORAGE_KEY);
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      
      // Luego sincronizar con backend
      if (isAuthenticated && user) {
        try {
          await apiService.clearCart();
          console.log('✅ Cart cleared in backend successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed, keeping local state:', backendError.message);
        }
      } else if (sessionId) {
        try {
          await apiService.clearCart(sessionId);
          console.log('✅ Cart cleared in backend for guest successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed for guest, keeping local state:', backendError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
    }
  }, [isAuthenticated, user, getOrCreateSessionId]);
  
  // 🔄 FUNCIÓN: Reintentar sincronización - MANTIENE FUNCIONALIDAD COMPLETA
  const retrySync = useCallback(async () => {
    const localData = loadFromLocalStorage();
    await syncWithBackend(localData.items);
  }, [loadFromLocalStorage, syncWithBackend]);
  
  // 💳 FUNCIÓN: Proceder al checkout MEJORADA - Soporte para invitados
  const proceedToCheckout = useCallback(async (guestData = null) => {
    if (state.items.length === 0) {
      throw new Error('El carrito está vacío');
    }
    
    // ✅ NUEVO: Si no está autenticado, redirigir a checkout en lugar de login
    if (!isAuthenticated && !guestData) {
      // Redirigir a página de checkout para invitados
      window.location.href = '/checkout';
      return {
        success: false,
        requiresCheckout: true,
        message: 'Redirigiendo al checkout...'
      };
    }
    
    try {
      console.log('💳 Processing checkout...');
      console.log('👤 User authenticated:', isAuthenticated);
      console.log('🎫 Guest data provided:', !!guestData);
      
      // Verificar stock antes del checkout
      for (const item of state.items) {
        try {
          const productResponse = await apiService.get(`/store/products/${item.id}`);
          const product = productResponse.data;
          
          if (!product || !product.inStock || product.stockQuantity < item.quantity) {
            throw new Error(`${item.name} no tiene suficiente stock disponible`);
          }
        } catch (error) {
          console.warn('⚠️ Could not verify stock for:', item.name);
        }
      }
      
      // Preparar datos de la orden
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
      
      // ✅ NUEVO: Agregar datos específicos para invitados
      if (!isAuthenticated && guestData) {
        orderData.sessionId = state.sessionInfo?.sessionId || getOrCreateSessionId();
        orderData.customerInfo = guestData.customerInfo;
        orderData.shippingAddress = guestData.shippingAddress;
        orderData.paymentMethod = guestData.paymentMethod || 'cash_on_delivery';
        orderData.deliveryTimeSlot = guestData.deliveryTimeSlot || 'morning';
        orderData.notes = guestData.notes || '';
        
        console.log('🎫 Guest checkout data prepared:', {
          sessionId: orderData.sessionId,
          customerEmail: orderData.customerInfo?.email,
          paymentMethod: orderData.paymentMethod
        });
      }
      
      console.log('📤 Order data to send:', orderData);
      
      // Crear orden usando la ruta correcta del README
      const response = await apiService.post('/store/orders', orderData);
      
      if (response.success && response.data?.order) {
        console.log('✅ Order created successfully:', response.data.order);
        
        // Limpiar carrito después de crear la orden
        await clearCart();
        
        return {
          success: true,
          order: response.data.order,
          orderId: response.data.order.id,
          orderNumber: response.data.order.orderNumber,
          redirectUrl: response.redirectUrl
        };
      }
      
      throw new Error(response.message || 'Error al crear la orden');
      
    } catch (error) {
      console.error('❌ Checkout error:', error);
      throw error;
    }
  }, [state.items, state.summary, state.sessionInfo, isAuthenticated, clearCart, getOrCreateSessionId]);
  
  // ✅ NUEVO: Función específica para checkout de invitados
  const proceedToGuestCheckout = useCallback(async (guestData) => {
    console.log('🎫 Starting guest checkout process...');
    return await proceedToCheckout(guestData);
  }, [proceedToCheckout]);
  
  // 🎯 FUNCIONES DE UI - MANTIENEN FUNCIONALIDAD COMPLETA
  const toggleCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: !state.isOpen });
  }, [state.isOpen]);
  
  const openCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: true });
  }, []);
  
  const closeCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: false });
  }, []);
  
  // 💰 FUNCIÓN: Formatear moneda - MANTIENE FUNCIONALIDAD COMPLETA
  const formatCurrency = useCallback((amount) => {
    const number = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number).replace('GTQ', 'Q');
  }, []);
  
  // 📊 VALORES CALCULADOS - MANTIENEN LÓGICA COMPLETA
  const itemCount = state.items.reduce((count, item) => count + (parseInt(item.quantity) || 0), 0);
  const total = state.summary.totalAmount || 0;
  const isEmpty = state.items.length === 0;
  
  // 📦 VALOR DEL CONTEXTO - MANTIENE TODO + NUEVAS FUNCIONES
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
    
    // Funciones de checkout MEJORADAS
    proceedToCheckout,
    proceedToGuestCheckout,   // ✅ NUEVO
    getOrCreateSessionId,     // ✅ NUEVO
    
    // Utilidades
    formatCurrency,
    retrySync
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// 🎣 HOOK PERSONALIZADO - MANTIENE FUNCIONALIDAD COMPLETA
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;

// 📝 RESUMEN DE CAMBIOS AGREGADOS SIN PERDER FUNCIONALIDAD:
// 
// ✅ MANTIENE TODO LO EXISTENTE:
// - Toda la lógica de sincronización
// - Toda la lógica de localStorage
// - Todos los métodos del carrito (add, update, remove, clear)
// - Todos los efectos y cálculos
// - Toda la funcionalidad de UI
// - Toda la funcionalidad de autenticados
// 
// ✅ NUEVAS FUNCIONALIDADES AGREGADAS:
// - sessionId para invitados: getOrCreateSessionId()
// - Checkout para invitados: proceedToGuestCheckout()
// - Checkout mejorado: proceedToCheckout() con soporte para invitados
// - SessionId se guarda en localStorage y se sincroniza
// - Soporte para backend con sessionId en todas las operaciones
// 
// ✅ COMPATIBILIDAD COMPLETA:
// - No rompe ninguna funcionalidad existente
// - Los usuarios autenticados siguen funcionando igual
// - Los invitados ahora tienen soporte completo
// - Todas las funciones mantienen su API original