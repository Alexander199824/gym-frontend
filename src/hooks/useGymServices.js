// src/hooks/useGymServices.js
// FUNCIÓN: Hook CORREGIDO para cargar servicios del gimnasio
// ARREGLA: Extrae solo la data del response del backend

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useGymServices = () => {
  const [services, setServices] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🏋️ useGymServices hook initialized');

  const fetchServices = useCallback(async () => {
    console.log('🏋️ Fetching Gym Services');
    console.log('📡 Making API request to /api/gym/services');
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getGymServices();
      console.log('✅ Services response received:', response);
      
      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let servicesData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [ { id: 1, title: "...", ... }, ... ] }
        servicesData = response.data;
        console.log('🏋️ Services data extracted:');
        console.log('  - Total services:', servicesData.length);
        if (Array.isArray(servicesData)) {
          servicesData.forEach((service, i) => {
            console.log(`  - Service ${i + 1}: ${service.title} (Active: ${service.active !== false})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        servicesData = response;
        console.log('🏋️ Services data (direct array):', servicesData.length);
      } else {
        console.warn('⚠️ Invalid services response structure:', response);
        throw new Error('Invalid response structure');
      }

      // Filtrar solo servicios activos
      const activeServices = Array.isArray(servicesData) 
        ? servicesData.filter(service => service.active !== false)
        : [];

      setServices(activeServices); // ✅ Guardamos solo la data, no el wrapper
      setIsLoaded(true);
      console.log(`✅ Gym services loaded successfully! (${activeServices.length} active)`);

    } catch (err) {
      console.error('❌ Error loading services:', err.message);
      setError(err);
      setServices([]); // Fallback a array vacío
      setIsLoaded(true); // Marcar como cargado aunque falle
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchServices();
    
    return () => {
      console.log('🧹 useGymServices hook cleanup');
    };
  }, [fetchServices]);

  // Función manual de reload
  const reload = useCallback(() => {
    console.log('🔄 Manual services reload requested');
    fetchServices();
  }, [fetchServices]);

  return {
    services,        // ✅ Solo la data: [ { id: 1, title: "...", ... }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useGymServices;