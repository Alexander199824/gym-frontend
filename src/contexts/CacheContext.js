// Autor: Alexander Echeverria
// src/contexts/CartContext.js
// VERSIÓN FINAL: Sin IVA, Sin envío gratis, Validación solo precio obligatorio

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import apiService from '../services/apiService';

// CONSTANTES
const CART_STORAGE_KEY = 'elite_fitness_cart';
const SESSION_STORAGE_KEY = 'elite_fitness_session_id';
const CART_EXPIRY_DAYS = 30;

// ============================================================================
// VALIDACIÓN DE PRODUCTOS - SOLO PRECIO OBLIGATORIO
// ============================================================================
const validateProduct = (item) => {
  const issues = [];
  
  // ✅ CRÍTICO: Precio válido (previene compras con Q0)
  const price = parseFloat(item.price);
  if (!item.price || isNaN(price) || price <= 0) {
    issues.push('precio_invalido');
    console.error('❌ Producto con precio inválido:', {
      id: item.id,
      name: item.name,
      price: item.price
    });
  }
  
  // ✅ CRÍTICO: Cantidad válida
  const quantity = parseInt(item.quantity);
  if (!item.quantity || isNaN(quantity) || quantity <= 0) {
    issues.push('cantidad_invalida');
    console.error('❌ Producto con cantidad inválida:', {
      id: item.id,
      quantity: item.quantity
    });
  }
  
  // ✅ CRÍTICO: ID del producto
  if (!item.id) {
    issues.push('sin_id');
    console.error('❌ Producto sin ID');
  }
  
  // ⚠️ ADVERTENCIA: Imagen faltante (permitido pero se registra)
  if (!item.image || item.image.trim() === '') {
    console.warn('⚠️ Producto sin imagen:', {
      id: item.id,
      name: item.name || 'Sin nombre'
    });
    // NO se agrega a issues - se permite sin imagen
  }
  
  // ⚠️ ADVERTENCIA: Nombre faltante (permitido pero se registra)
  if (!item.name || item.name.trim() === '') {
    console.warn('⚠️ Producto sin nombre:', {
      id: item.id
    });
    // NO se agrega a issues - se permite sin nombre
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    item
  };
};

const validateCartItems = (items) => {
  const validItems = [];
  const invalidItems = [];
  
  items.forEach(item => {
    const validation = validateProduct(item);
    
    if (validation.isValid) {
      validItems.push(item);
    } else {
      invalidItems.push({
        ...item,
        validationIssues: validation.issues
      });
      console.warn('❌ Producto RECHAZADO por validación:', {
        name: item.name || 'Desconocido',
        id: item.id,
        issues: validation.issues
      });
    }
  });
  
  return { validItems, invalidItems };
};

// ACTIONS
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
  SET_ERROR: 'SET_ERROR',
  SET_INVALID_ITEMS: 'SET_INVALID_ITEMS'
};

// ESTADO INICIAL
const initialState = {
  isOpen: false,
  items: [],
  isLoading: false,
  summary: {
    subtotal: 0,
    shippingAmount: 0,
    totalAmount: 0
  },
  sessionInfo: {
    lastSync: null,
    syncError: null,
    isGuest: true,
    sessionId: null
  },
  error: null,
  invalidItems: []
};

