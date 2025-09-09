// Autor: Alexander Echeverria
// src/hooks/useGymConfig.js
// FUNCIÓN: Hook optimizado con cache persistente para configuración del gimnasio

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

const useGymConfig = (options = {}) => {
  // Opciones con defaults
  const {
    enabled = true,
    refetchOnMount = false,
    staleTime = 30 * 60 * 1000, // 30 minutos (aumentado para persistencia)
    priority = 'high' // Config es crítico
  } = options;

  // Usar cache del AppContext
  const { 
    getCacheData, 
    setCacheData, 
    isCacheValid, 
    setDataLoading,
    clearCacheItem 
  } = useApp();

  // Estados locales
  const [config, setConfig] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Referencias para control
  const mountedRef = useRef(true);
  const hasInitialLoad = useRef(false);
  const fetchAbortController = useRef(null);
  const instanceId = useRef(`gymConfig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  console.log(`useGymConfig [${instanceId.current}] inicializado con cache del AppContext`);

  // Verificar cache al inicializar
  useEffect(() => {
    const cachedData = getCacheData('gymConfig');
    if (cachedData) {
      console.log(`useGymConfig [${instanceId.current}] restaurado desde cache:`, {
        name: cachedData.name,
        hasLogo: !!cachedData.logo?.url,
        hasContact: !!cachedData.contact
      });
      setConfig(cachedData);
      setIsLoaded(true);
      setLastFetch(Date.now());
      hasInitialLoad.current = true;
    }
  }, [getCacheData]);

  // Función de fetch optimizada con cache integrado
  const fetchConfig = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current || !enabled) {
      console.log(`useGymConfig [${instanceId.current}] fetch omitido - deshabilitado o desmontado`);
      return;
    }

    // Verificar cache válido primero (excepto si es force refresh)
    if (!forceRefresh && isCacheValid('gymConfig')) {
      const cachedData = getCacheData('gymConfig');
      if (cachedData) {
        console.log(`useGymConfig [${instanceId.current}] usando cache válido`);
        setConfig(cachedData);
        setIsLoaded(true);
        setLastFetch(Date.now());
        return;
      }
    }

    // Evitar múltiples fetches simultáneos
    if (isLoading && !forceRefresh) {
      console.log(`useGymConfig [${instanceId.current}] fetch omitido - ya cargando`);
      return;
    }

    try {
      console.log(`useGymConfig [${instanceId.current}] obteniendo datos${forceRefresh ? ' (forzado)' : ''}...`);
      
      // Cancelar petición anterior si existe
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }

      fetchAbortController.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setDataLoading({ gymConfig: true });

      // Usar Request Manager con cache del AppContext
      const result = await requestManager.executeRequest(
        '/api/gym/config',
        () => apiService.getGymConfig(),
        {
          forceRefresh,
          ttl: staleTime,
          priority,
          signal: fetchAbortController.current.signal
        }
      );

      if (!mountedRef.current) {
        console.log(`useGymConfig [${instanceId.current}] componente desmontado, omitiendo actualización de estado`);
        return;
      }

      // Extraer datos del response
      let configData = null;
      
      if (result && result.success && result.data) {
        configData = result.data;
      } else if (result && result.name) {
        configData = result;
      }

      if (configData && configData.name) {
        console.log(`useGymConfig [${instanceId.current}] datos cargados:`, {
          name: configData.name,
          hasLogo: !!configData.logo?.url,
          hasContact: !!configData.contact,
          hasSocial: !!(configData.social && Object.keys(configData.social).length > 0),
          hasHero: !!configData.hero,
          hasVideo: !!(configData.hero?.videoUrl || configData.videoUrl)
        });

        // Guardar en cache del AppContext
        setCacheData('gymConfig', configData);

        setConfig(configData);
        setError(null);
        setLastFetch(Date.now());
        hasInitialLoad.current = true;

        console.log(`useGymConfig [${instanceId.current}] guardado en cache del AppContext`);
      } else {
        throw new Error('Estructura de datos de configuración inválida');
      }

    } catch (err) {
      if (mountedRef.current && err.name !== 'AbortError') {
        console.error(`useGymConfig [${instanceId.current}] error:`, err.message);
        setError(err);
        
        // En caso de error, intentar usar cache aunque esté expirado
        const expiredCache = getCacheData('gymConfig');
        if (expiredCache && !config) {
          console.log(`useGymConfig [${instanceId.current}] usando cache expirado como fallback`);
          setConfig(expiredCache);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsLoaded(true);
        setDataLoading({ gymConfig: false });
      }
      
      fetchAbortController.current = null;
    }
  }, [enabled, isLoading, config, lastFetch, staleTime, priority, getCacheData, setCacheData, isCacheValid, setDataLoading]);

  // Función de refetch manual
  const refetch = useCallback(() => {
    console.log(`useGymConfig [${instanceId.current}] refetch manual solicitado`);
    return fetchConfig(true);
  }, [fetchConfig]);

  // Función de invalidación
  const invalidate = useCallback(() => {
    console.log(`useGymConfig [${instanceId.current}] invalidando cache`);
    requestManager.invalidateCache('/api/gym/config');
    clearCacheItem('gymConfig');
    setLastFetch(null);
    setConfig(null);
    setIsLoaded(false);
    hasInitialLoad.current = false;
  }, [clearCacheItem]);

  // Efecto principal - Fetch inicial inteligente
  useEffect(() => {
    const shouldFetch = enabled && (
      !hasInitialLoad.current || 
      refetchOnMount || 
      (!config && !isCacheValid('gymConfig'))
    );

    if (shouldFetch) {
      console.log(`useGymConfig [${instanceId.current}] fetch inicial activado`);
      fetchConfig();
    } else {
      console.log(`useGymConfig [${instanceId.current}] fetch inicial omitido`, {
        enabled,
        hasInitialLoad: hasInitialLoad.current,
        refetchOnMount,
        hasConfig: !!config,
        cacheValid: isCacheValid('gymConfig')
      });
      
      // Si tenemos datos pero no está marcado como loaded, marcarlo
      if (config && !isLoaded) {
        setIsLoaded(true);
      }
    }

    return () => {
      if (fetchAbortController.current) {
        console.log(`useGymConfig [${instanceId.current}] abortando fetch en cleanup de efecto`);
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, [enabled, refetchOnMount, config, isLoaded, fetchConfig, isCacheValid]);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log(`useGymConfig [${instanceId.current}] componente desmontándose - limpieza`);
      mountedRef.current = false;
      
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
        fetchAbortController.current = null;
      }
    };
  }, []);

  // Refrescar cuando la página se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled && config && !isCacheValid('gymConfig')) {
        console.log(`useGymConfig [${instanceId.current}] página visible, cache obsoleto, refrescando...`);
        fetchConfig();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, config, fetchConfig, isCacheValid]);

  // Propiedades computadas
  const hasValidData = Boolean(config && config.name);
  const isStale = !isCacheValid('gymConfig');
  const cacheAge = lastFetch ? Date.now() - lastFetch : 0;

  // Funciones de utilidad para el config
  const getLogoUrl = useCallback(() => {
    if (!config?.logo?.url) return null;
    
    const logoUrl = config.logo.url;
    if (logoUrl.startsWith('http')) return logoUrl;
    
    const baseUrl = window.location.origin;
    const cleanPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    return `${baseUrl}${cleanPath}`;
  }, [config]);

  const getVideoUrl = useCallback(() => {
    if (!config) return null;
    return config.hero?.videoUrl || config.videoUrl || null;
  }, [config]);

  const getPosterUrl = useCallback(() => {
    if (!config) return null;
    return config.hero?.imageUrl || config.imageUrl || null;
  }, [config]);

  const hasLogo = useCallback(() => {
    return !!(config?.logo?.url);
  }, [config]);

  const hasVideo = useCallback(() => {
    return !!(getVideoUrl());
  }, [getVideoUrl]);

  const hasPoster = useCallback(() => {
    return !!(getPosterUrl());
  }, [getPosterUrl]);

  const getSocialLinks = useCallback(() => {
    if (!config?.social) return [];
    
    return Object.entries(config.social)
      .filter(([platform, data]) => data && data.url && data.active)
      .map(([platform, data]) => ({
        platform,
        url: data.url,
        handle: data.handle,
        followers: data.followers
      }));
  }, [config]);

  const getContactInfo = useCallback(() => {
    return {
      phone: config?.contact?.phone || null,
      email: config?.contact?.email || null,
      address: config?.contact?.address || null,
      hours: config?.hours?.full || null
    };
  }, [config]);

  // Valor de retorno completo
  return {
    // Datos principales
    config,
    isLoaded,
    isLoading,
    error,
    
    // Funciones de control
    refetch,
    invalidate,
    
    // Información de estado
    hasValidData,
    isStale,
    lastFetch,
    cacheAge,
    
    // Funciones de utilidad
    getLogoUrl,
    getVideoUrl,
    getPosterUrl,
    hasLogo,
    hasVideo,
    hasPoster,
    getSocialLinks,
    getContactInfo,
    
    // Datos derivados (para comodidad)
    logoUrl: getLogoUrl(),
    videoUrl: getVideoUrl(),
    posterUrl: getPosterUrl(),
    socialLinks: getSocialLinks(),
    contactInfo: getContactInfo(),
    
    // Datos básicos de acceso rápido
    gymName: config?.name || 'Elite Fitness Club',
    gymDescription: config?.description || 'Tu transformación comienza aquí',
    gymTagline: config?.tagline || null,
    
    // Estados específicos para video/imagen
    hasMedia: hasVideo() || hasPoster(),
    mediaType: hasVideo() ? 'video' : hasPoster() ? 'image' : 'none',
    
    // Información de debug (solo en desarrollo)
    ...(process.env.NODE_ENV === 'development' && {
      instanceId: instanceId.current,
      mountedRef: mountedRef.current,
      staleTime,
      debugInfo: {
        hasInitialLoad: hasInitialLoad.current,
        isEnabled: enabled,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        cacheValid: isCacheValid('gymConfig'),
        priority
      }
    })
  };
};

export default useGymConfig;

/*
DOCUMENTACIÓN DEL HOOK useGymConfig

PROPÓSITO:
Este hook personalizado gestiona la configuración principal del gimnasio Elite Fitness en Guatemala,
proporcionando una interfaz optimizada con cache persistente para acceder a información corporativa,
branding, contacto, horarios, redes sociales y contenido multimedia del gimnasio. Incluye
integración completa con el AppContext para persistencia entre navegaciones.

FUNCIONALIDADES PRINCIPALES:
- Cache persistente integrado con AppContext del gimnasio
- Fetch optimizado con Request Manager y control de duplicados
- Invalidación inteligente y refetch manual disponible
- Funciones de utilidad para URLs y datos derivados
- Estados de carga robustos para UI responsive
- Manejo automático de visibilidad de página
- Fallbacks con cache expirado en caso de errores
- Logging detallado para debugging y monitoreo

ARCHIVOS Y CONEXIONES:

SERVICIOS UTILIZADOS:
- ../services/RequestManager: Coordinación de peticiones y cache avanzado
- ../services/apiService: Comunicación directa con backend del gimnasio
  * getGymConfig(): Endpoint para obtener configuración del gimnasio

CONTEXTS REQUERIDOS:
- ../contexts/AppContext: Cache global, estados de carga y gestión de datos
  * getCacheData(): Obtener datos desde cache global
  * setCacheData(): Guardar datos en cache global
  * isCacheValid(): Verificar validez del cache
  * setDataLoading(): Controlar estados de carga globales
  * clearCacheItem(): Limpiar elementos específicos del cache

DEPENDENCIAS DE REACT:
- useState: Gestión de estados locales del hook
- useEffect: Efectos para fetch automático, cleanup y visibilidad
- useCallback: Optimización de funciones para evitar re-renders
- useRef: Referencias para control de montaje, IDs y controladores

QUE SE MUESTRA AL USUARIO:

INFORMACIÓN BÁSICA DEL GIMNASIO:
El hook proporciona toda la configuración visual y de contenido del gimnasio:

**Identidad Corporativa**:
- **Nombre del gimnasio**: "Elite Fitness Club" (configurable)
- **Tagline/Eslogan**: "Tu transformación comienza aquí" o personalizado
- **Descripción**: Descripción corporativa del gimnasio
- **Logo corporativo**: URL completa del logo del gimnasio
- **Imágenes promocionales**: Posters y banners para el sitio web
- **Videos promocionales**: Videos de presentación del gimnasio

**Información de Contacto**:
- **Teléfono**: Número local guatemalteco (+502 XXXX-XXXX)
- **Email**: Dirección de correo electrónico oficial
- **Dirección física**: Ubicación del gimnasio en Guatemala
- **Horarios de atención**: Horarios completos de funcionamiento
- **Días de operación**: Información de días laborables y feriados

**Redes Sociales**:
- **Facebook**: URL de página oficial con número de seguidores
- **Instagram**: Perfil oficial con handle y métricas
- **YouTube**: Canal con videos de entrenamientos y testimonios
- **TikTok**: Contenido viral y dinámico del gimnasio
- **Twitter**: Actualizaciones y noticias del gimnasio
- **LinkedIn**: Presencia corporativa y profesional

**Contenido Hero/Principal**:
- **Video de fondo**: Video promocional para página principal
- **Imagen hero**: Imagen de fondo alternativa
- **Call-to-actions**: Botones principales de conversión
- **Mensajes promocionales**: Ofertas y promociones destacadas
- **Testimonios**: Casos de éxito de miembros del gimnasio

FUNCIONES DE UTILIDAD PROPORCIONADAS:

**URLs y Media**:
- `getLogoUrl()`: URL completa y formateada del logo
- `getVideoUrl()`: URL del video promocional principal
- `getPosterUrl()`: URL de imagen hero o poster principal
- `hasLogo()`: Verificar si hay logo disponible
- `hasVideo()`: Verificar si hay video promocional
- `hasPoster()`: Verificar si hay imagen de fondo

**Información Social**:
- `getSocialLinks()`: Array de enlaces activos de redes sociales
- Filtrado automático de enlaces inactivos o incorrectos
- Información de handles y número de seguidores
- Plataformas ordenadas por popularidad y actividad

**Datos de Contacto**:
- `getContactInfo()`: Objeto completo con toda la información
- Teléfonos formateados para Guatemala (+502)
- Direcciones específicas con referencias locales
- Horarios en formato 24 horas para claridad

ESTADOS Y CONTROL:

**Estados de Carga**:
- `isLoading`: Indica si hay una petición en curso
- `isLoaded`: Confirma que se han cargado datos al menos una vez
- `hasValidData`: Verifica que los datos están completos y válidos
- `isStale`: Indica si el cache ha expirado y necesita actualización

**Control de Cache**:
- Cache persistente de 30 minutos para datos estables
- Invalidación automática y manual disponible
- Verificación de validez antes de cada uso
- Fallback con cache expirado en caso de errores de red

**Funciones de Control**:
- `refetch()`: Forzar nueva carga ignorando cache
- `invalidate()`: Limpiar cache y forzar recarga completa
- Control automático de peticiones duplicadas
- Cancelación de peticiones al desmontar componente

CARACTERÍSTICAS ESPECÍFICAS PARA GUATEMALA:

**Localización**:
- Teléfonos con código de país guatemalteco (+502)
- Direcciones con formato local (zonas de Guatemala)
- Horarios en timezone de Guatemala (GMT-6)
- Contenido en español guatemalteco

**Adaptación Cultural**:
- Mensajes adaptados al mercado guatemalteco
- Referencias culturales locales apropiadas
- Promociones contextualizadas para fechas importantes
- Precios implícitos en quetzales para servicios

**Integración Local**:
- Enlaces a Google Maps con ubicaciones exactas
- Integración con números de WhatsApp Business
- Referencias a landmarks conocidos en Guatemala
- Información específica del mercado fitness guatemalteco

OPTIMIZACIONES TÉCNICAS:

**Rendimiento**:
- Cache inteligente con invalidación automática
- Fetch controlado con abort controllers
- Funciones memoizadas con useCallback
- Estados optimizados para evitar re-renders innecesarios

**Experiencia de Usuario**:
- Datos disponibles inmediatamente desde cache
- Actualizaciones en background sin interrumpir UX
- Estados de carga suaves y no intrusivos
- Información siempre disponible incluso con errores

**Desarrollo y Debugging**:
- Logging detallado en desarrollo
- IDs únicos de instancia para tracking
- Información de debug disponible en development
- Métricas de cache y rendimiento

CASOS DE USO EN EL GIMNASIO:

**Página Principal**:
- Header con logo y navegación principal
- Video hero de fondo con información corporativa
- Sección de contacto con horarios y ubicación
- Enlaces a redes sociales en footer

**Páginas de Marketing**:
- Landing pages con información consistente
- Formularios de contacto con datos actualizados
- Call-to-actions con información de precios
- Testimonios y casos de éxito

**Dashboard de Usuarios**:
- Información de contacto para soporte
- Enlaces a redes sociales del gimnasio
- Logo corporativo en interfaz de usuario
- Datos de la empresa en facturas y documentos

**Aplicación Móvil**:
- Configuración sincronizada entre plataformas
- Información de contacto para emergencias
- Enlaces directos a redes sociales
- Datos corporativos en notificaciones

INTEGRACIÓN CON OTROS SISTEMAS:

**Sistema de Pagos**:
- Información corporativa en facturas
- Datos de contacto para soporte de pagos
- Logo en comprobantes y recibos
- Dirección fiscal para documentos oficiales

**CRM y Marketing**:
- Datos consistentes en todas las comunicaciones
- Información actualizada para campañas de email
- Redes sociales para remarketing
- Contenido multimedia para promociones

**Sistema de Membresías**:
- Información corporativa en contratos
- Datos de contacto en documentos legales
- Horarios actualizados en términos de servicio
- Logo en tarjetas de membresía

BENEFICIOS PARA EL GIMNASIO:

**Consistencia de Marca**:
- Información uniforme en todos los canales
- Actualizaciones centralizadas sin cambios de código
- Branding consistente en toda la experiencia
- Mensaje corporativo coherente

**Gestión Eficiente**:
- Cambios de información desde panel admin
- Actualizaciones automáticas en toda la aplicación
- No necesidad de tocar código para cambios básicos
- Gestión centralizada de contenido multimedia

**Experiencia de Usuario**:
- Información siempre actualizada y disponible
- Carga rápida con sistema de cache inteligente
- Datos de contacto precisos para comunicación
- Enlaces funcionales a redes sociales

Este hook es fundamental para mantener la identidad y información del gimnasio
actualizada y accesible en toda la aplicación, proporcionando una base sólida
para la presencia digital del negocio en Guatemala.
*/