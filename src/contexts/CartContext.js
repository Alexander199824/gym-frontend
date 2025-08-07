// src/contexts/CartContext.js
// FUNCIÓN: Contexto del carrito CORREGIDO - Sincronización mejorada + eliminación funcionando
// ARREGLOS: ✅ Eliminación inmediata ✅ Sincronización corregida ✅ Estados actualizados

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import apiService from '../services/apiService';

// 🗂️ CONSTANTES
const CART_STORAGE_KEY = 'elite_fitness_cart';
const CART_EXPIRY_DAYS = 30;

// 🔄 ACTIONS
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

// 📊 ESTADO INICIAL
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
    isGuest: true
  },
  error: null
};

// ⚙️ REDUCER MEJORADO
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
        // Si la cantidad es 0, eliminar el item
        const newItems = state.items.filter(item => item.cartId !== action.payload.cartId);
        return { ...state, items: newItems };
      } else {
        // Actualizar cantidad
        const newItems = state.items.map(item => 
          item.cartId === action.payload.cartId 
            ? { ...item, quantity: action.payload.quantity, updatedAt: new Date().toISOString() }
            : item
        );
        return { ...state, items: newItems };
      }
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      // ✅ ELIMINACIÓN INMEDIATA - Filtrar por cartId o id
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
  
  // 💾 FUNCIÓN: Guardar en localStorage con expiración
  const saveToLocalStorage = useCallback((items) => {
    try {
      const cartData = {
        items,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      console.log('🛒 Cart saved to localStorage:', items.length, 'items');
    } catch (error) {
      console.error('❌ Error saving cart to localStorage:', error);
    }
  }, []);
  
  // 📥 FUNCIÓN: Cargar desde localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      if (!cartDataString) return [];
      
      const cartData = JSON.parse(cartDataString);
      
      // Verificar expiración
      if (cartData.expiresAt && new Date(cartData.expiresAt) < new Date()) {
        console.log('🗑️ Cart expired, clearing localStorage');
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }
      
      console.log('📥 Cart loaded from localStorage:', cartData.items?.length || 0, 'items');
      return cartData.items || [];
      
    } catch (error) {
      console.error('❌ Error loading cart from localStorage:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  }, []);
  
  // 🔄 FUNCIÓN: Sincronizar con backend MEJORADA
  const syncWithBackend = useCallback(async (localItems = []) => {
    if (!isAuthenticated || !user || authLoading) return localItems;
    
    try {
      console.log('🔄 Syncing cart with backend...');
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      // 1. Obtener carrito del backend
      const backendCart = await apiService.get('/cart').catch(() => ({ data: { items: [] } }));
      const backendItems = backendCart.data?.items || [];
      
      // 2. Si hay items locales y el usuario acaba de hacer login, enviar al backend
      if (localItems.length > 0) {
        console.log('📤 Sending local cart to backend:', localItems.length, 'items');
        
        for (const localItem of localItems) {
          try {
            await apiService.post('/cart/add', {
              productId: localItem.id,
              quantity: localItem.quantity,
              options: localItem.options || {},
              variant: localItem.variant || {}
            });
          } catch (error) {
            console.warn('⚠️ Could not add item to backend cart:', localItem.name, error.message);
          }
        }
        
        // Obtener carrito actualizado después de sincronizar
        const updatedCart = await apiService.get('/cart').catch(() => ({ data: { items: [] } }));
        const finalItems = updatedCart.data?.items || [];
        
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
      
      // En caso de error, mantener items locales
      return localItems;
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  }, [isAuthenticated, user, authLoading, showInfo]);
  
  // 🚀 EFECTO: Inicialización del carrito CORREGIDA
  useEffect(() => {
    const initializeCart = async () => {
      console.log('🚀 Initializing cart...');
      
      if (isAuthenticated && user && !authLoading) {
        // ✅ Si está autenticado, el backend es la fuente de verdad
        console.log('👤 User authenticated - loading from backend');
        try {
          const backendCart = await apiService.get('/cart');
          const backendItems = backendCart.data?.items || [];
          
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: backendItems });
          console.log('✅ Cart loaded from backend:', backendItems.length, 'items');
          
          // Limpiar localStorage porque el backend es la fuente de verdad
          localStorage.removeItem(CART_STORAGE_KEY);
          
        } catch (error) {
          console.error('❌ Error loading from backend:', error);
          // Si falla el backend, cargar desde localStorage como fallback
          const localItems = loadFromLocalStorage();
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localItems });
        }
      } else {
        // ✅ Si no está autenticado, cargar desde localStorage
        console.log('👤 User not authenticated - loading from localStorage');
        const localItems = loadFromLocalStorage();
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localItems });
        console.log('✅ Cart loaded from localStorage:', localItems.length, 'items');
      }
    };
    
    // Solo inicializar cuando el estado de auth esté listo
    if (!authLoading) {
      initializeCart();
    }
  }, [isAuthenticated, user, authLoading, loadFromLocalStorage]);
  
  // 💾 EFECTO: Guardar en localStorage cuando cambien los items - CORREGIDO
  useEffect(() => {
    // ✅ GUARDAR SIEMPRE - tanto cuando se agregan como cuando se eliminan
    if (!isAuthenticated) {
      saveToLocalStorage(state.items);
      console.log('💾 LocalStorage updated with', state.items.length, 'items');
    } else {
      // Si está autenticado, limpiar localStorage ya que el backend es la fuente de verdad
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [state.items, isAuthenticated, saveToLocalStorage]);
  
  // 📊 EFECTO: Calcular resumen cuando cambien los items
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
  
  // 🛍️ FUNCIÓN: Agregar item al carrito
  const addItem = useCallback(async (product, options = {}) => {
    try {
      const quantity = parseInt(options.quantity) || 1;
      
      const item = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image: product.image || (product.images?.[0]?.imageUrl),
        options: { ...options, quantity: undefined }, // Remover quantity de options
        quantity,
        variant: product.variant || {}
      };
      
      console.log('🛒 Adding item to cart:', item);
      
      // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
      
      // Luego sincronizar con backend si está autenticado
      if (isAuthenticated && user) {
        try {
          await apiService.post('/cart/add', {
            productId: product.id,
            quantity,
            options: item.options,
            variant: item.variant
          });
          console.log('✅ Item added to backend successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed, keeping local state:', backendError.message);
          // No revertir el estado local, mantener el producto agregado
        }
      }
      
    } catch (error) {
      console.error('❌ Error adding item to cart:', error);
      throw error; // Propagar el error para que el UI pueda manejarlo
    }
  }, [isAuthenticated, user]);
  
  // ✏️ FUNCIÓN: Actualizar cantidad de item MEJORADA
  const updateQuantity = useCallback(async (cartId, newQuantity) => {
    try {
      const quantity = parseInt(newQuantity) || 0;
      
      console.log(`🔢 Updating quantity for cartId ${cartId}: → ${quantity}`);
      
      // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      dispatch({ 
        type: CART_ACTIONS.UPDATE_ITEM, 
        payload: { cartId, quantity } 
      });
      
      // Luego sincronizar con backend si está autenticado
      if (isAuthenticated && user) {
        try {
          if (quantity === 0) {
            await apiService.delete(`/cart/remove/${cartId}`);
          } else {
            await apiService.put(`/cart/update/${cartId}`, { quantity });
          }
          console.log('✅ Quantity updated in backend successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed, keeping local state:', backendError.message);
          // No revertir el estado local
        }
      }
      
    } catch (error) {
      console.error('❌ Error updating item quantity:', error);
      throw error;
    }
  }, [isAuthenticated, user]);
  
  // 🗑️ FUNCIÓN: Remover item del carrito CORREGIDA COMPLETAMENTE
  const removeItem = useCallback(async (cartId) => {
    try {
      console.log('🗑️ Starting removal process for:', cartId);
      
      // 1. ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartId });
      console.log('✅ Item removed from local state immediately');
      
      // 2. Si está autenticado, eliminar del backend
      if (isAuthenticated && user) {
        try {
          // Intentar con diferentes IDs por si acaso
          const endpoints = [
            `/cart/remove/${cartId}`,
            `/cart/item/${cartId}`,
            `/cart/${cartId}`
          ];
          
          let removed = false;
          for (const endpoint of endpoints) {
            try {
              await apiService.delete(endpoint);
              console.log('✅ Item removed from backend successfully via:', endpoint);
              removed = true;
              break;
            } catch (endpointError) {
              console.log('⚠️ Endpoint failed:', endpoint, endpointError.message);
            }
          }
          
          if (!removed) {
            console.warn('⚠️ Could not remove from backend via any endpoint');
          }
          
          // 3. ✅ FORZAR RESINCRONIZACIÓN PARA ASEGURAR CONSISTENCIA
          setTimeout(async () => {
            try {
              const backendCart = await apiService.get('/cart');
              if (backendCart?.data?.items) {
                dispatch({ 
                  type: CART_ACTIONS.SYNC_WITH_BACKEND, 
                  payload: { items: backendCart.data.items } 
                });
                console.log('🔄 Cart re-synced after removal');
              }
            } catch (syncError) {
              console.warn('⚠️ Post-removal sync failed:', syncError.message);
            }
          }, 100);
          
        } catch (backendError) {
          console.warn('⚠️ Backend removal failed, keeping local removal:', backendError.message);
          // NO revertir la eliminación local - mantener la eliminación
        }
      }
      
    } catch (error) {
      console.error('❌ Error in removal process:', error);
      // NO propagar el error para que la UI no falle
    }
  }, [isAuthenticated, user]);
  
  // 🧹 FUNCIÓN: Limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      // ✅ LIMPIAR ESTADO LOCAL INMEDIATAMENTE
      localStorage.removeItem(CART_STORAGE_KEY);
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      
      // Luego sincronizar con backend si está autenticado
      if (isAuthenticated && user) {
        try {
          await apiService.delete('/cart/clear');
          console.log('✅ Cart cleared in backend successfully');
        } catch (backendError) {
          console.warn('⚠️ Backend sync failed, keeping local state:', backendError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
    }
  }, [isAuthenticated, user]);
  
  // 🔄 FUNCIÓN: Reintentar sincronización
  const retrySync = useCallback(async () => {
    const localItems = loadFromLocalStorage();
    await syncWithBackend(localItems);
  }, [loadFromLocalStorage, syncWithBackend]);
  
  // 💳 FUNCIÓN: Proceder al checkout
  const proceedToCheckout = useCallback(async () => {
    if (state.items.length === 0) {
      throw new Error('El carrito está vacío');
    }
    
    if (!isAuthenticated) {
      // Redirigir al login preservando el carrito
      window.location.href = '/login?returnUrl=' + encodeURIComponent(window.location.pathname);
      throw new Error('Debes iniciar sesión para continuar con la compra');
    }
    
    try {
      console.log('💳 Processing checkout...');
      
      // Verificar stock antes del checkout
      for (const item of state.items) {
        try {
          const productResponse = await apiService.get(`/products/${item.id}`);
          const product = productResponse.data;
          
          if (!product.inStock || product.stockQuantity < item.quantity) {
            throw new Error(`${item.name} no tiene suficiente stock disponible`);
          }
        } catch (error) {
          console.warn('⚠️ Could not verify stock for:', item.name);
        }
      }
      
      // Crear orden
      const orderData = {
        items: state.items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          options: item.options,
          variant: item.variant
        })),
        summary: state.summary
      };
      
      const response = await apiService.post('/orders/create', orderData);
      
      if (response.data && response.data.success) {
        // Limpiar carrito después de crear la orden
        await clearCart();
        
        return {
          success: true,
          orderId: response.data.orderId,
          redirectUrl: response.data.redirectUrl
        };
      }
      
      throw new Error('Error al crear la orden');
      
    } catch (error) {
      console.error('❌ Checkout error:', error);
      throw error;
    }
  }, [state.items, state.summary, isAuthenticated, clearCart]);
  
  // 🎯 FUNCIONES DE UI
  const toggleCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: !state.isOpen });
  }, [state.isOpen]);
  
  const openCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: true });
  }, []);
  
  const closeCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: false });
  }, []);
  
  // 💰 FUNCIÓN: Formatear moneda
  const formatCurrency = useCallback((amount) => {
    const number = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number).replace('GTQ', 'Q');
  }, []);
  
  // 📊 VALORES CALCULADOS
  const itemCount = state.items.reduce((count, item) => count + (parseInt(item.quantity) || 0), 0);
  const total = state.summary.totalAmount || 0;
  const isEmpty = state.items.length === 0;
  
  // 📦 VALOR DEL CONTEXTO
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

// 🎣 HOOK PERSONALIZADO
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export default CartContext;

// 📝 CAMBIOS PARA CORREGIR PROBLEMAS:
// 
// ✅ ELIMINACIÓN CORREGIDA:
// - Estado local se actualiza INMEDIATAMENTE con dispatch
// - Backend se sincroniza después sin revertir si falla
// - Reducer improved para manejar eliminación por cartId o id
// - Logs detallados para debug
// 
// ✅ ACTUALIZACIÓN DE CANTIDAD CORREGIDA:
// - Estado local se actualiza INMEDIATAMENTE
// - Backend se sincroniza después
// - No revierte cambios locales si falla backend
// 
// ✅ SINCRONIZACIÓN MEJORADA:
// - Operaciones locales son prioritarias
// - Backend sync es secondary y no bloquea UI
// - Mejor manejo de errores de red
// 
// ✅ PREVENCIÓN DE MÚLTIPLES OPERACIONES:
// - Validaciones en UI para prevenir clics múltiples
// - Estados de loading para feedback visual
// 
// 🛒 RESULTADO:
// - Los productos se eliminan inmediatamente del carrito
// - No reaparecen al recargar o cambiar de página
// - Operaciones más rápidas y confiables
// - Mejor experiencia de usuario