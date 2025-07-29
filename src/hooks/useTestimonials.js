// src/hooks/useTestimonials.js
// FUNCIÓN: Hook para testimonios - TOLERANTE a errores
import { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService';

const useTestimonials = () => {
  const [state, setState] = useState({
    testimonials: null,
    isLoaded: false,
    isLoading: false,
    error: null
  });
  
  const isMountedRef = useRef(true);
  
  const loadTestimonials = async () => {
    if (!isMountedRef.current) return;
    
    console.group('💬 Loading Testimonials');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('📡 Requesting testimonials...');
      const response = await apiService.getTestimonials();
      
      if (response && response.success && response.data) {
        const testimonialsData = response.data;
        
        if (Array.isArray(testimonialsData)) {
          console.log('💬 Testimonials received:', {
            total: testimonialsData.length,
            active: testimonialsData.filter(t => t.active !== false).length,
            testimonials: testimonialsData.map(t => ({ 
              name: t.name, 
              rating: t.rating,
              text_preview: t.text?.substring(0, 50) + '...'
            }))
          });
          
          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              testimonials: testimonialsData,
              isLoaded: true,
              isLoading: false,
              error: null
            }));
          }
          
          console.log('✅ Testimonials loaded successfully');
        } else {
          throw new Error('Testimonials data is not an array');
        }
      } else {
        throw new Error('Invalid testimonials response');
      }
      
    } catch (error) {
      console.log('❌ Failed to load testimonials:', error.message);
      
      // Análisis específico para testimonios (error común)
      if (error.response?.status === 500) {
        console.log('🔍 COMMON ISSUE: Testimonials 500 error usually caused by:');
        console.log('   - undefined created_at or updated_at fields');
        console.log('   - calling .toISOString() on undefined date');
        console.log('🔧 SOLUTION: Add null checking in gymController.js testimonials endpoint');
        console.log('📝 Example fix: testimonial.created_at ? testimonial.created_at.toISOString() : new Date().toISOString()');
      }
      
      console.log('💡 Testimonials section will be hidden in the landing page');
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          testimonials: [],
          isLoaded: true,
          isLoading: false,
          error: error.message
        }));
      }
    }
    
    console.groupEnd();
  };
  
  useEffect(() => {
    console.log('🚀 useTestimonials hook initialized');
    loadTestimonials();
    return () => { 
      isMountedRef.current = false;
      console.log('🧹 useTestimonials hook cleanup');
    };
  }, []);
  
  return {
    testimonials: state.testimonials,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    hasTestimonials: !!(state.testimonials && Array.isArray(state.testimonials) && state.testimonials.length > 0)
  };
};

export default useTestimonials;