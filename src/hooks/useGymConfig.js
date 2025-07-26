// src/hooks/useGymConfig.js
// FUNCIÓN: Hook principal para configuración del gimnasio - SOLO BACKEND
// CONECTA CON: Backend API únicamente (sin fallbacks de .env)

import { useState, useEffect, useMemo } from 'react';
import apiService from '../services/apiService';

const useGymConfig = () => {
  // 🏗️ Estados
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 📱 Configuración por defecto mínima (solo mientras carga)
  const defaultConfig = useMemo(() => ({
    name: 'Elite Fitness Club',
    tagline: 'Cargando...',
    description: 'Cargando configuración...',
    logo: {
      url: '/favicon.ico',
      alt: 'Logo'
    },
    contact: {
      phone: '',
      email: '',
      address: '',
      addressFull: '',
      whatsapp: '',
      location: {
        lat: 0,
        lng: 0,
        mapsUrl: ''
      }
    },
    hours: {
      weekday: '',
      weekend: '',
      full: ''
    },
    social: {
      instagram: { url: '', handle: '', active: false },
      facebook: { url: '', handle: '', active: false },
      twitter: { url: '', handle: '', active: false },
      youtube: { url: '', handle: '', active: false },
      tiktok: { url: '', handle: '', active: false },
      whatsapp: { url: '', handle: '', active: false }
    },
    stats: {
      members: '0',
      trainers: '0',
      experience: '0',
      satisfaction: '0%',
      equipment: '0',
      classes: '0'
    },
    features: {
      parking: false,
      lockers: false,
      showers: false,
      wifi: false,
      ac: false,
      security: ''
    },
    region: {
      timezone: 'America/Guatemala',
      language: 'es',
      currency: 'GTQ',
      currencySymbol: 'Q',
      city: '',
      country: ''
    }
  }), []);

  // 🚀 Función para obtener configuración del backend
  const fetchGymConfig = async (force = false) => {
    // Si ya tenemos datos y no es forzado, usar cache por 5 minutos
    if (config && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 5 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🏋️ Obteniendo configuración del gimnasio desde backend...');
      
      // Obtener configuración del backend
      const response = await apiService.getGymConfig();
      
      if (response.success && response.data) {
        console.log('✅ Configuración obtenida del backend:', response.data);
        
        // Usar directamente los datos del backend
        const backendConfig = {
          // Información básica
          name: response.data.name || defaultConfig.name,
          tagline: response.data.tagline || defaultConfig.tagline,
          description: response.data.description || defaultConfig.description,
          
          // Logo
          logo: {
            url: response.data.logo?.url || defaultConfig.logo.url,
            alt: response.data.logo?.alt || `${response.data.name} - Logo`
          },
          
          // Hero section
          hero: response.data.hero || {
            title: response.data.name || defaultConfig.name,
            subtitle: response.data.tagline || defaultConfig.tagline,
            videoUrl: '',
            imageUrl: ''
          },
          
          // Contacto - fusionar con datos del endpoint específico si están disponibles
          contact: {
            phone: response.data.contact?.phone || '',
            email: response.data.contact?.email || '',
            address: response.data.contact?.address || '',
            addressFull: response.data.contact?.addressFull || '',
            whatsapp: response.data.contact?.whatsapp || '',
            location: {
              lat: response.data.contact?.location?.lat || 0,
              lng: response.data.contact?.location?.lng || 0,
              mapsUrl: response.data.contact?.location?.mapsUrl || ''
            }
          },
          
          // Horarios
          hours: {
            weekday: response.data.hours?.weekday || '',
            weekend: response.data.hours?.weekend || '',
            full: response.data.hours?.full || ''
          },
          
          // Redes sociales
          social: {
            instagram: {
              url: response.data.social?.instagram?.url || '',
              handle: response.data.social?.instagram?.handle || '',
              active: !!response.data.social?.instagram?.url
            },
            facebook: {
              url: response.data.social?.facebook?.url || '',
              handle: response.data.social?.facebook?.handle || '',
              active: !!response.data.social?.facebook?.url
            },
            twitter: {
              url: response.data.social?.twitter?.url || '',
              handle: response.data.social?.twitter?.handle || '',
              active: !!response.data.social?.twitter?.url
            },
            youtube: {
              url: response.data.social?.youtube?.url || '',
              handle: response.data.social?.youtube?.handle || '',
              active: !!response.data.social?.youtube?.url
            },
            tiktok: {
              url: response.data.social?.tiktok?.url || '',
              handle: response.data.social?.tiktok?.handle || '',
              active: !!response.data.social?.tiktok?.url
            },
            whatsapp: {
              url: response.data.social?.whatsapp?.url || '',
              handle: response.data.social?.whatsapp?.handle || 'WhatsApp',
              active: !!response.data.social?.whatsapp?.url
            }
          },
          
          // Estadísticas
          stats: {
            members: response.data.stats?.members || '0',
            trainers: response.data.stats?.trainers || '0',
            experience: response.data.stats?.experience || '0',
            satisfaction: response.data.stats?.satisfaction || '0%',
            equipment: response.data.stats?.equipment || '0',
            classes: response.data.stats?.classes || '0'
          },
          
          // Características
          features: {
            parking: response.data.features?.parking || false,
            lockers: response.data.features?.lockers || false,
            showers: response.data.features?.showers || false,
            wifi: response.data.features?.wifi || false,
            ac: response.data.features?.ac || false,
            security: response.data.features?.security || ''
          },
          
          // Configuración regional
          region: {
            timezone: response.data.region?.timezone || 'America/Guatemala',
            language: response.data.region?.language || 'es',
            currency: response.data.region?.currency || 'GTQ',
            currencySymbol: response.data.region?.currencySymbol || 'Q',
            city: response.data.region?.city || '',
            country: response.data.region?.country || 'Guatemala'
          }
        };
        
        setConfig(backendConfig);
        setLastFetch(Date.now());
        console.log('✅ Configuración del gimnasio cargada exitosamente');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al obtener configuración del gimnasio:', error);
      setError(error.message);
      
      // En caso de error, usar configuración por defecto
      if (!config) {
        console.log('⚠️ Usando configuración por defecto debido al error');
        setConfig(defaultConfig);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar configuración al montar
  useEffect(() => {
    fetchGymConfig();
  }, []);

  // 🎯 Función para refrescar configuración
  const refresh = () => {
    fetchGymConfig(true);
  };

  // 📊 Función para obtener estadísticas adicionales si es necesario
  const fetchAdditionalStats = async () => {
    try {
      const statsResponse = await apiService.getGymStats();
      if (statsResponse.success && statsResponse.data) {
        setConfig(prev => ({
          ...prev,
          stats: { ...prev.stats, ...statsResponse.data }
        }));
      }
    } catch (error) {
      console.error('Error al obtener estadísticas adicionales:', error);
    }
  };

  // 📞 Función para obtener información de contacto actualizada
  const fetchContactInfo = async () => {
    try {
      const contactResponse = await apiService.getContactInfo();
      if (contactResponse.success && contactResponse.data) {
        setConfig(prev => ({
          ...prev,
          contact: { ...prev.contact, ...contactResponse.data }
        }));
      }
    } catch (error) {
      console.error('Error al obtener información de contacto:', error);
    }
  };

  // 📱 Función para obtener redes sociales actualizadas
  const fetchSocialMedia = async () => {
    try {
      const socialResponse = await apiService.getSocialMedia();
      if (socialResponse.success && socialResponse.data) {
        setConfig(prev => ({
          ...prev,
          social: { ...prev.social, ...socialResponse.data }
        }));
      }
    } catch (error) {
      console.error('Error al obtener redes sociales:', error);
    }
  };

  // 🎨 Funciones utilitarias
  const formatCurrency = (amount) => {
    if (!config) return `Q${amount}`;
    const symbol = config.region.currencySymbol;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (date, options = {}) => {
    if (!config) return new Date(date).toLocaleDateString();
    
    const locale = config.region.language === 'es' ? 'es-GT' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      timeZone: config.region.timezone,
      ...options
    });
  };

  const formatTime = (date, options = {}) => {
    if (!config) return new Date(date).toLocaleTimeString();
    
    const locale = config.region.language === 'es' ? 'es-GT' : 'en-US';
    return new Date(date).toLocaleTimeString(locale, {
      timeZone: config.region.timezone,
      ...options
    });
  };

  // 🔍 Función para verificar si una característica está activa
  const hasFeature = (feature) => {
    return config?.features?.[feature] || false;
  };

  // 📱 Función para obtener red social activa
  const getSocialNetwork = (network) => {
    return config?.social?.[network] || { url: '', handle: '', active: false };
  };

  // 🏠 Retornar configuración y funciones
  return {
    // Estado
    config: config || defaultConfig,
    loading,
    error,
    lastFetch,
    
    // Funciones de datos
    refresh,
    fetchAdditionalStats,
    fetchContactInfo,
    fetchSocialMedia,
    
    // Funciones utilitarias
    formatCurrency,
    formatDate,
    formatTime,
    hasFeature,
    getSocialNetwork,
    
    // Información útil
    isLoaded: !loading && !!config && !error,
    hasError: !!error,
    isEmpty: !config || !config.name || config.name === defaultConfig.name,
    
    // Acceso directo a propiedades importantes (compatibilidad)
    name: config?.name || defaultConfig.name,
    tagline: config?.tagline || defaultConfig.tagline,
    description: config?.description || defaultConfig.description,
    logo: config?.logo || defaultConfig.logo,
    contact: config?.contact || defaultConfig.contact,
    hours: config?.hours || defaultConfig.hours,
    social: config?.social || defaultConfig.social,
    stats: config?.stats || defaultConfig.stats,
    features: config?.features || defaultConfig.features,
    region: config?.region || defaultConfig.region
  };
};

export default useGymConfig;

// 📝 NOTAS DE USO:
// - Hook completamente basado en backend (sin fallbacks de .env)
// - Cache de 5 minutos para optimizar rendimiento
// - Manejo robusto de errores con configuración por defecto
// - Funciones utilitarias para formateo y acceso a datos
// - Compatible con todos los componentes existentes
// - Actualización automática de datos específicos (stats, contact, social)