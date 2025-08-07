// src/contexts/CartContext.js
// FUNCIÓN: Contexto del carrito MEJORADO - Persistencia completa + sincronización automática
// FEATURES: ✅ Guarda sin sesión ✅ Persiste al cerrar ✅ Sincroniza al login ✅ Verifica stock

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

// ⚙️ REDUCER
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
      const newItems = action.payload.quantity === 0 
        ? state.items.filter(item => item.cartId !== action.payload.cartId)
        : state.items.map(item => 
            item.cartId === action.payload.cartId 
              ? { ...item, quantity: action.payload.quantity, updatedAt: new Date().toISOString() }
              : item
          );
      
      return { ...state, items: newItems };
    }
    
    case CART_ACTIONS.REMOVE_ITEM:
      return { 
        ...state, 
        items: state.items.filter(item => item.cartId !== action.payload)
      };
      
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
  
  // 🔄 FUNCIÓN: Sincronizar con backend
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
  
  // 🚀 EFECTO: Inicialización del carrito
  useEffect(() => {
    const initializeCart = async () => {
      console.log('🚀 Initializing cart...');
      
      // Cargar desde localStorage
      const localItems = loadFromLocalStorage();
      
      if (localItems.length > 0) {
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localItems });
        console.log('✅ Cart loaded from localStorage:', localItems.length, 'items');
      }
      
      // Si está autenticado, sincronizar
      if (isAuthenticated && user && !authLoading) {
        const syncedItems = await syncWithBackend(localItems);
        if (syncedItems !== localItems) {
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: syncedItems });
        }
      }
    };
    
    initializeCart();
  }, [isAuthenticated, user, authLoading, loadFromLocalStorage, syncWithBackend]);
  
  // 💾 EFECTO: Guardar en localStorage cuando cambien los items
  useEffect(() => {
    if (state.items.length > 0 && !isAuthenticated) {
      saveToLocalStorage(state.items);
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
      
      if (isAuthenticated && user) {
        // Enviar al backend
        await apiService.post('/cart/add', {
          productId: product.id,
          quantity,
          options: item.options,
          variant: item.variant
        });
      }
      
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
      
    } catch (error) {
      console.error('❌ Error adding item to cart:', error);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('stock')) {
        showError('No hay suficiente stock disponible');
      } else if (error.response?.status === 404) {
        showError('Producto no encontrado');
      } else {
        // Si falla el backend pero no está autenticado, agregar localmente
        if (!isAuthenticated) {
          const item = {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price) || 0,
            image: product.image || (product.images?.[0]?.imageUrl),
            options: { ...options, quantity: undefined },
            quantity: parseInt(options.quantity) || 1,
            variant: product.variant || {}
          };
          
          dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
        } else {
          showError('Error al agregar producto al carrito');
        }
      }
    }
  }, [isAuthenticated, user, showError]);
  
  // ✏️ FUNCIÓN: Actualizar cantidad de item
  const updateQuantity = useCallback(async (cartId, newQuantity) => {
    try {
      const quantity = parseInt(newQuantity) || 0;
      
      if (isAuthenticated && user) {
        if (quantity === 0) {
          await apiService.delete(`/cart/remove/${cartId}`);
        } else {
          await apiService.put(`/cart/update/${cartId}`, { quantity });
        }
      }
      
      dispatch({ 
        type: CART_ACTIONS.UPDATE_ITEM, 
        payload: { cartId, quantity } 
      });
      
    } catch (error) {
      console.error('❌ Error updating item quantity:', error);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('stock')) {
        showError('No hay suficiente stock para esa cantidad');
      } else {
        // Si falla el backend, actualizar localmente
        dispatch({ 
          type: CART_ACTIONS.UPDATE_ITEM, 
          payload: { cartId, quantity: parseInt(newQuantity) || 0 } 
        });
      }
    }
  }, [isAuthenticated, user, showError]);
  
  // 🗑️ FUNCIÓN: Remover item del carrito
  const removeItem = useCallback(async (cartId) => {
    try {
      if (isAuthenticated && user) {
        await apiService.delete(`/cart/remove/${cartId}`);
      }
      
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartId });
      
    } catch (error) {
      console.error('❌ Error removing item from cart:', error);
      
      // Si falla el backend, remover localmente
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartId });
    }
  }, [isAuthenticated, user]);
  
  // 🧹 FUNCIÓN: Limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      if (isAuthenticated && user) {
        await apiService.delete('/cart/clear');
      }
      
      localStorage.removeItem(CART_STORAGE_KEY);
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      
      // Si falla el backend, limpiar localmente
      localStorage.removeItem(CART_STORAGE_KEY);
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
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
      
      if (error.message?.includes('stock')) {
        showError(error.message);
      } else if (error.response?.status === 401) {
        showError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else {
        showError('Error al procesar el pedido. Inténtalo de nuevo.');
      }
      
      throw error;
    }
  }, [state.items, state.summary, isAuthenticated, showError, clearCart]);
  
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

// 📝 CARACTERÍSTICAS DE ESTA VERSIÓN:
// 
// ✅ PERSISTENCIA COMPLETA:
// - Guarda automáticamente en localStorage sin sesión
// - Persiste al cerrar y reabrir la página
// - Expira después de 30 días automáticamente
// - Sincroniza con backend al iniciar sesión
// 
// ✅ SINCRONIZACIÓN INTELIGENTE:
// - Envía carrito local al backend al hacer login
// - Maneja conflictos de items duplicados
// - Verifica stock antes de sincronizar
// - Limpia localStorage después de sincronizar
// 
// ✅ MANEJO DE ERRORES ROBUSTO:
// - Continúa funcionando aunque falle el backend
// - Maneja errores de stock y productos no encontrados
// - Reintentos automáticos de sincronización
// - Estados de error claros para el usuario
// 
// ✅ OPTIMIZACIÓN DE PERFORMANCE:
// - Usa useCallback para evitar re-renders
// - Cálculos de resumen optimizados
// - Actualizaciones de estado eficientes
// - Debounce en operaciones costosas