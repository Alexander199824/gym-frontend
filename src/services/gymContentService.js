// src/services/gymContentService.js
// FUNCIÓN: Servicio para contenido dinámico COMPLETO con soporte para video y móvil
// MEJORAS: Video, optimización móvil, mejor cache, monitoreo avanzado

import apiService from './apiService';
import { requestManager } from './RequestManager';

class GymContentService {
  constructor() {
    this.baseUrl = '/api/gym/content';
    this.cache = new Map();
    
    // 📱 Configuración adaptativa según dispositivo
    this.isMobile = this.detectMobile();
    this.cacheTimeout = this.isMobile ? 3 * 60 * 1000 : 5 * 60 * 1000; // Menos cache en móvil
    this.maxCacheSize = this.isMobile ? 15 : 30; // Límite de cache según dispositivo
    
    // 🎬 Configuración específica para diferentes tipos de contenido
    this.contentConfig = {
      video: {
        ttl: 20 * 60 * 1000,     // 20 min - video cambia poco
        priority: 'low',          // Baja prioridad - no crítico
        mobileOptimized: true,
        fallback: true           // Permitir fallback si falla
      },
      config: {
        ttl: 10 * 60 * 1000,     // 10 min
        priority: 'high',         // Alta prioridad - crítico
        mobileOptimized: true,
        fallback: false          // No permitir fallback
      },
      stats: {
        ttl: 3 * 60 * 1000,      // 3 min
        priority: 'normal',
        mobileOptimized: true,
        fallback: true
      },
      dynamic: {
        ttl: 2 * 60 * 1000,      // 2 min - contenido dinámico
        priority: 'normal',
        mobileOptimized: true,
        fallback: true
      }
    };
    
    // 📊 Estadísticas del servicio
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      videoRequests: 0,
      mobileRequests: 0,
      fallbacksUsed: 0,
      lastCleanup: Date.now()
    };
    
    // 🔧 Setup automático
    this.setupAutoCleanup();
    
