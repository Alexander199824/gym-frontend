// src/hooks/usePromoContent.js
// FUNCIÓN: Hook para contenido promocional y CTAs
// CONECTA CON: GET /api/gym/promotional-content

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const usePromoContent = () => {
  // 🏗️ Estados
  const [promoContent, setPromoContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 📱 Contenido promocional por defecto mientras carga
  const defaultPromoContent = {
    main_offer: {
      title: 'Cargando oferta...',
      subtitle: 'Cargando...',
      description: 'Cargando...'
    },
    cta_card: {
      title: 'Cargando...',
      benefits: [],
      buttons: []
    },
    features: [],
    motivational: {
      title: 'Cargando...',
      message: 'Cargando...'
    }
  };

  // 🚀 Función para obtener contenido promocional
  const fetchPromotionalContent = async (force = false) => {
    // Cache de 15 minutos (contenido promocional puede cambiar frecuentemente)
    if (promoContent && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 15 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🎉 Obteniendo contenido promocional desde backend...');
      
      const response = await apiService.getPromotionalContent();
      
      if (response.success && response.data) {
        console.log('✅ Contenido promocional obtenido:', response.data);
        setPromoContent(response.data);
        setLastFetch(Date.now());
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al obtener contenido promocional:', error);
      setError(error.message);
      
      // En caso de error, usar contenido por defecto
      if (!promoContent) {
        setPromoContent(defaultPromoContent);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar contenido al montar
  useEffect(() => {
    fetchPromotionalContent();
  }, []);

  // 🎯 Función para refrescar contenido promocional
  const refresh = () => {
    fetchPromotionalContent(true);
  };

  // 🏆 Función para obtener la oferta principal
  const getMainOffer = () => {
    return promoContent?.main_offer || defaultPromoContent.main_offer;
  };

  // 🎯 Función para obtener CTA card
  const getCTACard = () => {
    return promoContent?.cta_card || defaultPromoContent.cta_card;
  };

  // ⭐ Función para obtener características destacadas
  const getFeatures = () => {
    return promoContent?.features || [];
  };

  // 💡 Función para obtener mensaje motivacional
  const getMotivationalMessage = () => {
    return promoContent?.motivational || defaultPromoContent.motivational;
  };

  // 🎨 Función para obtener botones de CTA
  const getCTAButtons = () => {
    return promoContent?.cta_card?.buttons || [];
  };

  // 🎁 Función para obtener beneficios del CTA
  const getCTABenefits = () => {
    return promoContent?.cta_card?.benefits || [];
  };

  // 📊 Función para verificar si hay ofertas activas
  const hasActiveOffers = () => {
    const mainOffer = getMainOffer();
    return mainOffer && mainOffer.title && mainOffer.title !== 'Cargando oferta...';
  };

  // 🎯 Función para verificar si hay CTAs disponibles
  const hasCTAs = () => {
    const buttons = getCTAButtons();
    return buttons && buttons.length > 0;
  };

  // 🌟 Función para obtener feature específico por título
  const getFeatureByTitle = (title) => {
    const features = getFeatures();
    return features.find(feature => feature.title === title);
  };

  // 🎨 Función para verificar si el contenido promocional está completo
  const isContentComplete = () => {
    return hasActiveOffers() && hasCTAs() && getFeatures().length > 0;
  };

  // 🏠 Retornar contenido promocional y funciones
  return {
    // Estado
    promoContent: promoContent || defaultPromoContent,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getMainOffer,
    getCTACard,
    getFeatures,
    getMotivationalMessage,
    getCTAButtons,
    getCTABenefits,
    getFeatureByTitle,
    
    // Verificaciones
    hasActiveOffers,
    hasCTAs,
    isContentComplete,
    
    // Acceso directo (para compatibilidad)
    mainOffer: getMainOffer(),
    ctaCard: getCTACard(),
    features: getFeatures(),
    motivational: getMotivationalMessage(),
    ctaButtons: getCTAButtons(),
    ctaBenefits: getCTABenefits(),
    
    // Estado útil
    isLoaded: !loading && !!promoContent && !error,
    hasError: !!error,
    isEmpty: !promoContent || !hasActiveOffers()
  };
};

export default usePromoContent;