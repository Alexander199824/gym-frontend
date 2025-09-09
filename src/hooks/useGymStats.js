// Autor: Alexander Echeverria
// Dirección: src/hooks/useGymStats.js

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useGymStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('Hook useGymStats inicializado');

  const fetchStats = useCallback(async () => {
    console.log('Obteniendo estadísticas del gimnasio');
    console.log('Realizando solicitud API a /api/gym/stats');
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getGymStats();
      console.log('Respuesta de estadísticas recibida:', response);
      
      // CORRECCIÓN CRÍTICA: Extraer solo la data del response
      let statsData = null;
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: { members: 2000, ... } }
        statsData = response.data;
        console.log('Datos de estadísticas extraídos:');
        console.log('  - Miembros:', statsData.members);
        console.log('  - Entrenadores:', statsData.trainers);
        console.log('  - Experiencia:', statsData.experience);
        console.log('  - Satisfacción:', statsData.satisfaction);
        console.log('  - Instalaciones:', statsData.facilities);
        if (statsData.customStats) {
          console.log('  - Estadísticas personalizadas:', statsData.customStats.length);
        }
      } else if (response && response.members) {
        // Si el response ya es la data directamente
        statsData = response;
        console.log('Datos de estadísticas (directo):', statsData);
      } else {
        console.warn('Estructura de respuesta de estadísticas inválida:', response);
        throw new Error('Estructura de respuesta inválida');
      }

      if (statsData) {
        setStats(statsData); // Guardamos solo la data, no el wrapper
        setIsLoaded(true);
        console.log('Estadísticas del gimnasio cargadas exitosamente!');
      } else {
        throw new Error('Los datos de estadísticas están vacíos');
      }

    } catch (err) {
      console.error('Error al cargar estadísticas:', err.message);
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
      console.log('Limpieza del hook useGymStats');
    };
  }, [fetchStats]);

  // Función manual de recarga
  const reload = useCallback(() => {
    console.log('Recarga manual de estadísticas solicitada');
    fetchStats();
  }, [fetchStats]);

  return {
    stats,           // Solo la data: { members: 2000, trainers: 50, ... }
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload           // Función para recargar manualmente
  };
};

export default useGymStats;

/**
 * DOCUMENTACIÓN DEL HOOK useGymStats
 * 
 * PROPÓSITO:
 * Hook personalizado de React que gestiona la carga y manejo de las estadísticas
 * del gimnasio desde el backend. Proporciona datos numéricos clave sobre el
 * rendimiento y estado actual del gimnasio para mostrar en dashboards y secciones
 * informativas del sitio web.
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Obtiene estadísticas del gimnasio desde la API backend
 * - Extrae correctamente los datos del wrapper de respuesta del backend
 * - Maneja estados de carga y errores de forma robusta
 * - Proporciona función de recarga manual para actualizar datos
 * - Implementa limpieza automática de recursos
 * - Logs detallados para debugging y monitoreo
 * 
 * ARCHIVOS CON LOS QUE SE CONECTA:
 * - '../services/apiService': Servicio principal para comunicación con el backend
 *   └── Función específica: getGymStats()
 * - Backend API endpoint: '/api/gym/stats'
 * - Componentes de dashboard que muestran métricas del gimnasio
 * - Secciones "Acerca de" o "Nosotros" que muestran logros del gimnasio
 * - Páginas de estadísticas administrativas
 * 
 * ESTRUCTURA DE DATOS ESPERADA DEL BACKEND:
 * Respuesta del API: { success: true, data: {...} }
 * Objeto de estadísticas: {
 *   members: number,           // Total de miembros activos
 *   trainers: number,          // Número de entrenadores
 *   experience: number,        // Años de experiencia
 *   satisfaction: number,      // Porcentaje de satisfacción (0-100)
 *   facilities: number,        // Número de instalaciones/equipos
 *   customStats?: Array,       // Estadísticas personalizadas adicionales
 *   revenue?: string,          // Ingresos (en quetzales si aplica)
 *   ...otros campos numéricos
 * }
 * 
 * USO TÍPICO EN COMPONENTES:
 * const { stats, isLoading, error, reload } = useGymStats();
 * 
 * if (isLoading) return <div>Cargando estadísticas...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!stats) return <div>No hay estadísticas disponibles</div>;
 * 
 * return (
 *   <div className="stats-grid">
 *     <StatCard title="Miembros Activos" value={stats.members} />
 *     <StatCard title="Entrenadores" value={stats.trainers} />
 *     <StatCard title="Años de Experiencia" value={stats.experience} />
 *     <StatCard title="Satisfacción" value={`${stats.satisfaction}%`} />
 *   </div>
 * );
 * 
 * ESTADOS RETORNADOS:
 * - stats: Objeto con todas las estadísticas numéricas del gimnasio
 * - isLoaded: Boolean que indica si ya terminó el proceso de carga
 * - isLoading: Boolean que indica si está actualmente cargando datos
 * - error: Objeto Error si ocurrió algún problema, null si todo está bien
 * 
 * FUNCIONES DISPONIBLES:
 * - reload(): Fuerza una nueva carga de estadísticas desde el backend
 * 
 * MANEJO DE ERRORES:
 * - Si falla la carga, stats permanece como null
 * - isLoaded se marca como true incluso en caso de error
 * - El error se almacena en el estado 'error' para manejo por el componente
 * - Los componentes deben verificar si stats es null antes de renderizar
 * 
 * CASOS DE USO COMUNES:
 * 1. Sección "Acerca de Nosotros": Mostrar años de experiencia, miembros, etc.
 * 2. Dashboard administrativo: Métricas de rendimiento del gimnasio
 * 3. Landing page: Estadísticas impresionantes para atraer nuevos miembros
 * 4. Página de testimonios: Datos de satisfacción y número de miembros
 * 
 * OPTIMIZACIONES:
 * - Uso de useCallback para evitar re-renders innecesarios
 * - Cleanup automático en el desmontaje del componente
 * - Logs detallados para debugging en desarrollo
 * - Validación robusta de estructura de datos
 * 
 * CONSIDERACIONES DE RENDIMIENTO:
 * - Las estadísticas suelen cambiar con poca frecuencia
 * - Considerar implementar caché si se usa en múltiples componentes
 * - Los datos numéricos son ligeros, no requieren paginación
 * 
 * NOTA PARA DESARROLLADORES:
 * Este hook es esencial para mostrar la credibilidad y éxito del gimnasio.
 * Las estadísticas monetarias (si existen) deben mostrarse en quetzales (Q).
 * Mantener consistencia con el formato numérico (separadores de miles, etc.)
 * al mostrar las estadísticas en la interfaz de usuario.
 */