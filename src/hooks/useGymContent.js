// src/hooks/useGymContent.js
// FUNCIÓN: Hook para obtener contenido dinámico del gimnasio - CORREGIDO
// CONECTA CON: Backend API /api/gym/content usando apiService

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useGymContent = () => {
  // 🏗️ Estados
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 📱 Contenido por defecto mientras carga
  const defaultContent = {
    hero: null,
    services: null,
    plans: null,
    testimonials: null,
    contact: null,
    store: null
  };

  // 🚀 Función para obtener contenido del gimnasio
  const fetchGymContent = async (force = false) => {
    // Cache de 10 minutos (contenido puede cambiar ocasionalmente)
    if (content && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 10 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📄 Obteniendo contenido del gimnasio desde backend...');
      
      // Verificar que apiService tenga la función
      if (!apiService || typeof apiService.get !== 'function') {
        throw new Error('apiService.get no está disponible');
      }
      
      // Intentar obtener contenido desde el endpoint específico
      let response = await apiService.get('/gym/content');
      
      // Si no existe ese endpoint, intentar obtener desde config general
      if (!response.success) {
        console.log('📄 Endpoint /gym/content no disponible, usando configuración general...');
        response = await apiService.getGymConfig();
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
      } else {
        console.warn('⚠️ No se pudo obtener contenido del gimnasio');
        setContent(defaultContent);
      }
    } catch (err) {
      console.error('❌ Error al obtener contenido del gimnasio:', err);
      setError(err.message);
      
      // En caso de error, mantener contenido por defecto
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar contenido al montar
  useEffect(() => {
    fetchGymContent();
  }, []);

  // 🎯 Función para refrescar contenido
  const refresh = () => {
    fetchGymContent(true);
  };

  // 🔄 Función para actualizar una sección específica
  const updateContent = async (section, newData) => {
    try {
      console.log(`📝 Actualizando sección ${section}...`);
      
      if (!apiService || typeof apiService.put !== 'function') {
        throw new Error('apiService.put no está disponible');
      }
      
      const response = await apiService.put(`/gym/content/${section}`, newData);
      
      if (response.success) {
        console.log(`✅ Sección ${section} actualizada`);
        setContent(prev => ({
          ...prev,
          [section]: response.data
        }));
        return true;
      } else {
        throw new Error(response.message || 'Error al actualizar contenido');
      }
    } catch (err) {
      console.error(`❌ Error al actualizar sección ${section}:`, err);
      setError(err.message);
      return false;
    }
  };

  // 🔍 Función para verificar si una sección tiene datos
  const hasSection = (sectionName) => {
    return content && 
           content[sectionName] && 
           typeof content[sectionName] === 'object' &&
           Object.keys(content[sectionName]).length > 0;
  };

  // 🔍 Función para verificar si hay contenido disponible
  const hasAnyContent = () => {
    if (!content) return false;
    
    return Object.values(content).some(section => 
      section && 
      typeof section === 'object' && 
      Object.keys(section).length > 0
    );
  };

  // 🎯 Función para obtener contenido de una sección específica
  const getSectionContent = (sectionName) => {
    return content?.[sectionName] || null;
  };

  // 🎨 Función para verificar si el contenido está completo
  const isContentComplete = () => {
    if (!content) return false;
    
    const requiredSections = ['hero', 'services', 'plans'];
    return requiredSections.every(section => hasSection(section));
  };

  // 📊 Función para obtener estadísticas del contenido
  const getContentStats = () => {
    if (!content) return null;
    
    const sectionsWithContent = Object.keys(content).filter(key => hasSection(key));
    
    return {
      total: Object.keys(content).length,
      withContent: sectionsWithContent.length,
      completionPercentage: Math.round((sectionsWithContent.length / Object.keys(content).length) * 100),
      missingSections: Object.keys(content).filter(key => !hasSection(key))
    };
  };

  // 🏠 Retornar contenido y funciones
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
    isLoaded: !loading && content !== null && !error,
    hasError: !!error,
    isEmpty: !content || !hasAnyContent(),
    stats: getContentStats()
  };
};

export default useGymContent;