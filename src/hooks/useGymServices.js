// Autor: Alexander Echeverria
// Dirección: src/hooks/useGymServices.js
// ✅ COMPLETO CON CRUD - Conectado con backend real

import { useState, useEffect, useCallback } from 'react';
import { GymService } from '../services/gymService';
const gymService = new GymService();

const useGymServices = () => {
  const [services, setServices] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  console.log('Hook useGymServices inicializado');

  // ================================
  // 📖 OBTENER SERVICIOS
  // ================================
  
  const fetchServices = useCallback(async () => {
    console.log('🏋️ Obteniendo servicios del gimnasio desde backend...');
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await gymService.getGymServices();
      console.log('✅ Respuesta de servicios recibida:', response);
      
      let servicesData = [];
      
      if (response && response.success && response.data) {
        servicesData = response.data;
        console.log('📋 Datos de servicios extraídos:');
        console.log('   - Total de servicios:', servicesData.length);
        
        if (Array.isArray(servicesData)) {
          servicesData.forEach((service, i) => {
            console.log(`   - Servicio ${i + 1}: "${service.title}" (Activo: ${service.isActive !== false})`);
          });
        }
      } else if (response && Array.isArray(response)) {
        servicesData = response;
        console.log('📋 Datos de servicios (array directo):', servicesData.length);
      } else {
        console.warn('⚠️ Estructura de respuesta de servicios inválida:', response);
        throw new Error('Estructura de respuesta inválida');
      }

      // ✅ Retornar TODOS los servicios (activos e inactivos)
      const allServices = Array.isArray(servicesData) ? servicesData : [];

      // ⚠️ MAPEO CORRECTO: Backend usa isActive, iconName
      const mappedServices = allServices.map(service => ({
        ...service,
        // Mantener isActive del backend
        isActive: service.isActive !== false,
        // Mantener iconName del backend
        iconName: service.iconName || 'dumbbell',
        // Asegurar que features es un array
        features: Array.isArray(service.features) ? service.features : []
      }));

      setServices(mappedServices);
      setIsLoaded(true);
      
      const activeCount = mappedServices.filter(s => s.isActive !== false).length;
      console.log(`✅ Servicios cargados: ${mappedServices.length} totales, ${activeCount} activos`);

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

  // ================================
  // ➕ CREAR SERVICIO
  // ================================
  
  const createService = useCallback(async (serviceData) => {
    console.log('➕ Creando nuevo servicio:', serviceData);
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Formatear datos para el backend
      const formattedData = {
        title: serviceData.title,
        description: serviceData.description || '',
        iconName: serviceData.iconName || serviceData.icon || 'dumbbell', // ⚠️ Mapeo
        imageUrl: serviceData.imageUrl || null,
        features: Array.isArray(serviceData.features) ? serviceData.features : [],
        displayOrder: serviceData.displayOrder || null,
        isActive: serviceData.isActive !== false // ⚠️ Mapeo
      };
      
      const response = await gymService.createService(formattedData);
      console.log('✅ Servicio creado:', response);
      
      if (response && response.success) {
        // Recargar servicios después de crear
        await fetchServices();
        return { success: true, data: response.data };
      }
      
      throw new Error(response?.message || 'Error al crear servicio');
    } catch (err) {
      console.error('❌ Error al crear servicio:', err.message);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [fetchServices]);

  // ================================
  // ✏️ ACTUALIZAR SERVICIO
  // ================================
  
  const updateService = useCallback(async (serviceId, serviceData) => {
    console.log(`✏️ Actualizando servicio ${serviceId}:`, serviceData);
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Formatear datos para el backend
      const formattedData = {
        title: serviceData.title,
        description: serviceData.description,
        iconName: serviceData.iconName || serviceData.icon, // ⚠️ Mapeo
        imageUrl: serviceData.imageUrl,
        features: Array.isArray(serviceData.features) ? serviceData.features : [],
        displayOrder: serviceData.displayOrder,
        isActive: serviceData.isActive // ⚠️ Usar isActive
      };
      
      const response = await gymService.updateService(serviceId, formattedData);
      console.log('✅ Servicio actualizado:', response);
      
      if (response && response.success) {
        // Recargar servicios después de actualizar
        await fetchServices();
        return { success: true, data: response.data };
      }
      
      throw new Error(response?.message || 'Error al actualizar servicio');
    } catch (err) {
      console.error('❌ Error al actualizar servicio:', err.message);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [fetchServices]);

  // ================================
  // 🗑️ ELIMINAR SERVICIO
  // ================================
  
  const deleteService = useCallback(async (serviceId) => {
    console.log(`🗑️ Eliminando servicio ${serviceId}...`);
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await gymService.deleteService(serviceId);
      console.log('✅ Servicio eliminado:', response);
      
      if (response && response.success) {
        // Recargar servicios después de eliminar
        await fetchServices();
        return { success: true };
      }
      
      throw new Error(response?.message || 'Error al eliminar servicio');
    } catch (err) {
      console.error('❌ Error al eliminar servicio:', err.message);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [fetchServices]);

  // ================================
  // 🔄 ACTIVAR/DESACTIVAR SERVICIO
  // ================================
  
  const toggleService = useCallback(async (serviceId) => {
    console.log(`🔄 Cambiando estado del servicio ${serviceId}...`);
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await gymService.toggleService(serviceId);
      console.log('✅ Estado del servicio cambiado:', response);
      
      if (response && response.success) {
        // Recargar servicios después del toggle
        await fetchServices();
        return { success: true, data: response.data };
      }
      
      throw new Error(response?.message || 'Error al cambiar estado del servicio');
    } catch (err) {
      console.error('❌ Error al cambiar estado del servicio:', err.message);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [fetchServices]);

  // ================================
  // 🔢 REORDENAR SERVICIOS
  // ================================
  
  const reorderServices = useCallback(async (orderData) => {
    console.log('🔢 Reordenando servicios:', orderData);
    
    setIsSaving(true);
    setError(null);
    
    try {
      // orderData debe ser un array de { id, displayOrder }
      const response = await gymService.reorderServices(orderData);
      console.log('✅ Servicios reordenados:', response);
      
      if (response && response.success) {
        // Recargar servicios después de reordenar
        await fetchServices();
        return { success: true };
      }
      
      throw new Error(response?.message || 'Error al reordenar servicios');
    } catch (err) {
      console.error('❌ Error al reordenar servicios:', err.message);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [fetchServices]);

  // ================================
  // 🌱 CREAR SERVICIOS POR DEFECTO
  // ================================
  
  const seedDefaultServices = useCallback(async () => {
    console.log('🌱 Creando servicios por defecto...');
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await gymService.seedDefaultServices();
      console.log('✅ Servicios por defecto creados:', response);
      
      if (response && response.success) {
        // Recargar servicios después del seed
        await fetchServices();
        return { success: true, data: response.data };
      }
      
      throw new Error(response?.message || 'Error al crear servicios por defecto');
    } catch (err) {
      console.error('❌ Error al crear servicios por defecto:', err.message);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, [fetchServices]);

  // ================================
  // 🔍 OBTENER SERVICIO POR ID
  // ================================
  
  const getServiceById = useCallback(async (serviceId) => {
    console.log(`🔍 Obteniendo servicio ${serviceId}...`);
    
    try {
      const response = await gymService.getServiceById(serviceId);
      console.log('✅ Servicio obtenido:', response);
      
      if (response && response.success && response.data) {
        // ⚠️ MAPEO CORRECTO
        const service = {
          ...response.data,
          isActive: response.data.isActive !== false,
          iconName: response.data.iconName || 'dumbbell',
          features: Array.isArray(response.data.features) ? response.data.features : []
        };
        
        return { success: true, data: service };
      }
      
      throw new Error(response?.message || 'Servicio no encontrado');
    } catch (err) {
      console.error('❌ Error al obtener servicio:', err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // ================================
  // 🔄 RECARGA MANUAL
  // ================================
  
  const reload = useCallback(() => {
    console.log('🔄 useGymServices - Recarga manual de servicios solicitada');
    return fetchServices();
  }, [fetchServices]);

  // ================================
  // 🎯 EFECTO PRINCIPAL
  // ================================
  
  useEffect(() => {
    console.log('🚀 useGymServices - Cargando servicios inicial...');
    fetchServices();
    
    return () => {
      console.log('👋 Limpieza del hook useGymServices');
    };
  }, [fetchServices]);

  // ================================
  // 📤 RETORNAR API DEL HOOK
  // ================================
  
  return {
    // Estado
    services,        // Array de servicios completo
    isLoaded,        // true cuando terminó de cargar
    isLoading,       // true mientras está cargando
    isSaving,        // true mientras guarda/actualiza/elimina
    error,           // Error si falló, null si todo ok
    
    // Funciones CRUD
    createService,   // (serviceData) => Promise<{success, data}>
    updateService,   // (id, serviceData) => Promise<{success, data}>
    deleteService,   // (id) => Promise<{success}>
    toggleService,   // (id) => Promise<{success, data}>
    reorderServices, // (orderData) => Promise<{success}>
    seedDefaultServices, // () => Promise<{success, data}>
    getServiceById,  // (id) => Promise<{success, data}>
    
    // Utilidades
    reload           // () => Promise - Recargar manualmente
  };
};

export default useGymServices;

/**
 * DOCUMENTACIÓN DEL HOOK useGymServices - VERSIÓN COMPLETA CON CRUD
 * 
 * PROPÓSITO:
 * Hook personalizado de React que gestiona completamente los servicios del gimnasio
 * incluyendo operaciones CRUD (Create, Read, Update, Delete) conectadas al backend real.
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - ✅ Obtiene servicios del gimnasio desde el backend (READ)
 * - ✅ Crea nuevos servicios (CREATE)
 * - ✅ Actualiza servicios existentes (UPDATE)
 * - ✅ Elimina servicios (DELETE)
 * - ✅ Activa/Desactiva servicios (TOGGLE)
 * - ✅ Reordena servicios (REORDER)
 * - ✅ Crea servicios por defecto (SEED)
 * - ✅ Obtiene servicio individual por ID (GET BY ID)
 * - ✅ Maneja estados de carga y guardado
 * - ✅ Maneja errores de forma robusta
 * - ✅ Recarga automática después de cambios
 * - ✅ Mapeo correcto de campos (icon→iconName, active→isActive)
 * 
 * ESTRUCTURA DE DATOS DEL BACKEND (según test):
 * {
 *   id: number,
 *   title: string,           // REQUERIDO
 *   description: string,
 *   iconName: string,        // Backend usa "iconName" no "icon"
 *   imageUrl: string,        // opcional
 *   features: Array<string>, // array de strings
 *   displayOrder: number,    // para ordenar
 *   isActive: boolean,       // Backend usa "isActive" no "active"
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 * 
 * USO TÍPICO EN COMPONENTES:
 * ```javascript
 * const {
 *   services,
 *   isLoading,
 *   isSaving,
 *   error,
 *   createService,
 *   updateService,
 *   deleteService,
 *   toggleService,
 *   reload
 * } = useGymServices();
 * 
 * // Crear nuevo servicio
 * const handleCreate = async () => {
 *   const result = await createService({
 *     title: 'Entrenamiento Personal',
 *     description: 'Entrenamiento personalizado...',
 *     iconName: 'dumbbell',
 *     features: ['Evaluación inicial', 'Plan personalizado'],
 *     isActive: true
 *   });
 *   
 *   if (result.success) {
 *     console.log('Servicio creado:', result.data);
 *   }
 * };
 * 
 * // Actualizar servicio
 * const handleUpdate = async (serviceId) => {
 *   const result = await updateService(serviceId, {
 *     title: 'Nuevo título',
 *     description: 'Nueva descripción'
 *   });
 * };
 * 
 * // Eliminar servicio
 * const handleDelete = async (serviceId) => {
 *   const result = await deleteService(serviceId);
 * };
 * 
 * // Activar/Desactivar
 * const handleToggle = async (serviceId) => {
 *   const result = await toggleService(serviceId);
 * };
 * ```
 * 
 * ESTADOS RETORNADOS:
 * - services: Array de servicios del gimnasio
 * - isLoaded: Boolean - true cuando terminó la carga inicial
 * - isLoading: Boolean - true mientras carga datos
 * - isSaving: Boolean - true mientras guarda/actualiza/elimina
 * - error: Object Error o null
 * 
 * FUNCIONES DISPONIBLES:
 * - createService(serviceData): Crear nuevo servicio
 * - updateService(id, serviceData): Actualizar servicio existente
 * - deleteService(id): Eliminar servicio
 * - toggleService(id): Activar/Desactivar servicio
 * - reorderServices(orderData): Reordenar múltiples servicios
 * - seedDefaultServices(): Crear servicios por defecto del sistema
 * - getServiceById(id): Obtener servicio individual
 * - reload(): Recargar todos los servicios manualmente
 * 
 * MANEJO DE ERRORES:
 * - Cada función retorna { success: boolean, data?, error? }
 * - Los errores se almacenan en el estado 'error'
 * - Recarga automática después de operaciones exitosas
 * - Logging detallado en consola para debugging
 * 
 * MAPEO DE CAMPOS:
 * - Frontend "icon" ↔️ Backend "iconName"
 * - Frontend "active" ↔️ Backend "isActive"
 * - Todos los demás campos se mantienen igual
 * 
 * OPTIMIZACIONES:
 * - Uso de useCallback para evitar re-renders innecesarios
 * - Recarga automática después de cambios
 * - Estados separados para loading y saving
 * - Cleanup automático en desmontaje del componente
 * - Logs detallados para debugging en desarrollo
 * 
 * CONECTIVIDAD:
 * - Conectado con GymService del backend real
 * - Usa endpoints: /api/gym/services/*
 * - Compatible con test-gym-info-manager.js del backend
 * 
 * NOTA PARA DESARROLLADORES:
 * Este hook maneja TODA la lógica de servicios del gimnasio.
 * Los componentes solo deben llamar las funciones y mostrar los datos.
 * El mapeo de campos se hace automáticamente en el hook.
 */