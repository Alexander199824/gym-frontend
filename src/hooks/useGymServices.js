// src/hooks/useGymServices.js
// FUNCIÓN: Hook para servicios del gimnasio
// CONECTA CON: GET /api/gym/services

import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const useGymServices = () => {
  // 🏗️ Estados
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 🏋️ Servicios por defecto mientras carga
  const defaultServices = [
    {
      id: 1,
      title: 'Cargando servicios...',
      description: 'Por favor espera...',
      icon: 'Dumbbell',
      features: [],
      order: 1
    }
  ];

  // 🚀 Función para obtener servicios
  const fetchGymServices = async (force = false) => {
    // Cache de 15 minutos (servicios no cambian frecuentemente)
    if (services && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 15 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🏋️ Obteniendo servicios desde backend...');
      
      const response = await apiService.getGymServices();
      
      if (response.success && response.data) {
        console.log('✅ Servicios obtenidos:', response.data);
        
        // Ordenar servicios por el campo 'order'
        const sortedServices = response.data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setServices(sortedServices);
        setLastFetch(Date.now());
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al obtener servicios:', error);
      setError(error.message);
      
      // En caso de error, usar servicios por defecto
      if (!services) {
        setServices(defaultServices);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar servicios al montar
  useEffect(() => {
    fetchGymServices();
  }, []);

  // 🎯 Función para refrescar servicios
  const refresh = () => {
    fetchGymServices(true);
  };

  // 🔍 Función para obtener servicio por ID
  const getServiceById = (id) => {
    return services?.find(service => service.id === id);
  };

  // 🔍 Función para obtener servicio por título
  const getServiceByTitle = (title) => {
    return services?.find(service => 
      service.title.toLowerCase().includes(title.toLowerCase())
    );
  };

  // ⭐ Función para obtener servicios destacados
  const getFeaturedServices = (limit = 3) => {
    return services?.slice(0, limit) || [];
  };

  // 📱 Función para obtener servicios para móvil (compactos)
  const getMobileServices = () => {
    return services?.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description.length > 100 
        ? `${service.description.substring(0, 100)}...` 
        : service.description,
      icon: service.icon
    })) || [];
  };

  // 🏷️ Función para obtener categorías de servicios
  const getServiceCategories = () => {
    if (!services) return [];
    
    const categories = new Set();
    services.forEach(service => {
      if (service.category) {
        categories.add(service.category);
      }
    });
    
    return Array.from(categories);
  };

  // 🔍 Función para filtrar servicios por categoría
  const getServicesByCategory = (category) => {
    return services?.filter(service => service.category === category) || [];
  };

  // 🎯 Función para obtener características de un servicio
  const getServiceFeatures = (serviceId) => {
    const service = getServiceById(serviceId);
    return service?.features || [];
  };

  // 📊 Función para obtener servicios formateados para display
  const getDisplayServices = () => {
    if (!services) return [];
    
    return services.map(service => ({
      ...service,
      // Asegurar que el icono tenga un valor por defecto
      icon: service.icon || 'Star',
      // Formatear características
      formattedFeatures: service.features || [],
      // Agregar información adicional
      hasFeatures: service.features && service.features.length > 0,
      shortDescription: service.description.length > 150 
        ? `${service.description.substring(0, 150)}...` 
        : service.description
    }));
  };

  // 🔝 Función para obtener los servicios más populares
  const getPopularServices = () => {
    // Si los servicios tienen un campo 'popular' o 'views', usarlo
    return services?.filter(service => service.popular) || 
           services?.slice(0, 3) || [];
  };

  // 🔄 Función para verificar si hay servicios válidos
  const hasValidServices = () => {
    return services && 
           services.length > 0 && 
           services[0].title !== 'Cargando servicios...';
  };

  // 📈 Función para obtener estadísticas de servicios
  const getServicesStats = () => {
    if (!services) return null;
    
    return {
      total: services.length,
      withFeatures: services.filter(s => s.features && s.features.length > 0).length,
      categories: getServiceCategories().length,
      popular: getPopularServices().length
    };
  };

  // 🔍 Función para buscar servicios
  const searchServices = (query) => {
    if (!services || !query) return services || [];
    
    const searchTerm = query.toLowerCase();
    return services.filter(service =>
      service.title.toLowerCase().includes(searchTerm) ||
      service.description.toLowerCase().includes(searchTerm) ||
      service.features?.some(feature => 
        feature.toLowerCase().includes(searchTerm)
      )
    );
  };

  // 🎨 Función para obtener mapeo de iconos de servicios
  const getServiceIconMap = () => {
    const iconMap = {
      'entrenamiento': 'Dumbbell',
      'personalizado': 'User',
      'clases': 'Users',
      'grupales': 'Users',
      'nutricion': 'Apple',
      'deportiva': 'Activity',
      'fisioterapia': 'Heart',
      'spa': 'Droplets',
      'sauna': 'Sun',
      'piscina': 'Waves',
      'crossfit': 'Zap',
      'yoga': 'Flower2',
      'pilates': 'Circle',
      'spinning': 'RotateCw',
      'boxeo': 'Shield',
      'danza': 'Music',
      'aerobicos': 'Activity'
    };
    
    return iconMap;
  };

  // 🎯 Función para obtener icono apropiado para un servicio
  const getServiceIcon = (service) => {
    const iconMap = getServiceIconMap();
    
    // Si el servicio ya tiene un icono específico, usarlo
    if (service.icon && service.icon !== 'Star') {
      return service.icon;
    }
    
    // Buscar icono basado en el título
    const title = service.title.toLowerCase();
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (title.includes(keyword)) {
        return icon;
      }
    }
    
    // Icono por defecto
    return 'Star';
  };

  // 🏠 Retornar servicios y funciones
  return {
    // Estado
    services: services || defaultServices,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getServiceById,
    getServiceByTitle,
    getFeaturedServices,
    getMobileServices,
    getServiceCategories,
    getServicesByCategory,
    getServiceFeatures,
    getDisplayServices,
    getPopularServices,
    searchServices,
    getServiceIcon,
    
    // Estadísticas
    getServicesStats,
    
    // Verificaciones
    hasValidServices,
    
    // Acceso directo (para compatibilidad)
    allServices: services || defaultServices,
    featuredServices: getFeaturedServices(),
    popularServices: getPopularServices(),
    categories: getServiceCategories(),
    stats: getServicesStats(),
    
    // Estado útil
    isLoaded: !loading && !!services && !error && hasValidServices(),
    hasError: !!error,
    isEmpty: !services || services.length === 0 || !hasValidServices(),
    count: services?.length || 0
  };
};

export default useGymServices;