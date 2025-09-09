// Autor: Alexander Echeverria
// src/hooks/useActivePromotions.js
// FUNCIÓN: Hook para gestión de promociones activas del gimnasio

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useActivePromotions = () => {
  // Estados
  const [promotions, setPromotions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Promociones por defecto mientras carga
  const defaultPromotions = [];

  // Función para obtener promociones activas
  const fetchActivePromotions = async (force = false) => {
    // Cache de 2 minutos (promociones pueden cambiar frecuentemente)
    if (promotions && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 2 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo promociones activas desde backend...');
      
      const response = await apiService.getPromotions();
      
      if (response.success && response.data) {
        console.log('Promociones activas obtenidas:', response.data);
        
        // Filtrar solo promociones activas y vigentes
        const activePromotions = response.data.filter(promo => {
          if (!promo.active) return false;
          
          const now = new Date();
          const startDate = promo.start_date ? new Date(promo.start_date) : null;
          const endDate = promo.end_date ? new Date(promo.end_date) : null;
          
          // Verificar fechas de vigencia
          if (startDate && now < startDate) return false;
          if (endDate && now > endDate) return false;
          
          return true;
        });
        
        // Ordenar por prioridad (si existe) o por fecha de creación
        activePromotions.sort((a, b) => {
          if (a.priority && b.priority) return b.priority - a.priority;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        setPromotions(activePromotions);
        setLastFetch(Date.now());
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error al obtener promociones activas:', error);
      setError(error.message);
      
      // En caso de error, usar promociones por defecto
      if (!promotions) {
        setPromotions(defaultPromotions);
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar promociones al montar
  useEffect(() => {
    fetchActivePromotions();
  }, []);

  // Efecto para auto-actualizar promociones cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivePromotions();
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, []);

  // Función para refrescar promociones
  const refresh = () => {
    fetchActivePromotions(true);
  };

  // Función para obtener promoción por tipo
  const getPromotionByType = (type) => {
    return promotions?.find(promo => promo.type === type);
  };

  // Función para verificar si "primera semana gratis" está activa
  const isFreeWeekActive = () => {
    const freeWeekPromo = getPromotionByType('free_week') || 
                         getPromotionByType('primera_semana_gratis') ||
                         promotions?.find(promo => 
                           promo.title?.toLowerCase().includes('primera semana') ||
                           promo.title?.toLowerCase().includes('semana gratis') ||
                           promo.title?.toLowerCase().includes('free week')
                         );
    
    return !!freeWeekPromo;
  };

  // Función para obtener datos de "primera semana gratis"
  const getFreeWeekPromotion = () => {
    const freeWeekPromo = getPromotionByType('free_week') || 
                         getPromotionByType('primera_semana_gratis') ||
                         promotions?.find(promo => 
                           promo.title?.toLowerCase().includes('primera semana') ||
                           promo.title?.toLowerCase().includes('semana gratis') ||
                           promo.title?.toLowerCase().includes('free week')
                         );
    
    return freeWeekPromo || null;
  };

  // Función para obtener promociones destacadas
  const getFeaturedPromotions = () => {
    return promotions?.filter(promo => promo.featured) || [];
  };

  // Función para obtener promociones por categoría
  const getPromotionsByCategory = (category) => {
    return promotions?.filter(promo => promo.category === category) || [];
  };

  // Función para verificar si una promoción está por vencer
  const isPromotionExpiringSoon = (promotion, hours = 24) => {
    if (!promotion.end_date) return false;
    
    const now = new Date();
    const endDate = new Date(promotion.end_date);
    const hoursUntilExpiry = (endDate - now) / (1000 * 60 * 60);
    
    return hoursUntilExpiry <= hours && hoursUntilExpiry > 0;
  };

  // Función para obtener promociones que expiran pronto
  const getExpiringSoonPromotions = (hours = 24) => {
    return promotions?.filter(promo => isPromotionExpiringSoon(promo, hours)) || [];
  };

  // Función para obtener promoción principal (la más importante)
  const getMainPromotion = () => {
    if (!promotions || promotions.length === 0) return null;
    
    // Buscar promoción marcada como principal
    const mainPromo = promotions.find(promo => promo.is_main || promo.main);
    if (mainPromo) return mainPromo;
    
    // Si no hay principal, retornar la primera (ya están ordenadas por prioridad)
    return promotions[0];
  };

  // Función para obtener promociones para CTA buttons
  const getPromotionCTAs = () => {
    const freeWeekPromo = getFreeWeekPromotion();
    const mainPromo = getMainPromotion();
    
    const ctas = [];
    
    // CTA principal basado en promoción activa
    if (freeWeekPromo) {
      ctas.push({
        text: freeWeekPromo.cta_text || freeWeekPromo.title || 'Primera Semana GRATIS',
        type: 'primary',
        action: 'register',
        icon: 'gift',
        promotion: freeWeekPromo
      });
    } else if (mainPromo) {
      ctas.push({
        text: mainPromo.cta_text || mainPromo.title || 'Únete Ahora',
        type: 'primary',
        action: 'register',
        icon: 'star',
        promotion: mainPromo
      });
    } else {
      // CTA genérico si no hay promociones
      ctas.push({
        text: 'Únete Ahora',
        type: 'primary',
        action: 'register',
        icon: 'star',
        promotion: null
      });
    }
    
    // CTA secundario (tienda)
    ctas.push({
      text: 'Ver Tienda',
      type: 'secondary',
      action: 'store',
      icon: 'shopping-cart',
      promotion: null
    });
    
    return ctas;
  };

  // Función para obtener estadísticas de promociones
  const getPromotionsStats = () => {
    if (!promotions) return null;
    
    const now = new Date();
    
    return {
      total: promotions.length,
      featured: getFeaturedPromotions().length,
      expiringSoon: getExpiringSoonPromotions().length,
      hasFreeWeek: isFreeWeekActive(),
      categories: [...new Set(promotions.map(p => p.category).filter(Boolean))].length,
      active: promotions.length, // Ya están filtradas las activas
      withEndDate: promotions.filter(p => p.end_date).length
    };
  };

  // Función para buscar promociones
  const searchPromotions = (query) => {
    if (!promotions || !query) return promotions || [];
    
    const searchTerm = query.toLowerCase();
    return promotions.filter(promo =>
      promo.title?.toLowerCase().includes(searchTerm) ||
      promo.description?.toLowerCase().includes(searchTerm) ||
      promo.type?.toLowerCase().includes(searchTerm)
    );
  };

  // Función para verificar si hay promociones válidas
  const hasValidPromotions = () => {
    return promotions && promotions.length > 0;
  };

  // Función para obtener promociones formateadas para display
  const getDisplayPromotions = () => {
    if (!promotions) return [];
    
    return promotions.map(promo => {
      const now = new Date();
      const endDate = promo.end_date ? new Date(promo.end_date) : null;
      const hoursUntilExpiry = endDate ? (endDate - now) / (1000 * 60 * 60) : null;
      
      return {
        ...promo,
        isExpiringSoon: hoursUntilExpiry && hoursUntilExpiry <= 24 && hoursUntilExpiry > 0,
        hoursUntilExpiry: hoursUntilExpiry,
        daysUntilExpiry: hoursUntilExpiry ? Math.ceil(hoursUntilExpiry / 24) : null,
        formattedEndDate: endDate ? endDate.toLocaleDateString('es-GT') : null,
        urgencyLevel: hoursUntilExpiry ? 
          hoursUntilExpiry <= 6 ? 'high' : 
          hoursUntilExpiry <= 24 ? 'medium' : 'low' : 'none'
      };
    });
  };

  // Función para obtener texto promocional dinámico
  const getPromotionalText = (fallback = 'Únete Ahora') => {
    const freeWeekPromo = getFreeWeekPromotion();
    const mainPromo = getMainPromotion();
    
    if (freeWeekPromo) {
      return freeWeekPromo.title || 'Primera Semana GRATIS';
    }
    
    if (mainPromo) {
      return mainPromo.title || fallback;
    }
    
    return fallback;
  };

  // Retornar promociones y funciones
  return {
    // Estado
    promotions: promotions || defaultPromotions,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getPromotionByType,
    getFreeWeekPromotion,
    getFeaturedPromotions,
    getPromotionsByCategory,
    getExpiringSoonPromotions,
    getMainPromotion,
    getPromotionCTAs,
    getDisplayPromotions,
    searchPromotions,
    
    // Funciones de verificación
    isFreeWeekActive,
    isPromotionExpiringSoon,
    hasValidPromotions,
    
    // Utilidades
    getPromotionsStats,
    getPromotionalText,
    
    // Acceso directo (para compatibilidad)
    allPromotions: promotions || defaultPromotions,
    freeWeekPromotion: getFreeWeekPromotion(),
    mainPromotion: getMainPromotion(),
    featuredPromotions: getFeaturedPromotions(),
    promotionCTAs: getPromotionCTAs(),
    stats: getPromotionsStats(),
    
    // Estado útil
    isLoaded: !loading && promotions !== null && !error,
    hasError: !!error,
    isEmpty: !promotions || promotions.length === 0,
    count: promotions?.length || 0,
    hasFreeWeek: isFreeWeekActive(),
    hasMainPromotion: !!getMainPromotion(),
    hasFeatured: getFeaturedPromotions().length > 0
  };
};

export default useActivePromotions;

/*
DOCUMENTACIÓN DEL HOOK useActivePromotions

PROPÓSITO:
Este hook personalizado gestiona las promociones activas del gimnasio, proporcionando una interfaz
completa para obtener, filtrar y mostrar ofertas especiales, descuentos en membresías, promociones
de primera semana gratis y otras campañas de marketing del gimnasio. Incluye funcionalidades de
cache, auto-actualización y filtrado inteligente.

FUNCIONALIDADES PRINCIPALES:
- Obtención automática de promociones activas desde el backend
- Filtrado por fechas de vigencia y estado activo
- Cache inteligente con actualización automática cada 5 minutos
- Funciones de búsqueda y categorización de promociones
- Generación automática de CTAs (llamadas a la acción)
- Detección de promociones por vencer
- Estadísticas y métricas de promociones
- Formateo de fechas para Guatemala (es-GT)

ARCHIVOS Y CONEXIONES:

SERVICIOS UTILIZADOS:
- ../services/apiService: Comunicación con backend del gimnasio
  * getPromotions(): Endpoint GET /api/gym/promotions para obtener promociones

DEPENDENCIAS DE REACT:
- useState: Gestión de estados locales del hook
- useEffect: Efectos para carga inicial y auto-actualización

QUE PROPORCIONA AL USUARIO DEL GIMNASIO:

PROMOCIONES MOSTRADAS:
El hook proporciona datos para mostrar al usuario las siguientes promociones:

**Promoción "Primera Semana Gratis"**:
- Detección automática por tipo 'free_week' o 'primera_semana_gratis'
- Búsqueda flexible por títulos que contengan "primera semana" o "semana gratis"
- Función isFreeWeekActive() para verificar disponibilidad
- Texto personalizable para CTAs de registro

**Promoción Principal**:
- Promoción marcada como is_main o main en el backend
- Si no hay principal, toma la primera por prioridad
- Utilizada para banners principales y CTAs destacados
- Texto dinámico para botones de acción

**Promociones Destacadas**:
- Filtradas por campo 'featured' = true
- Mostradas en secciones especiales del sitio web
- Utilizadas para carruseles y banners secundarios
- Ordenadas por prioridad o fecha de creación

**Promociones por Categoría**:
- Agrupadas por categorías (membresías, productos, servicios)
- Filtrado específico para diferentes secciones del sitio
- Navegación contextual de ofertas

**Promociones por Vencer**:
- Detección automática de promociones que expiran en 24 horas
- Niveles de urgencia: 'high' (6 horas), 'medium' (24 horas), 'low' (más tiempo)
- Indicadores visuales de tiempo restante
- Texto de urgencia para motivar acción rápida

**CTAs (Llamadas a la Acción) Generados**:
- **CTA Primario**: 
  - "Primera Semana GRATIS" si hay promoción activa de semana gratis
  - Título de promoción principal si existe
  - "Únete Ahora" como fallback genérico
  - Incluye icono y tipo de acción (register)

- **CTA Secundario**:
  - "Ver Tienda" para dirigir a productos del gimnasio
  - Tipo 'secondary' con icono de carrito de compras
  - Redirige a la tienda de suplementos y equipos

**Información de Promociones Mostrada**:
- **Título**: Nombre de la promoción
- **Descripción**: Detalles de la oferta
- **Fechas**: Inicio y fin de vigencia en formato guatemalteco (dd/MM/yyyy)
- **Descuento**: Porcentaje o monto de descuento en quetzales
- **Categoría**: Tipo de promoción (membresía, producto, servicio)
- **Estado de urgencia**: Indicador visual si está por vencer
- **Términos y condiciones**: Restricciones y limitaciones

**Estadísticas de Promociones**:
- Número total de promociones activas
- Cantidad de promociones destacadas
- Promociones por vencer pronto
- Disponibilidad de primera semana gratis
- Número de categorías disponibles

CARACTERÍSTICAS TÉCNICAS:

**Sistema de Cache**:
- Cache local de 2 minutos para evitar consultas excesivas
- Auto-actualización cada 5 minutos en background
- Forzado de actualización disponible con refresh()

**Filtrado Inteligente**:
- Solo promociones con active = true
- Verificación de fechas de inicio y fin
- Ordenamiento por prioridad y fecha de creación
- Filtrado por categorías y tipos específicos

**Manejo de Estados**:
- loading: Indica si está cargando datos
- error: Mensaje de error si falla la carga
- isLoaded: Confirma que los datos están disponibles
- isEmpty: Indica si no hay promociones activas

**Funciones de Búsqueda**:
- Búsqueda por título, descripción o tipo
- Filtros por categoría específica
- Detección de promociones específicas (semana gratis)
- Búsqueda de promociones por vencer

**Formateo para Guatemala**:
- Fechas en formato es-GT (dd/MM/yyyy)
- Timezone local automático
- Textos en español
- Moneda en quetzales cuando aplique

CASOS DE USO EN EL GIMNASIO:

**Página Principal**:
- Banner principal con promoción destacada
- CTAs dinámicos basados en ofertas activas
- Indicadores de urgencia para ofertas limitadas

**Página de Membresías**:
- Promociones específicas de membresías
- Descuentos en planes anuales
- Ofertas de primera semana gratis

**Tienda de Productos**:
- Descuentos en suplementos
- Ofertas especiales en equipos
- Promociones por compras combinadas

**Landing Pages**:
- Contenido dinámico basado en campañas activas
- A/B testing con diferentes promociones
- Personalización por segmento de usuario

INTEGRACIÓN CON MARKETING:

**Campañas Estacionales**:
- Promociones de enero (nuevos propósitos)
- Ofertas de verano (preparación física)
- Descuentos de fin de año

**Promociones de Retención**:
- Ofertas para miembros existentes
- Descuentos por renovación anticipada
- Programas de referidos

**Promociones de Adquisición**:
- Primera semana gratis para nuevos miembros
- Descuentos por registro online
- Ofertas especiales para estudiantes

MÉTRICAS Y ANÁLISIS:
- Tracking de visualizaciones de promociones
- Conversión de CTAs promocionales
- Efectividad de ofertas por categoría
- Análisis de urgencia vs conversión

PERSONALIZACIÓN:
- Promociones diferentes por tipo de usuario
- Ofertas geográficas específicas para Guatemala
- Precios en quetzales guatemaltecos
- Contenido adaptado a cultura local

ERROR HANDLING:
- Fallbacks cuando el backend no responde
- Promociones por defecto en caso de error
- Logging de errores para debugging
- Estados de carga suaves para UX

Este hook es fundamental para el sistema de marketing del gimnasio, permitiendo
mostrar ofertas dinámicas y atractivas que motiven la conversión de visitantes
en miembros, aumenten las ventas de productos y mejoren la retención de clientes
existentes a través de promociones personalizadas y oportunas.
*/