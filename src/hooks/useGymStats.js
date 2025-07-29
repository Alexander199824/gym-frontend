// src/hooks/useGymStats.js
// FUNCIÓN: Hook CORREGIDO para cargar estadísticas del gimnasio
// ARREGLA: Extrae solo la data del response del backend

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useGymStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('📊 useGymStats hook initialized');

  const fetchStats = useCallback(async () => {
    console.log('📊 Fetching Gym Statistics');
    console.log('📡 Making API request to /api/gym/stats');
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getGymStats();
      console.log('✅ Stats response received:', response);
      
      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let statsData = null;
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: { members: 2000, ... } }
        statsData = response.data;
        console.log('📊 Stats data extracted:');
        console.log('  - Members:', statsData.members);
        console.log('  - Trainers:', statsData.trainers);
        console.log('  - Experience:', statsData.experience);
        console.log('  - Satisfaction:', statsData.satisfaction);
        console.log('  - Facilities:', statsData.facilities);
        if (statsData.customStats) {
          console.log('  - Custom Stats:', statsData.customStats.length);
        }
      } else if (response && response.members) {
        // Si el response ya es la data directamente
        statsData = response;
        console.log('📊 Stats data (direct):', statsData);
      } else {
        console.warn('⚠️ Invalid stats response structure:', response);
        throw new Error('Invalid response structure');
      }

      if (statsData) {
        setStats(statsData); // ✅ Guardamos solo la data, no el wrapper
        setIsLoaded(true);
        console.log('✅ Gym stats loaded successfully!');
      } else {
        throw new Error('Stats data is empty');
      }

    } catch (err) {
      console.error('❌ Error loading stats:', err.message);
      setError(err);
      setIsLoaded(true); // Marcar como cargado aunque falle
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchStats();
    
    return () => {
      console.log('🧹 useGymStats hook cleanup');
    };
  }, [fetchStats]);

  // Función manual de reload
  const reload = useCallback(() => {
    console.log('🔄 Manual stats reload requested');
    fetchStats();
  }, [fetchStats]);

  return {
    stats,           // ✅ Solo la data: { members: 2000, trainers: 50, ... }
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useGymStats;