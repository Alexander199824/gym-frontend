// src/hooks/useMembershipPlans.js
// FUNCIÓN: Hook CORREGIDO para cargar planes de membresía
// ARREGLA: Extrae solo la data del response del backend

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useMembershipPlans = () => {
  const [plans, setPlans] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🎫 useMembershipPlans hook initialized');

  const fetchPlans = useCallback(async () => {
    console.log('🎫 Fetching Membership Plans');
    console.log('📡 Making API request to /api/gym/membership-plans');
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getMembershipPlans();
      console.log('✅ Plans response received:', response);
      
      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let plansData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, name: "...", ... }, ... ] }
        plansData = response.data;
        console.log('🎫 Plans data extracted:');
        console.log('  - Total plans:', plansData.length);
        if (Array.isArray(plansData)) {
          plansData.forEach((plan, i) => {
            console.log(`  - Plan ${i + 1}: ${plan.name} - Q${plan.price} (Popular: ${plan.popular})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        plansData = response;
        console.log('🎫 Plans data (direct array):', plansData.length);
      } else {
        console.warn('⚠️ Invalid plans response structure:', response);
        throw new Error('Invalid response structure');
      }

      // Filtrar solo planes activos y ordenar por orden
      const activePlans = Array.isArray(plansData) 
        ? plansData
            .filter(plan => plan.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        : [];

      setPlans(activePlans); // ✅ Guardamos solo la data, no el wrapper
      setIsLoaded(true);
      console.log(`✅ Membership plans loaded successfully! (${activePlans.length} active)`);

    } catch (err) {
      console.error('❌ Error loading plans:', err.message);
      setError(err);
      setPlans([]); // Fallback a array vacío
      setIsLoaded(true); // Marcar como cargado aunque falle
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchPlans();
    
    return () => {
      console.log('🧹 useMembershipPlans hook cleanup');
    };
  }, [fetchPlans]);

  // Función manual de reload
  const reload = useCallback(() => {
    console.log('🔄 Manual plans reload requested');
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,           // ✅ Solo la data: [ { id: 1, name: "...", ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useMembershipPlans;