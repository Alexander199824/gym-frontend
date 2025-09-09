// Autor: Alexander Echeverria
// Dirección: src/hooks/useGymVideo.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useGymVideo = (options = {}) => {
  const {
    enabled = true,
    autoRetry = false,
    priority = 'low'
  } = options;

  // Estados del hook
  const [video, setVideo] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const isMountedRef = useRef(true);
  
  // Función para obtener video del config del gym
  const fetchGymVideo = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current || !enabled) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.group('OBTENIENDO VIDEO DEL GIMNASIO DESDE CONFIG');
      console.log('Estado actual:', { 
        isLoaded, 
        hasVideo: !!video, 
        forceRefresh,
        enabled 
      });
      
      // Usar RequestManager para obtener config del gym
      const response = await requestManager.executeRequest(
        '/api/gym/config',
        () => apiService.getGymConfig(),
        {
          ttl: 10 * 60 * 1000, // 10 minutos de cache
          forceRefresh,
          priority: priority
        }
      );
      
      if (!isMountedRef.current) return;
      
      if (response && response.success && response.data) {
        console.log('CONFIG DEL GIMNASIO RECIBIDO');
        console.log('Verificando datos de video en la configuración...');
        
        const gymData = response.data;
        
        // Extraer datos de video del config (si existen)
        let videoData = null;
        let posterData = null;
        
        // Buscar video en diferentes ubicaciones posibles del config
        if (gymData.hero?.videoUrl) {
          videoData = gymData.hero.videoUrl;
          posterData = gymData.hero.imageUrl;
          console.log('Video encontrado en sección hero');
        } else if (gymData.videoUrl) {
          videoData = gymData.videoUrl;
          posterData = gymData.imageUrl;
          console.log('Video encontrado en configuración raíz');
        } else if (gymData.media?.videoUrl) {
          videoData = gymData.media.videoUrl;
          posterData = gymData.media.imageUrl;
          console.log('Video encontrado en sección de medios');
        }
        
        console.log('URL de video encontrada:', videoData || 'Ninguna');
        console.log('URL de poster encontrada:', posterData || 'Ninguna');
        
        // Procesar datos del video
        const processedVideo = {
          heroVideo: videoData || null,
          poster: posterData || null,
          title: gymData.name || 'Club de Entrenamiento Elite',
          description: gymData.description || 'Tu transformación comienza aquí',
          settings: {
            autoplay: false,
            muted: true,
            loop: true,
            controls: true
          },
          // Metadatos
          available: !!videoData,
          fallbackImage: posterData,
          hasAnyMedia: !!(videoData || posterData),
          // CTAs del hero
          ctaButtons: [
            {
              text: "Únete Ahora",
              type: "primary",
              action: "register"
            }
          ],
          ctaText: 'Comienza Hoy'
        };
        
        console.log('DATOS DE VIDEO PROCESADOS:', {
          hasVideo: !!processedVideo.heroVideo,
          hasPoster: !!processedVideo.poster,
          hasAnyMedia: processedVideo.hasAnyMedia,
          title: processedVideo.title,
          available: processedVideo.available
        });
        
        setVideo(processedVideo);
        setIsLoaded(true);
        setLastFetch(Date.now());
        
        console.log('VIDEO DEL GIMNASIO CARGADO DESDE CONFIG');
        
      } else {
        console.log('SIN DATOS DE CONFIG DESDE EL BACKEND');
        
        // Fallback con datos básicos del gym
        const fallbackVideo = {
          heroVideo: null,
          poster: null,
          title: 'Club de Entrenamiento Elite',
          description: 'Tu transformación comienza aquí',
          settings: {
            autoplay: false,
            muted: true,
            loop: true,
            controls: true
          },
          available: false,
          fallbackImage: null,
          hasAnyMedia: false,
          ctaButtons: [
            {
              text: "Únete Ahora",
              type: "primary",
              action: "register"
            }
          ],
          ctaText: 'Comienza Hoy'
        };
        
        setVideo(fallbackVideo);
        setIsLoaded(true);
        setLastFetch(Date.now());
        
        console.log('VIDEO DEL GIMNASIO: Usando datos de respaldo');
      }
      
      console.groupEnd();
      
    } catch (fetchError) {
      if (!isMountedRef.current) return;
      
      console.group('ERROR AL OBTENER VIDEO DEL GIMNASIO');
      console.log('Detalles del error:', fetchError.message);
      
      setError({
        type: 'fetch_error',
        message: fetchError.message,
        critical: false,
        suggestion: 'El video es opcional - la aplicación funciona sin él'
      });
      
      // NUNCA fallar - siempre proveer datos por defecto
      const emergencyFallback = {
        heroVideo: null,
        poster: null,
        title: 'Club de Entrenamiento Elite',
        description: 'Tu transformación comienza aquí',
        settings: {
          autoplay: false,
          muted: true,
          loop: true,
          controls: true
        },
        available: false,
        fallbackImage: null,
        hasAnyMedia: false,
        ctaButtons: [
          {
            text: "Únete Ahora",
            type: "primary",
            action: "register"
          }
        ],
        ctaText: 'Comienza Hoy',
        errorState: true
      };
      
      setVideo(emergencyFallback);
      setIsLoaded(true);
      setLastFetch(Date.now());
      
      console.log('VIDEO DEL GIMNASIO: Usando respaldo de emergencia después del error');
      console.groupEnd();
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isLoaded, video, enabled, priority]);
  
  // Función para refrescar datos
  const refresh = useCallback(() => {
    console.log('VIDEO DEL GIMNASIO: Actualización manual solicitada');
    setIsLoaded(false);
    fetchGymVideo(true);
  }, [fetchGymVideo]);
  
  // Función para limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Funciones de utilidad para video (memoizadas)
  const hasVideo = useCallback(() => {
    return !!(video && video.heroVideo && video.available !== false);
  }, [video]);
  
  const hasPoster = useCallback(() => {
    return !!(video && (video.poster || video.fallbackImage));
  }, [video]);
  
  const hasAnyMedia = useCallback(() => {
    return hasVideo() || hasPoster();
  }, [hasVideo, hasPoster]);
  
  const getVideoUrl = useCallback(() => {
    return hasVideo() ? video.heroVideo : null;
  }, [video, hasVideo]);
  
  const getPosterUrl = useCallback(() => {
    if (!video) return null;
    return video.poster || video.fallbackImage || null;
  }, [video]);
  
  const getVideoSettings = useCallback(() => {
    return video?.settings || {
      autoplay: false,
      muted: true,
      loop: true,
      controls: true
    };
  }, [video]);
  
  const getHeroContent = useCallback(() => {
    if (!video) return null;
    
    return {
      title: video.title || 'Club de Entrenamiento Elite',
      description: video.description || 'Tu transformación comienza aquí',
      ctaButtons: video.ctaButtons || [],
      ctaText: video.ctaText || 'Comienza Hoy'
    };
  }, [video]);
  
  const canPlayVideo = useCallback(() => {
    if (!hasVideo()) return false;
    
    const videoUrl = getVideoUrl();
    if (!videoUrl) return false;
    
    try {
      new URL(videoUrl);
      return true;
    } catch {
      return videoUrl.startsWith('/') || videoUrl.includes('.');
    }
  }, [hasVideo, getVideoUrl]);
  
  const getVideoInfo = useCallback(() => {
    return {
      available: hasVideo(),
      canPlay: canPlayVideo(),
      hasMedia: hasAnyMedia(),
      url: getVideoUrl(),
      poster: getPosterUrl(),
      title: video?.title || null,
      description: video?.description || null,
      settings: getVideoSettings(),
      heroContent: getHeroContent(),
      lastFetch: lastFetch ? new Date(lastFetch).toISOString() : null,
      error: error,
      errorState: video?.errorState || false
    };
  }, [video, hasVideo, canPlayVideo, hasAnyMedia, getVideoUrl, getPosterUrl, getVideoSettings, getHeroContent, lastFetch, error]);
  
  // Efecto para cargar video al montar
  useEffect(() => {
    isMountedRef.current = true;
    
    console.log('HOOK VIDEO DEL GIMNASIO: Inicializando (usando config del gym)...', { enabled });
    
    if (enabled && !isLoaded && !isLoading) {
      const timer = setTimeout(() => {
        if (isMountedRef.current && enabled) {
          fetchGymVideo();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      isMountedRef.current = false;
      console.log('HOOK VIDEO DEL GIMNASIO: Limpieza');
    };
  }, [fetchGymVideo, isLoaded, isLoading, enabled]);
  
  // Log de estado cuando cambie (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CAMBIO DE ESTADO VIDEO DEL GIMNASIO (usando config):', {
        enabled,
        isLoaded,
        isLoading,
        hasVideo: hasVideo(),
        hasMedia: hasAnyMedia(),
        canPlay: canPlayVideo(),
        hasError: !!error,
        errorState: video?.errorState,
        lastFetch: lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Nunca'
      });
    }
  }, [enabled, isLoaded, isLoading, hasVideo, hasAnyMedia, canPlayVideo, error, video?.errorState, lastFetch]);
  
  // RETORNO DEL HOOK (manteniendo la misma API)
  return {
    // Estados principales
    video,
    isLoaded,
    isLoading,
    error,
    lastFetch,
    enabled,
    
    // Funciones de control
    refresh,
    clearError,
    
    // Funciones de utilidad
    hasVideo,
    hasPoster,
    hasAnyMedia,
    getVideoUrl,
    getPosterUrl,
    getVideoSettings,
    getHeroContent,
    canPlayVideo,
    getVideoInfo,
    
    // Estados derivados (para comodidad)
    videoUrl: getVideoUrl(),
    posterUrl: getPosterUrl(),
    videoSettings: getVideoSettings(),
    heroContent: getHeroContent(),
    canPlay: canPlayVideo(),
    videoInfo: getVideoInfo(),
    
    // Estados de conveniencia (manteniendo compatibilidad)
    showVideo: hasVideo() && canPlayVideo(),
    showPoster: hasPoster(),
    showFallback: !hasAnyMedia()
  };
};

