// src/hooks/useMembershipPlans.js
// FUNCIÓN: Hook para planes de membresía del gimnasio - CORREGIDO
// CONECTA CON: GET /api/gym/membership-plans

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useMembershipPlans = () => {
  // 🏗️ Estados
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 💳 Planes por defecto mientras carga (vacío para forzar backend)
  const defaultPlans = [];

  // 🚀 Función para obtener planes de membresía
  const fetchMembershipPlans = async (force = false) => {
    // Cache de 20 minutos (planes no cambian muy frecuentemente)
    if (plans && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 20 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('💳 Obteniendo planes de membresía desde backend...');
      
      // Verificar que apiService tenga la función
      if (!apiService || typeof apiService.getMembershipPlans !== 'function') {
        throw new Error('apiService.getMembershipPlans no está disponible');
      }
      
      const response = await apiService.getMembershipPlans();
      
      if (response && response.success && response.data && Array.isArray(response.data)) {
        console.log('✅ Planes de membresía obtenidos:', response.data);
        
        // Ordenar planes - populares primero, luego por precio
        const sortedPlans = response.data.sort((a, b) => {
          // Populares primero
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          // Luego por orden si existe
          if (a.order && b.order) return a.order - b.order;
          // Finalmente por precio
          return (a.price || 0) - (b.price || 0);
        });
        
        setPlans(sortedPlans);
        setLastFetch(Date.now());
      } else {
        console.warn('⚠️ Respuesta inválida del servidor para planes de membresía');
        setPlans(defaultPlans);
      }
    } catch (error) {
      console.error('❌ Error al obtener planes de membresía:', error);
      setError(error.message);
      
      // En caso de error, usar planes por defecto (vacío)
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar planes al montar
  useEffect(() => {
    fetchMembershipPlans();
  }, []);

  // 🎯 Función para refrescar planes
  const refresh = () => {
    fetchMembershipPlans(true);
  };

  // 🔍 Función para obtener plan por ID
  const getPlanById = (id) => {
    if (!plans || !Array.isArray(plans)) return null;
    return plans.find(plan => plan.id === id);
  };

  // 🔍 Función para obtener plan por nombre
  const getPlanByName = (name) => {
    if (!plans || !Array.isArray(plans)) return null;
    return plans.find(plan => 
      plan.name && plan.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  // ⭐ Función para obtener planes populares
  const getPopularPlans = () => {
    if (!plans || !Array.isArray(plans)) return [];
    return plans.filter(plan => plan.popular);
  };

  // 💰 Función para obtener planes con descuento
  const getDiscountedPlans = () => {
    if (!plans || !Array.isArray(plans)) return [];
    return plans.filter(plan => 
      plan.originalPrice && plan.originalPrice > plan.price
    );
  };

  // 📱 Función para obtener planes para móvil (información compacta)
  const getMobilePlans = () => {
    if (!plans || !Array.isArray(plans)) return [];
    return plans.map(plan => ({
      ...plan,
      shortFeatures: plan.features?.slice(0, 3) || [],
      hasMoreFeatures: plan.features && plan.features.length > 3
    }));
  };

  // 💲 Función para calcular descuento de un plan
  const getDiscount = (plan) => {
    if (!plan || !plan.originalPrice || plan.originalPrice <= plan.price) {
      return 0;
    }
    return Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
  };

  // 💰 Función para formatear precio
  const formatPrice = (price) => {
    if (typeof price !== 'number') return 'Q0.00';
    return `Q${price.toFixed(2)}`;
  };

  // 🏷️ Función para obtener tipo de duración únicos
  const getDurationTypes = () => {
    if (!plans || !Array.isArray(plans)) return [];
    
    const durations = new Set();
    plans.forEach(plan => {
      if (plan.duration) {
        durations.add(plan.duration);
      }
    });
    
    return Array.from(durations);
  };

  // 🔍 Función para filtrar planes por duración
  const getPlansByDuration = (duration) => {
    if (!plans || !Array.isArray(plans)) return [];
    return plans.filter(plan => plan.duration === duration);
  };

  // 📊 Función para obtener estadísticas de planes
  const getPlansStats = () => {
    if (!plans || !Array.isArray(plans) || plans.length === 0) return null;
    
    const prices = plans.map(p => p.price || 0).filter(p => p > 0);
    if (prices.length === 0) return null;
    
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
      total: plans.length,
      popular: getPopularPlans().length,
      discounted: getDiscountedPlans().length,
      averagePrice: avgPrice.toFixed(2),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      durations: getDurationTypes().length
    };
  };

  // 🎯 Función para verificar si hay planes válidos
  const hasValidPlans = () => {
    return plans && Array.isArray(plans) && plans.length > 0;
  };

  // 🔍 Función para buscar planes
  const searchPlans = (query) => {
    if (!plans || !Array.isArray(plans) || !query) return plans || [];
    
    const searchTerm = query.toLowerCase();
    return plans.filter(plan =>
      (plan.name && plan.name.toLowerCase().includes(searchTerm)) ||
      (plan.description && plan.description.toLowerCase().includes(searchTerm)) ||
      (plan.features && plan.features.some(feature => 
        feature.toLowerCase().includes(searchTerm)
      ))
    );
  };

  // 🎨 Función para obtener planes formateados para display
  const getDisplayPlans = () => {
    if (!plans || !Array.isArray(plans)) return [];
    
    return plans.map(plan => ({
      ...plan,
      discount: getDiscount(plan),
      formattedPrice: formatPrice(plan.price),
      formattedOriginalPrice: plan.originalPrice ? formatPrice(plan.originalPrice) : null,
      hasDiscount: getDiscount(plan) > 0,
      savings: plan.originalPrice ? plan.originalPrice - plan.price : 0,
      formattedSavings: plan.originalPrice ? formatPrice(plan.originalPrice - plan.price) : null,
      // Mapear iconos
      iconName: plan.icon || (plan.popular ? 'Crown' : 'Shield'),
      // Información adicional
      isBasic: plan.name && plan.name.toLowerCase().includes('básico') || plan.name.toLowerCase().includes('basic'),
      isPremium: plan.name && plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('pro'),
      isVIP: plan.name && plan.name.toLowerCase().includes('vip') || plan.name.toLowerCase().includes('elite')
    }));
  };

  // 🔝 Función para obtener el plan más popular
  const getMostPopularPlan = () => {
    const popularPlans = getPopularPlans();
    return popularPlans.length > 0 ? popularPlans[0] : null;
  };

  // 💎 Función para obtener el plan más caro (premium) - CORREGIDA
  const getPremiumPlan = () => {
    if (!plans || !Array.isArray(plans) || plans.length === 0) return null;
    
    // CORREGIR: Agregar valor inicial al reduce
    return plans.reduce((prev, current) => {
      const prevPrice = prev.price || 0;
      const currentPrice = current.price || 0;
      return prevPrice > currentPrice ? prev : current;
    }, plans[0]); // Valor inicial: primer elemento del array
  };

  // 💰 Función para obtener el plan más económico - CORREGIDA
  const getCheapestPlan = () => {
    if (!plans || !Array.isArray(plans) || plans.length === 0) return null;
    
    // CORREGIR: Agregar valor inicial al reduce
    return plans.reduce((prev, current) => {
      const prevPrice = prev.price || Infinity;
      const currentPrice = current.price || Infinity;
      return prevPrice < currentPrice ? prev : current;
    }, plans[0]); // Valor inicial: primer elemento del array
  };

  // 🎯 Función para filtrar planes por precio
  const getPlansByPriceRange = (minPrice, maxPrice) => {
    if (!plans || !Array.isArray(plans)) return [];
    return plans.filter(plan => 
      plan.price >= minPrice && plan.price <= maxPrice
    );
  };

  // 🏆 Función para recomendar plan basado en características
  const getRecommendedPlan = (preferences = {}) => {
    if (!plans || !Array.isArray(plans) || plans.length === 0) return null;
    
    let scores = plans.map(plan => ({
      plan,
      score: 0
    }));
    
    // Scoring basado en preferencias
    scores.forEach(item => {
      const { plan } = item;
      
      // Si busca popularidad
      if (preferences.popular && plan.popular) {
        item.score += 10;
      }
      
      // Si busca descuentos
      if (preferences.discount && getDiscount(plan) > 0) {
        item.score += 5;
      }
      
      // Si tiene rango de precio preferido
      if (preferences.maxPrice && plan.price <= preferences.maxPrice) {
        item.score += 3;
      }
      
      // Si busca muchas características
      if (preferences.features && plan.features) {
        item.score += plan.features.length;
      }
    });
    
    // Ordenar por score y retornar el mejor
    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.plan || null;
  };

  // 🏠 Retornar planes y funciones
  return {
    // Estado
    plans: plans || defaultPlans,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getPlanById,
    getPlanByName,
    getPopularPlans,
    getDiscountedPlans,
    getMobilePlans,
    getDisplayPlans,
    searchPlans,
    getPlansByDuration,
    getPlansByPriceRange,
    
    // Funciones de utilidad
    getDiscount,
    formatPrice,
    getDurationTypes,
    getPlansStats,
    getMostPopularPlan,
    getPremiumPlan,
    getCheapestPlan,
    getRecommendedPlan,
    
    // Verificaciones
    hasValidPlans,
    
    // Acceso directo (para compatibilidad)
    allPlans: plans || defaultPlans,
    popularPlans: getPopularPlans(),
    discountedPlans: getDiscountedPlans(),
    mostPopular: getMostPopularPlan(),
    premium: getPremiumPlan(),
    cheapest: getCheapestPlan(),
    stats: getPlansStats(),
    
    // Estado útil
    isLoaded: !loading && plans !== null && !error,
    hasError: !!error,
    isEmpty: !plans || !Array.isArray(plans) || plans.length === 0,
    count: plans && Array.isArray(plans) ? plans.length : 0,
    hasPopular: getPopularPlans().length > 0,
    hasDiscounts: getDiscountedPlans().length > 0
  };
};

export default useMembershipPlans;