// src/contexts/CartContext.js
// FUNCIÓN: Sistema de carrito MEJORADO con persistencia y notificaciones

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
  abandonedCart: null, // Para recordatorios
  lastUpdate: null
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => 
        item.id === action.payload.id && 
        JSON.stringify(item.options) === JSON.stringify(action.payload.options)
      );
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.cartId === existingItem.cartId
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
        return calculateTotals({ ...state, items: updatedItems, lastUpdate: new Date() });
      } else {
        const newItem = {
          ...action.payload,
          cartId: Date.now() + Math.random(),
          quantity: action.payload.quantity || 1,
          addedAt: new Date()
        };
        return calculateTotals({ ...state, items: [...state.items, newItem], lastUpdate: new Date() });
      }
      
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.cartId !== action.payload);
      return calculateTotals({ ...state, items: filteredItems, lastUpdate: new Date() });
      
    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item =>
        item.cartId === action.payload.cartId
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      return calculateTotals({ ...state, items: updatedItems, lastUpdate: new Date() });
      
    case 'CLEAR_CART':
      return { ...initialState };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
      
    case 'OPEN_CART':
      return { ...state, isOpen: true };
      
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
      
    case 'LOAD_CART':
      return calculateTotals({ ...state, items: action.payload });
      
    case 'SET_ABANDONED_CART':
      return { ...state, abandonedCart: action.payload };
      
    case 'MERGE_CARTS':
      // Fusionar carrito local con carrito del servidor
      const mergedItems = [...state.items];
      action.payload.forEach(serverItem => {
        const existingIndex = mergedItems.findIndex(item => 
          item.id === serverItem.id && 
          JSON.stringify(item.options) === JSON.stringify(serverItem.options)
        );
        
        if (existingIndex >= 0) {
          mergedItems[existingIndex].quantity += serverItem.quantity;
        } else {
          mergedItems.push({
            ...serverItem,
            cartId: Date.now() + Math.random()
          });
        }
      });
      
      return calculateTotals({ ...state, items: mergedItems });
      
    default:
      return state;
  }
}

