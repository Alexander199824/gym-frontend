// src/contexts/CartContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/apiService';

const CartContext = createContext();

// 🛒 ESTADO INICIAL DEL CARRITO
const initialState = {
  items: [],
  isLoading: false,
  total: 0,
  itemCount: 0,
  isOpen: false
};

// 🔄 REDUCER DEL CARRITO
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
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return calculateTotals({ ...state, items: updatedItems });
      } else {
        const newItem = {
          ...action.payload,
          cartId: Date.now(),
          quantity: 1,
          addedAt: new Date()
        };
        return calculateTotals({ ...state, items: [...state.items, newItem] });
      }
      
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.cartId !== action.payload);
      return calculateTotals({ ...state, items: filteredItems });
      
    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item =>
        item.cartId === action.payload.cartId
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      return calculateTotals({ ...state, items: updatedItems });
      
    case 'CLEAR_CART':
      return { ...initialState };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
      
    case 'LOAD_CART':
      return calculateTotals({ ...state, items: action.payload });
      
    default:
      return state;
  }
}

// 📊 CALCULAR TOTALES
function calculateTotals(state) {
  const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    ...state,
    total,
    itemCount
  };
}

// 🏭 PROVIDER DEL CARRITO
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  
  // 💾 EFECTO: Cargar carrito desde localStorage o backend
  useEffect(() => {
    if (isAuthenticated && user) {
      // Usuario autenticado: cargar desde backend
      loadCartFromBackend();
    } else {
      // Usuario no autenticado: cargar desde localStorage
      loadCartFromStorage();
    }
  }, [isAuthenticated, user]);
  
  // 💾 EFECTO: Guardar carrito cuando cambie
  useEffect(() => {
    if (isAuthenticated && user) {
      // Guardar en backend (con debounce)
      const timeoutId = setTimeout(() => {
        saveCartToBackend();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Guardar en localStorage
      saveCartToStorage();
    }
  }, [state.items, isAuthenticated, user]);
  
  // 📥 FUNCIONES DE CARGA
  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('elite_fitness_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      }
    } catch (error) {
      console.error('Error al cargar carrito desde localStorage:', error);
    }
  };
  
  const loadCartFromBackend = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.getCart();
      
      if (response.success) {
        dispatch({ type: 'LOAD_CART', payload: response.data.items });
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
  
  // 🛒 FUNCIONES DEL CARRITO
  const addItem = (product, options = {}) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { ...product, options }
    });
  };
  
  const removeItem = (cartId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: cartId });
  };
  
  const updateQuantity = (cartId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { cartId, quantity }
    });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };
  
  // 💳 FUNCIÓN DE CHECKOUT
  const proceedToCheckout = async () => {
    if (!isAuthenticated) {
      // Redirigir a login
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
    proceedToCheckout,
    
    // Utilidades
    formatCurrency: (amount) => `Q${amount.toFixed(2)}`,
    isEmpty: state.items.length === 0
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// 🎣 HOOK PERSONALIZADO
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
}