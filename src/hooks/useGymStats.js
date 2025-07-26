// src/hooks/useGymStats.js
// FUNCIÓN: Hook para estadísticas del gimnasio
// CONECTA CON: GET /api/gym/stats

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useGymStats = () => {
  // 🏗️ Estados
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 📊 Estadísticas por defecto mientras carga
  const defaultStats = {
    members: '0',
    trainers: '0',
    experience: '0',
    satisfaction: '0%',
    equipment: '0',
    classes: '0',
    locations: '1',
    hours_per_day: '16'
  };

  // 🚀 Función para obtener estadísticas
  const fetchGymStats = async (force = false) => {
    // Cache de 5 minutos (estadísticas pueden cambiar frecuentemente)
    if (stats && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 5 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Obteniendo estadísticas desde backend...');
      
      const response = await apiService.getGymStats();
      
      if (response.success && response.data) {
        console.log('✅ Estadísticas obtenidas:', response.data);
        
        // Fusionar con valores por defecto
        const completeStats = { ...defaultStats, ...response.data };
        setStats(completeStats);
        setLastFetch(Date.now());
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      setError(error.message);
      
      // En caso de error, usar estadísticas por defecto
      if (!stats) {
        setStats(defaultStats);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar estadísticas al montar
  useEffect(() => {
    fetchGymStats();
  }, []);

  // 🎯 Función para refrescar estadísticas
  const refresh = () => {
    fetchGymStats(true);
  };

  // 📈 Función para obtener estadística específica
  const getStat = (statName) => {
    return stats?.[statName] || defaultStats[statName] || '0';
  };

  // 🔢 Función para formatear números grandes
  const formatNumber = (value) => {
    if (typeof value !== 'string') return value;
    
    // Si ya tiene formato (ej: "2000+"), devolverlo tal como está
    if (value.includes('+') || value.includes('%')) {
      return value;
    }
    
    const num = parseInt(value);
    if (isNaN(num)) return value;
    
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    
    return num.toString();
  };

  // 📊 Función para obtener estadísticas formateadas para display
  const getDisplayStats = () => {
    if (!stats) return [];
    
    return [
      {
        key: 'members',
        label: 'Miembros Activos',
        value: getStat('members'),
        icon: 'Users',
        color: 'primary',
        description: 'Miembros registrados y activos'
      },
      {
        key: 'trainers',
        label: 'Entrenadores',
        value: getStat('trainers'),
        icon: 'Award',
        color: 'secondary',
        description: 'Entrenadores certificados'
      },
      {
        key: 'experience',
        label: 'Años de Experiencia',
        value: getStat('experience'),
        icon: 'Trophy',
        color: 'success',
        description: 'Años sirviendo a la comunidad'
      },
      {
        key: 'satisfaction',
        label: 'Satisfacción',
        value: getStat('satisfaction'),
        icon: 'Star',
        color: 'warning',
        description: 'Nivel de satisfacción de clientes'
      },
      {
        key: 'equipment',
        label: 'Equipos',
        value: getStat('equipment'),
        icon: 'Dumbbell',
        color: 'info',
        description: 'Máquinas y equipos disponibles'
      },
      {
        key: 'classes',
        label: 'Clases',
        value: getStat('classes'),
        icon: 'Calendar',
        color: 'purple',
        description: 'Clases grupales semanales'
      }
    ];
  };

  // 🏆 Función para obtener estadísticas destacadas (para hero)
  const getFeaturedStats = () => {
    const displayStats = getDisplayStats();
    return displayStats.slice(0, 4); // Solo las primeras 4
  };

  // 📱 Función para obtener estadísticas para móvil (compactas)
  const getMobileStats = () => {
    return [
      {
        label: 'Miembros',
        value: getStat('members'),
        icon: 'Users'
      },
      {
        label: 'Entrenadores',
        value: getStat('trainers'),
        icon: 'Award'
      },
      {
        label: 'Años',
        value: getStat('experience'),
        icon: 'Trophy'
      },
      {
        label: 'Satisfacción',
        value: getStat('satisfaction'),
        icon: 'Star'
      }
    ];
  };

  // 🎯 Función para verificar si hay estadísticas válidas
  const hasValidStats = () => {
    if (!stats) return false;
    
    const mainStats = ['members', 'trainers', 'experience', 'satisfaction'];
    return mainStats.some(stat => {
      const value = getStat(stat);
      return value && value !== '0' && value !== '0%';
    });
  };

  // 📈 Función para obtener tendencia (si está disponible)
  const getStatTrend = (statName) => {
    return stats?.[`${statName}_trend`] || null;
  };

  // 🔄 Función para auto-actualizar estadísticas
  const startAutoRefresh = (intervalMinutes = 5) => {
    const interval = setInterval(() => {
      refresh();
    }, intervalMinutes * 60 * 1000);
    
    return () => clearInterval(interval);
  };

  // 💾 Función para obtener estadísticas desde cache local
  const getFromCache = () => {
    try {
      const cached = localStorage.getItem('gym_stats_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Cache válido por 10 minutos
        if (now - timestamp < 10 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error al leer cache de estadísticas:', error);
    }
    
    return null;
  };

  // 💾 Función para guardar estadísticas en cache
  const saveToCache = (statsData) => {
    try {
      const cacheData = {
        data: statsData,
        timestamp: Date.now()
      };
      localStorage.setItem('gym_stats_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error al guardar cache de estadísticas:', error);
    }
  };

  // 💾 Efecto para manejar cache
  useEffect(() => {
    if (stats && hasValidStats()) {
      saveToCache(stats);
    }
  }, [stats]);

  // 🏠 Retornar estadísticas y funciones
  return {
    // Estado
    stats: stats || defaultStats,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getStat,
    formatNumber,
    getDisplayStats,
    getFeaturedStats,
    getMobileStats,
    getStatTrend,
    startAutoRefresh,
    
    // Verificaciones
    hasValidStats,
    
    // Acceso directo a estadísticas principales (para compatibilidad)
    members: getStat('members'),
    trainers: getStat('trainers'),
    experience: getStat('experience'),
    satisfaction: getStat('satisfaction'),
    equipment: getStat('equipment'),
    classes: getStat('classes'),
    
    // Estadísticas adicionales
    locations: getStat('locations'),
    hoursPerDay: getStat('hours_per_day'),
    
    // Estado útil
    isLoaded: !loading && !!stats && !error,
    hasError: !!error,
    isEmpty: !stats || !hasValidStats()
  };
};

export default useGymStats;