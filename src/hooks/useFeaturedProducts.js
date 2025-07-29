// src/hooks/useFeaturedProducts.js
// FUNCIÓN: Hook para productos destacados - TOLERANTE a errores
import { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService';

const useFeaturedProducts = () => {
  const [state, setState] = useState({
    products: null,
    isLoaded: false,
    isLoading: false,
    error: null
  });
  
  const isMountedRef = useRef(true);
  
  const loadProducts = async () => {
    if (!isMountedRef.current) return;
    
    console.group('🛍️ Loading Featured Products');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('📡 Requesting featured products...');
      const response = await apiService.getFeaturedProducts();
      
      if (response && response.success && response.data) {
        const productsData = response.data;
        
        if (Array.isArray(productsData)) {
          console.log('🛍️ Products received:', {
            total: productsData.length,
            inStock: productsData.filter(p => p.inStock !== false).length,
            products: productsData.map(p => ({ 
              name: p.name, 
              price: p.price,
              category: p.category
            }))
          });
          
          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              products: productsData,
              isLoaded: true,
              isLoading: false,
              error: null
            }));
          }
          
          console.log('✅ Featured products loaded successfully');
        } else {
          throw new Error('Products data is not an array');
        }
      } else {
        throw new Error('Invalid products response');
      }
      
    } catch (error) {
      console.log('❌ Failed to load featured products:', error.message);
      console.log('💡 Store section will be hidden in the landing page');
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          products: [],
          isLoaded: true,
          isLoading: false,
          error: error.message
        }));
      }
    }
    
    console.groupEnd();
  };
  
  useEffect(() => {
    console.log('🚀 useFeaturedProducts hook initialized');
    loadProducts();
    return () => { 
      isMountedRef.current = false;
      console.log('🧹 useFeaturedProducts hook cleanup');
    };
  }, []);
  
  return {
    products: state.products,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    hasProducts: !!(state.products && Array.isArray(state.products) && state.products.length > 0)
  };
};

export default useFeaturedProducts;