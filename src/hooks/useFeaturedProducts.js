// src/hooks/useFeaturedProducts.js
// FUNCIÓN: Hook 100% OPTIMIZADO para productos destacados de la tienda
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useFeaturedProducts = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 2 * 60 * 1000, // 2 minutos - productos pueden cambiar stock
    inStockOnly = true, // Solo productos en stock
    featuredOnly = true, // Solo productos destacados
    limit = null, // Límite de productos
    category = null, // Filtrar por categoría
  } = options;

  // Estados
  const [products, setProducts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`featuredProducts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`🚀 useFeaturedProducts [${instanceId.current}] hook initialized`);

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useFeaturedProducts [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`⏸️ useFeaturedProducts [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && products && products.length > 0 && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useFeaturedProducts [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`🛍️ useFeaturedProducts [${instanceId.current}] Loading Featured Products${forceRefresh ? ' (forced)' : ''}`);
      console.log('📡 Requesting featured products...');
      
      // Cancelar petición anterior si existe
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      // Crear nuevo AbortController
      fetchAbortController.current = new AbortController();

      setIsLoading(true);
      setError(null);

      // 🎯 USAR REQUEST MANAGER - Evita peticiones duplicadas automáticamente
      const response = await requestManager.executeRequest(
        '/api/store/featured-products',
        () => apiService.getFeaturedProducts(),
        {
          forceRefresh,
          ttl: staleTime,
          priority: 'normal'
        }
      );

      console.log('🛍️ Featured products received:', response);

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useFeaturedProducts [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let productsData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, name: "...", price: 100, ... }, ... ] }
        productsData = response.data;
        console.log('🛍️ Products data extracted:');
        console.log('  - Total products:', productsData.length);
        if (Array.isArray(productsData)) {
          productsData.forEach((product, i) => {
            console.log(`  - Product ${i + 1}: ${product.name} - Q${product.price} (Stock: ${product.inStock !== false})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        productsData = response;
        console.log('🛍️ Products data (direct array):', productsData.length);
      } else {
        console.warn('⚠️ Invalid products response structure:', response);
        // En lugar de lanzar error, usar array vacío
        productsData = [];
      }

      // Aplicar filtros
      let processedProducts = Array.isArray(productsData) ? [...productsData] : [];

      // Filtrar solo productos en stock
      if (inStockOnly) {
        processedProducts = processedProducts.filter(product => 
          product.inStock !== false && (product.stock == null || product.stock > 0)
        );
      }

      // Filtrar solo productos destacados
      if (featuredOnly) {
        processedProducts = processedProducts.filter(product => product.featured === true);
      }

      // Filtrar por categoría si está especificada
      if (category) {
        processedProducts = processedProducts.filter(product => 
          product.category?.toLowerCase() === category.toLowerCase()
        );
      }

      // Aplicar límite si está especificado
      if (limit && limit > 0) {
        processedProducts = processedProducts.slice(0, limit);
      }

      // Ordenar por precio (opcional) o por orden de destacado
      processedProducts.sort((a, b) => {
        // Priorizar productos con badge "Más Vendido" o similares
        if (a.badge && !b.badge) return -1;
        if (!a.badge && b.badge) return 1;
        // Luego por rating descendente
        return (b.rating || 0) - (a.rating || 0);
      });

      setProducts(processedProducts); // ✅ Guardamos solo la data procesada
      setIsLoaded(true);
      setError(null);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;
      console.log(`✅ Featured products loaded successfully! (${processedProducts.length} available)`);

    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ useFeaturedProducts [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // No limpiar products anterior en caso de error, mantener datos previos
        if (products.length === 0) {
          setProducts([]); // Fallback a array vacío
        }
        
        setIsLoaded(true); // Marcar como cargado aunque falle
        hasInitialLoad.current = true;
      }
    } finally {
      // Solo actualizar loading si el componente sigue montado
      if (mountedRef.current) {
        setIsLoading(false);
      }
      
      // Limpiar AbortController
      fetchAbortController.current = null;
    }
  }, [enabled, isLoading, products, lastFetch, staleTime, inStockOnly, featuredOnly, limit, category]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const reload = useCallback(() => {
    console.log(`🔄 useFeaturedProducts [${instanceId.current}] manual reload requested`);
    return fetchProducts(true);
  }, [fetchProducts]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useFeaturedProducts [${instanceId.current}] invalidating cache`);
    requestManager.invalidateCache('/api/store/featured-products');
    setLastFetch(null);
  }, []);

  // 🔍 FUNCIÓN PARA OBTENER PRODUCTO POR ID
  const getProductById = useCallback((id) => {
    return products.find(product => product.id === id) || null;
  }, [products]);

  // 🔍 FUNCIÓN PARA FILTRAR POR RANGO DE PRECIO
  const getProductsByPriceRange = useCallback((minPrice = 0, maxPrice = Infinity) => {
    return products.filter(product => 
      product.price >= minPrice && product.price <= maxPrice
    );
  }, [products]);

  // 🔍 FUNCIÓN PARA OBTENER PRODUCTOS CON DESCUENTO
  const getDiscountedProducts = useCallback(() => {
    return products.filter(product => 
      product.originalPrice && product.originalPrice > product.price
    );
  }, [products]);

  // 📊 FUNCTION PARA CALCULAR PRECIO PROMEDIO
  const getAveragePrice = useCallback(() => {
    if (products.length === 0) return 0;
    
    const totalPrice = products.reduce((sum, product) => sum + (product.price || 0), 0);
    return Math.round((totalPrice / products.length) * 100) / 100; // Redondear a 2 decimales
  }, [products]);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      products.length === 0 ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 useFeaturedProducts [${instanceId.current}] initial fetch triggered`);
      fetchProducts();
    } else {
      console.log(`⏸️ useFeaturedProducts [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (products.length > 0 && !isLoaded) {
        setIsLoaded(true);
        hasInitialLoad.current = true;
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useFeaturedProducts [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useFeaturedProducts [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const hasValidData = Array.isArray(products) && products.length > 0;
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;
  const inStockCount = products.filter(p => p.inStock !== false).length;
  const discountedCount = products.filter(p => p.originalPrice && p.originalPrice > p.price).length;
  const averagePrice = getAveragePrice();

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Datos principales
    products,        // ✅ Solo la data: [ { id: 1, name: "...", price: 100, ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    
    // Funciones de control
    reload,          // Función para recargar manualmente
    invalidate,      // Función para invalidar cache
    
    // Funciones de utilidad
    getProductById,           // Obtener producto por ID
    getProductsByPriceRange,  // Filtrar por rango de precio
    getDiscountedProducts,    // Obtener productos con descuento
    getAveragePrice,          // Calcular precio promedio
    
    // Información de estado
    hasValidData,
    isStale,
    lastFetch,
    cacheAge,
    inStockCount,
    discountedCount,
    averagePrice,
    isEmpty: products.length === 0,
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        filters: { inStockOnly, featuredOnly, limit, category },
        cacheAge: Math.round(cacheAge / 1000) + 's',
        dataStructure: {
          isArray: Array.isArray(products),
          length: products.length,
          sampleProduct: products[0] ? {
            hasId: !!products[0].id,
            hasName: !!products[0].name,
            hasPrice: !!products[0].price,
            hasImages: !!(products[0].images && products[0].images.length),
            inStock: products[0].inStock !== false,
            featured: products[0].featured === true
          } : null
        }
      }
    })
  };
};

export default useFeaturedProducts;