// src/hooks/useTestimonials.js
// FUNCIÓN: Hook para testimonios de clientes
// CONECTA CON: GET /api/gym/testimonials

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useTestimonials = () => {
  // 🏗️ Estados
  const [testimonials, setTestimonials] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [autoPlay, setAutoPlay] = useState(true);

  // 💬 Testimonios por defecto mientras carga
  const defaultTestimonials = [
    {
      id: 1,
      name: 'Cargando testimonios...',
      role: 'Cliente',
      text: 'Por favor espera mientras cargamos los testimonios...',
      rating: 5,
      image: null,
      featured: true,
      order: 1
    }
  ];

  // 🚀 Función para obtener testimonios
  const fetchTestimonials = async (force = false) => {
    // Cache de 20 minutos (testimonios no cambian frecuentemente)
    if (testimonials && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 20 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('💬 Obteniendo testimonios desde backend...');
      
      const response = await apiService.getTestimonials();
      
      if (response.success && response.data) {
        console.log('✅ Testimonios obtenidos:', response.data);
        
        // Ordenar testimonios por orden y destacados primero
        const sortedTestimonials = response.data.sort((a, b) => {
          // Destacados primero
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          // Luego por orden
          return (a.order || 0) - (b.order || 0);
        });
        
        setTestimonials(sortedTestimonials);
        setLastFetch(Date.now());
        
        // Resetear índice si es necesario
        if (currentIndex >= sortedTestimonials.length) {
          setCurrentIndex(0);
        }
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al obtener testimonios:', error);
      setError(error.message);
      
      // En caso de error, usar testimonios por defecto
      if (!testimonials) {
        setTestimonials(defaultTestimonials);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar testimonios al montar
  useEffect(() => {
    fetchTestimonials();
  }, []);

  // ⏰ Efecto para auto-reproducción de testimonios
  useEffect(() => {
    if (!autoPlay || !testimonials || testimonials.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % testimonials.length);
    }, 5000); // Cambiar cada 5 segundos
    
    return () => clearInterval(interval);
  }, [autoPlay, testimonials]);

  // 🎯 Función para refrescar testimonios
  const refresh = () => {
    fetchTestimonials(true);
  };

  // 🔍 Función para obtener testimonio por ID
  const getTestimonialById = (id) => {
    return testimonials?.find(testimonial => testimonial.id === id);
  };

  // ⭐ Función para obtener testimonios destacados
  const getFeaturedTestimonials = () => {
    return testimonials?.filter(testimonial => testimonial.featured) || [];
  };

  // 🔝 Función para obtener testimonios con mejor rating
  const getTopRatedTestimonials = (minRating = 5) => {
    return testimonials?.filter(testimonial => testimonial.rating >= minRating) || [];
  };

  // 📱 Función para obtener testimonios para móvil (texto más corto)
  const getMobileTestimonials = () => {
    return testimonials?.map(testimonial => ({
      ...testimonial,
      shortText: testimonial.text.length > 120 
        ? `${testimonial.text.substring(0, 120)}...` 
        : testimonial.text
    })) || [];
  };

  // 🎯 Función para obtener testimonio actual
  const getCurrentTestimonial = () => {
    if (!testimonials || testimonials.length === 0) {
      return defaultTestimonials[0];
    }
    return testimonials[currentIndex] || testimonials[0];
  };

  // ▶️ Función para ir al siguiente testimonio
  const nextTestimonial = () => {
    if (!testimonials) return;
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
  };

  // ◀️ Función para ir al testimonio anterior
  const previousTestimonial = () => {
    if (!testimonials) return;
    setCurrentIndex(prev => prev === 0 ? testimonials.length - 1 : prev - 1);
  };

  // 🎯 Función para ir a un testimonio específico
  const goToTestimonial = (index) => {
    if (!testimonials || index < 0 || index >= testimonials.length) return;
    setCurrentIndex(index);
  };

  // ⏸️ Función para pausar/reanudar auto-play
  const toggleAutoPlay = () => {
    setAutoPlay(prev => !prev);
  };

  // 🔄 Función para verificar si hay testimonios válidos
  const hasValidTestimonials = () => {
    return testimonials && 
           testimonials.length > 0 && 
           testimonials[0].name !== 'Cargando testimonios...';
  };

  // ⭐ Función para generar estrellas de rating
  const generateStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => ({
      filled: index < rating,
      key: `star-${index}`
    }));
  };

  // 📊 Función para obtener estadísticas de testimonios
  const getTestimonialsStats = () => {
    if (!testimonials) return null;
    
    const ratings = testimonials.map(t => t.rating);
    const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    return {
      total: testimonials.length,
      featured: getFeaturedTestimonials().length,
      averageRating: averageRating.toFixed(1),
      topRated: getTopRatedTestimonials().length,
      withImages: testimonials.filter(t => t.image).length
    };
  };

  // 🔍 Función para buscar testimonios
  const searchTestimonials = (query) => {
    if (!testimonials || !query) return testimonials || [];
    
    const searchTerm = query.toLowerCase();
    return testimonials.filter(testimonial =>
      testimonial.name.toLowerCase().includes(searchTerm) ||
      testimonial.text.toLowerCase().includes(searchTerm) ||
      testimonial.role.toLowerCase().includes(searchTerm)
    );
  };

  // 🎨 Función para obtener testimonios por rating
  const getTestimonialsByRating = (rating) => {
    return testimonials?.filter(testimonial => testimonial.rating === rating) || [];
  };

  // 📸 Función para verificar si un testimonio tiene imagen
  const hasImage = (testimonial) => {
    return testimonial && testimonial.image && testimonial.image.trim() !== '';
  };

  // 🎯 Función para obtener initials del nombre
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // 🎨 Función para obtener testimonios formateados para display
  const getDisplayTestimonials = () => {
    if (!testimonials) return [];
    
    return testimonials.map(testimonial => ({
      ...testimonial,
      stars: generateStars(testimonial.rating),
      initials: getInitials(testimonial.name),
      hasImage: hasImage(testimonial),
      shortText: testimonial.text.length > 200 
        ? `${testimonial.text.substring(0, 200)}...` 
        : testimonial.text,
      displayImage: hasImage(testimonial) ? testimonial.image : null
    }));
  };

  // 🏠 Retornar testimonios y funciones
  return {
    // Estado
    testimonials: testimonials || defaultTestimonials,
    currentIndex,
    autoPlay,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getTestimonialById,
    getFeaturedTestimonials,
    getTopRatedTestimonials,
    getMobileTestimonials,
    getCurrentTestimonial,
    getDisplayTestimonials,
    searchTestimonials,
    getTestimonialsByRating,
    
    // Controles de navegación
    nextTestimonial,
    previousTestimonial,
    goToTestimonial,
    toggleAutoPlay,
    
    // Utilidades
    generateStars,
    getInitials,
    hasImage,
    getTestimonialsStats,
    
    // Verificaciones
    hasValidTestimonials,
    
    // Acceso directo (para compatibilidad)
    currentTestimonial: getCurrentTestimonial(),
    featuredTestimonials: getFeaturedTestimonials(),
    topRatedTestimonials: getTopRatedTestimonials(),
    stats: getTestimonialsStats(),
    
    // Estado útil
    isLoaded: !loading && !!testimonials && !error && hasValidTestimonials(),
    hasError: !!error,
    isEmpty: !testimonials || testimonials.length === 0 || !hasValidTestimonials(),
    count: testimonials?.length || 0,
    hasMultiple: testimonials && testimonials.length > 1,
    canNavigate: hasValidTestimonials() && testimonials.length > 1
  };
};

export default useTestimonials;