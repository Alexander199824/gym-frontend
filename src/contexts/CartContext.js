// src/contexts/CartContext.js
// FUNCIÓN: Sistema de carrito COMPLETO sin errores + validaciones numéricas
// CORRIGE: TypeError amount.toFixed + manejo robusto de datos

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import apiService from '../services/apiService';

const CartContext = createContext();

const initialState = {
  items: [],
  isLoading: false,
  total: 0,
  itemCount: 0,
  isOpen: false,
  sessionId: null, // Para usuarios no autenticados
  lastSync: null,
  syncError: null,
  summary: {
    itemsCount: 0,
    subtotal: 0,
    taxAmount: 0,
    shippingAmount: 0,
    totalAmount: 0
  }
};

// ✅ HELPER: Validar y convertir a número
const safeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

// ✅ HELPER: Validar y convertir a entero
const safeInteger = (value, defaultValue = 0) => {
  const num = parseInt(value);
  return isNaN(num) ? defaultValue : num;
};

// ✅ HELPER: Formatear moneda de forma segura
const safeCurrencyFormat = (amount) => {
  const numericAmount = safeNumber(amount, 0);
  return `Q${numericAmount.toFixed(2)}`;
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
      
    case 'LOAD_CART_SUCCESS':
      const cartData = action.payload;
      const items = cartData.cartItems || cartData.items || [];
      const summary = cartData.summary || calculateLocalSummary(items);
      
      return {
        ...state,
        items: items.map(item => ({
          cartId: item.id || item.cartId || `${Date.now()}_${Math.random()}`,
          id: item.productId || item.id,
          name: item.product?.name || item.name || 'Producto sin nombre',
          price: safeNumber(item.unitPrice || item.price, 0),
          quantity: safeInteger(item.quantity, 1),
          image: item.product?.images?.[0]?.imageUrl || item.image || '/api/placeholder/80/80',
          options: item.selectedVariants || item.options || {},
          addedAt: item.addedAt || new Date()
        })),
        summary,
        total: safeNumber(summary.totalAmount || summary.subtotal, 0),
        itemCount: safeInteger(summary.itemsCount, 0),
        lastSync: new Date(),
        syncError: null
      };
      
    case 'ADD_ITEM_SUCCESS':
      return {
        ...state,
        lastSync: new Date(),
        syncError: null
      };
      
    case 'UPDATE_ITEM_SUCCESS':
      return {
        ...state,
        lastSync: new Date(),
        syncError: null
      };
      
    case 'REMOVE_ITEM_SUCCESS':
      return {
        ...state,
        lastSync: new Date(),
        syncError: null
      };
      
    case 'CLEAR_CART_SUCCESS':
      return {
        ...initialState,
        sessionId: state.sessionId,
        lastSync: new Date()
      };
      
    case 'SET_SYNC_ERROR':
      return {
        ...state,
        syncError: action.payload,
        isLoading: false
      };
      
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
      
    case 'OPEN_CART':
      return { ...state, isOpen: true };
      
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
      
    // Operaciones locales para fallback
    case 'ADD_ITEM_LOCAL':
      const newItem = action.payload;
      const existingIndex = state.items.findIndex(item => 
        item.id === newItem.id && 
        JSON.stringify(item.options) === JSON.stringify(newItem.options)
      );
      
      let updatedItems;
      if (existingIndex >= 0) {
        updatedItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: safeInteger(item.quantity) + safeInteger(newItem.quantity, 1) }
            : item
        );
      } else {
        updatedItems = [...state.items, {
          ...newItem,
          cartId: `${Date.now()}_${Math.random()}`,
          addedAt: new Date(),
          price: safeNumber(newItem.price, 0),
          quantity: safeInteger(newItem.quantity, 1)
        }];
      }
      
      return calculateLocalTotals({ ...state, items: updatedItems });
      
    case 'UPDATE_ITEM_LOCAL':
      const { cartId, quantity } = action.payload;
      const itemsAfterUpdate = state.items.map(item =>
        item.cartId === cartId ? { ...item, quantity: Math.max(0, safeInteger(quantity)) } : item
      ).filter(item => item.quantity > 0);
      
      return calculateLocalTotals({ ...state, items: itemsAfterUpdate });
      
    case 'REMOVE_ITEM_LOCAL':
      const itemsAfterRemove = state.items.filter(item => item.cartId !== action.payload);
      return calculateLocalTotals({ ...state, items: itemsAfterRemove });
      
    case 'CLEAR_CART_LOCAL':
      return { ...initialState, sessionId: state.sessionId };
      
    default:
      return state;
  }
}

