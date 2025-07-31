// src/hooks/useGymVideo.js
// FUNCIÓN: Hook SIMPLIFICADO que usa el video de /api/gym/config
// MEJORAS: Usa endpoint existente, menos complejidad, mejor rendimiento

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '../services/RequestManager';
import apiService from '../services/apiService';

const useGymVideo = (options = {}) => {
  const {
    enabled = true,
    autoRetry = false,
    priority = 'low'
  } = options;

  // 🏗️ Estados del hook
  const [video, setVideo] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const isMountedRef = useRef(true);
  
  // 🔍 Función para obtener video del config del gym
  const fetchGymVideo = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current || !enabled) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.group('🎬 FETCHING GYM VIDEO FROM CONFIG');
      console.log('📊 Current state:', { 
        isLoaded, 
        hasVideo: !!video, 
        forceRefresh,
        enabled 
      });
      
      // 📡 Usar RequestManager para obtener config del gym
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
        console.log('✅ GYM CONFIG RECEIVED');
        console.log('🎬 Checking for video data in config...');
        
        const gymData = response.data;
        
        // 🎬 Extraer datos de video del config (si existen)
        let videoData = null;
        let posterData = null;
        
        // Buscar video en diferentes ubicaciones posibles del config
        if (gymData.hero?.videoUrl) {
          videoData = gymData.hero.videoUrl;
          posterData = gymData.hero.imageUrl;
          console.log('🎬 Video found in hero section');
        } else if (gymData.videoUrl) {
          videoData = gymData.videoUrl;
          posterData = gymData.imageUrl;
          console.log('🎬 Video found in root config');
        } else if (gymData.media?.videoUrl) {
          videoData = gymData.media.videoUrl;
          posterData = gymData.media.imageUrl;
          console.log('🎬 Video found in media section');
        }
        
        console.log('📹 Video URL found:', videoData || 'None');
        console.log('🖼️ Poster URL found:', posterData || 'None');
        
        // 🎬 Procesar datos del video
        const processedVideo = {
          heroVideo: videoData || null,
          poster: posterData || null,
          title: gymData.name || 'Elite Fitness Club',
          description: gymData.description || 'Tu transformación comienza aquí',
          settings: {
            autoplay: false,
            muted: true,
            loop: true,
            controls: true
          },
          // 📊 Metadatos
          available: !!videoData,
          fallbackImage: posterData,
          hasAnyMedia: !!(videoData || posterData),
          // 🎯 CTAs del hero
          ctaButtons: [
            {
              text: "Únete Ahora",
              type: "primary",
              action: "register"
            }
          ],
          ctaText: 'Comienza Hoy'
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
        
        console.log('✅ GYM VIDEO LOADED FROM CONFIG');
        
      } else {
        console.log('⚠️ NO CONFIG DATA FROM BACKEND');
        
        // Fallback con datos básicos del gym
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
        
        console.log('ℹ️ GYM VIDEO: Using fallback data');
      }
      
      console.groupEnd();
      
    } catch (fetchError) {
      if (!isMountedRef.current) return;
      
      console.group('🎬 GYM VIDEO FETCH ERROR');
      console.log('💥 Error details:', fetchError.message);
      
      setError({
        type: 'fetch_error',
        message: fetchError.message,
        critical: false,
        suggestion: 'Video is optional - app works without it'
      });
      
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
  }, [isLoaded, video, enabled, priority]);
  
  // 🔄 Función para refrescar datos
  const refresh = useCallback(() => {
    console.log('🔄 GYM VIDEO: Manual refresh requested');
    setIsLoaded(false);
    fetchGymVideo(true);
  }, [fetchGymVideo]);
  
  // 🧹 Función para limpiar error
  const clearError = useCallback(() => {
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
  
  // 📱 Efecto para cargar video al montar
  useEffect(() => {
    isMountedRef.current = true;
    
    console.log('🎬 GYM VIDEO HOOK: Initializing (using gym config)...', { enabled });
    
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
      console.log('🎬 GYM VIDEO HOOK: Cleanup');
    };
  }, [fetchGymVideo, isLoaded, isLoading, enabled]);
  
  // 📊 Log de estado cuando cambie (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎬 GYM VIDEO STATE CHANGE (using config):', {
        enabled,
        isLoaded,
        isLoading,
        hasVideo: hasVideo(),
        hasMedia: hasAnyMedia(),
        canPlay: canPlayVideo(),
        hasError: !!error,
        errorState: video?.errorState,
        lastFetch: lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never'
      });
    }
  }, [enabled, isLoaded, isLoading, hasVideo, hasAnyMedia, canPlayVideo, error, video?.errorState, lastFetch]);
  
  // 🎯 RETORNO DEL HOOK (manteniendo la misma API)
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
    
    // 🎯 Estados de conveniencia (manteniendo compatibilidad)
    showVideo: hasVideo() && canPlayVideo(),
    showPoster: hasPoster(),
    showFallback: !hasAnyMedia()
  };
};

export default useGymVideo;