// REDUCER
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
      // Validar antes de agregar
      const validation = validateProduct(action.payload);
      
      if (!validation.isValid) {
        console.error('❌ Intento de agregar producto inválido bloqueado:', validation.issues);
        return state;
      }
      
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
        invalidItems: [],
        summary: { subtotal: 0, shippingAmount: 0, totalAmount: 0 }
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
      
    case CART_ACTIONS.SET_INVALID_ITEMS:
      return { ...state, invalidItems: action.payload };
      
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
  
  const isInitializedRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  
  // FUNCIÓN: Generar o recuperar sessionId
  const getOrCreateSessionId = useCallback(() => {
    if (isAuthenticated) return null;
    
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      console.log('✅ SessionID generado:', sessionId);
    }
    
    return sessionId;
  }, [isAuthenticated]);
  
  // FUNCIÓN: Guardar en localStorage con validación
  const saveToLocalStorage = useCallback((items, sessionId) => {
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 1000) {
      return;
    }
    lastSaveTimeRef.current = now;
    
    try {
      // Validar y limpiar items antes de guardar
      const { validItems, invalidItems } = validateCartItems(items);
      
      if (invalidItems.length > 0) {
        console.warn(`⚠️ ${invalidItems.length} producto(s) inválido(s) NO guardados en localStorage`);
      }
      
      const cartData = {
        items: validItems,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
        version: '1.3',
        sessionId: sessionId
      };
      
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      
      if (sessionId) {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }
      
      console.log('💾 Carrito guardado:', {
        validItems: validItems.length,
        invalidRemoved: invalidItems.length,
        sessionId: sessionId
      });
    } catch (error) {
      console.error('❌ Error guardando carrito:', error);
    }
  }, []);
  
  // FUNCIÓN: Cargar desde localStorage con validación
  const loadFromLocalStorage = useCallback(() => {
    try {
      const cartDataString = localStorage.getItem(CART_STORAGE_KEY);
      const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (!cartDataString) {
        return { 
          items: [], 
          sessionId: savedSessionId || null,
          invalidItems: []
        };
      }
      
      const cartData = JSON.parse(cartDataString);
      
      // Verificar expiración
      if (cartData.expiresAt && new Date(cartData.expiresAt) < new Date()) {
        console.log('🕐 Carrito expirado, limpiando...');
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return { items: [], sessionId: null, invalidItems: [] };
      }
      
      // VALIDAR PRODUCTOS CARGADOS
      const { validItems, invalidItems } = validateCartItems(cartData.items || []);
      
      // Si hay productos inválidos, limpiar y guardar solo los válidos
      if (invalidItems.length > 0) {
        console.warn(`⚠️ ${invalidItems.length} producto(s) inválido(s) eliminados del localStorage`);
        
        const finalSessionId = cartData.sessionId || savedSessionId;
        const cleanCartData = {
          items: validItems,
          timestamp: new Date().toISOString(),
          expiresAt: cartData.expiresAt,
          version: '1.3',
          sessionId: finalSessionId
        };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cleanCartData));
      }
      
      const finalSessionId = cartData.sessionId || savedSessionId;
      
      return {
        items: validItems,
        sessionId: finalSessionId,
        invalidItems: invalidItems
      };
      
    } catch (error) {
      console.error('❌ Error cargando carrito:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return { items: [], sessionId: null, invalidItems: [] };
    }
  }, []);
  
  // INICIALIZACIÓN con validación
  useEffect(() => {
    if (isInitializedRef.current || authLoading) {
      return;
    }
    
    const initializeCart = async () => {
      console.log('🚀 Inicializando carrito con validación...');
      isInitializedRef.current = true;
      
      if (isAuthenticated && user) {
        // Usuario autenticado
        try {
          const backendCart = await apiService.getCart();
          const backendItems = backendCart.data?.cartItems || [];
          
          const { validItems, invalidItems } = validateCartItems(backendItems);
          
          if (invalidItems.length > 0) {
            console.warn(`⚠️ ${invalidItems.length} producto(s) inválido(s) del backend eliminados`);
            showWarning(`${invalidItems.length} producto(s) con datos incompletos fueron eliminados`);
          }
          
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: validItems });
          dispatch({ type: CART_ACTIONS.SET_INVALID_ITEMS, payload: invalidItems });
          
          console.log('✅ Carrito cargado desde backend:', validItems.length, 'productos válidos');
        } catch (error) {
          console.error('❌ Error cargando desde backend:', error);
          const localData = loadFromLocalStorage();
          dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localData.items });
          
          if (localData.invalidItems.length > 0) {
            dispatch({ type: CART_ACTIONS.SET_INVALID_ITEMS, payload: localData.invalidItems });
            showWarning(`${localData.invalidItems.length} producto(s) inválido(s) eliminados`);
          }
        }
      } else {
        // Usuario invitado
        const localData = loadFromLocalStorage();
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: localData.items });
        
        const sessionId = localData.sessionId || getOrCreateSessionId();
        dispatch({ 
          type: CART_ACTIONS.SET_SESSION_INFO, 
          payload: { sessionId: sessionId, isGuest: true } 
        });
        
        if (localData.invalidItems.length > 0) {
          dispatch({ type: CART_ACTIONS.SET_INVALID_ITEMS, payload: localData.invalidItems });
          showWarning(`${localData.invalidItems.length} producto(s) inválido(s) eliminados`);
        }
        
        console.log('✅ Carrito cargado desde localStorage:', {
          validItems: localData.items.length,
          invalidItems: localData.invalidItems.length,
          sessionId: sessionId
        });
      }
    };
    
    initializeCart();
  }, [isAuthenticated, user, authLoading, loadFromLocalStorage, getOrCreateSessionId, showWarning]);
  
  // GUARDAR con debouncing
  useEffect(() => {
    if (!isAuthenticated && !authLoading && isInitializedRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        const sessionId = getOrCreateSessionId();
        saveToLocalStorage(state.items, sessionId);
      }, 500);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.items, isAuthenticated, authLoading, getOrCreateSessionId, saveToLocalStorage]);
  
  // CALCULAR RESUMEN - SIN IVA, SIN ENVÍO GRATIS
  useEffect(() => {
    const calculateSummary = () => {
      const subtotal = state.items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
      
      // SIN IVA - Eliminado completamente
      // SIN ENVÍO GRATIS - Se calcula en checkout según método de entrega
      const shippingAmount = 0;
      const totalAmount = subtotal + shippingAmount;
      
      const summary = {
        subtotal: Math.round(subtotal * 100) / 100,
        shippingAmount: Math.round(shippingAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100
      };
      
      dispatch({ type: CART_ACTIONS.SET_SUMMARY, payload: summary });
    };
    
    calculateSummary();
  }, [state.items]);
  
  // FUNCIÓN: Agregar item con validación
  const addItem = useCallback(async (product, options = {}) => {
    try {
      const quantity = parseInt(options.quantity) || 1;
      
      const item = {
        id: product.id,
        name: product.name || 'Producto sin nombre',
        price: parseFloat(product.price) || 0,
        image: product.image || (product.images?.[0]?.imageUrl) || '',
        options: { ...options, quantity: undefined },
        quantity,
        variant: product.variant || {}
      };
      
      // VALIDAR ANTES DE AGREGAR
      const validation = validateProduct(item);
      
      if (!validation.isValid) {
        const issuesText = validation.issues.map(issue => {
          switch(issue) {
            case 'precio_invalido': return 'precio inválido o Q0';
            case 'cantidad_invalida': return 'cantidad inválida';
            case 'sin_id': return 'sin ID de producto';
            default: return issue;
          }
        }).join(', ');
        
        showError(`No se puede agregar: ${issuesText}`);
        console.error('❌ Producto rechazado:', validation.issues);
        return false;
      }
      
      console.log('✅ Agregando producto válido:', item.name, '- Q', item.price);
      
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
      
      // Sincronizar con backend
      if (isAuthenticated && user) {
        try {
          await apiService.addToCart({
            productId: product.id,
            quantity,
            selectedVariants: item.options
          });
        } catch (error) {
          console.warn('⚠️ Fallo de sincronización:', error.message);
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
          console.warn('⚠️ Fallo de sincronización invitado:', error.message);
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
      showError('Error al agregar producto');
      return false;
    }
  }, [isAuthenticated, user, getOrCreateSessionId, showError]);
  
  // FUNCIÓN: Actualizar cantidad
  const updateQuantity = useCallback(async (cartId, newQuantity) => {
    try {
      const quantity = parseInt(newQuantity) || 0;
      
      if (quantity < 0) {
        showError('La cantidad no puede ser negativa');
        return false;
      }
      
      dispatch({ 
        type: CART_ACTIONS.UPDATE_ITEM, 
        payload: { cartId, quantity } 
      });
      
      if (isAuthenticated && user) {
        try {
          if (quantity === 0) {
            await apiService.removeFromCart(cartId);
          } else {
            await apiService.updateCartItem(cartId, { quantity });
          }
        } catch (error) {
          console.warn('⚠️ Fallo de sincronización:', error.message);
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error actualizando cantidad:', error);
      return false;
    }
  }, [isAuthenticated, user, showError]);
  
  // FUNCIÓN: Remover item
  const removeItem = useCallback(async (cartId) => {
    try {
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartId });
      
      if (isAuthenticated && user) {
        try {
          await apiService.removeFromCart(cartId);
        } catch (error) {
          console.warn('⚠️ Fallo al eliminar en servidor:', error.message);
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      return false;
    }
  }, [isAuthenticated, user]);
  
  // FUNCIÓN: Limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      
      if (!isAuthenticated) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
          items: [],
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
          version: '1.3',
          sessionId: state.sessionInfo?.sessionId || getOrCreateSessionId()
        }));
      }
      
      if (isAuthenticated && user) {
        try {
          await apiService.clearCart();
        } catch (error) {
          console.warn('⚠️ Fallo al limpiar en servidor:', error.message);
        }
      }
      
      console.log('✅ Carrito limpiado');
      return true;
      
    } catch (error) {
      console.error('❌ Error limpiando carrito:', error);
      return false;
    }
  }, [isAuthenticated, user, state.sessionInfo, getOrCreateSessionId]);
  
  // FUNCIÓN: Validar carrito manualmente
  const validateCart = useCallback(() => {
    const { validItems, invalidItems } = validateCartItems(state.items);
    
    if (invalidItems.length > 0) {
      console.warn(`⚠️ ${invalidItems.length} producto(s) inválido(s) encontrados`);
      dispatch({ type: CART_ACTIONS.LOAD_CART, payload: validItems });
      dispatch({ type: CART_ACTIONS.SET_INVALID_ITEMS, payload: invalidItems });
      
      const errorDetails = invalidItems.map(item => {
        const issues = item.validationIssues.map(issue => {
          switch(issue) {
            case 'precio_invalido': return 'precio inválido';
            case 'cantidad_invalida': return 'cantidad inválida';
            case 'sin_id': return 'sin ID';
            default: return issue;
          }
        }).join(', ');
        return `${item.name || 'Producto'} (${issues})`;
      }).join('; ');
      
      showWarning(`Productos eliminados: ${errorDetails}`);
      
      return {
        isValid: false,
        invalidCount: invalidItems.length,
        invalidItems
      };
    }
    
    return {
      isValid: true,
      invalidCount: 0,
      invalidItems: []
    };
  }, [state.items, showWarning]);
  
  // FUNCIÓN: Proceder al checkout con validación
  const proceedToCheckout = useCallback(async (guestData = null) => {
    // VALIDAR CARRITO ANTES
    const validation = validateCart();
    
    if (!validation.isValid) {
      showError(`Hay ${validation.invalidCount} producto(s) con datos inválidos que fueron eliminados`);
      return {
        success: false,
        error: 'Productos inválidos eliminados',
        invalidItems: validation.invalidItems
      };
    }
    
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
      console.error('❌ Error en checkout:', error);
      throw error;
    }
  }, [state.items, state.summary, state.sessionInfo, isAuthenticated, clearCart, getOrCreateSessionId, validateCart, showError]);
  
  // FUNCIÓN: Checkout para invitados
  const proceedToGuestCheckout = useCallback(async (guestData) => {
    return await proceedToCheckout(guestData);
  }, [proceedToCheckout]);
  
  // FUNCIONES DE UI
  const toggleCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: !state.isOpen });
  }, [state.isOpen]);
  
  const openCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: true });
  }, []);
  
  const closeCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.SET_OPEN, payload: false });
  }, []);
  
  // FUNCIÓN: Formatear moneda
  const formatCurrency = useCallback((amount) => {
    const number = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number).replace('GTQ', 'Q');
  }, []);
  
  // FUNCIÓN: Debug
  const debugCart = useCallback(() => {
    console.group('🛒 DEBUG CARRITO');
    console.log('Items válidos:', state.items.length);
    console.log('Items inválidos detectados:', state.invalidItems.length);
    console.log('Session ID:', state.sessionInfo?.sessionId);
    console.log('Subtotal:', state.summary.subtotal);
    console.log('Total:', state.summary.totalAmount);
    console.log('En localStorage:', !!localStorage.getItem(CART_STORAGE_KEY));
    
    if (state.invalidItems.length > 0) {
      console.warn('Productos inválidos:', state.invalidItems);
    }
    
    console.groupEnd();
  }, [state]);
  
  // FUNCIÓN: Retry sync
  const retrySync = useCallback(async () => {
    console.log('🔄 Reintentando sincronización...');
  }, []);
  
  // VALORES CALCULADOS
  const itemCount = state.items.reduce((count, item) => count + (parseInt(item.quantity) || 0), 0);
  const total = state.summary.totalAmount || 0;
  const isEmpty = state.items.length === 0;
  const hasInvalidItems = state.invalidItems.length > 0;
  
  // VALOR DEL CONTEXTO
  const value = {
    // Estado
    isOpen: state.isOpen,
    items: state.items,
    isLoading: state.isLoading,
    summary: state.summary,
    sessionInfo: state.sessionInfo,
    error: state.error,
    invalidItems: state.invalidItems,
    
    // Valores calculados
    itemCount,
    total,
    isEmpty,
    hasInvalidItems,
    
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
    validateCart,
    debugCart,
    retrySync
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
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export default CartContext;

/*
DOCUMENTACIÓN DEL CONTEXTO CacheContext

PROPÓSITO:
Este contexto proporciona un sistema de cache global optimizado que reduce
significativamente las peticiones al backend del gimnasio Elite Fitness Club.
Mejora el rendimiento de la aplicación cachéando inteligentemente datos como
configuraciones, estadísticas, servicios, testimonios, productos y planes,
especialmente importante para optimizar la carga de información financiera
y transacciones en quetzales guatemaltecos.

FUNCIONALIDADES PRINCIPALES:
- Cache inteligente con TTL (Time To Live) configurable por tipo de dato
- Reducción del 90% de peticiones duplicadas al backend
- Gestión automática de estados de carga y errores
- Limpieza automática de cache expirado
- Estadísticas detalladas de rendimiento (hit rate, misses)
- Prevención de peticiones duplicadas simultáneas
- Invalidación selectiva de cache por clave
- Logs detallados para debugging en desarrollo

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTOS QUE LO UTILIZAN:
- AppContext: Integra cache para datos globales de la aplicación
- AuthContext: Puede cachear datos de perfil de usuario
- Contextos de componentes que requieren optimización de datos

HOOKS QUE LO INTEGRAN:
- useApp(): Utiliza cache para datos de configuración del gimnasio
- useAuth(): Puede cachear información de perfil y permisos
- Hooks personalizados de datos del gimnasio que necesitan optimización
- Hooks de componentes que cargan datos frecuentemente

COMPONENTES QUE SE BENEFICIAN:
- ClientDashboard: Cache de estadísticas y datos del usuario
- MembershipCard: Cache de información de planes y precios
- PaymentHistoryCard: Cache de historial de transacciones en quetzales
- MembershipCheckout: Cache de configuraciones de pago
- ScheduleCard: Cache de configuraciones de horarios
- CacheDebugPanel: Accede directamente al estado del cache para debugging

SERVICIOS QUE LO UTILIZAN:
- membershipService: Cache de datos de membresías y precios
- paymentService: Cache de configuraciones de pago y métodos
- gymService: Cache de configuración general del gimnasio
- userService: Cache de datos de usuarios frecuentemente accedidos

QUE PROPORCIONA AL USUARIO:

OPTIMIZACIÓN DE RENDIMIENTO:
- Carga instantánea de datos previamente consultados
- Reducción significativa de tiempos de espera
- Experiencia más fluida navegando entre secciones
- Menor consumo de datos para usuarios móviles

GESTIÓN INTELIGENTE DE DATOS:
- Cache automático sin intervención del usuario
- Actualización transparente de datos expirados
- Fallback automático al servidor cuando es necesario
- Sincronización inteligente de datos críticos

CONFIGURACIONES DE CACHE POR TIPO:
- config: 10 minutos (configuración del gimnasio, precios)
- stats: 5 minutos (estadísticas de uso, métricas del día)
- services: 15 minutos (servicios del gimnasio, ofertas)
- testimonials: 10 minutos (testimonios de clientes)
- products: 3 minutos (productos, stock, precios en quetzales)
- plans: 30 minutos (planes de membresía, precios en quetzales)

FUNCIONES PRINCIPALES:

GESTIÓN DE DATOS:
- getCachedData(key): Obtiene datos del cache si están válidos
- setCachedData(key, data, ttl): Guarda datos en cache con TTL específico
- isDataValid(key): Verifica si los datos en cache siguen siendo válidos
- invalidateKey(key): Fuerza la invalidación de datos específicos

GESTIÓN DE ESTADOS:
- isPending(key): Verifica si hay una petición en curso
- setPending(key): Marca una petición como en progreso
- clearPending(key): Marca una petición como completada
- setLoading(key, loading): Establece estado de carga
- setError(key, error): Establece estado de error

UTILIDADES:
- cleanupExpired(): Limpia automáticamente cache expirado
- clearCache(): Limpia todo el cache (útil para logout)
- getCacheStats(): Obtiene estadísticas de rendimiento

CASOS DE USO EN EL GIMNASIO:

OPERACIONES FINANCIERAS:
- Cache de precios de membresías en quetzales
- Configuraciones de métodos de pago locales
- Historial de transacciones recientes
- Tasas de cambio y configuraciones financieras

GESTIÓN DE MEMBRESÍAS:
- Planes disponibles y precios actualizados
- Configuraciones de renovación automática
- Estados de membresías de clientes frecuentes
- Ofertas y promociones activas

DATOS DEL GIMNASIO:
- Servicios disponibles y horarios
- Testimonios de clientes satisfechos
- Estadísticas de uso de instalaciones
- Configuración de equipos y espacios

EXPERIENCIA DEL USUARIO:
- Carga rápida del dashboard personal
- Acceso instantáneo a historial de pagos
- Navegación fluida entre secciones
- Datos siempre actualizados pero optimizados

CARACTERÍSTICAS TÉCNICAS:

ALGORITMO DE CACHE:
- TTL diferenciado según criticidad de datos
- LRU (Least Recently Used) implícito
- Cleanup automático cada 5 minutos
- Máximo 100 entradas para control de memoria

PREVENCIÓN DE PETICIONES DUPLICADAS:
- Sistema de "pending" para evitar requests simultáneos
- Timeout de 30 segundos para peticiones colgadas
- Queue automático de peticiones relacionadas

ESTADÍSTICAS DE RENDIMIENTO:
- Hit rate: Porcentaje de aciertos del cache
- Requests totales: Número de solicitudes procesadas
- Hits/Misses: Aciertos y fallos del cache
- Entradas activas: Número de elementos cacheados
- Peticiones pendientes: Requests en progreso

LOGGING Y DEBUGGING:
- Logs detallados en modo desarrollo
- Estadísticas automáticas cada minuto
- Mensajes descriptivos en español
- Integración con CacheDebugPanel

INTEGRACIÓN CON BACKEND:
- Transparente para el desarrollador
- Compatible con cualquier servicio de API
- No interfiere con lógica de negocio
- Fallback automático en caso de fallo

OPTIMIZACIÓN DE MEMORIA:
- Límite máximo de 100 entradas
- Limpieza automática de datos expirados
- Gestión eficiente de referencias
- Prevención de memory leaks

BENEFICIOS PARA EL GIMNASIO:

OPERACIONALES:
- Menor carga en el servidor backend
- Mejor experiencia para clientes
- Reducción de costos de infraestructura
- Mayor escalabilidad del sistema

FINANCIEROS:
- Optimización de consultas de precios
- Cache de configuraciones de pago
- Mejora en procesamiento de transacciones
- Menor latencia en operaciones críticas

EXPERIENCIA DEL CLIENTE:
- Carga instantánea de información personal
- Navegación fluida entre secciones
- Datos siempre disponibles
- Menor tiempo de espera

Este contexto es crucial para el rendimiento óptimo de la aplicación del
gimnasio en Guatemala, especialmente importante para operaciones que
involucran datos financieros en quetzales y configuraciones críticas
que deben estar disponibles instantáneamente para brindar una excelente
experiencia al usuario mientras se optimiza el uso de recursos del servidor.
*/