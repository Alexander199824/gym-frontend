// src/hooks/useTestimonials.js
// FUNCIÓN: Hook CORREGIDO para cargar testimonios
// ARREGLA: Extrae solo la data del response del backend

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🚀 useTestimonials hook initialized');

  const fetchTestimonials = useCallback(async () => {
    console.log('💬 Loading Testimonials');
    setIsLoading(true);
    setError(null);

    try {
      console.log('📡 Requesting testimonials...');
      const response = await apiService.getTestimonials();
      
      console.log('💬 Testimonials received:', response);
      
      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let testimonialsData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, name: "...", ... }, ... ] }
        testimonialsData = response.data;
        console.log('💬 Testimonials data extracted:');
        console.log('  - Total testimonials:', testimonialsData.length);
        if (Array.isArray(testimonialsData)) {
          testimonialsData.forEach((testimonial, i) => {
            console.log(`  - Testimonial ${i + 1}: ${testimonial.name} (${testimonial.rating}⭐)`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        testimonialsData = response;
        console.log('💬 Testimonials data (direct array):', testimonialsData.length);
      } else {
        console.warn('⚠️ Invalid testimonials response structure:', response);
        throw new Error('Invalid response structure');
      }

      // Filtrar solo testimonios activos y verificados
      const activeTestimonials = Array.isArray(testimonialsData) 
        ? testimonialsData.filter(testimonial => 
            testimonial.active !== false && 
            testimonial.verified !== false
          )
        : [];

      setTestimonials(activeTestimonials); // ✅ Guardamos solo la data, no el wrapper
      setIsLoaded(true);
      console.log(`✅ Testimonials loaded successfully! (${activeTestimonials.length} active)`);

    } catch (err) {
      console.error('❌ Error loading testimonials:', err.message);
      setError(err);
      setTestimonials([]); // Fallback a array vacío
      setIsLoaded(true); // Marcar como cargado aunque falle
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchTestimonials();
    
    return () => {
      console.log('🧹 useTestimonials hook cleanup');
    };
  }, [fetchTestimonials]);

  // Función manual de reload
  const reload = useCallback(() => {
    console.log('🔄 Manual testimonials reload requested');
    fetchTestimonials();
  }, [fetchTestimonials]);

  return {
    testimonials,    // ✅ Solo la data: [ { id: 1, name: "...", ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useTestimonials;