// src/hooks/useFeaturedProducts.js
// 🔧 HOOK CORREGIDO: Maneja la estructura real del backend

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useFeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🚀 useFeaturedProducts hook initialized');

  const fetchProducts = useCallback(async () => {
    console.log('🛍️ Loading Featured Products');
    setIsLoading(true);
    setError(null);

    try {
      console.log('📡 Requesting featured products...');
      const response = await apiService.getFeaturedProducts();
      
      console.group('🛍️ Response Structure Analysis');
      console.log('Full response:', response);
      console.log('response.success:', response?.success);
      console.log('response.data:', response?.data);
      console.log('response.data.products:', response?.data?.products);
      console.groupEnd();
      
      // 🎯 ESTRUCTURA CORREGIDA: Backend devuelve { success: true, data: { products: [...] } }
      let productsData = [];
      
      if (response && response.success && response.data && response.data.products) {
        // ✅ RUTA CORRECTA: response.data.products
        productsData = response.data.products;
        console.log('✅ Products extracted from response.data.products:', productsData.length);
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        // Fallback: response.data es array directo
        productsData = response.data;
        console.log('✅ Products extracted from response.data (array):', productsData.length);
      } else if (response && Array.isArray(response)) {
        // Fallback: response es array directo
        productsData = response;
        console.log('✅ Products extracted from response (direct array):', productsData.length);
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
        throw new Error('Unexpected response structure');
      }

      // 🐛 MOSTRAR TODOS LOS PRODUCTOS RECIBIDOS
      if (Array.isArray(productsData) && productsData.length > 0) {
        console.group('📦 ALL PRODUCTS RECEIVED');
        productsData.forEach((product, i) => {
          console.log(`Product ${i + 1}: ${product.name}`, {
            id: product.id,
            name: product.name,
            price: product.price,
            isFeatured: product.isFeatured,
            isActive: product.isActive,
            inStock: product.inStock,
            categoryName: product.category?.name,
            brandName: product.brand?.name
          });
        });
        console.groupEnd();
      }

      // 🔧 FILTRO CORRECTO: Usar las propiedades reales del backend
      const featuredProducts = Array.isArray(productsData) 
        ? productsData.filter(product => {
            // Backend usa: isFeatured, isActive, inStock (no featured, active)
            const isFeatured = product.isFeatured !== false;
            const isActive = product.isActive !== false;  
            const inStock = product.inStock !== false;
            
            const shouldInclude = isFeatured && isActive && inStock;
            
            console.log(`🔍 Filter check for "${product.name}":`, {
              isFeatured: product.isFeatured,
              isActive: product.isActive,
              inStock: product.inStock,
              shouldInclude
            });
            
            return shouldInclude;
          })
        : [];

      console.group('✅ FILTERED RESULTS');
      console.log(`📊 ${featuredProducts.length} of ${productsData.length} products passed filter`);
      featuredProducts.forEach((product, i) => {
        console.log(`✅ Featured Product ${i + 1}: ${product.name} - Q${product.price}`);
      });
      console.groupEnd();

      setProducts(featuredProducts);
      setIsLoaded(true);
      console.log(`🎉 Featured products loaded successfully! (${featuredProducts.length} featured products)`);

    } catch (err) {
      console.group('❌ FETCH ERROR');
      console.error('Error message:', err.message);
      console.error('Error details:', err);
      console.groupEnd();
      
      setError(err);
      setProducts([]);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchProducts();
    
    return () => {
      console.log('🧹 useFeaturedProducts hook cleanup');
    };
  }, [fetchProducts]);

  // Función manual de reload
  const reload = useCallback(() => {
    console.log('🔄 Manual products reload requested');
    setProducts([]);
    setIsLoaded(false);
    setError(null);
    fetchProducts();
  }, [fetchProducts]);

  // Log final del estado
  useEffect(() => {
    console.log('🎯 useFeaturedProducts FINAL STATE:', {
      productsCount: products?.length || 0,
      isLoaded,
      isLoading,
      hasError: !!error,
      firstProduct: products?.[0]?.name || 'None'
    });
  }, [products, isLoaded, isLoading, error]);

  return {
    products,        // ✅ Productos filtrados correctamente
    isLoaded,        
    isLoading,       
    error,           
    reload           
  };
};

export default useFeaturedProducts;