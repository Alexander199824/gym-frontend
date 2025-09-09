// src/hooks/usePromoContent.js
// Autor: Alexander Echeverria
// Archivo: src/hooks/usePromoContent.js

// FUNCION: Hook para contenido promocional y CTAs
// CONECTA CON: GET /api/gym/promotional-content

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const usePromoContent = () => {
  // Estados
  const [promoContent, setPromoContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Contenido promocional por defecto mientras carga
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

  // Función para obtener contenido promocional
  const fetchPromotionalContent = async (force = false) => {
    // Cache de 15 minutos (contenido promocional puede cambiar frecuentemente)
    if (promoContent && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 15 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo contenido promocional desde backend...');
      
      const response = await apiService.getPromotionalContent();
      
      if (response.success && response.data) {
        console.log('Contenido promocional obtenido:', response.data);
        setPromoContent(response.data);
        setLastFetch(Date.now());
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error al obtener contenido promocional:', error);
      setError(error.message);
      
      // En caso de error, usar contenido por defecto
      if (!promoContent) {
        setPromoContent(defaultPromoContent);
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar contenido al montar
  useEffect(() => {
    fetchPromotionalContent();
  }, []);

  // Función para refrescar contenido promocional
  const refresh = () => {
    fetchPromotionalContent(true);
  };

  // Función para obtener la oferta principal
  const getMainOffer = () => {
    return promoContent?.main_offer || defaultPromoContent.main_offer;
  };

  // Función para obtener CTA card
  const getCTACard = () => {
    return promoContent?.cta_card || defaultPromoContent.cta_card;
  };

  // Función para obtener características destacadas
  const getFeatures = () => {
    return promoContent?.features || [];
  };

  // Función para obtener mensaje motivacional
  const getMotivationalMessage = () => {
    return promoContent?.motivational || defaultPromoContent.motivational;
  };

  // Función para obtener botones de CTA
  const getCTAButtons = () => {
    return promoContent?.cta_card?.buttons || [];
  };

  // Función para obtener beneficios del CTA
  const getCTABenefits = () => {
    return promoContent?.cta_card?.benefits || [];
  };

  // Función para verificar si hay ofertas activas
  const hasActiveOffers = () => {
    const mainOffer = getMainOffer();
    return mainOffer && mainOffer.title && mainOffer.title !== 'Cargando oferta...';
  };

  // Función para verificar si hay CTAs disponibles
  const hasCTAs = () => {
    const buttons = getCTAButtons();
    return buttons && buttons.length > 0;
  };

  // Función para obtener feature específico por título
  const getFeatureByTitle = (title) => {
    const features = getFeatures();
    return features.find(feature => feature.title === title);
  };

  // Función para verificar si el contenido promocional está completo
  const isContentComplete = () => {
    return hasActiveOffers() && hasCTAs() && getFeatures().length > 0;
  };

  // Retornar contenido promocional y funciones
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

/*
=== COMENTARIOS FINALES ===

PROPOSITO DEL ARCHIVO:
Este hook personalizado (usePromoContent) gestiona el contenido promocional dinámico
de la aplicación, incluyendo ofertas principales, CTAs (Call To Action), características
destacadas y mensajes motivacionales para los usuarios.

FUNCIONALIDAD PRINCIPAL:
- Obtención y cache de contenido promocional desde el backend
- Sistema de fallback con contenido por defecto durante la carga
- Cache inteligente de 15 minutos para optimizar peticiones
- Funciones auxiliares para acceder a secciones específicas del contenido
- Validaciones para verificar la completitud del contenido promocional
- Manejo robusto de errores con contenido de respaldo

ARCHIVOS A LOS QUE SE CONECTA:
- ../services/apiService: Servicio que maneja la petición GET /api/gym/promotional-content
- Componentes de la UI que muestran ofertas promocionales
- Componentes de CTA cards y botones de llamada a la acción
- Secciones de características destacadas del gimnasio
- Mensajes motivacionales en diferentes partes de la aplicación

ESTRUCTURA DEL CONTENIDO PROMOCIONAL:
- main_offer: Oferta principal con título, subtítulo y descripción
- cta_card: Tarjeta de llamada a la acción con beneficios y botones
- features: Características destacadas del gimnasio
- motivational: Mensajes motivacionales para los usuarios

FUNCIONES EXPORTADAS:
- getMainOffer(): Obtiene la oferta principal
- getCTACard(): Obtiene la tarjeta de CTA
- getFeatures(): Obtiene las características destacadas
- getMotivationalMessage(): Obtiene el mensaje motivacional
- getCTAButtons(): Obtiene los botones de llamada a la acción
- getCTABenefits(): Obtiene los beneficios del CTA
- hasActiveOffers(): Verifica si hay ofertas activas
- hasCTAs(): Verifica si hay CTAs disponibles
- isContentComplete(): Verifica si el contenido está completo
- refresh(): Fuerza la actualización del contenido

BENEFICIOS:
- Contenido promocional dinámico y actualizable desde el backend
- Experiencia de usuario mejorada con contenido de respaldo
- Optimización de peticiones con sistema de cache
- Flexibilidad para mostrar diferentes tipos de promociones
- Fácil integración con componentes de marketing y ventas

Este hook es especialmente útil para campañas de marketing dinámicas
donde el contenido promocional debe actualizarse frecuentemente sin
necesidad de desplegar cambios en el código.
*/