// src/hooks/useGymContent.js
// FUNCIÓN: Hook para obtener contenido dinámico del gimnasio SOLO desde backend
// CONECTA CON: Backend API /api/gym/content (SIN fallbacks hardcodeados)

import { useState, useEffect } from 'react';
import { gymContentService } from '../services/gymContentService';

const useGymContent = () => {
  const [content, setContent] = useState({
    hero: null,
    services: null,
    plans: null,
    testimonials: null,
    contact: null,
    store: null
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔄 Cargar contenido del gimnasio SOLO desde backend
  const loadContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // SOLO intentar cargar desde API - sin fallbacks
      const contentData = await gymContentService.getGymContent();
      
      if (contentData) {
        setContent(contentData);
      } else {
        // Si no hay datos, mantener estado vacío
        setContent({
          hero: null,
          services: null,
          plans: null,
          testimonials: null,
          contact: null,
          store: null
        });
      }
      
      setIsLoaded(true);
      
    } catch (err) {
      console.error('Error loading gym content:', err);
      setError(err.message);
      
      // En caso de error, NO usar datos hardcodeados
      setContent({
        hero: null,
        services: null,
        plans: null,
        testimonials: null,
        contact: null,
        store: null
      });
      
      setIsLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Actualizar contenido (solo backend)
  const updateContent = async (section, newData) => {
    try {
      const updatedContent = await gymContentService.updateSection(section, newData);
      setContent(prev => ({
        ...prev,
        [section]: updatedContent
      }));
      return true;
    } catch (err) {
      console.error('Error updating content:', err);
      setError(err.message);
      return false;
    }
  };

  // 🔄 Recargar contenido
  const refreshContent = () => {
    loadContent();
  };

  // 🎯 Efecto inicial
  useEffect(() => {
    loadContent();
  }, []);

  // 🔍 Verificar si una sección tiene datos
  const hasSection = (sectionName) => {
    return content[sectionName] && Object.keys(content[sectionName]).length > 0;
  };

  // 🔍 Verificar si hay datos disponibles
  const hasAnyContent = () => {
    return Object.values(content).some(section => 
      section && Object.keys(section).length > 0
    );
  };

  return {
    // Estados principales
    content,
    isLoaded,
    isLoading,
    error,
    
    // Funciones
    updateContent,
    refreshContent,
    
    // Helpers
    hasSection,
    hasAnyContent,
    
    // Shortcuts para secciones específicas (pueden ser null)
    hero: content.hero,
    services: content.services,
    plans: content.plans,
    testimonials: content.testimonials,
    contact: content.contact,
    store: content.store
  };
};

export default useGymContent;