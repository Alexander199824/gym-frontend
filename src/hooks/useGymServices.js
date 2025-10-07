// Autor: Alexander Echeverria
// Dirección: src/hooks/useGymServices.js
// ✅ ACTUALIZADO para usar GymService en lugar de apiService

import { useState, useEffect, useCallback } from 'react';
import { GymService } from '../services/gymService';
const gymService = new GymService();

const useGymServices = () => {
  const [services, setServices] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('Hook useGymServices inicializado');

  const fetchServices = useCallback(async () => {
    console.log('🏋️ Obteniendo servicios del gimnasio desde backend...');
    
    setIsLoading(true);
    setError(null);

    try {
      // ✅ USAR gymService en lugar de apiService
      const response = await gymService.getGymServices();
      console.log('✅ Respuesta de servicios recibida:', response);
      
      let servicesData = [];
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: [...] }
        servicesData = response.data;
        console.log('📋 Datos de servicios extraídos:');
        console.log('   - Total de servicios:', servicesData.length);
        
        if (Array.isArray(servicesData)) {
          servicesData.forEach((service, i) => {
            console.log(`   - Servicio ${i + 1}: "${service.title}" (Activo: ${service.active !== false})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        // Si el response ya es la data directamente
        servicesData = response;
        console.log('📋 Datos de servicios (array directo):', servicesData.length);
      } else {
        console.warn('⚠️ Estructura de respuesta de servicios inválida:', response);
        throw new Error('Estructura de respuesta inválida');
      }

      // ✅ Retornar TODOS los servicios (activos e inactivos)
      // El filtrado se hace en el componente si es necesario
      const allServices = Array.isArray(servicesData) ? servicesData : [];

      setServices(allServices);
      setIsLoaded(true);
      
      const activeCount = allServices.filter(s => s.active !== false).length;
      console.log(`✅ Servicios cargados: ${allServices.length} totales, ${activeCount} activos`);

    } catch (err) {
      console.error('❌ Error al cargar servicios:', err.message);
      console.error('   Stack:', err.stack);
      setError(err);
      setServices([]);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    console.log('🚀 useGymServices - Cargando servicios inicial...');
    fetchServices();
    
    return () => {
      console.log('👋 Limpieza del hook useGymServices');
    };
  }, [fetchServices]);

  // Función manual de recarga
  const reload = useCallback(() => {
    console.log('🔄 useGymServices - Recarga manual de servicios solicitada');
    return fetchServices();
  }, [fetchServices]);

  return {
    services,        // Array de servicios: [ { id, title, description, icon, features, active }, ... ]
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    error,           // Error si falló, null si todo ok
    reload           // Función para recargar manualmente
  };
};

export default useGymServices;

/**
 * DOCUMENTACIÓN DEL HOOK useGymServices
 * 
 * PROPÓSITO:
 * Hook personalizado de React que gestiona la carga y manejo de los servicios
 * del gimnasio desde el backend. Proporciona una interfaz limpia para obtener
 * la lista de servicios activos disponibles en el gimnasio.
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Obtiene servicios del gimnasio desde la API backend
 * - Filtra automáticamente solo los servicios activos
 * - Maneja estados de carga y errores de forma robusta
 * - Extrae correctamente los datos del wrapper de respuesta del backend
 * - Proporciona función de recarga manual
 * - Implementa limpieza automática de recursos
 * 
 * ARCHIVOS CON LOS QUE SE CONECTA:
 * - '../services/apiService': Servicio principal para comunicación con el backend
 *   └── Función específica: getGymServices()
 * - Backend API endpoint: '/api/gym/services'
 * - Cualquier componente React que necesite mostrar servicios del gimnasio
 * 
 * ESTRUCTURA DE DATOS ESPERADA DEL BACKEND:
 * Respuesta del API: { success: true, data: [...] }
 * Cada servicio: {
 *   id: number,
 *   title: string,
 *   description?: string,
 *   price?: string (en quetzales),
 *   active: boolean,
 *   ...otros campos
 * }
 * 
 * USO TÍPICO EN COMPONENTES:
 * const { services, isLoading, error, reload } = useGymServices();
 * 
 * if (isLoading) return <div>Cargando servicios...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * 
 * return (
 *   <div>
 *     {services.map(service => (
 *       <ServiceCard key={service.id} service={service} />
 *     ))}
 *   </div>
 * );
 * 
 * ESTADOS RETORNADOS:
 * - services: Array de objetos con los servicios activos del gimnasio
 * - isLoaded: Boolean que indica si ya terminó el proceso de carga
 * - isLoading: Boolean que indica si está actualmente cargando datos
 * - error: Objeto Error si ocurrió algún problema, null si todo está bien
 * 
 * FUNCIONES DISPONIBLES:
 * - reload(): Fuerza una nueva carga de servicios desde el backend
 * 
 * MANEJO DE ERRORES:
 * - Si falla la carga, services se establece como array vacío
 * - isLoaded se marca como true incluso en caso de error
 * - El error se almacena en el estado 'error' para manejo por el componente
 * 
 * FILTRADO AUTOMÁTICO:
 * - Solo retorna servicios donde 'active' no sea false
 * - Servicios sin campo 'active' se consideran activos por defecto
 * 
 * OPTIMIZACIONES:
 * - Uso de useCallback para evitar re-renders innecesarios
 * - Cleanup automático en el desmontaje del componente
 * - Logs detallados para debugging en desarrollo
 * 
 * NOTA PARA DESARROLLADORES:
 * Este hook es esencial para cualquier sección que muestre servicios del gimnasio.
 * Los precios de servicios deben mostrarse en quetzales (Q). Mantener compatibilidad
 * con la estructura de respuesta del backend al hacer cambios.
 */