export default useGymVideo;

/**
 * DOCUMENTACIÓN DEL HOOK useGymVideo
 * 
 * PROPÓSITO:
 * Hook personalizado de React que gestiona la carga y manejo de contenido de video
 * del gimnasio desde la configuración del backend. Proporciona una interfaz completa
 * para manejar videos hero, posters, configuraciones de reproducción y contenido
 * relacionado para secciones principales del sitio web.
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Obtiene configuración de video desde la API del gimnasio (/api/gym/config)
 * - Utiliza RequestManager para optimización de requests con cache de 10 minutos
 * - Busca videos en múltiples ubicaciones dentro de la configuración (hero, root, media)
 * - Proporciona datos de respaldo robustos en caso de fallos
 * - Incluye validación de URLs y capacidad de reproducción
 * - Maneja estados de carga, error y disponibilidad de medios
 * - Ofrece funciones utilitarias para verificación y acceso a contenido
 * 
 * ARCHIVOS CON LOS QUE SE CONECTA:
 * - '../services/RequestManager': Gestor de requests optimizado con cache
 * - '../services/apiService': Servicio principal para comunicación con backend
 *   └── Función específica: getGymConfig()
 * - Backend API endpoint: '/api/gym/config'
 * - Componentes de video/hero que muestran contenido multimedia
 * - Secciones principales (landing, hero, about) que requieren video
 * 
 * ESTRUCTURA DE DATOS ESPERADA DEL BACKEND:
 * Respuesta del API: { success: true, data: {...} }
 * 
 * Ubicaciones posibles del video en config:
 * - gymData.hero.videoUrl + gymData.hero.imageUrl (poster)
 * - gymData.videoUrl + gymData.imageUrl (poster)
 * - gymData.media.videoUrl + gymData.media.imageUrl (poster)
 * 
 * Objeto de video procesado: {
 *   heroVideo: string|null,     // URL del video principal
 *   poster: string|null,        // URL de imagen poster/fallback
 *   title: string,              // Título del gimnasio
 *   description: string,        // Descripción/tagline
 *   settings: {                 // Configuraciones de reproducción
 *     autoplay: boolean,
 *     muted: boolean,
 *     loop: boolean,
 *     controls: boolean
 *   },
 *   available: boolean,         // Si hay video disponible
 *   fallbackImage: string|null, // Imagen de respaldo
 *   hasAnyMedia: boolean,       // Si hay cualquier tipo de media
 *   ctaButtons: Array,          // Botones de llamada a la acción
 *   ctaText: string,            // Texto de CTA principal
 *   errorState?: boolean        // Si ocurrió error en la carga
 * }
 * 
 * OPCIONES DE CONFIGURACIÓN:
 * const options = {
 *   enabled: boolean,           // Habilitar/deshabilitar el hook (default: true)
 *   autoRetry: boolean,         // Reintento automático en fallos (default: false)
 *   priority: string           // Prioridad del request ('low'|'normal'|'high')
 * };
 * 
 * USO TÍPICO EN COMPONENTES:
 * const { 
 *   video, 
 *   isLoading, 
 *   hasVideo, 
 *   canPlayVideo, 
 *   getVideoUrl, 
 *   getPosterUrl,
 *   getHeroContent,
 *   refresh 
 * } = useGymVideo({ enabled: true, priority: 'normal' });
 * 
 * if (isLoading) return <div>Cargando video...</div>;
 * 
 * return (
 *   <section className="hero">
 *     {hasVideo() && canPlayVideo() ? (
 *       <video
 *         src={getVideoUrl()}
 *         poster={getPosterUrl()}
 *         {...video.settings}
 *       />
 *     ) : (
 *       <img src={getPosterUrl() || '/default-hero.jpg'} alt="Hero" />
 *     )}
 *     <div className="hero-content">
 *       <h1>{video?.title}</h1>
 *       <p>{video?.description}</p>
 *       {video?.ctaButtons.map(btn => (
 *         <button key={btn.action} className={btn.type}>
 *           {btn.text}
 *         </button>
 *       ))}
 *     </div>
 *   </section>
 * );
 * 
 * ESTADOS RETORNADOS:
 * - video: Objeto completo con todos los datos del video y configuración
 * - isLoaded: Boolean indicando si terminó el proceso de carga
 * - isLoading: Boolean indicando si está cargando actualmente
 * - error: Objeto de error con detalles si ocurrió algún problema
 * - lastFetch: Timestamp de la última carga exitosa
 * - enabled: Estado actual de habilitación del hook
 * 
 * FUNCIONES PRINCIPALES:
 * - refresh(): Fuerza actualización de datos desde el backend
 * - clearError(): Limpia el estado de error actual
 * - hasVideo(): Verifica si hay video disponible y válido
 * - hasPoster(): Verifica si hay imagen poster disponible
 * - hasAnyMedia(): Verifica si hay cualquier tipo de media
 * - getVideoUrl(): Obtiene URL del video (null si no disponible)
 * - getPosterUrl(): Obtiene URL del poster/imagen de respaldo
 * - getVideoSettings(): Obtiene configuraciones de reproducción
 * - getHeroContent(): Obtiene contenido del hero (título, descripción, CTAs)
 * - canPlayVideo(): Verifica si el video se puede reproducir (URL válida)
 * - getVideoInfo(): Obtiene resumen completo del estado del video
 * 
 * ESTADOS DERIVADOS (CONVENIENCIA):
 * - videoUrl: URL directa del video
 * - posterUrl: URL directa del poster
 * - videoSettings: Configuraciones de reproducción
 * - heroContent: Contenido del hero completo
 * - canPlay: Boolean si se puede reproducir
 * - videoInfo: Información completa del video
 * - showVideo: Boolean para mostrar video (disponible + puede reproducir)
 * - showPoster: Boolean para mostrar poster
 * - showFallback: Boolean para mostrar contenido de respaldo
 * 
 * MANEJO DE ERRORES ROBUSTO:
 * - Nunca falla completamente, siempre proporciona datos de respaldo
 * - Errores no críticos permiten que la aplicación continúe funcionando
 * - Múltiples niveles de fallback: config → básico → emergencia
 * - Logs detallados para debugging en desarrollo
 * 
 * OPTIMIZACIONES DE RENDIMIENTO:
 * - Cache de 10 minutos via RequestManager
 * - useCallback para todas las funciones utilitarias
 * - Verificación de montaje antes de actualizaciones de estado
 * - Delay de 500ms en carga inicial para evitar requests innecesarios
 * - Cleanup automático de recursos en desmontaje
 * 
 * CASOS DE USO COMUNES:
 * 1. Sección Hero principal: Video de fondo con overlay de contenido
 * 2. Página About: Video institucional del gimnasio
 * 3. Landing pages: Videos promocionales y de marketing
 * 4. Secciones testimoniales: Videos de miembros exitosos
 * 5. Tours virtuales: Videos de las instalaciones
 * 
 * CONSIDERACIONES TÉCNICAS:
 * - Compatible con URLs absolutas y relativas
 * - Validación de URLs antes de intentar reproducción
 * - Configuraciones de video seguras (muted por defecto)
 * - Soporte para diferentes formatos de video
 * - Graceful degradation a imágenes si no hay video
 * 
 * NOTA PARA DESARROLLADORES:
 * Este hook es fundamental para el contenido multimedia del sitio del gimnasio.
 * Mantener la estructura de respuesta consistente con la API del backend.
 * El video es opcional - la aplicación debe funcionar completamente sin él.
 * Considerar el rendimiento al usar videos grandes, especialmente en mobile.
 * Los costos de ancho de banda para videos deben considerarse en quetzales (Q).
 */