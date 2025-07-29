// src/hooks/useFeaturedProducts.js
// FUNCIÓN: Hook CORREGIDO para cargar productos destacados
// ARREGLA: Extrae solo la data del response del backend

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
      
      console.log('🛍️ Featured products received:', response);
      
      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let productsData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, name: "...", ... }, ... ] }
        productsData = response.data;
        console.log('🛍️ Products data extracted:');
        console.log('  - Total products:', productsData.length);
        if (Array.isArray(productsData)) {
          productsData.forEach((product, i) => {
            console.log(`  - Product ${i + 1}: ${product.name} - Q${product.price} (Stock: ${product.inStock})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        productsData = response;
        console.log('🛍️ Products data (direct array):', productsData.length);
      } else {
        console.warn('⚠️ Invalid products response structure:', response);
        throw new Error('Invalid response structure');
      }

      // Filtrar solo productos disponibles y destacados
      const availableProducts = Array.isArray(productsData) 
        ? productsData.filter(product => 
            product.inStock !== false && 
            product.featured !== false
          )
        : [];

      setProducts(availableProducts); // ✅ Guardamos solo la data, no el wrapper
      setIsLoaded(true);
      console.log(`✅ Featured products loaded successfully! (${availableProducts.length} available)`);

    } catch (err) {
      console.error('❌ Error loading featured products:', err.message);
      setError(err);
      setProducts([]); // Fallback a array vacío
      setIsLoaded(true); // Marcar como cargado aunque falle
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
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,        // ✅ Solo la data: [ { id: 1, name: "...", ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useFeaturedProducts;