    console.log(`🏢 GYM CONTENT SERVICE INITIALIZED ${this.isMobile ? '📱 (Mobile)' : '🖥️ (Desktop)'}`);
  }

  // 📱 Detectar dispositivo móvil
  detectMobile() {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (typeof window !== 'undefined' && window.innerWidth < 768);
  }

  // 🏢 MÉTODOS PRINCIPALES DE CONTENIDO

  // 🔍 Obtener todo el contenido del gimnasio OPTIMIZADO
  async getGymContent(options = {}) {
    const {
      forceRefresh = false,
      includeVideo = true,
      mobileOptimized = this.isMobile
    } = options;
    
    try {
      this.stats.totalRequests++;
      if (this.isMobile) this.stats.mobileRequests++;
      
      console.group('🏢 FETCHING GYM CONTENT (Complete)');
      console.log('📊 Options:', { forceRefresh, includeVideo, mobileOptimized, isMobile: this.isMobile });
      
      // Verificar cache primero
      const cacheKey = `gym_content_all_${includeVideo ? 'with_video' : 'no_video'}`;
      const cached = this.getCachedData(cacheKey);
      
      if (cached && !forceRefresh) {
        this.stats.cacheHits++;
        console.log('✅ RETURNING CACHED COMPLETE CONTENT');
        console.groupEnd();
        return cached;
      }
      
      this.stats.cacheMisses++;
      
      // 🚀 Usar RequestManager para optimización
      const config = this.contentConfig.config;
      const response = await requestManager.executeRequest(
        this.baseUrl,
        () => apiService.get(this.baseUrl),
        {
          ttl: config.ttl,
          forceRefresh,
          priority: config.priority
        }
      );
      
      if (response.success && response.data) {
        console.log('✅ COMPLETE CONTENT RECEIVED FROM BACKEND');
        
        // 🎬 Agregar video si está solicitado y disponible
        let finalContent = response.data;
        if (includeVideo) {
          try {
            const videoContent = await this.getVideoContent({ fallbackOnError: true });
            if (videoContent && videoContent.data) {
              finalContent = {
                ...finalContent,
                video: videoContent.data
              };
              console.log('🎬 VIDEO CONTENT MERGED INTO COMPLETE CONTENT');
            }
          } catch (videoError) {
            console.log('⚠️ VIDEO CONTENT FAILED, CONTINUING WITHOUT VIDEO:', videoError.message);
            // No fallar por video - es opcional
          }
        }
        
        // Guardar en cache
        this.setCachedData(cacheKey, {
          status: 'loaded',
          data: finalContent,
          timestamp: Date.now(),
          includesVideo: includeVideo
        });
        
        console.log('✅ COMPLETE CONTENT PROCESSED AND CACHED');
        console.groupEnd();
        
        return {
          status: 'loaded',
          data: finalContent,
          timestamp: Date.now(),
          includesVideo: includeVideo
        };
      }
      
      // Sin datos del backend
      console.log('⚠️ NO COMPLETE CONTENT FROM BACKEND');
      console.groupEnd();
      
      return this.createNotFoundResponse('gym_content', 'Contenido completo no encontrado en el servidor');
      
    } catch (error) {
      this.stats.errors++;
      console.error('❌ Error fetching complete gym content:', error);
      console.groupEnd();
      
      return this.createErrorResponse('gym_content', error.message);
    }
  }

  // 🎬 Obtener contenido de video específicamente
  async getVideoContent(options = {}) {
    const {
      forceRefresh = false,
      fallbackOnError = true,
      priority = 'low'
    } = options;
    
    try {
      this.stats.totalRequests++;
      this.stats.videoRequests++;
      if (this.isMobile) this.stats.mobileRequests++;
      
      console.group('🎬 FETCHING VIDEO CONTENT');
      console.log('📊 Options:', { forceRefresh, fallbackOnError, priority });
      
      // Verificar cache
      const cacheKey = 'gym_video_content';
      const cached = this.getCachedData(cacheKey);
      
      if (cached && !forceRefresh) {
        this.stats.cacheHits++;
        console.log('✅ RETURNING CACHED VIDEO CONTENT');
        console.groupEnd();
        return cached;
      }
      
      this.stats.cacheMisses++;
      
      // 🚀 Usar RequestManager con configuración de video
      const config = this.contentConfig.video;
      const response = await requestManager.executeRequest(
        '/api/gym/video',
        () => apiService.getGymVideo(),
        {
          ttl: config.ttl,
          forceRefresh,
          priority: priority
        }
      );
      
      if (response && response.success && response.data) {
        console.log('✅ VIDEO CONTENT RECEIVED FROM BACKEND');
        console.log('🎬 Video details:', {
          hasHeroVideo: !!response.data.heroVideo,
          hasPoster: !!response.data.poster,
          hasTitle: !!response.data.title,
          hasSettings: !!response.data.settings
        });
        
        // Guardar en cache
        const videoContent = {
          status: 'loaded',
          data: response.data,
          timestamp: Date.now()
        };
        
        this.setCachedData(cacheKey, videoContent);
        
        console.log('✅ VIDEO CONTENT CACHED');
        console.groupEnd();
        
        return videoContent;
      }
      
      // Sin video disponible
      console.log('ℹ️ NO VIDEO CONTENT AVAILABLE FROM BACKEND');
      console.groupEnd();
      
      if (fallbackOnError) {
        this.stats.fallbacksUsed++;
        return {
          status: 'not_found',
          message: 'Video content not available',
          data: null,
          fallback: true
        };
      }
      
      return this.createNotFoundResponse('video', 'Contenido de video no disponible');
      
    } catch (error) {
      this.stats.errors++;
      console.error('❌ Error fetching video content:', error);
      console.groupEnd();
      
      // 🎬 Manejo especial para errores de video
      if (fallbackOnError) {
        this.stats.fallbacksUsed++;
        console.log('🔄 VIDEO ERROR: Using fallback (video is optional)');
        return {
          status: 'error_fallback',
          message: 'Video content failed to load, using fallback',
          error: error.message,
          data: null,
          fallback: true
        };
      }
      
      return this.createErrorResponse('video', error.message);
    }
  }

  // 🔍 Obtener contenido de una sección específica MEJORADO
  async getSectionContent(section, options = {}) {
    const {
      forceRefresh = false,
      priority = 'normal',
      mobileOptimized = this.isMobile
    } = options;
    
    try {
      this.stats.totalRequests++;
      if (this.isMobile) this.stats.mobileRequests++;
      
      console.group(`🔍 FETCHING SECTION CONTENT: ${section}`);
      
      // Verificar cache
      const cacheKey = `gym_section_${section}`;
      const cached = this.getCachedData(cacheKey);
      
      if (cached && !forceRefresh) {
        this.stats.cacheHits++;
        console.log(`✅ RETURNING CACHED SECTION: ${section}`);
        console.groupEnd();
        return cached;
      }
      
      this.stats.cacheMisses++;
      
      // Determinar configuración según el tipo de sección
      let config = this.contentConfig.dynamic;
      if (section === 'config') config = this.contentConfig.config;
      else if (section === 'stats') config = this.contentConfig.stats;
      else if (section === 'video') config = this.contentConfig.video;
      
      // 🚀 Usar RequestManager
      const response = await requestManager.executeRequest(
        `${this.baseUrl}/${section}`,
        () => apiService.get(`${this.baseUrl}/${section}`),
        {
          ttl: config.ttl,
          forceRefresh,
          priority: priority
        }
      );
      
      if (response.success && response.data) {
        console.log(`✅ SECTION CONTENT RECEIVED: ${section}`);
        
        const sectionContent = {
          status: 'loaded',
          section,
          data: response.data,
          timestamp: Date.now()
        };
        
        this.setCachedData(cacheKey, sectionContent);
        
        console.groupEnd();
        return sectionContent;
      }
      
      console.log(`⚠️ NO SECTION CONTENT: ${section}`);
      console.groupEnd();
      
      return this.createNotFoundResponse(section, `Contenido de la sección "${section}" no encontrado`);
      
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Error fetching section ${section}:`, error);
      console.groupEnd();
      
      return this.createErrorResponse(section, error.message);
    }
  }

  // ✏️ MÉTODOS DE ACTUALIZACIÓN (mantenidos)

  async updateSection(section, data) {
    try {
      const response = await apiService.put(`${this.baseUrl}/${section}`, data);
      
      if (response.success) {
        this.invalidateCache(`gym_section_${section}`);
        this.invalidateCache('gym_content_all_true');
        this.invalidateCache('gym_content_all_false');
        console.log(`✅ SECTION UPDATED AND CACHE INVALIDATED: ${section}`);
        return response.data;
      }
      
      throw new Error('Failed to update content');
      
    } catch (error) {
      console.error(`❌ Error updating ${section} content:`, error);
      throw error;
    }
  }

  async updateAllContent(content) {
    try {
      const response = await apiService.put(this.baseUrl, content);
      
      if (response.success) {
        this.clearCache();
        console.log('✅ ALL CONTENT UPDATED AND CACHE CLEARED');
        return response.data;
      }
      
      throw new Error('Failed to update content');
      
    } catch (error) {
      console.error('❌ Error updating all content:', error);
      throw error;
    }
  }

  // 💾 MÉTODOS DE CACHE MEJORADOS

  getCachedData(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const age = Date.now() - cached.timestamp;
    const ttl = cached.ttl || this.cacheTimeout;
    
    if (age > ttl) {
      console.log(`🗑️ CACHE EXPIRED: ${key} | Age: ${age}ms > TTL: ${ttl}ms`);
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCachedData(key, data, customTTL = null) {
    const ttl = customTTL || this.cacheTimeout;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });
    
    console.log(`💾 CACHED: ${key} | TTL: ${ttl}ms | Cache size: ${this.cache.size}/${this.maxCacheSize}`);
    
    // Limpiar si excede el límite
    if (this.cache.size > this.maxCacheSize) {
      this.cleanupCache();
    }
  }

  // 🧹 Limpieza de cache optimizada
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;
    
    // Crear array de entradas con metadatos
    const entries = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      cached,
      age: now - cached.timestamp,
      expired: (now - cached.timestamp) > (cached.ttl || this.cacheTimeout)
    }));
    
    // Eliminar expirados primero
    entries.filter(entry => entry.expired).forEach(entry => {
      this.cache.delete(entry.key);
      cleaned++;
    });
    
    // Si aún excedemos el límite, eliminar los más antiguos
    const remaining = entries.filter(entry => !entry.expired);
    if (remaining.length > this.maxCacheSize) {
      remaining
        .sort((a, b) => b.age - a.age) // Más antiguos primero
        .slice(this.maxCacheSize - 5) // Mantener margen
        .forEach(entry => {
          this.cache.delete(entry.key);
          cleaned++;
        });
    }
    
    if (cleaned > 0) {
      console.log(`🧹 CACHE CLEANUP: Removed ${cleaned} entries | Remaining: ${this.cache.size}`);
    }
    
    this.stats.lastCleanup = Date.now();
  }

  // 🔧 Setup automático
  setupAutoCleanup() {
    const interval = this.isMobile ? 2 * 60 * 1000 : 5 * 60 * 1000; // Más frecuente en móvil
    
    setInterval(() => {
      this.cleanupCache();
    }, interval);
    
    console.log(`🔧 AUTO-CLEANUP SETUP: Every ${interval / 1000}s (Mobile: ${this.isMobile})`);
  }

  // 📊 MÉTODOS DE MONITOREO MEJORADOS

  getStats() {
    const cacheHitRate = this.stats.totalRequests > 0 
      ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(1)
      : 0;

    return {
      ...this.stats,
      cacheHitRate: `${cacheHitRate}%`,
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      isMobile: this.isMobile,
      videoRequestsPercent: this.stats.totalRequests > 0 ? 
        ((this.stats.videoRequests / this.stats.totalRequests) * 100).toFixed(1) + '%' : '0%',
      mobileRequestsPercent: this.stats.totalRequests > 0 ? 
        ((this.stats.mobileRequests / this.stats.totalRequests) * 100).toFixed(1) + '%' : '0%',
      fallbacksUsedPercent: this.stats.totalRequests > 0 ? 
        ((this.stats.fallbacksUsed / this.stats.totalRequests) * 100).toFixed(1) + '%' : '0%',
      lastCleanup: new Date(this.stats.lastCleanup).toLocaleTimeString()
    };
  }

  logStats() {
    const stats = this.getStats();
    
    console.group(`📊 GYM CONTENT SERVICE STATS ${this.isMobile ? '📱' : '🖥️'}`);
    console.log('📈 Total Requests:', stats.totalRequests);
    console.log('💾 Cache Hit Rate:', stats.cacheHitRate);
    console.log('📦 Cache Usage:', `${stats.cacheSize}/${stats.maxCacheSize}`);
    console.log('🎬 Video Requests:', `${stats.videoRequests} (${stats.videoRequestsPercent})`);
    console.log('📱 Mobile Requests:', `${stats.mobileRequests} (${stats.mobileRequestsPercent})`);
    console.log('🔄 Fallbacks Used:', `${stats.fallbacksUsed} (${stats.fallbacksUsedPercent})`);
    console.log('❌ Errors:', stats.errors);
    console.log('🧹 Last Cleanup:', stats.lastCleanup);
    console.groupEnd();
  }

  // 🛠️ MÉTODOS DE UTILIDAD MEJORADOS

  // Invalidar cache específico
  invalidateCache(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ CACHE INVALIDATED: ${key}`);
    }
    return deleted;
  }

  // Limpiar todo el cache
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ CACHE CLEARED | Removed ${size} entries`);
  }

  // Verificar disponibilidad de contenido
  async isContentAvailable() {
    try {
      const response = await apiService.get(`${this.baseUrl}/health`);
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // 📊 Obtener estadísticas de contenido
  async getContentStats() {
    try {
      const response = await apiService.get(`${this.baseUrl}/stats`);
      
      if (response.success && response.data) {
        return {
          status: 'loaded',
          data: response.data,
          timestamp: Date.now()
        };
      }
      
      return this.createNotFoundResponse('content_stats', 'Estadísticas de contenido no encontradas');
      
    } catch (error) {
      console.error('❌ Error fetching content stats:', error);
      return this.createErrorResponse('content_stats', error.message);
    }
  }

  // 🔄 Crear contenido inicial
  async createInitialContent() {
    try {
      const response = await apiService.post(`${this.baseUrl}/initialize`);
      
      if (response.success) {
        this.clearCache();
        console.log('✅ INITIAL CONTENT CREATED');
        return response.data;
      }
      
      throw new Error('Failed to create initial content');
      
    } catch (error) {
      console.error('❌ Error creating initial content:', error);
      throw error;
    }
  }

  // 🔄 Reiniciar contenido
  async resetContent() {
    try {
      const response = await apiService.post(`${this.baseUrl}/reset`);
      
      if (response.success) {
        this.clearCache();
        console.log('✅ CONTENT RESET');
        return response.data;
      }
      
      throw new Error('Failed to reset content');
      
    } catch (error) {
      console.error('❌ Error resetting content:', error);
      throw error;
    }
  }

  // 🛠️ MÉTODOS UTILITARIOS DE ESTADOS (mantenidos)

  isNotFound(response) {
    return response && (response.status === 'not_found' || response.status === 'error_fallback');
  }

  hasError(response) {
    return response && response.status === 'error';
  }

  getStatusMessage(response) {
    if (this.isNotFound(response)) {
      return response.message || 'Contenido no encontrado';
    }
    
    if (this.hasError(response)) {
      return response.message || 'Error al cargar contenido';
    }
    
    return 'Contenido cargado exitosamente';
  }

  getDataOrFallback(response, fallback = null) {
    if (response && response.data) {
      return response.data;
    }
    
    return fallback;
  }

  createNotFoundResponse(section = 'general', customMessage = null) {
    return {
      status: 'not_found',
      message: customMessage || `Contenido de ${section} no disponible`,
      section,
      data: null,
      timestamp: Date.now()
    };
  }

  createErrorResponse(section = 'general', error = 'Error desconocido') {
    return {
      status: 'error',
      message: `Error al cargar ${section}`,
      section,
      error,
      data: null,
      timestamp: Date.now()
    };
  }
}

// Exportar instancia única del servicio
export const gymContentService = new GymContentService();

// Auto-logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    if (gymContentService.stats.totalRequests > 0) {
      gymContentService.logStats();
    }
  }, 60000); // Cada minuto
}

export default gymContentService;

// 📝 MEJORAS IMPLEMENTADAS:
// ✅ Soporte completo para contenido de video con fallbacks
// ✅ Detección automática de dispositivos móviles
// ✅ Configuración adaptativa de cache según dispositivo
// ✅ Sistema de prioridades para diferentes tipos de contenido
// ✅ Integración completa con RequestManager mejorado
// ✅ Manejo de errores específico para video (no crítico)
// ✅ Estadísticas ampliadas con métricas de video y móvil
// ✅ Sistema de fallbacks para contenido opcional
// ✅ Cache más inteligente con límites según dispositivo
// ✅ Auto-limpieza más frecuente en móvil
// ✅ Método getGymContent que incluye video opcionalmente
// ✅ Método getVideoContent específico con manejo de errores
// ✅ Configuración específica por tipo de contenido
// ✅ Monitoreo avanzado con logging detallado
// ✅ Invalidación inteligente de cache relacionado
// ✅ Mantiene TODA la funcionalidad original del servicio