// ✅ Helper para calcular resumen local - SIN ERRORES
function calculateLocalSummary(items) {
  const subtotal = items.reduce((sum, item) => {
    const price = safeNumber(item.unitPrice || item.price, 0);
    const quantity = safeInteger(item.quantity, 0);
    return sum + (price * quantity);
  }, 0);
  
  const taxAmount = subtotal * 0.12; // 12% IVA
  const shippingAmount = 0; // Envío gratis por ahora
  const totalAmount = subtotal + taxAmount + shippingAmount;
  
  return {
    itemsCount: items.reduce((sum, item) => sum + safeInteger(item.quantity, 0), 0),
    subtotal: safeNumber(subtotal),
    taxAmount: safeNumber(taxAmount),
    shippingAmount: safeNumber(shippingAmount),
    totalAmount: safeNumber(totalAmount)
  };
}

// ✅ Helper para calcular totales locales - SIN ERRORES
function calculateLocalTotals(state) {
  const summary = calculateLocalSummary(state.items);
  return {
    ...state,
    summary,
    total: summary.totalAmount,
    itemCount: summary.itemsCount
  };
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showInfo, showWarning, showError } = useApp();
  
  // 🔑 EFECTO: Generar sessionId para usuarios no autenticados
  useEffect(() => {
    if (!isAuthenticated && !state.sessionId) {
      const sessionId = generateSessionId();
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
      console.log('🆔 Generated session ID for guest user:', sessionId);
    }
  }, [isAuthenticated, state.sessionId]);
  
  // 📥 EFECTO: Cargar carrito al iniciar
  useEffect(() => {
    loadCartFromBackend();
  }, [isAuthenticated, user, state.sessionId]);
  
  // 🔄 EFECTO: Sincronizar cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      handleUserAuthentication();
    }
  }, [isAuthenticated, user]);
  
  // 🆔 FUNCIÓN: Generar sessionId único
  const generateSessionId = () => {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // 📥 FUNCIÓN: Cargar carrito desde backend
  const loadCartFromBackend = async () => {
    if ((!isAuthenticated && !state.sessionId) || state.isLoading) {
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('🛒 Loading cart from backend...', { 
        authenticated: isAuthenticated, 
        sessionId: state.sessionId 
      });
      
      const sessionId = !isAuthenticated ? state.sessionId : null;
      const response = await apiService.getCart(sessionId);
      
      if (response.success && response.data) {
        console.log('✅ Cart loaded successfully:', response.data);
        dispatch({ type: 'LOAD_CART_SUCCESS', payload: response.data });
      } else {
        console.log('📭 Empty cart or no cart found');
        dispatch({ type: 'LOAD_CART_SUCCESS', payload: { cartItems: [], summary: calculateLocalSummary([]) } });
      }
      
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      
      // Para errores 404, simplemente inicializar carrito vacío
      if (error.response?.status === 404) {
        console.log('📭 Cart not found, initializing empty cart');
        dispatch({ type: 'LOAD_CART_SUCCESS', payload: { cartItems: [], summary: calculateLocalSummary([]) } });
      } else {
        dispatch({ type: 'SET_SYNC_ERROR', payload: 'Error al cargar carrito' });
        
        // Cargar desde localStorage como fallback
        loadCartFromLocalStorage();
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  // 💾 FUNCIÓN: Cargar carrito desde localStorage (fallback)
  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('elite_fitness_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        console.log('📥 Loaded cart from localStorage as fallback');
        dispatch({ type: 'LOAD_CART_SUCCESS', payload: { cartItems: cartData, summary: calculateLocalSummary(cartData) } });
      }
    } catch (error) {
      console.error('❌ Error loading cart from localStorage:', error);
    }
  };
  
  // 🔄 FUNCIÓN: Manejar autenticación del usuario
  const handleUserAuthentication = async () => {
    try {
      console.log('🔄 User authenticated, syncing cart...');
      
      // Si había items locales antes de autenticarse, intentar fusionar
      if (state.items.length > 0) {
        console.log('🔗 Found local items, merging with backend cart...');
        await mergeCartWithBackend();
      } else {
        // Solo cargar carrito del backend
        await loadCartFromBackend();
      }
      
    } catch (error) {
      console.error('❌ Error handling user authentication:', error);
      showError('Error al sincronizar carrito. Algunos productos pueden no estar guardados.');
    }
  };
  
  // 🔗 FUNCIÓN: Fusionar carrito local con backend
  const mergeCartWithBackend = async () => {
    try {
      console.log('🔗 Merging local cart with backend...');
      
      // Primero, agregar todos los items locales al backend
      for (const item of state.items) {
        try {
          await apiService.addToCart({
            productId: item.id,
            quantity: item.quantity,
            selectedVariants: item.options
          });
          console.log('✅ Merged item:', item.name);
        } catch (error) {
          console.warn('⚠️ Failed to merge item:', item.name, error.message);
        }
      }
      
      // Luego recargar el carrito completo
      await loadCartFromBackend();
      
      showInfo('Carrito sincronizado con tu cuenta');
      
    } catch (error) {
      console.error('❌ Error merging cart:', error);
      showWarning('Algunos productos no se pudieron sincronizar');
    }
  };
  
  // 🛒 FUNCIÓN: Agregar item al carrito - SIN ERRORES
  const addItem = async (product, options = {}) => {
    try {
      console.log('🛒 Adding item to cart:', { product: product.name, options });
      
      const productData = {
        productId: safeInteger(product.id) || product.id,
        quantity: safeInteger(options.quantity, 1),
        selectedVariants: {
          ...options,
          quantity: undefined // Remover quantity de variants
        }
      };
      
      // Si no está autenticado, agregar sessionId
      if (!isAuthenticated && state.sessionId) {
        productData.sessionId = state.sessionId;
      }
      
      // Intentar agregar al backend
      try {
        const response = await apiService.addToCart(productData, !isAuthenticated ? state.sessionId : null);
        
        if (response.success) {
          console.log('✅ Item added to backend cart');
          dispatch({ type: 'ADD_ITEM_SUCCESS' });
          
          // Recargar carrito para obtener datos actualizados
          await loadCartFromBackend();
          
          showSuccess(`${product.name} agregado al carrito`);
          
          // Auto-abrir carrito si es el primer item
          if (state.items.length === 0) {
            setTimeout(() => {
              dispatch({ type: 'OPEN_CART' });
            }, 500);
          }
        }
        
      } catch (error) {
        console.error('❌ Error adding to backend cart, using local fallback:', error);
        
        // Fallback: agregar localmente
        const localItem = {
          id: product.id,
          name: product.name || 'Producto sin nombre',
          price: safeNumber(product.price, 0),
          image: product.image || '/api/placeholder/80/80',
          quantity: safeInteger(options.quantity, 1),
          options: options
        };
        
        dispatch({ type: 'ADD_ITEM_LOCAL', payload: localItem });
        saveCartToLocalStorage();
        
        showSuccess(`${product.name} agregado al carrito (guardado localmente)`);
        showWarning('Conectándose al servidor...');
      }
      
    } catch (error) {
      console.error('❌ Error adding item:', error);
      showError('Error al agregar producto al carrito');
    }
  };
  
  // 🗑️ FUNCIÓN: Remover item del carrito
  const removeItem = async (cartId) => {
    try {
      console.log('🗑️ Removing item from cart:', cartId);
      
      // Encontrar el item para obtener su ID del backend
      const item = state.items.find(i => i.cartId === cartId);
      if (!item) {
        console.warn('⚠️ Item not found locally');
        return;
      }
      
      // Intentar remover del backend
      try {
        const sessionId = !isAuthenticated ? state.sessionId : null;
        await apiService.removeFromCart(cartId, sessionId);
        
        console.log('✅ Item removed from backend cart');
        dispatch({ type: 'REMOVE_ITEM_SUCCESS' });
        
        // Recargar carrito
        await loadCartFromBackend();
        
        showInfo('Producto eliminado del carrito');
        
      } catch (error) {
        console.error('❌ Error removing from backend, using local fallback:', error);
        
        // Fallback: remover localmente
        dispatch({ type: 'REMOVE_ITEM_LOCAL', payload: cartId });
        saveCartToLocalStorage();
        
        showInfo('Producto eliminado del carrito (cambio local)');
      }
      
    } catch (error) {
      console.error('❌ Error removing item:', error);
      showError('Error al eliminar producto del carrito');
    }
  };
  
  // 🔄 FUNCIÓN: Actualizar cantidad
  const updateQuantity = async (cartId, quantity) => {
    const safeQty = safeInteger(quantity, 0);
    
    if (safeQty <= 0) {
      return removeItem(cartId);
    }
    
    try {
      console.log('🔄 Updating item quantity:', { cartId, quantity: safeQty });
      
      // Intentar actualizar en backend
      try {
        const sessionId = !isAuthenticated ? state.sessionId : null;
        await apiService.updateCartItem(cartId, { quantity: safeQty }, sessionId);
        
        console.log('✅ Item quantity updated in backend');
        dispatch({ type: 'UPDATE_ITEM_SUCCESS' });
        
        // Recargar carrito
        await loadCartFromBackend();
        
      } catch (error) {
        console.error('❌ Error updating in backend, using local fallback:', error);
        
        // Fallback: actualizar localmente
        dispatch({ type: 'UPDATE_ITEM_LOCAL', payload: { cartId, quantity: safeQty } });
        saveCartToLocalStorage();
      }
      
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      showError('Error al actualizar cantidad');
    }
  };
  
  // 🧹 FUNCIÓN: Vaciar carrito
  const clearCart = async () => {
    try {
      console.log('🧹 Clearing entire cart...');
      
      // Intentar vaciar en backend
      try {
        const sessionId = !isAuthenticated ? state.sessionId : null;
        await apiService.clearCart(sessionId);
        
        console.log('✅ Cart cleared in backend');
        dispatch({ type: 'CLEAR_CART_SUCCESS' });
        
        showInfo('Carrito vaciado');
        
      } catch (error) {
        console.error('❌ Error clearing backend cart, clearing locally:', error);
        
        // Fallback: limpiar localmente
        dispatch({ type: 'CLEAR_CART_LOCAL' });
        localStorage.removeItem('elite_fitness_cart');
        
        showInfo('Carrito vaciado (cambio local)');
      }
      
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      showError('Error al vaciar carrito');
    }
  };
  
  // 💾 FUNCIÓN: Guardar carrito en localStorage (fallback)
  const saveCartToLocalStorage = () => {
    try {
      const cartData = state.items.map(item => ({
        id: item.id,
        name: item.name,
        price: safeNumber(item.price),
        quantity: safeInteger(item.quantity),
        image: item.image,
        options: item.options,
        addedAt: item.addedAt
      }));
      
      localStorage.setItem('elite_fitness_cart', JSON.stringify(cartData));
      console.log('💾 Cart saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving cart to localStorage:', error);
    }
  };
  
  // 🎯 FUNCIONES DE UI
  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };
  
  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };
  
  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };
  
  // 💳 FUNCIÓN: Proceder al checkout
  const proceedToCheckout = async () => {
    if (state.items.length === 0) {
      showError('Tu carrito está vacío');
      return;
    }
    
    if (!isAuthenticated) {
      // Guardar carrito y redirigir a login
      saveCartToLocalStorage();
      showInfo('Debes iniciar sesión para continuar con la compra');
      setTimeout(() => {
        window.location.href = '/login?redirect=checkout';
      }, 1000);
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const orderData = {
        sessionId: state.sessionId,
        customerInfo: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone || ''
        },
        paymentMethod: 'cash_on_delivery', // Por defecto
        notes: 'Pedido desde la tienda online'
      };
      
      console.log('💳 Creating order...', orderData);
      
      const response = await apiService.createOrder(orderData);
      
      if (response.success) {
        console.log('✅ Order created successfully:', response.data);
        
        // Limpiar carrito después de crear la orden
        dispatch({ type: 'CLEAR_CART_SUCCESS' });
        
        showSuccess('¡Pedido creado exitosamente!');
        
        return {
          success: true,
          order: response.data.order,
          redirectUrl: `/orders/${response.data.order.id}`
        };
      }
      
    } catch (error) {
      console.error('❌ Error in checkout:', error);
      showError('Error al procesar el pedido');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  // 🔄 FUNCIÓN: Reintentar sincronización
  const retrySync = async () => {
    console.log('🔄 Retrying cart synchronization...');
    dispatch({ type: 'SET_SYNC_ERROR', payload: null });
    await loadCartFromBackend();
  };
  
  // 📦 VALOR DEL CONTEXTO
  const contextValue = {
    // Estado
    ...state,
    
    // Funciones principales
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    proceedToCheckout,
    retrySync,
    
    // Estado de sincronización
    isOnline: !state.syncError,
    needsSync: !!state.syncError,
    
    // Utilidades - SIN ERRORES
    formatCurrency: safeCurrencyFormat,
    isEmpty: state.items.length === 0,
    hasItems: state.items.length > 0,
    
    // Métricas
    uniqueItemCount: state.items.length,
    averageItemPrice: state.items.length > 0 ? safeNumber(state.total) / Math.max(1, state.itemCount) : 0,
    
    // Información de sesión
    sessionInfo: {
      sessionId: state.sessionId,
      isAuthenticated,
      lastSync: state.lastSync,
      syncError: state.syncError
    }
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
}