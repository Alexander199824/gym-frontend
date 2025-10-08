// src/hooks/useActiveGymServices.js
// Hook optimizado para obtener SOLO servicios activos (público)

import { useState, useEffect, useCallback } from 'react';
import { GymService } from '../services/gymService';

const gymService = new GymService();

const useActiveGymServices = () => {
  const [services, setServices] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🎯 Hook useActiveGymServices inicializado');

  // Función para obtener servicios activos
  const fetchActiveServices = useCallback(async () => {
    console.log('🏋️ Obteniendo SOLO servicios activos desde backend...');
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await gymService.getActiveServices();
      console.log('✅ Respuesta de servicios activos recibida:', response);
      
      let servicesData = [];
      
      if (response && response.success && response.data) {
        servicesData = response.data;
        console.log('📋 Servicios activos extraídos:', servicesData.length);
        
        if (Array.isArray(servicesData)) {
          servicesData.forEach((service, i) => {
            console.log(`   - Servicio ${i + 1}: "${service.title}"`);
          });
        }
      } else if (response && Array.isArray(response)) {
        servicesData = response;
      } else {
        console.warn('⚠️ Estructura de respuesta inválida:', response);
      }

      // Mapear correctamente los campos
      const mappedServices = (Array.isArray(servicesData) ? servicesData : []).map(service => ({
        ...service,
        // Backend usa isActive, frontend puede esperar active también
        active: service.isActive !== false,
        isActive: service.isActive !== false,
        // Backend usa iconName, algunos componentes esperan icon
        icon: service.iconName || service.icon || 'dumbbell',
        iconName: service.iconName || service.icon || 'dumbbell',
        // Asegurar que features es un array
        features: Array.isArray(service.features) ? service.features : []
      }));

      setServices(mappedServices);
      setIsLoaded(true);
      
      console.log(`✅ ${mappedServices.length} servicios activos cargados`);

    } catch (err) {
      console.error('❌ Error al cargar servicios activos:', err.message);
      console.error('   Stack:', err.stack);
      setError(err);
      setServices([]);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recarga manual
  const reload = useCallback(() => {
    console.log('🔄 useActiveGymServices - Recarga manual solicitada');
    return fetchActiveServices();
  }, [fetchActiveServices]);

  // Efecto principal - cargar al montar
  useEffect(() => {
    console.log('🚀 useActiveGymServices - Cargando servicios activos inicial...');
    fetchActiveServices();
    
    return () => {
      console.log('👋 Limpieza del hook useActiveGymServices');
    };
  }, [fetchActiveServices]);

  return {
    services,      // Array de servicios activos
    isLoaded,      // true cuando terminó de cargar
    isLoading,     // true mientras está cargando
    error,         // Error si falló, null si todo ok
    reload         // Función para recargar manualmente
  };
};

export default useActiveGymServices;

/**
 * DOCUMENTACIÓN DEL HOOK useActiveGymServices
 * 
 * PROPÓSITO:
 * Hook optimizado para obtener SOLO servicios activos del gimnasio.
 * Ideal para páginas públicas como la Landing Page.
 * 
 * DIFERENCIAS CON useGymServices:
 * - useActiveGymServices: Solo servicios activos (público) - Sin funciones CRUD
 * - useGymServices: Todos los servicios + CRUD completo (admin)
 * 
 * USO:
 * ```javascript
 * const { services, isLoading, error, reload } = useActiveGymServices();
 * 
 * // Usar servicios directamente (ya están filtrados como activos)
 * services.map(service => <ServiceCard key={service.id} {...service} />)
 * ```
 * 
 * VENTAJAS:
 * - ✅ Más eficiente (solo trae datos necesarios)
 * - ✅ Filtrado en el backend (no en el cliente)
 * - ✅ Menos transferencia de datos
 * - ✅ Código más limpio en componentes
 * - ✅ Mapeo automático de campos (isActive, iconName)
 * 
 * RETORNA:
 * - services: Array de servicios activos
 * - isLoaded: Boolean - true cuando terminó la carga
 * - isLoading: Boolean - true mientras carga
 * - error: Object Error o null
 * - reload: Function - Recargar manualmente
 */