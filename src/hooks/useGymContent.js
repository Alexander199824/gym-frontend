// Autor: Alexander Echeverria
// Dirección: src/hooks/useGymContent.js
// ✅ COMPLETO - Este archivo NO necesita cambios
// ✅ Ya está conectado correctamente con el backend

import { useState, useEffect, useCallback } from 'react';
import { gymService } from '../services';
import { useApp } from '../contexts/AppContext';

const useGymContent = (options = {}) => {
  const {
    enabled = true,
    autoFetch = true,
    cacheTime = 10 * 60 * 1000
  } = options;

  const { showError } = useApp();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const [stats, setStats] = useState([]);
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  const fetchGymContent = useCallback(async (force = false) => {
    if (content && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < cacheTime) {
        console.log('📋 useGymContent: usando contenido cacheado');
        return;
      }
    }

    if (!enabled) {
      console.log('📋 useGymContent: deshabilitado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 useGymContent: obteniendo contenido desde backend...');
      
      const configResponse = await gymService.getGymConfig();
      
      if (configResponse && configResponse.data) {
        console.log('✅ useGymContent: configuración obtenida');
        
        const structuredContent = {
          hero: {
            title: configResponse.data.name || '',
            subtitle: configResponse.data.tagline || '',
            description: configResponse.data.description || '',
            imageUrl: configResponse.data.hero?.imageUrl || null,
            videoUrl: configResponse.data.hero?.videoUrl || null,
            videoConfig: configResponse.data.hero?.videoConfig || null
          },
          
          config: {
            name: configResponse.data.name || '',
            tagline: configResponse.data.tagline || '',
            description: configResponse.data.description || '',
            logo: configResponse.data.logo || null,
            contact: configResponse.data.contact || null,
            social: configResponse.data.social || null,
            multimedia: configResponse.data.multimedia || null
          }
        };
        
        setContent(structuredContent);
        setLastFetch(Date.now());
        
        console.log('✅ useGymContent: contenido estructurado y guardado');
      } else {
        console.warn('⚠️ useGymContent: no se recibió configuración');
      }
    } catch (err) {
      console.error('❌ useGymContent: error al obtener contenido:', err);
      setError(err.message);
      showError?.('Error al cargar contenido del gimnasio');
    } finally {
      setLoading(false);
    }
  }, [content, lastFetch, cacheTime, enabled, showError]);

  const fetchStats = useCallback(async (force = false) => {
    try {
      console.log('📊 useGymContent: obteniendo estadísticas...');
      
      const response = await gymService.getActiveStatistics();
      
      if (response && response.data) {
        const statsData = Array.isArray(response.data) ? response.data : [];
        setStats(statsData);
        console.log(`✅ useGymContent: ${statsData.length} estadísticas obtenidas`);
        return statsData;
      }
    } catch (err) {
      console.error('❌ useGymContent: error al obtener estadísticas:', err);
      setStats([]);
    }
  }, []);

  const fetchServices = useCallback(async (force = false) => {
    try {
      console.log('🏋️ useGymContent: obteniendo servicios...');
      
      const response = await gymService.getGymServices();
      
      if (response && response.data) {
        const servicesData = Array.isArray(response.data) ? response.data : [];
        setServices(servicesData);
        console.log(`✅ useGymContent: ${servicesData.length} servicios obtenidos`);
        return servicesData;
      }
    } catch (err) {
      console.error('❌ useGymContent: error al obtener servicios:', err);
      setServices([]);
    }
  }, []);

  const fetchPlans = useCallback(async (force = false) => {
    try {
      console.log('💳 useGymContent: obteniendo planes...');
      
      const response = await gymService.getMembershipPlans();
      
      if (response && response.data) {
        const plansData = Array.isArray(response.data) ? response.data : [];
        setPlans(plansData);
        console.log(`✅ useGymContent: ${plansData.length} planes obtenidos`);
        return plansData;
      }
    } catch (err) {
      console.error('❌ useGymContent: error al obtener planes:', err);
      setPlans([]);
    }
  }, []);

  const fetchTestimonials = useCallback(async (force = false) => {
    try {
      console.log('💬 useGymContent: obteniendo testimonios...');
      
      const response = await gymService.getTestimonials();
      
      if (response && response.data) {
        const testimonialsData = Array.isArray(response.data) ? response.data : [];
        setTestimonials(testimonialsData);
        console.log(`✅ useGymContent: ${testimonialsData.length} testimonios obtenidos`);
        return testimonialsData;
      }
    } catch (err) {
      console.error('❌ useGymContent: error al obtener testimonios:', err);
      setTestimonials([]);
    }
  }, []);

  const fetchAllContent = useCallback(async (force = false) => {
    console.log('🔄 useGymContent: cargando todo el contenido...');
    
    await Promise.all([
      fetchGymContent(force),
      fetchStats(force),
      fetchServices(force),
      fetchPlans(force),
      fetchTestimonials(force)
    ]);
    
    console.log('✅ useGymContent: todo el contenido cargado');
  }, [fetchGymContent, fetchStats, fetchServices, fetchPlans, fetchTestimonials]);

  useEffect(() => {
    if (autoFetch && enabled) {
      console.log('🚀 useGymContent: carga automática inicial');
      fetchAllContent();
    }
  }, [autoFetch, enabled, fetchAllContent]);

  const refresh = useCallback(() => {
    console.log('🔄 useGymContent: refresh manual solicitado');
    return fetchAllContent(true);
  }, [fetchAllContent]);

  const updateServices = useCallback(async (newServices) => {
    try {
      console.log('💾 useGymContent: actualizando servicios...');
      
      await gymService.updateServices(newServices);
      await fetchServices(true);
      
      console.log('✅ useGymContent: servicios actualizados');
      return true;
    } catch (err) {
      console.error('❌ useGymContent: error al actualizar servicios:', err);
      showError?.('Error al actualizar servicios');
      return false;
    }
  }, [fetchServices, showError]);

  const updatePlans = useCallback(async (newPlans) => {
    try {
      console.log('💾 useGymContent: actualizando planes...');
      
      await gymService.updateMembershipPlans(newPlans);
      await fetchPlans(true);
      
      console.log('✅ useGymContent: planes actualizados');
      return true;
    } catch (err) {
      console.error('❌ useGymContent: error al actualizar planes:', err);
      showError?.('Error al actualizar planes');
      return false;
    }
  }, [fetchPlans, showError]);

  const updateContent = useCallback(async (section, newData) => {
    try {
      console.log(`💾 useGymContent: actualizando sección ${section}...`);
      
      switch (section) {
        case 'services':
          return await updateServices(newData);
        
        case 'plans':
          return await updatePlans(newData);
        
        default:
          console.warn(`⚠️ useGymContent: sección ${section} no soportada`);
          return false;
      }
    } catch (err) {
      console.error(`❌ useGymContent: error al actualizar ${section}:`, err);
      showError?.(`Error al actualizar ${section}`);
      return false;
    }
  }, [updateServices, updatePlans, showError]);

  const hasSection = useCallback((sectionName) => {
    if (sectionName === 'stats') return stats && stats.length > 0;
    if (sectionName === 'services') return services && services.length > 0;
    if (sectionName === 'plans') return plans && plans.length > 0;
    if (sectionName === 'testimonials') return testimonials && testimonials.length > 0;
    
    return content && 
           content[sectionName] && 
           typeof content[sectionName] === 'object' &&
           Object.keys(content[sectionName]).length > 0;
  }, [content, stats, services, plans, testimonials]);

  const hasAnyContent = useCallback(() => {
    if (!content) return false;
    
    return Object.values(content).some(section => 
      section && 
      typeof section === 'object' && 
      Object.keys(section).length > 0
    ) || stats.length > 0 || services.length > 0 || plans.length > 0 || testimonials.length > 0;
  }, [content, stats, services, plans, testimonials]);

  const getSectionContent = useCallback((sectionName) => {
    if (sectionName === 'stats') return stats;
    if (sectionName === 'services') return services;
    if (sectionName === 'plans') return plans;
    if (sectionName === 'testimonials') return testimonials;
    
    return content?.[sectionName] || null;
  }, [content, stats, services, plans, testimonials]);

  const isContentComplete = useCallback(() => {
    if (!content) return false;
    
    const hasHero = hasSection('hero');
    const hasConfig = hasSection('config');
    const hasStats = stats.length > 0;
    const hasServices = services.length > 0;
    const hasPlans = plans.length > 0;
    
    return hasHero && hasConfig && hasStats && hasServices && hasPlans;
  }, [content, stats, services, plans, hasSection]);

  const getContentStats = useCallback(() => {
    if (!content) return null;
    
    const sections = ['hero', 'config'];
    const sectionsWithContent = sections.filter(key => hasSection(key));
    
    if (stats.length > 0) sectionsWithContent.push('stats');
    if (services.length > 0) sectionsWithContent.push('services');
    if (plans.length > 0) sectionsWithContent.push('plans');
    if (testimonials.length > 0) sectionsWithContent.push('testimonials');
    
    const totalSections = sections.length + 4;
    
    return {
      total: totalSections,
      withContent: sectionsWithContent.length,
      completionPercentage: Math.round((sectionsWithContent.length / totalSections) * 100),
      missingSections: [
        ...sections.filter(key => !hasSection(key)),
        ...(stats.length === 0 ? ['stats'] : []),
        ...(services.length === 0 ? ['services'] : []),
        ...(plans.length === 0 ? ['plans'] : []),
        ...(testimonials.length === 0 ? ['testimonials'] : [])
      ],
      details: {
        stats: stats.length,
        services: services.length,
        plans: plans.length,
        testimonials: testimonials.length
      }
    };
  }, [content, stats, services, plans, testimonials, hasSection]);

  return {
    content,
    loading,
    error,
    lastFetch,
    
    stats,
    services,
    plans,
    testimonials,
    
    refresh,
    fetchAllContent,
    updateContent,
    updateServices,
    updatePlans,
    getSectionContent,
    
    fetchStats,
    fetchServices,
    fetchPlans,
    fetchTestimonials,
    
    hasSection,
    hasAnyContent,
    isContentComplete,
    
    getContentStats,
    
    hero: getSectionContent('hero'),
    config: getSectionContent('config'),
    
    isLoaded: !loading && content !== null && !error,
    hasError: !!error,
    isEmpty: !content || !hasAnyContent(),
    isComplete: isContentComplete(),
    contentStats: getContentStats(),
    
    statsCount: stats.length,
    servicesCount: services.length,
    plansCount: plans.length,
    testimonialsCount: testimonials.length,
    
    ...(process.env.NODE_ENV === 'development' && {
      debugInfo: {
        enabled,
        autoFetch,
        cacheTime: Math.round(cacheTime / 1000) + 's',
        cacheAge: lastFetch ? Math.round((Date.now() - lastFetch) / 1000) + 's' : 'N/A',
        backendConnected: true,
        endpoints: {
          config: '/api/gym/config',
          stats: '/api/gym/stats',
          services: '/api/gym/services',
          plans: '/api/gym/membership-plans',
          testimonials: '/api/gym/testimonials'
        }
      }
    })
  };
};

