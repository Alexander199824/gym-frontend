// src/hooks/useGymVideo.js
// FUNCIÓN: Hook para obtener video del gimnasio desde el backend
// CORREGIDO: Maneja 404 sin mostrar errores repetidos
// OPTIMIZADO: Solo hace petición si es necesario, manejo inteligente de errores

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
  const [endpointAvailable, setEndpointAvailable] = useState(null); // null = unknown, true = available, false = not available
  
  // 📱 Referencias para control
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = autoRetry ? 2 : 0; // Solo 2 reintentos si está habilitado
  const retryDelay = 3000; // 3 segundos entre reintentos
  
  // 🔍 Función para obtener video del backend con manejo inteligente de 404
  const fetchGymVideo = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current || !enabled) return;
    
    // Si ya sabemos que el endpoint no está disponible, no hacer más peticiones
    if (endpointAvailable === false && !forceRefresh) {
      console.log('🎬 VIDEO ENDPOINT: Known to be unavailable, skipping request');
      setIsLoaded(true);
      setVideo(null);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.group('🎬 FETCHING GYM VIDEO');
      console.log('📊 Current state:', { 
        isLoaded, 
        hasVideo: !!video, 
        forceRefresh, 
        endpointKnownStatus: endpointAvailable,
        enabled 
      });
      
      // 📡 Usar RequestManager para deduplicación inteligente
      const response = await requestManager.executeRequest(
        '/api/gym/video',
        () => apiService.getGymVideo(),
        {
          ttl: 15 * 60 * 1000, // 15 minutos de cache para video
          forceRefresh,
          priority: priority
        }
      );
      
      if (!isMountedRef.current) return;
      
      if (response && response.success && response.data) {
        console.log('✅ VIDEO DATA RECEIVED FROM BACKEND:');
        console.log('📹 Hero Video URL:', response.data.heroVideo || 'None');
        console.log('🖼️ Poster URL:', response.data.poster || 'None');
        console.log('📝 Video Title:', response.data.title || 'None');
        console.log('📄 Video Description:', response.data.description || 'None');
        console.log('⚙️ Video Settings:', response.data.settings || 'None');
        
        // Marcar endpoint como disponible
        setEndpointAvailable(true);
        
        // 🎬 Procesar datos del video
        const processedVideo = {
          heroVideo: response.data.heroVideo || null,
          poster: response.data.poster || null,
          title: response.data.title || 'Video del Gimnasio',
          description: response.data.description || '',
          settings: {
            autoplay: response.data.settings?.autoplay || false,
            muted: response.data.settings?.muted !== false, // true por defecto
            loop: response.data.settings?.loop !== false, // true por defecto
            controls: response.data.settings?.controls !== false, // true por defecto
            ...response.data.settings
          },
          // 📊 Metadatos adicionales si están disponibles
          duration: response.data.duration || null,
          size: response.data.size || null,
          format: response.data.format || 'mp4',
          quality: response.data.quality || 'HD',
          uploadedAt: response.data.uploadedAt || null,
          updatedAt: response.data.updatedAt || null,
          available: response.data.available !== false
        };
        
        console.log('🎯 PROCESSED VIDEO DATA:', processedVideo);
        
        setVideo(processedVideo);
        setIsLoaded(true);
        setLastFetch(Date.now());
        retryCountRef.current = 0;
        
        console.log('✅ GYM VIDEO LOADED SUCCESSFULLY');
        
      } else {
        console.log('⚠️ NO VIDEO DATA FROM BACKEND (but endpoint exists)');
        
        // Endpoint existe pero no hay video configurado
        setEndpointAvailable(true);
        setVideo(null);
        setIsLoaded(true);
        setLastFetch(Date.now());
        
        console.log('ℹ️ GYM VIDEO: Endpoint exists but no video configured');
      }
      
      console.groupEnd();
      
    } catch (fetchError) {
      if (!isMountedRef.current) return;
      
      console.group('🎬 GYM VIDEO FETCH ERROR');
      console.log('💥 Error details:', fetchError.message);
      console.log('📊 Error response:', fetchError.response?.status);
      
      // 🎯 MANEJO ESPECÍFICO DE ERROR 404
      if (fetchError.response?.status === 404) {
        console.log('🔍 ANALYSIS: Video endpoint not implemented in backend (404)');
        console.log('💡 SOLUTION: This is normal - video is optional');
        console.log('✅ ACTION: Marking endpoint as unavailable and continuing without video');
        
        // Marcar endpoint como no disponible para evitar más peticiones
        setEndpointAvailable(false);
        setIsLoaded(true);
        setVideo(null);
        setLastFetch(Date.now());
        
        // No es un error crítico - establecer error informativo
        setError({
          type: 'endpoint_not_implemented',
          message: 'Video endpoint not implemented',
          critical: false,
          suggestion: 'Video is optional - app works without it'
        });
        
        console.log('✅ GYM VIDEO: Gracefully handled 404 - app continues normally');
        console.groupEnd();
        return;
      }
      
      // 🔄 Lógica de reintentos solo para errores no-404
      if (autoRetry && retryCountRef.current < maxRetries && fetchError.response?.status !== 404) {
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
      
      // 📊 Análisis de otros errores
      if (fetchError.code === 'ERR_NETWORK') {
        console.log('🌐 ANALYSIS: Network connection error');
        console.log('💡 SOLUTION: Check backend server status');
        
        setError({
          type: 'network_error',
          message: 'Cannot connect to backend',
          critical: false,
          suggestion: 'Check if backend server is running'
        });
      } else {
        console.log('🔥 ANALYSIS: Unexpected error');
        console.log('📋 Error code:', fetchError.code);
        console.log('📋 Error response:', fetchError.response?.data);
        
        setError({
          type: 'unknown_error',
          message: fetchError.message,
          critical: false,
          suggestion: 'Check backend logs for more details'
        });
      }
      
      // Marcar como "cargado" incluso con error para no bloquear la UI
      setIsLoaded(true);
      setVideo(null);
      setLastFetch(Date.now());
      
      console.log('⚠️ GYM VIDEO: Marked as loaded with error state');
      console.groupEnd();
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isLoaded, video, enabled, autoRetry, priority, endpointAvailable]);
  
  // 🔄 Función para refrescar datos
  const refresh = useCallback(() => {
    console.log('🔄 GYM VIDEO: Manual refresh requested');
    setIsLoaded(false);
    setEndpointAvailable(null); // Reset endpoint status
    retryCountRef.current = 0;
    fetchGymVideo(true);
  }, [fetchGymVideo]);
  
  // 🧹 Función para limpiar error
  const clearError = useCallback(() => {
    console.log('🧼 GYM VIDEO: Clearing error state');
    setError(null);
  }, []);
  
  // 🎬 Funciones de utilidad para video
  const hasVideo = useCallback(() => {
    return !!(video && video.heroVideo && video.available !== false);
  }, [video]);
  
  const getVideoUrl = useCallback(() => {
    return hasVideo() ? video.heroVideo : null;
  }, [video, hasVideo]);
  
  const getPosterUrl = useCallback(() => {
    return video?.poster || null;
  }, [video]);
  
  const getVideoSettings = useCallback(() => {
    return video?.settings || {
      autoplay: false,
      muted: true,
      loop: true,
      controls: true
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
  
  // 📊 Obtener información detallada del video
  const getVideoInfo = useCallback(() => {
    return {
      available: hasVideo(),
      canPlay: canPlayVideo(),
      url: getVideoUrl(),
      poster: getPosterUrl(),
      title: video?.title || null,
      description: video?.description || null,
      settings: getVideoSettings(),
      metadata: video ? {
        duration: video.duration,
        size: video.size,
        format: video.format,
        quality: video.quality,
        uploadedAt: video.uploadedAt,
        updatedAt: video.updatedAt
      } : null,
      lastFetch: lastFetch ? new Date(lastFetch).toISOString() : null,
      endpointStatus: endpointAvailable,
      error: error
    };
  }, [video, hasVideo, canPlayVideo, getVideoUrl, getPosterUrl, getVideoSettings, lastFetch, endpointAvailable, error]);
  
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
        canPlay: canPlayVideo(),
        hasError: !!error,
        errorType: error?.type,
        errorCritical: error?.critical,
        endpointStatus: endpointAvailable,
        lastFetch: lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never'
      });
    }
  }, [enabled, isLoaded, isLoading, hasVideo, canPlayVideo, error, endpointAvailable, lastFetch]);
  
  // 🎯 RETORNO DEL HOOK
  return {
    // 📊 Estados principales
    video,
    isLoaded,
    isLoading,
    error,
    lastFetch,
    enabled,
    
    // 📊 Estados de disponibilidad
    endpointAvailable,
    isEndpointImplemented: endpointAvailable === true,
    isEndpointMissing: endpointAvailable === false,
    
    // 🔧 Funciones de control
    refresh,
    clearError,
    
    // 🎬 Funciones de utilidad
    hasVideo,
    getVideoUrl,
    getPosterUrl,
    getVideoSettings,
    canPlayVideo,
    getVideoInfo,
    
    // 📊 Estados derivados (para comodidad)
    videoUrl: getVideoUrl(),
    posterUrl: getPosterUrl(),
    videoSettings: getVideoSettings(),
    canPlay: canPlayVideo(),
    videoInfo: getVideoInfo()
  };
};

export default useGymVideo;