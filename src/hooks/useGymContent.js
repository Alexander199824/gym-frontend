// src/hooks/useGymContent.js
// FUNCIÓN: Hook 100% OPTIMIZADO para contenido dinámico del gimnasio
// MEJORAS: RequestManager + deduplicación + cache inteligente + cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useGymContent = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 10 * 60 * 1000, // 10 minutos - contenido puede cambiar ocasionalmente
    section = null, // Sección específica a cargar
  } = options;

  // Estados
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`gymContent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`📄 useGymContent [${instanceId.current}] hook initialized`);

  // 📱 Contenido por defecto mientras carga
  const defaultContent = {
    hero: null,
    services: null,
    plans: null,
    testimonials: null,
    contact: null,
    store: null
  };

  // 🔥 FUNCIÓN DE FETCH OPTIMIZADA con RequestManager
  const fetchGymContent = useCallback(async (forceRefresh = false) => {
    // Verificar si el componente sigue montado y está habilitado
    if (!mountedRef.current || !enabled) {
      console.log(`⏸️ useGymContent [${instanceId.current}] fetch skipped - disabled or unmounted`);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (loading && !forceRefresh) {
      console.log(`⏸️ useGymContent [${instanceId.current}] fetch skipped - already loading`);
      return;
    }

    // Verificar si ya tenemos datos frescos
    if (!forceRefresh && content && lastFetch) {
      const age = Date.now() - lastFetch;
      if (age < staleTime) {
        console.log(`✅ useGymContent [${instanceId.current}] using fresh data (age: ${Math.round(age/1000)}s)`);
        return;
      }
    }

    try {
      console.log(`📄 useGymContent [${instanceId.current}] Obteniendo contenido del gimnasio${forceRefresh ? ' (forced)' : ''}...`);
      
      // Cancelar petición anterior si existe
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      // Crear nuevo AbortController
      fetchAbortController.current = new AbortController();

      setLoading(true);
      setError(null);

      const endpoint = section ? `/gym/content/${section}` : '/gym/content';
      
      // 🎯 USAR REQUEST MANAGER - Evita peticiones duplicadas automáticamente
      let response;
      try {
        response = await requestManager.executeRequest(
          endpoint,
          () => apiService.get(endpoint),
          {
            forceRefresh,
            ttl: staleTime,
            priority: 'low' // Contenido no es crítico
          }
        );
      } catch (contentError) {
        // Si no existe ese endpoint, intentar obtener desde config general
        console.log('📄 Endpoint /gym/content no disponible, usando configuración general...');
        response = await requestManager.executeRequest(
          '/api/gym/config',
          () => apiService.getGymConfig(),
          {
            forceRefresh,
            ttl: staleTime,
            priority: 'low'
          }
        );
      }

      // Verificar que el componente sigue montado antes de actualizar estado
      if (!mountedRef.current) {
        console.log(`⚠️ useGymContent [${instanceId.current}] component unmounted, skipping state update`);
        return;
      }

      if (response && response.success && response.data) {
        console.log('✅ Contenido del gimnasio obtenido:', response.data);
        
        // Estructurar el contenido de manera consistente
        const structuredContent = {
          hero: response.data.hero || {
            title: response.data.name || 'Elite Fitness Club',
            subtitle: response.data.tagline || 'Tu mejor versión te espera',
            description: response.data.description || 'Descubre el gimnasio que transformará tu vida',
            imageUrl: response.data.hero?.imageUrl || null,
            videoUrl: response.data.hero?.videoUrl || null
          },
          services: response.data.services || {
            title: 'Nuestros Servicios',
            subtitle: 'Todo lo que necesitas para alcanzar tus metas'
          },
          plans: response.data.plans || {
            title: 'Planes de Membresía',
            subtitle: 'Elige el plan perfecto para ti',
            guarantee: 'Garantía de satisfacción 30 días'
          },
          testimonials: response.data.testimonials || {
            title: 'Lo que dicen nuestros miembros',
            subtitle: 'Historias reales de transformación'
          },
          contact: response.data.contact || {
            title: '¿Listo para comenzar?',
            subtitle: `Únete a ${response.data.name || 'nuestro gimnasio'} y comienza tu transformación`
          },
          store: response.data.store || {
            title: 'Tienda Premium',
            subtitle: 'Productos de alta calidad para tu entrenamiento',
            benefits: [
              { text: 'Envío gratis +Q200' },
              { text: 'Garantía de calidad' },
              { text: 'Productos originales' }
            ]
          }
        };
        
        setContent(structuredContent);
        setLastFetch(Date.now());
        hasInitialLoad.current = true;
      } else {
        console.warn('⚠️ No se pudo obtener contenido del gimnasio');
        setContent(defaultContent);
        hasInitialLoad.current = true;
      }
    } catch (err) {
      // Solo actualizar error si el componente sigue montado
      if (mountedRef.current) {
        console.error(`❌ useGymContent [${instanceId.current}] error:`, err.message);
        setError(err.message);
        
        // En caso de error, mantener contenido por defecto
        if (!content) {
          setContent(defaultContent);
        }
        hasInitialLoad.current = true;
      }
    } finally {
      // Solo actualizar loading si el componente sigue montado
      if (mountedRef.current) {
        setLoading(false);
      }
      
      // Limpiar AbortController
      fetchAbortController.current = null;
    }
  }, [enabled, loading, content, lastFetch, staleTime, section]);

  // 🔄 FUNCIÓN DE REFETCH MANUAL
  const refresh = useCallback(() => {
    console.log(`🔄 useGymContent [${instanceId.current}] manual refresh requested`);
    return fetchGymContent(true);
  }, [fetchGymContent]);

  // 🗑️ FUNCIÓN DE INVALIDACIÓN
  const invalidate = useCallback(() => {
    console.log(`🗑️ useGymContent [${instanceId.current}] invalidating cache`);
    const endpoint = section ? `/gym/content/${section}` : '/gym/content';
    requestManager.invalidateCache(endpoint);
    requestManager.invalidateCache('/api/gym/config'); // También limpiar config
    setLastFetch(null);
  }, [section]);

  // 🔄 FUNCIÓN PARA ACTUALIZAR CONTENIDO (solo para admins)
  const updateContent = useCallback(async (sectionName, newData) => {
    try {
      console.log(`📝 useGymContent [${instanceId.current}] Updating section ${sectionName}...`);
      
      if (!apiService || typeof apiService.put !== 'function') {
        throw new Error('apiService.put no está disponible');
      }
      
      const response = await apiService.put(`/gym/content/${sectionName}`, newData);
      
      if (response.success) {
        console.log(`✅ Sección ${sectionName} actualizada`);
        setContent(prev => ({
          ...prev,
          [sectionName]: response.data
        }));
        
        // Invalidar cache para refrescar datos
        invalidate();
        
        return true;
      } else {
        throw new Error(response.message || 'Error al actualizar contenido');
      }
    } catch (err) {
      console.error(`❌ useGymContent [${instanceId.current}] Error updating section ${sectionName}:`, err);
      setError(err.message);
      return false;
    }
  }, [invalidate]);

  // 🔍 FUNCIÓN PARA VERIFICAR SI UNA SECCIÓN TIENE DATOS
  const hasSection = useCallback((sectionName) => {
    return content && 
           content[sectionName] && 
           typeof content[sectionName] === 'object' &&
           Object.keys(content[sectionName]).length > 0;
  }, [content]);

  // 🔍 FUNCIÓN PARA VERIFICAR SI HAY CONTENIDO DISPONIBLE
  const hasAnyContent = useCallback(() => {
    if (!content) return false;
    
    return Object.values(content).some(section => 
      section && 
      typeof section === 'object' && 
      Object.keys(section).length > 0
    );
  }, [content]);

  // 🎯 FUNCIÓN PARA OBTENER CONTENIDO DE UNA SECCIÓN ESPECÍFICA
  const getSectionContent = useCallback((sectionName) => {
    return content?.[sectionName] || null;
  }, [content]);

  // 🎨 FUNCIÓN PARA VERIFICAR SI EL CONTENIDO ESTÁ COMPLETO
  const isContentComplete = useCallback(() => {
    if (!content) return false;
    
    const requiredSections = ['hero', 'services', 'plans'];
    return requiredSections.every(section => hasSection(section));
  }, [content, hasSection]);

  // 📊 FUNCIÓN PARA OBTENER ESTADÍSTICAS DEL CONTENIDO
  const getContentStats = useCallback(() => {
    if (!content) return null;
    
    const sectionsWithContent = Object.keys(content).filter(key => hasSection(key));
    
    return {
      total: Object.keys(content).length,
      withContent: sectionsWithContent.length,
      completionPercentage: Math.round((sectionsWithContent.length / Object.keys(content).length) * 100),
      missingSections: Object.keys(content).filter(key => !hasSection(key))
    };
  }, [content, hasSection]);

  // 🔥 EFECTO PRINCIPAL - Optimizado para evitar renders innecesarios
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      !content ||
      (lastFetch && Date.now() - lastFetch > staleTime)
    );

    if (shouldFetch) {
      console.log(`🚀 useGymContent [${instanceId.current}] initial fetch triggered`);
      fetchGymContent();
    } else {
      console.log(`⏸️ useGymContent [${instanceId.current}] initial fetch skipped - conditions not met`);
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (content && !hasInitialLoad.current) {
        hasInitialLoad.current = true;
      }
    }

    // Cleanup function
    return () => {
      if (fetchAbortController.current) {
        console.log(`🚫 useGymContent [${instanceId.current}] aborting fetch on effect cleanup`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount]); // Dependencias mínimas

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`🧹 useGymContent [${instanceId.current}] component unmounting - cleanup`);
      mountedRef.current = false;
      
      // Abortar cualquier petición activa
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // 📊 PROPIEDADES COMPUTADAS (Memoizadas)
  const isLoaded = !loading && content !== null && !error;
  const hasError = !!error;
  const isEmpty = !content || !hasAnyContent();
  const isStale = lastFetch ? (Date.now() - lastFetch > staleTime) : false;
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;
  const stats = getContentStats();

  // 🎯 VALOR DE RETORNO OPTIMIZADO
  return {
    // Estados principales
    content: content || defaultContent,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    updateContent,
    getSectionContent,
    invalidate,
    
    // Verificaciones
    hasSection,
    hasAnyContent,
    isContentComplete,
    
    // Estadísticas
    getContentStats,
    
    // Acceso directo a secciones (pueden ser null)
    hero: getSectionContent('hero'),
    services: getSectionContent('services'),
    plans: getSectionContent('plans'),
    testimonials: getSectionContent('testimonials'),
    contact: getSectionContent('contact'),
    store: getSectionContent('store'),
    
    // Estado útil
    isLoaded,
    hasError,
    isEmpty,
    isStale,
    cacheAge,
    stats,
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        section,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        dataStructure: content ? {
          sections: Object.keys(content),
          completeSections: Object.keys(content).filter(key => hasSection(key)),
          totalSections: Object.keys(content).length
        } : null
      }
    })
  };
};

export default useGymContent;