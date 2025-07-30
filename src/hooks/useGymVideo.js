// src/hooks/useGymVideo.js
// FUNCIÓN: Hook COMPLETO para video del gimnasio usando endpoint existente
// MEJORAS: Usa /api/content/landing que ya existe, manejo graceful como el logo

import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';
import { requestManager } from '../services/RequestManager';

const useGymVideo = (options = {}) => {
  const {
    enabled = true,           // Permitir deshabilitar el hook
    autoRetry = false,        // Deshabilitar reintentos automáticos por defecto
    priority = 'low'          // Baja prioridad para video
  } = options;

  // 🏗️ Estados del hook
  const [video, setVideo] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  // 📱 Referencias para control
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = autoRetry ? 2 : 0;
  const retryDelay = 3000;
  
  // 🔍 Función para obtener video del backend usando endpoint existente
  const fetchGymVideo = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current || !enabled) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.group('🎬 FETCHING GYM VIDEO FROM LANDING CONTENT');
      console.log('📊 Current state:', { 
        isLoaded, 
        hasVideo: !!video, 
        forceRefresh,
        enabled 
      });
      
      // 📡 Usar RequestManager para obtener contenido de landing (endpoint existente)
      const response = await requestManager.executeRequest(
        '/api/content/landing',
        () => apiService.getLandingContent(),
        {
          ttl: 15 * 60 * 1000, // 15 minutos de cache
          forceRefresh,
          priority: priority
        }
      );
      
      if (!isMountedRef.current) return;
      
      if (response && response.success && response.data) {
        console.log('✅ LANDING CONTENT RECEIVED FROM BACKEND');
        console.log('🎬 Hero section:', response.data.hero);
        
        const heroSection = response.data.hero;
        
        if (heroSection) {
          console.log('📹 Video URL found:', heroSection.videoUrl || 'None');
          console.log('🖼️ Image URL found:', heroSection.imageUrl || 'None');
          console.log('📝 Title:', heroSection.title || 'None');
          console.log('📄 Description:', heroSection.description || 'None');
          
          // 🎬 Procesar datos del video (como el logo, funciona con o sin datos)
          const processedVideo = {
            heroVideo: heroSection.videoUrl || null,
            poster: heroSection.imageUrl || null,
            title: heroSection.title || 'Elite Fitness Club',
            description: heroSection.description || 'Descubre nuestras instalaciones',
            settings: {
              autoplay: false, // Por políticas de navegadores
              muted: true,     // true por defecto para cumplir políticas
              loop: true,
              controls: true
            },
            // 📊 Metadatos adicionales
            available: !!(heroSection.videoUrl),
            fallbackImage: heroSection.imageUrl,
            hasAnyMedia: !!(heroSection.videoUrl || heroSection.imageUrl),
            // 🎯 CTAs del hero
            ctaButtons: heroSection.ctaButtons || [],
            ctaText: heroSection.ctaText || 'Comienza Hoy'
          };
          
          console.log('🎯 PROCESSED VIDEO DATA:', {
            hasVideo: !!processedVideo.heroVideo,
            hasPoster: !!processedVideo.poster,
            hasAnyMedia: processedVideo.hasAnyMedia,
            title: processedVideo.title,
            available: processedVideo.available
          });
          
          setVideo(processedVideo);
          setIsLoaded(true);
          setLastFetch(Date.now());
          retryCountRef.current = 0;
          
          console.log('✅ GYM VIDEO LOADED SUCCESSFULLY FROM LANDING CONTENT');
          
        } else {
          console.log('⚠️ NO HERO SECTION IN LANDING CONTENT');
          
          // Crear datos por defecto como fallback (igual que el logo)
          const fallbackVideo = {
            heroVideo: null,
            poster: null,
            title: 'Elite Fitness Club',
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
          
          console.log('ℹ️ GYM VIDEO: Using fallback data (no hero section)');
        }
        
      } else {
        console.log('⚠️ NO LANDING CONTENT FROM BACKEND');
        
        // Fallback completo (como el logo cuando no hay config)
        const fallbackVideo = {
          heroVideo: null,
          poster: null,
          title: 'Elite Fitness Club',
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
        
        console.log('ℹ️ GYM VIDEO: Using complete fallback data');
      }
      
      console.groupEnd();
      
    } catch (fetchError) {
      if (!isMountedRef.current) return;
      
      console.group('🎬 GYM VIDEO FETCH ERROR');
      console.log('💥 Error details:', fetchError.message);
      console.log('📊 Error response:', fetchError.response?.status);
      
      // 🔄 Lógica de reintentos solo para errores de red
      if (autoRetry && retryCountRef.current < maxRetries && fetchError.code === 'ERR_NETWORK') {
        retryCountRef.current++;
        console.log(`🔄 RETRYING... Attempt ${retryCountRef.current}/${maxRetries}`);
        console.log(`⏰ Waiting ${retryDelay}ms before retry`);
        
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchGymVideo(forceRefresh);
          }
        }, retryDelay);
        
        console.groupEnd();
        return;
      }
      
      // 📊 Análisis de errores (pero nunca fallar completamente)
      let errorInfo = {
        type: 'unknown_error',
        message: fetchError.message,
        critical: false,
        suggestion: 'Video is optional - app works without it'
      };
      
      if (fetchError.code === 'ERR_NETWORK') {
        console.log('🌐 ANALYSIS: Network connection error');
        console.log('💡 SOLUTION: Check backend server status');
        
        errorInfo = {
          type: 'network_error',
          message: 'Cannot connect to backend',
          critical: false,
          suggestion: 'Check if backend server is running'
        };
      } else if (fetchError.response?.status === 404) {
        console.log('🔍 ANALYSIS: Endpoint not found (404)');
        console.log('💡 SOLUTION: Backend needs /api/content/landing endpoint');
        
        errorInfo = {
          type: 'endpoint_not_found',
          message: 'Landing content endpoint not found',
          critical: false,
          suggestion: 'Contact administrator to configure landing content'
        };
      }
      
      setError(errorInfo);
      
      // ✅ NUNCA fallar - siempre proveer datos por defecto
      const emergencyFallback = {
        heroVideo: null,
        poster: null,
        title: 'Elite Fitness Club',
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
      
      console.log('✅ GYM VIDEO: Using emergency fallback after error');
      console.groupEnd();
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isLoaded, video, enabled, autoRetry, priority]);
  
  // 🔄 Función para refrescar datos
  const refresh = useCallback(() => {
    console.log('🔄 GYM VIDEO: Manual refresh requested');
    setIsLoaded(false);
    retryCountRef.current = 0;
    fetchGymVideo(true);
  }, [fetchGymVideo]);
  
  // 🧹 Función para limpiar error
  const clearError = useCallback(() => {
    console.log('🧼 GYM VIDEO: Clearing error state');
    setError(null);
  }, []);
  
  // 🎬 Funciones de utilidad para video (memoizadas)
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
      title: video.title || 'Elite Fitness Club',
      description: video.description || 'Tu transformación comienza aquí',
      ctaButtons: video.ctaButtons || [],
      ctaText: video.ctaText || 'Comienza Hoy'
    };
  }, [video]);
  
  // 🎯 Función para verificar si el video se puede reproducir
  const canPlayVideo = useCallback(() => {
    if (!hasVideo()) return false;
    
    const videoUrl = getVideoUrl();
    if (!videoUrl) return false;
    
    // Verificar si es una URL válida
    try {
      new URL(videoUrl);
      return true;
    } catch {
      // Si no es URL absoluta, asumir que es relativa y válida
      return videoUrl.startsWith('/') || videoUrl.includes('.');
    }
  }, [hasVideo, getVideoUrl]);
  
  // 📊 Obtener información completa del video
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
  
  // 📱 Efecto para cargar video al montar (solo si está habilitado)
  useEffect(() => {
    isMountedRef.current = true;
    
    console.log('🎬 GYM VIDEO HOOK: Initializing...', { enabled });
    
    if (enabled && !isLoaded && !isLoading) {
      // Pequeño delay para dar prioridad a contenido crítico
      const timer = setTimeout(() => {
        if (isMountedRef.current && enabled) {
          fetchGymVideo();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      isMountedRef.current = false;
      console.log('🎬 GYM VIDEO HOOK: Cleanup');
    };
  }, [fetchGymVideo, isLoaded, isLoading, enabled]);
  
  // 📊 Log de estado cuando cambie (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎬 GYM VIDEO STATE CHANGE:', {
        enabled,
        isLoaded,
        isLoading,
        hasVideo: hasVideo(),
        hasMedia: hasAnyMedia(),
        canPlay: canPlayVideo(),
        hasError: !!error,
        errorType: error?.type,
        errorState: video?.errorState,
        lastFetch: lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never'
      });
    }
  }, [enabled, isLoaded, isLoading, hasVideo, hasAnyMedia, canPlayVideo, error, video?.errorState, lastFetch]);
  
  // 🎯 RETORNO DEL HOOK (completo como el logo)
  return {
    // 📊 Estados principales
    video,
    isLoaded,
    isLoading,
    error,
    lastFetch,
    enabled,
    
    // 🔧 Funciones de control
    refresh,
    clearError,
    
    // 🎬 Funciones de utilidad
    hasVideo,
    hasPoster,
    hasAnyMedia,
    getVideoUrl,
    getPosterUrl,
    getVideoSettings,
    getHeroContent,
    canPlayVideo,
    getVideoInfo,
    
    // 📊 Estados derivados (para comodidad)
    videoUrl: getVideoUrl(),
    posterUrl: getPosterUrl(),
    videoSettings: getVideoSettings(),
    heroContent: getHeroContent(),
    canPlay: canPlayVideo(),
    videoInfo: getVideoInfo(),
    
    // 🎯 Estados de conveniencia
    showVideo: hasVideo() && canPlayVideo(),
    showPoster: hasPoster(),
    showFallback: !hasAnyMedia()
  };
};

export default useGymVideo;