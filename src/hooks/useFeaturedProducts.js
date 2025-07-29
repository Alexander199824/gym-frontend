// src/hooks/useFeaturedProducts.js
// FUNCIÓN: Hook para productos destacados de la tienda
// CONECTA CON: GET /api/store/featured-products

// src/hooks/useFeaturedProducts.js
// FUNCIÓN: Hook optimizado para productos destacados - Cache inteligente
// EVITA: Múltiples peticiones innecesarias al mismo endpoint

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

// 🏠 CACHE GLOBAL para productos destacados
const globalFeaturedProductsCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  error: null,
  subscribers: new Set()
};

// ⏰ TTL del cache: 10 minutos (los productos pueden cambiar de disponibilidad)
const CACHE_TTL = 10 * 60 * 1000;

const useFeaturedProducts = () => {
  const { setCacheData, getCacheData } = useApp();
  const [state, setState] = useState({
    products: null,
    isLoaded: false,
    isLoading: false,
    error: null
  });
  
  const subscriberIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const isMountedRef = useRef(true);
  
  // 🔧 Función para actualizar estado de forma segura
  const safeSetState = (newState) => {
    if (isMountedRef.current) {
      setState(prevState => ({ ...prevState, ...newState }));
    }
  };
  
  // 🔧 Notificar a todos los subscribers
  const notifySubscribers = (data) => {
    globalFeaturedProductsCache.subscribers.forEach(callback => {
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  };
  
  // 🔧 Obtener datos del cache
  const getFromCache = () => {
    // Verificar cache de AppContext primero
    const appCacheData = getCacheData('featuredProducts');
    if (appCacheData) {
      console.log('📦 Using AppContext cache for featured products');
      return appCacheData;
    }
    
    // Verificar cache global
    if (globalFeaturedProductsCache.data && globalFeaturedProductsCache.timestamp) {
      const age = Date.now() - globalFeaturedProductsCache.timestamp;
      if (age < CACHE_TTL) {
        console.log('📦 Using global cache for featured products');
        return globalFeaturedProductsCache.data;
      }
    }
    
    return null;
  };
  
  // 🔧 Guardar en cache
  const saveToCache = (data) => {
    globalFeaturedProductsCache.data = data;
    globalFeaturedProductsCache.timestamp = Date.now();
    globalFeaturedProductsCache.error = null;
    
    setCacheData('featuredProducts', data);
    console.log('💾 Featured products saved to cache');
  };
  
  // 🚀 Función principal para obtener productos destacados
  const fetchFeaturedProducts = async (force = false) => {
    // Si ya hay una petición en curso y no es forzada, esperar
    if (globalFeaturedProductsCache.isLoading && !force) {
      console.log('⏳ Featured products fetch already in progress, waiting...');
      return;
    }
    
    // Verificar cache primero (solo si no es forzada)
    if (!force) {
      const cachedData = getFromCache();
      if (cachedData) {
        safeSetState({
          products: cachedData,
          isLoaded: true,
          isLoading: false,
          error: null
        });
        return;
      }
    }
    
    // Marcar como cargando
    globalFeaturedProductsCache.isLoading = true;
    safeSetState({ isLoading: true, error: null });
    
    try {
      console.group('🛍️ Fetching Featured Products');
      console.log('📡 Making API request to /api/store/featured-products');
      
      const response = await apiService.getFeaturedProducts();
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, aborting update');
        console.groupEnd();
        return;
      }
      
      if (response.success && response.data) {
        const products = Array.isArray(response.data) ? response.data : [];
        const inStockProducts = products.filter(product => product.inStock !== false);
        
        console.log('✅ Featured products received successfully');
        console.log('📋 Products summary:', {
          total: products.length,
          inStock: inStockProducts.length,
          categories: [...new Set(products.map(p => p.category).filter(Boolean))],
          priceRange: products.length > 0 ? {
            min: Math.min(...products.map(p => p.price || 0)),
            max: Math.max(...products.map(p => p.price || 0))
          } : null,
          hasImages: products.filter(p => p.image || (p.images && p.images.length > 0)).length
        });
        
        // Log de productos individuales
        if (products.length > 0) {
          console.log('📋 Individual products:');
          products.forEach((product, index) => {
            const price = product.price ? `Q${product.price}` : 'No price';
            const stock = product.inStock !== false ? '✅ In Stock' : '❌ Out of Stock';
            console.log(`  ${index + 1}. ${product.name || 'Unnamed'} - ${price} ${stock}`);
          });
        } else {
          console.log('⚠️ No featured products returned from backend');
        }
        
        // Guardar en cache
        saveToCache(products);
        
        // Actualizar estado
        const newState = {
          products: products,
          isLoaded: true,
          isLoading: false,
          error: null
        };
        
        safeSetState(newState);
        notifySubscribers(newState);
        console.groupEnd();
        
      } else {
        throw new Error('Invalid response format from backend');
      }
      
    } catch (error) {
      console.group('❌ Featured Products Fetch Failed');
      console.log('🔍 Error details:', error.message);
      
      if (error.response?.status === 404) {
        console.log('📍 PROBLEM: /api/store/featured-products endpoint not found');
        console.log('🔧 SOLUTION: Implement featured products endpoint in backend');
        console.log('📋 EXPECTED RESPONSE:');
        console.log(`   {
     "success": true,
     "data": [
       {
         "id": 1,
         "name": "Proteína Whey",
         "description": "Proteína de alta calidad...",
         "price": 299,
         "originalPrice": 349,
         "image": "protein.jpg",
         "category": "suplementos",
         "inStock": true,
         "rating": 4.8,
         "features": ["Alta calidad", "Fácil digestión"]
       }
     ]
   }`);
      } else if (error.response?.status === 500) {
        console.log('📍 PROBLEM: Backend internal error in products');
        console.log('🔧 SOLUTION: Check backend logs for database errors');
      } else if (error.code === 'ERR_NETWORK') {
        console.log('📍 PROBLEM: Cannot connect to backend');
        console.log('🔧 SOLUTION: Verify backend is running');
      }
      
      console.groupEnd();
      
      const errorState = {
        products: null,
        isLoaded: true,
        isLoading: false,
        error: error.message
      };
      
      safeSetState(errorState);
      globalFeaturedProductsCache.error = error.message;
      globalFeaturedProductsCache.isLoading = false;
      notifySubscribers(errorState);
    }
    
    globalFeaturedProductsCache.isLoading = false;
  };
  
  // 🔧 Suscribirse a cambios en el cache global
  useEffect(() => {
    // Función de callback para recibir actualizaciones
    const handleCacheUpdate = (newState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    };
    
    // Suscribirse
    globalFeaturedProductsCache.subscribers.add(handleCacheUpdate);
    
    // Verificar cache existente
    const cachedData = getFromCache();
    if (cachedData) {
      console.log('📦 Loading featured products from existing cache');
      safeSetState({
        products: cachedData,
        isLoaded: true,
        isLoading: false,
        error: null
      });
    } else if (!globalFeaturedProductsCache.isLoading) {
      // Solo hacer fetch si no hay cache y no hay petición en curso
      fetchFeaturedProducts();
    }
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      globalFeaturedProductsCache.subscribers.delete(handleCacheUpdate);
    };
  }, []);
  
  // 🔄 Función para refrescar datos
  const refetch = () => {
    console.log('🔄 Force refreshing featured products...');
    fetchFeaturedProducts(true);
  };
  
  // 🧹 Función para limpiar cache
  const clearCache = () => {
    console.log('🧹 Clearing featured products cache...');
    globalFeaturedProductsCache.data = null;
    globalFeaturedProductsCache.timestamp = null;
    globalFeaturedProductsCache.error = null;
    
    safeSetState({
      products: null,
      isLoaded: false,
      isLoading: false,
      error: null
    });
  };
  
  // 🔧 Funciones de utilidad para productos
  const getInStockProducts = () => {
    return state.products ? state.products.filter(product => product.inStock !== false) : [];
  };
  
  const getProductById = (id) => {
    return state.products ? state.products.find(product => product.id === id) : null;
  };
  
  const getProductsByCategory = (category) => {
    return state.products ? state.products.filter(product => 
      product.category === category && product.inStock !== false
    ) : [];
  };
  
  const getDiscountedProducts = () => {
    return state.products ? state.products.filter(product => 
      product.originalPrice && product.originalPrice > product.price && product.inStock !== false
    ) : [];
  };
  
  const getTopRatedProducts = (minRating = 4) => {
    return state.products ? state.products.filter(product => 
      (product.rating || 0) >= minRating && product.inStock !== false
    ) : [];
  };
  
  const getProductCategories = () => {
    if (!state.products) return [];
    return [...new Set(state.products.map(product => product.category).filter(Boolean))];
  };
  
  const getPriceRange = () => {
    if (!state.products || state.products.length === 0) return { min: 0, max: 0 };
    const prices = state.products.map(product => product.price || 0).filter(price => price > 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };
  
  return {
    products: state.products,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    clearCache,
    
    // Funciones de utilidad
    inStockProducts: getInStockProducts(),
    discountedProducts: getDiscountedProducts(),
    topRatedProducts: getTopRatedProducts(),
    getProductById,
    getProductsByCategory,
    getProductCategories,
    getPriceRange,
    hasValidProducts: state.products && Array.isArray(state.products) && state.products.length > 0,
    inStockCount: getInStockProducts().length,
    categories: getProductCategories(),
    priceRange: getPriceRange(),
    cacheAge: globalFeaturedProductsCache.timestamp ? Date.now() - globalFeaturedProductsCache.timestamp : null,
    isCacheValid: globalFeaturedProductsCache.timestamp ? (Date.now() - globalFeaturedProductsCache.timestamp) < CACHE_TTL : false
  };
};

export default useFeaturedProducts;