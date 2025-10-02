// Autor: Alexander Echeverria
// src/contexts/CartContext.js
// VERSIÓN COMPLETA: IVA incluido en precios, desglosado automáticamente para backend

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import apiService from '../services/apiService';

// CONSTANTES
const CART_STORAGE_KEY = 'elite_fitness_cart';
const SESSION_STORAGE_KEY = 'elite_fitness_session_id';
const CART_EXPIRY_DAYS = 30;

// ✅ CONFIGURACIÓN DE IVA GUATEMALA
const TAX_RATE = 0.12; // 12% IVA
const TAX_MULTIPLIER = 1 + TAX_RATE; // 1.12

// ============================================================================
// FUNCIONES DE CÁLCULO CON IVA INCLUIDO
// ============================================================================

/**
 * Calcula el subtotal SIN IVA a partir del precio CON IVA
 * Fórmula: precioConIVA ÷ 1.12 = precioSinIVA
 */
const calculateSubtotalWithoutTax = (priceWithTax, quantity) => {
  const priceWithoutTax = priceWithTax / TAX_MULTIPLIER;
  return priceWithoutTax * quantity;
};

/**
 * Calcula el IVA desglosado del precio
 * Fórmula: precioConIVA - (precioConIVA ÷ 1.12) = IVA
 */
const calculateTaxAmount = (priceWithTax, quantity) => {
  const priceWithoutTax = priceWithTax / TAX_MULTIPLIER;
  const taxAmount = (priceWithTax - priceWithoutTax) * quantity;
  return taxAmount;
};

/**
 * Calcula el resumen completo del carrito
 * - totalWithTax: Lo que ve el usuario (precios con IVA)
 * - subtotal: Sin IVA (para backend)
 * - taxAmount: IVA desglosado (para backend)
 */
const calculateCartSummary = (items, shippingCost = 0) => {
  // 1. Calcular total CON IVA (lo que ve el usuario)
  const totalProductsWithTax = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);

  // 2. Desglosar: calcular subtotal SIN IVA
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + calculateSubtotalWithoutTax(price, quantity);
  }, 0);

  // 3. Calcular IVA (diferencia entre total con IVA y subtotal sin IVA)
  const taxAmount = totalProductsWithTax - subtotal;

  // 4. Total final
  const totalAmount = totalProductsWithTax + shippingCost;

  return {
    totalProductsWithTax: Math.round(totalProductsWithTax * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingAmount: Math.round(shippingCost * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};

// ============================================================================
// VALIDACIÓN DE PRODUCTOS
// ============================================================================
const validateProduct = (item) => {
  const issues = [];
  
  const price = parseFloat(item.price);
  if (!item.price || isNaN(price) || price <= 0) {
    issues.push('precio_invalido');
  }
  
  const quantity = parseInt(item.quantity);
  if (!item.quantity || isNaN(quantity) || quantity <= 0) {
    issues.push('cantidad_invalida');
  }
  
  if (!item.id) {
    issues.push('sin_id');
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
    totalProductsWithTax: 0,
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
      const validation = validateProduct(action.payload);
      
      if (!validation.isValid) {
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
        summary: {
          totalProductsWithTax: 0,
          subtotal: 0,
          taxAmount: 0,
          shippingAmount: 0,
          totalAmount: 0
        }
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
      const { validItems, invalidItems } = validateCartItems(items);
      
      if (invalidItems.length > 0) {
        console.warn(`⚠️ ${invalidItems.length} producto(s) inválido(s) NO guardados`);
      }
      
      const cartData = {
        items: validItems,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
        version: '2.0',
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
          version: '2.0',
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
  
  // ============================================================================
  // CALCULAR RESUMEN CON IVA INCLUIDO
  // ============================================================================
  useEffect(() => {
    const summary = calculateCartSummary(state.items, 0);
    dispatch({ type: CART_ACTIONS.SET_SUMMARY, payload: summary });
    
    console.log('💰 Resumen del carrito actualizado:', {
      totalConIVA: summary.totalProductsWithTax,
      subtotalSinIVA: summary.subtotal,
      iva: summary.taxAmount,
      envio: summary.shippingAmount,
      totalFinal: summary.totalAmount
    });
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
          version: '2.0',
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
  
  // ============================================================================
  // FUNCIÓN: Proceder al checkout - CON CÁLCULOS CORRECTOS PARA BACKEND
  // ============================================================================
  const proceedToCheckout = useCallback(async (checkoutData) => {
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
    
    try {
      // ✅ CALCULAR EL RESUMEN CORRECTO CON IVA DESGLOSADO
      const shippingCost = checkoutData.shippingCost || 0;
      const summary = calculateCartSummary(state.items, shippingCost);
      
      console.log('📊 Resumen calculado para checkout:', {
        totalProductosConIVA: summary.totalProductsWithTax,
        subtotalSinIVA: summary.subtotal,
        ivaDesglosado: summary.taxAmount,
        envio: summary.shippingAmount,
        totalFinal: summary.totalAmount
      });
      
      // Preparar datos para el backend
      const orderData = {
        items: state.items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price, // Precio CON IVA (como está en la BD)
          selectedVariants: item.options || {},
          variant: item.variant || {}
        })),
        
        // ✅ VALORES CRÍTICOS CALCULADOS CORRECTAMENTE
        subtotal: summary.subtotal,           // Sin IVA
        taxAmount: summary.taxAmount,         // IVA desglosado
        shippingAmount: summary.shippingAmount, // Envío
        totalAmount: summary.totalAmount,     // Total final
        
        // Información del cliente y entrega
        customerInfo: checkoutData.customerInfo,
        shippingAddress: checkoutData.shippingAddress,
        paymentMethod: checkoutData.paymentMethod || 'cash_on_delivery',
        deliveryMethod: checkoutData.deliveryMethod,
        notes: checkoutData.notes || ''
      };
      
      // Si es invitado, agregar sessionId
      if (!isAuthenticated) {
        orderData.sessionId = state.sessionInfo?.sessionId || getOrCreateSessionId();
      }
      
      console.log('📤 Datos enviados al backend:', {
        subtotal: orderData.subtotal,
        taxAmount: orderData.taxAmount,
        shippingAmount: orderData.shippingAmount,
        totalAmount: orderData.totalAmount,
        itemsCount: orderData.items.length
      });
      
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
  }, [state.items, state.sessionInfo, isAuthenticated, clearCart, getOrCreateSessionId, validateCart, showError]);
  
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
    console.log('Subtotal (sin IVA):', state.summary.subtotal);
    console.log('IVA:', state.summary.taxAmount);
    console.log('Total:', state.summary.totalAmount);
    console.log('En localStorage:', !!localStorage.getItem(CART_STORAGE_KEY));
    
    if (state.invalidItems.length > 0) {
      console.warn('Productos inválidos:', state.invalidItems);
    }
    
    console.groupEnd();
  }, [state]);
  
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
    getOrCreateSessionId,
    
    // Utilidades
    formatCurrency,
    validateCart,
    debugCart,
    
    // ✅ EXPONER LA FUNCIÓN DE CÁLCULO PARA CHECKOUT
    calculateCartSummary
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