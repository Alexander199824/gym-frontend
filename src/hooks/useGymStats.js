// Autor: Alexander Echeverria
// Dirección: src/hooks/useGymStats.js
// VERSIÓN ACTUALIZADA: Usa estadísticas activas dinámicas del backend

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useGymStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('Hook useGymStats inicializado (versión dinámica)');

  const fetchStats = useCallback(async () => {
    console.log('📊 Obteniendo estadísticas activas del gimnasio');
    console.log('Realizando solicitud API a /api/statistics/active');
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getActiveStatistics();
      console.log('Respuesta de estadísticas activas recibida:', response);
      
      let statsData = null;
      
      if (response && response.success && response.data) {
        // Nuevo formato: Array de estadísticas activas
        if (Array.isArray(response.data)) {
          statsData = response.data;
          console.log('✅ Estadísticas activas (formato array):', statsData.length);
          statsData.forEach((stat, index) => {
            console.log(`  ${index + 1}. ${stat.label}: ${stat.number} (${stat.icon || 'sin icono'})`);
          });
        } 
        // Formato antiguo: Objeto con propiedades
        else if (response.data.members || response.data.trainers) {
          console.log('⚠️ Formato antiguo detectado, convirtiendo...');
          statsData = convertOldFormat(response.data);
        } 
        else {
          console.warn('Estructura de respuesta de estadísticas inválida:', response);
          throw new Error('Estructura de respuesta inválida');
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es el array directamente
        statsData = response;
        console.log('✅ Estadísticas activas (directo):', statsData.length);
      } else {
        console.warn('Estructura de respuesta de estadísticas inválida:', response);
        throw new Error('Estructura de respuesta inválida');
      }

      if (statsData) {
        setStats(statsData);
        setIsLoaded(true);
        console.log('✅ Estadísticas del gimnasio cargadas exitosamente!');
      } else {
        throw new Error('Los datos de estadísticas están vacíos');
      }

    } catch (err) {
      console.error('Error al cargar estadísticas:', err.message);
      setError(err);
      setStats([]); // Array vacío en caso de error
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para convertir formato antiguo a nuevo
  const convertOldFormat = (oldData) => {
    const converted = [];
    
    if (oldData.members > 0) {
      converted.push({
        number: oldData.members,
        label: "Miembros Activos",
        icon: "Users",
        color: "primary"
      });
    }
    
    if (oldData.trainers > 0) {
      converted.push({
        number: oldData.trainers,
        label: "Entrenadores",
        icon: "Award",
        color: "secondary"
      });
    }
    
    if (oldData.experience > 0) {
      converted.push({
        number: oldData.experience,
        label: "Años de Experiencia",
        icon: "Trophy",
        color: "success"
      });
    }
    
    if (oldData.satisfaction > 0) {
      converted.push({
        number: `${oldData.satisfaction}%`,
        label: "Satisfacción",
        icon: "Star",
        color: "warning"
      });
    }
    
    console.log('Formato antiguo convertido:', converted);
    return converted;
  };

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchStats();
    
    return () => {
      console.log('Limpieza del hook useGymStats');
    };
  }, [fetchStats]);

  // Función manual de recarga
  const reload = useCallback(() => {
    console.log('Recarga manual de estadísticas solicitada');
    fetchStats();
  }, [fetchStats]);

  return {
    stats,           // Array de estadísticas: [{ number, label, icon, color, description? }]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useGymStats;

/**
 * DOCUMENTACIÓN ACTUALIZADA DEL HOOK useGymStats
 * 
 * CAMBIOS EN ESTA VERSIÓN:
 * - Usa endpoint /api/statistics/active para obtener estadísticas dinámicas
 * - Soporta array de estadísticas con iconos y colores personalizados
 * - Mantiene compatibilidad con formato antiguo (fallback)
 * - Retorna array vacío en caso de error (no null)
 * 
 * ESTRUCTURA DE DATOS ESPERADA (NUEVA):
 * Array de estadísticas: [
 *   {
 *     number: string | number,    // Valor a mostrar (ej: "500+", 1200)
 *     label: string,               // Etiqueta (ej: "Miembros Activos")
 *     icon: string,                // Nombre del icono (ej: "Users", "Trophy")
 *     color: string,               // Color (ej: "primary", "success")
 *     description?: string         // Descripción opcional
 *   },
 *   ...
 * ]
 * 
 * USO EN COMPONENTES:
 * const { stats, isLoading, error } = useGymStats();
 * 
 * if (isLoading) return <Loader />;
 * if (error) return <ErrorMessage />;
 * 
 * return (
 *   <div className="stats-grid">
 *     {stats && stats.map((stat, index) => (
 *       <StatCard 
 *         key={index}
 *         icon={stat.icon}
 *         number={stat.number}
 *         label={stat.label}
 *         color={stat.color}
 *       />
 *     ))}
 *   </div>
 * );
 */

/**
 * =====================================================
 * DOCUMENTACIÓN - VERSIÓN COMPATIBLE
 * =====================================================
 * 
 * PROPÓSITO:
 * Hook que obtiene estadísticas dinámicas del backend pero mantiene
 * compatibilidad total con el código existente en LandingPage.js
 * 
 * MAPEO AUTOMÁTICO:
 * Backend devuelve: [{ label: "Miembros", number: "2000+" }, ...]
 * Hook devuelve: { members: 2000, trainers: 50, ... }
 * 
 * SIN CAMBIOS REQUERIDOS EN:
 * - LandingPage.js (mantiene el mismo código)
 * - Diseño visual (idéntico al original)
 * - Lógica de renderizado (sin modificaciones)
 * 
 * VENTAJAS:
 * ✅ Datos 100% dinámicos desde el backend
 * ✅ Cero cambios en el diseño existente
 * ✅ Compatible con código actual
 * ✅ Fallback automático en caso de error
 * ✅ Fácil de mantener y actualizar
 */