function calculateTotals(state) {
  const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    ...state,
    total,
    itemCount
  };
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showInfo, showWarning } = useApp();
  
  // 💾 EFECTO: Cargar carrito al iniciar
  useEffect(() => {
    loadInitialCart();
  }, []);
  
  // 🔄 EFECTO: Manejar cambios de autenticación
  useEffect(() => {
    if (isAuthenticated && user) {
      handleUserLogin();
    }
  }, [isAuthenticated, user]);
  
  // 💾 EFECTO: Guardar carrito cuando cambie
  useEffect(() => {
    if (state.lastUpdate) {
      saveCartToStorage();
      
      if (isAuthenticated && user) {
        // Debounce para evitar demasiadas peticiones
        const timeoutId = setTimeout(() => {
          saveCartToBackend();
        }, 2000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [state.items, state.lastUpdate, isAuthenticated, user]);
  
  // 🔔 EFECTO: Verificar carrito abandonado
  useEffect(() => {
    if (!isAuthenticated && state.items.length > 0) {
      // Guardar como carrito abandonado después de 30 minutos de inactividad
      const timeoutId = setTimeout(() => {
        saveAbandonedCart();
      }, 30 * 60 * 1000); // 30 minutos
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.items, isAuthenticated]);
  
  // 📥 FUNCIONES DE CARGA
  const loadInitialCart = () => {
    try {
      const savedCart = localStorage.getItem('elite_fitness_cart');
      const abandonedCart = localStorage.getItem('elite_fitness_abandoned_cart');
      
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      }
      
      if (abandonedCart) {
        const abandonedData = JSON.parse(abandonedCart);
        dispatch({ type: 'SET_ABANDONED_CART', payload: abandonedData });
      }
    } catch (error) {
      console.error('Error al cargar carrito desde localStorage:', error);
    }
  };
  
  const handleUserLogin = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Cargar carrito del servidor
      const response = await apiService.getCart();
      
      if (response.success && response.data.items) {
        if (state.items.length > 0) {
          // Hay items locales, fusionar carritos
          dispatch({ type: 'MERGE_CARTS', payload: response.data.items });
          showInfo('Hemos fusionado tu carrito local con el carrito de tu cuenta.');
        } else {
          // Solo cargar carrito del servidor
          dispatch({ type: 'LOAD_CART', payload: response.data.items });
        }
      }
      
      // Verificar carrito abandonado
      if (state.abandonedCart) {
        showCartAbandonedNotification();
      }
      
    } catch (error) {
      console.error('Error al cargar carrito desde backend:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  // 💾 FUNCIONES DE GUARDADO
  const saveCartToStorage = () => {
    try {
      localStorage.setItem('elite_fitness_cart', JSON.stringify(state.items));
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  };
  
  const saveCartToBackend = async () => {
    try {
      await apiService.updateCart(state.items);
    } catch (error) {
      console.error('Error al guardar carrito en backend:', error);
    }
  };
  
  const saveAbandonedCart = () => {
    try {
      const abandonedData = {
        items: state.items,
        total: state.total,
        abandonedAt: new Date(),
        sessionId: Date.now().toString()
      };
      
      localStorage.setItem('elite_fitness_abandoned_cart', JSON.stringify(abandonedData));
      dispatch({ type: 'SET_ABANDONED_CART', payload: abandonedData });
    } catch (error) {
      console.error('Error al guardar carrito abandonado:', error);
    }
  };
  
  // 🔔 NOTIFICACIONES
  const showCartAbandonedNotification = () => {
    if (state.abandonedCart && state.abandonedCart.items.length > 0) {
      showWarning(
        `Tienes ${state.abandonedCart.items.length} productos en tu carrito anterior. ¿Quieres restaurarlos?`,
        'Carrito recuperado'
      );
      
      // Auto-restaurar después de 3 segundos si no hay interacción
      setTimeout(() => {
        restoreAbandonedCart();
      }, 3000);
    }
  };
  
  // 🛒 FUNCIONES DEL CARRITO
  const addItem = (product, options = {}) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { ...product, options }
    });
    
    showSuccess(`${product.name} agregado al carrito`);
    
    // Auto-abrir carrito si es el primer item
    if (state.items.length === 0) {
      setTimeout(() => {
        dispatch({ type: 'OPEN_CART' });
      }, 500);
    }
  };
  
  const removeItem = (cartId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: cartId });
    showInfo('Producto eliminado del carrito');
  };
  
  const updateQuantity = (cartId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { cartId, quantity }
    });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem('elite_fitness_cart');
    localStorage.removeItem('elite_fitness_abandoned_cart');
    showInfo('Carrito vaciado');
  };
  
  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };
  
  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };
  
  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };
  
  const restoreAbandonedCart = () => {
    if (state.abandonedCart && state.abandonedCart.items) {
      dispatch({ type: 'LOAD_CART', payload: state.abandonedCart.items });
      dispatch({ type: 'SET_ABANDONED_CART', payload: null });
      localStorage.removeItem('elite_fitness_abandoned_cart');
      showSuccess('Carrito restaurado exitosamente');
    }
  };
  
  // 💳 FUNCIÓN DE CHECKOUT
  const proceedToCheckout = async () => {
    if (!isAuthenticated) {
      // Guardar carrito y redirigir a login
      saveCartToStorage();
      window.location.href = '/login?redirect=checkout';
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const orderData = {
        items: state.items,
        total: state.total,
        userId: user.id
      };
      
      const response = await apiService.createOrder(orderData);
      
      if (response.success) {
        clearCart();
        showSuccess('¡Pedido creado exitosamente!');
        return response.data;
      }
    } catch (error) {
      console.error('Error en checkout:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  // 📦 VALOR DEL CONTEXTO
  const contextValue = {
    // Estado
    ...state,
    
    // Funciones
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    proceedToCheckout,
    restoreAbandonedCart,
    
    // Utilidades
    formatCurrency: (amount) => `Q${amount.toFixed(2)}`,
    isEmpty: state.items.length === 0,
    hasAbandonedCart: !!state.abandonedCart,
    
    // Métricas
    uniqueItemCount: state.items.length,
    averageItemPrice: state.items.length > 0 ? state.total / state.itemCount : 0
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