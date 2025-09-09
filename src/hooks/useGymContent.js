// Autor: Alexander Echeverria
// Dirección: src/hooks/useGymContent.js

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useGymContent = () => {
  // Estados principales
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Contenido por defecto mientras carga
  const defaultContent = {
    hero: null,
    services: null,
    plans: null,
    testimonials: null,
    contact: null,
    store: null
  };

  // Función para obtener contenido del gimnasio
  const fetchGymContent = async (force = false) => {
    // Cache de 10 minutos (contenido puede cambiar ocasionalmente)
    if (content && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 10 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo contenido del gimnasio desde backend...');
      
      // Verificar que apiService tenga la función
      if (!apiService || typeof apiService.get !== 'function') {
        throw new Error('apiService.get no está disponible');
      }
      
      // Intentar obtener contenido desde el endpoint específico
      let response = await apiService.get('/gym/content');
      
      // Si no existe ese endpoint, intentar obtener desde config general
      if (!response.success) {
        console.log('Endpoint /gym/content no disponible, usando configuración general...');
        response = await apiService.getGymConfig();
      }
      
      if (response && response.success && response.data) {
        console.log('Contenido del gimnasio obtenido exitosamente:', response.data);
        
        // Estructurar el contenido de manera consistente
        const structuredContent = {
          hero: response.data.hero || {
            title: response.data.name || 'Club de Entrenamiento Elite',
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
        console.warn('No se pudo obtener contenido del gimnasio');
        setContent(defaultContent);
      }
    } catch (err) {
      console.error('Error al obtener contenido del gimnasio:', err);
      setError(err.message);
      
      // En caso de error, mantener contenido por defecto
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar contenido al montar el componente
  useEffect(() => {
    fetchGymContent();
  }, []);

  // Función para refrescar contenido manualmente
  const refresh = () => {
    fetchGymContent(true);
  };

  // Función para actualizar una sección específica
  const updateContent = async (section, newData) => {
    try {
      console.log(`Actualizando sección ${section}...`);
      
      if (!apiService || typeof apiService.put !== 'function') {
        throw new Error('apiService.put no está disponible');
      }
      
      const response = await apiService.put(`/gym/content/${section}`, newData);
      
      if (response.success) {
        console.log(`Sección ${section} actualizada correctamente`);
        setContent(prev => ({
          ...prev,
          [section]: response.data
        }));
        return true;
      } else {
        throw new Error(response.message || 'Error al actualizar contenido');
      }
    } catch (err) {
      console.error(`Error al actualizar sección ${section}:`, err);
      setError(err.message);
      return false;
    }
  };

  // Función para verificar si una sección tiene datos
  const hasSection = (sectionName) => {
    return content && 
           content[sectionName] && 
           typeof content[sectionName] === 'object' &&
           Object.keys(content[sectionName]).length > 0;
  };

  // Función para verificar si hay contenido disponible
  const hasAnyContent = () => {
    if (!content) return false;
    
    return Object.values(content).some(section => 
      section && 
      typeof section === 'object' && 
      Object.keys(section).length > 0
    );
  };

  // Función para obtener contenido de una sección específica
  const getSectionContent = (sectionName) => {
    return content?.[sectionName] || null;
  };

  // Función para verificar si el contenido está completo
  const isContentComplete = () => {
    if (!content) return false;
    
    const requiredSections = ['hero', 'services', 'plans'];
    return requiredSections.every(section => hasSection(section));
  };

  // Función para obtener estadísticas del contenido
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

  // Retornar todas las propiedades y funciones disponibles
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
    
    // Estados útiles para componentes
    isLoaded: !loading && content !== null && !error,
    hasError: !!error,
    isEmpty: !content || !hasAnyContent(),
    stats: getContentStats()
  };
};

export default useGymContent;

/**
 * DOCUMENTACIÓN DEL HOOK useGymContent
 * 
 * PROPÓSITO:
 * Hook personalizado de React que gestiona la obtención y manipulación del contenido
 * dinámico del gimnasio desde el backend. Proporciona una interfaz unificada para
 * acceder a todas las secciones del sitio web del gimnasio.
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Obtiene contenido del gimnasio desde la API backend
 * - Implementa sistema de caché de 10 minutos para optimizar rendimiento
 * - Proporciona contenido por defecto mientras carga o en caso de error
 * - Permite actualización de secciones específicas
 * - Incluye funciones de validación y estadísticas
 * 
 * ARCHIVOS CON LOS QUE SE CONECTA:
 * - '../services/apiService': Servicio principal para comunicación con el backend
 * - Backend API endpoints: '/gym/content' y '/gym/content/{section}'
 * - Cualquier componente React que importe este hook
 * 
 * SECCIONES QUE MANEJA:
 * - hero: Sección principal/banner del sitio
 * - services: Servicios del gimnasio
 * - plans: Planes de membresía
 * - testimonials: Testimonios de clientes
 * - contact: Información de contacto
 * - store: Tienda de productos
 * 
 * USO TÍPICO:
 * const { content, loading, error, refresh } = useGymContent();
 * 
 * ESTADOS RETORNADOS:
 * - content: Objeto con todas las secciones del gimnasio
 * - loading: Boolean indicando si está cargando
 * - error: Mensaje de error si ocurre algún problema
 * - isLoaded: Boolean indicando si ya se cargó exitosamente
 * 
 * FUNCIONES DISPONIBLES:
 * - refresh(): Fuerza actualización del contenido
 * - updateContent(section, data): Actualiza una sección específica
 * - getSectionContent(name): Obtiene contenido de una sección
 * - hasSection(name): Verifica si una sección tiene datos
 * 
 * NOTA PARA DESARROLLADORES:
 * Este hook es fundamental para la gestión de contenido dinámico del sitio.
 * Cualquier cambio debe mantener la retrocompatibilidad con los componentes
 * que lo utilizan. Los precios están configurados en quetzales (Q).
 */