// src/hooks/useFeaturedProducts.js
// FUNCIÓN: Hook para productos destacados de la tienda
// CONECTA CON: GET /api/store/featured-products

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useFeaturedProducts = () => {
  // 🏗️ Estados
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 🛍️ Productos por defecto mientras carga
  const defaultProducts = [
    {
      id: 1,
      name: 'Cargando productos...',
      description: 'Por favor espera...',
      price: 0,
      originalPrice: 0,
      image: '/api/placeholder/300/300',
      category: 'general',
      rating: 0,
      reviews: 0,
      badge: 'Cargando',
      featured: true
    }
  ];

  // 🚀 Función para obtener productos destacados
  const fetchFeaturedProducts = async (force = false) => {
    // Cache de 10 minutos (productos pueden cambiar frecuentemente)
    if (products && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 10 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🛍️ Obteniendo productos destacados desde backend...');
      
      const response = await apiService.getFeaturedProducts();
      
      if (response.success && response.data) {
        console.log('✅ Productos destacados obtenidos:', response.data);
        setProducts(response.data);
        setLastFetch(Date.now());
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al obtener productos destacados:', error);
      setError(error.message);
      
      // En caso de error, usar productos por defecto
      if (!products) {
        setProducts(defaultProducts);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar productos al montar
  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // 🎯 Función para refrescar productos
  const refresh = () => {
    fetchFeaturedProducts(true);
  };

  // 🔍 Función para obtener producto por ID
  const getProductById = (id) => {
    return products?.find(product => product.id === id);
  };

  // 🏷️ Función para obtener productos por categoría
  const getProductsByCategory = (category) => {
    return products?.filter(product => product.category === category) || [];
  };

  // 🔝 Función para obtener productos con mejor rating
  const getTopRatedProducts = (minRating = 4.5) => {
    return products?.filter(product => product.rating >= minRating) || [];
  };

  // 💰 Función para obtener productos en oferta
  const getDiscountedProducts = () => {
    return products?.filter(product => 
      product.originalPrice && product.originalPrice > product.price
    ) || [];
  };

  // 🆕 Función para obtener productos nuevos
  const getNewProducts = () => {
    return products?.filter(product => 
      product.badge && product.badge.toLowerCase().includes('nuevo')
    ) || [];
  };

  // 🔥 Función para obtener productos más vendidos
  const getBestSellers = () => {
    return products?.filter(product => 
      product.badge && product.badge.toLowerCase().includes('vendido')
    ) || [];
  };

  // 📱 Función para obtener productos para móvil (información compacta)
  const getMobileProducts = () => {
    return products?.map(product => ({
      ...product,
      shortName: product.name.length > 30 
        ? `${product.name.substring(0, 30)}...` 
        : product.name,
      shortDescription: product.description.length > 80 
        ? `${product.description.substring(0, 80)}...` 
        : product.description
    })) || [];
  };

  // 💲 Función para calcular descuento
  const getDiscount = (product) => {
    if (!product.originalPrice || product.originalPrice <= product.price) {
      return 0;
    }
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  };

  // 💰 Función para formatear precio
  const formatPrice = (price) => {
    return `Q${price.toFixed(2)}`;
  };

  // ⭐ Función para generar estrellas de rating
  const generateStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => ({
      filled: index < Math.floor(rating),
      half: index === Math.floor(rating) && rating % 1 >= 0.5,
      key: `star-${index}`
    }));
  };

  // 🏷️ Función para obtener categorías únicas
  const getCategories = () => {
    if (!products) return [];
    
    const categories = new Set();
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    
    return Array.from(categories);
  };

  // 🔍 Función para buscar productos
  const searchProducts = (query) => {
    if (!products || !query) return products || [];
    
    const searchTerm = query.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  };

  // 📊 Función para obtener estadísticas de productos
  const getProductsStats = () => {
    if (!products) return null;
    
    const ratings = products.map(p => p.rating).filter(r => r > 0);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    const averagePrice = products.reduce((sum, product) => sum + product.price, 0) / products.length;
    
    return {
      total: products.length,
      categories: getCategories().length,
      averageRating: averageRating.toFixed(1),
      averagePrice: averagePrice.toFixed(2),
      discounted: getDiscountedProducts().length,
      topRated: getTopRatedProducts().length,
      new: getNewProducts().length,
      bestSellers: getBestSellers().length
    };
  };

  // 🎯 Función para verificar si hay productos válidos
  const hasValidProducts = () => {
    return products && 
           products.length > 0 && 
           products[0].name !== 'Cargando productos...';
  };

  // 🎨 Función para obtener productos formateados para display
  const getDisplayProducts = () => {
    if (!products) return [];
    
    return products.map(product => ({
      ...product,
      discount: getDiscount(product),
      formattedPrice: formatPrice(product.price),
      formattedOriginalPrice: product.originalPrice ? formatPrice(product.originalPrice) : null,
      stars: generateStars(product.rating),
      hasDiscount: getDiscount(product) > 0,
      shortName: product.name.length > 40 
        ? `${product.name.substring(0, 40)}...` 
        : product.name,
      shortDescription: product.description.length > 100 
        ? `${product.description.substring(0, 100)}...` 
        : product.description,
      isNew: product.badge && product.badge.toLowerCase().includes('nuevo'),
      isBestSeller: product.badge && product.badge.toLowerCase().includes('vendido'),
      isTopRated: product.rating >= 4.5
    }));
  };

  // 🛒 Función para obtener información de disponibilidad
  const getAvailabilityInfo = (product) => {
    // Esto podría expandirse con datos del backend
    return {
      inStock: true, // Por defecto asumimos que está en stock
      quantity: product.stock || null,
      canOrder: true,
      estimatedDelivery: '2-3 días hábiles'
    };
  };

  // 🎯 Función para filtrar productos por precio
  const getProductsByPriceRange = (minPrice, maxPrice) => {
    return products?.filter(product => 
      product.price >= minPrice && product.price <= maxPrice
    ) || [];
  };

  // 🏆 Función para obtener los mejores productos por criterio
  const getTopProducts = (limit = 3, criteria = 'rating') => {
    if (!products) return [];
    
    let sortedProducts = [...products];
    
    switch (criteria) {
      case 'rating':
        sortedProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        sortedProducts.sort((a, b) => b.reviews - a.reviews);
        break;
      case 'discount':
        sortedProducts.sort((a, b) => getDiscount(b) - getDiscount(a));
        break;
      case 'price_low':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      default:
        // Mantener orden original
        break;
    }
    
    return sortedProducts.slice(0, limit);
  };

  // 🏠 Retornar productos y funciones
  return {
    // Estado
    products: products || defaultProducts,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getProductById,
    getProductsByCategory,
    getTopRatedProducts,
    getDiscountedProducts,
    getNewProducts,
    getBestSellers,
    getMobileProducts,
    getDisplayProducts,
    getTopProducts,
    searchProducts,
    getProductsByPriceRange,
    
    // Utilidades
    getDiscount,
    formatPrice,
    generateStars,
    getCategories,
    getProductsStats,
    getAvailabilityInfo,
    
    // Verificaciones
    hasValidProducts,
    
    // Acceso directo (para compatibilidad)
    allProducts: products || defaultProducts,
    discountedProducts: getDiscountedProducts(),
    topRatedProducts: getTopRatedProducts(),
    newProducts: getNewProducts(),
    bestSellers: getBestSellers(),
    categories: getCategories(),
    stats: getProductsStats(),
    
    // Estado útil
    isLoaded: !loading && !!products && !error && hasValidProducts(),
    hasError: !!error,
    isEmpty: !products || products.length === 0 || !hasValidProducts(),
    count: products?.length || 0,
    hasDiscounts: getDiscountedProducts().length > 0,
    hasNewProducts: getNewProducts().length > 0,
    hasBestSellers: getBestSellers().length > 0
  };
};

export default useFeaturedProducts;