export default useGymContent;

/*
=============================================================================
HOOK useGymContent - ACTUALIZADO PARA TEST-GYM-INFO-MANAGER.JS
=============================================================================


✅ FUNCIONES DISPONIBLES:
- refresh() - Recargar todo
- fetchAllContent() - Cargar todo el contenido
- fetchStats() - Cargar solo estadísticas
- fetchServices() - Cargar solo servicios
- fetchPlans() - Cargar solo planes
- fetchTestimonials() - Cargar solo testimonios
- updateServices(data) - Actualizar servicios
- updatePlans(data) - Actualizar planes
- updateContent(section, data) - Actualizar sección específica
- getSectionContent(name) - Obtener contenido de sección
- hasSection(name) - Verificar si sección tiene datos
- getContentStats() - Estadísticas de completitud

✅ ESTADOS RETORNADOS:
- isLoaded: Indica si ya cargó
- loading: Indica si está cargando
- hasError: Indica si hay error
- isEmpty: Indica si no hay contenido
- isComplete: Indica si todo está completo
- contentStats: Estadísticas detalladas
- statsCount, servicesCount, plansCount, testimonialsCount

✅ MANTIENE COMPATIBILIDAD:
- Todas las funciones existentes
- Cache de 10 minutos
- Manejo de errores robusto
- Debug info en desarrollo

Este hook está completamente sincronizado con el test backend
y proporciona acceso completo a todo el contenido del gimnasio.
=============================================================================
*/