// src/services/gymContentService.js
// Autor: Alexander Echeverria
// Archivo: src/services/gymContentService.js

// FUNCION: Servicio para contenido dinámico COMPLETO con soporte para video y móvil
// MEJORAS: Video, optimización móvil, mejor cache, monitoreo avanzado

import apiService from './apiService';
import { requestManager } from './RequestManager';

class GymContentService {
  constructor() {
    this.baseUrl = '/api/gym/content';
    this.cache = new Map();
    
    // Configuración adaptativa según dispositivo
    this.isMobile = this.detectMobile();
    this.cacheTimeout = this.isMobile ? 3 * 60 * 1000 : 5 * 60 * 1000; // Menos cache en móvil
    this.maxCacheSize = this.isMobile ? 15 : 30; // Límite de cache según dispositivo
    
    // Configuración específica para diferentes tipos de contenido
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
    
    // Estadísticas del servicio
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
    
    // Setup automático
    this.setupAutoCleanup();
    
    console.log(`GYM CONTENT SERVICE INITIALIZED ${this.isMobile ? '(Móvil)' : '(Escritorio)'}`);
  }

  // Detectar dispositivo móvil
  detectMobile() {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (typeof window !== 'undefined' && window.innerWidth < 768);
  }

  // METODOS PRINCIPALES DE CONTENIDO

  // Obtener todo el contenido del gimnasio OPTIMIZADO
  async getGymContent(options = {}) {
    const {
      forceRefresh = false,
      includeVideo = true,
      mobileOptimized = this.isMobile
    } = options;
    
    try {
      this.stats.totalRequests++;
      if (this.isMobile) this.stats.mobileRequests++;
      
      console.group('OBTENIENDO CONTENIDO COMPLETO DEL GIMNASIO');
      console.log('Opciones:', { forceRefresh, includeVideo, mobileOptimized, isMobile: this.isMobile });
      
      // Verificar cache primero
      const cacheKey = `gym_content_all_${includeVideo ? 'with_video' : 'no_video'}`;
      const cached = this.getCachedData(cacheKey);
      
      if (cached && !forceRefresh) {
        this.stats.cacheHits++;
        console.log('RETORNANDO CONTENIDO COMPLETO CACHEADO');
        console.groupEnd();
        return cached;
      }
      
      this.stats.cacheMisses++;
      
      // Usar RequestManager para optimización
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
        console.log('CONTENIDO COMPLETO RECIBIDO DEL BACKEND');
        
        // Agregar video si está solicitado y disponible
        let finalContent = response.data;
        if (includeVideo) {
          try {
            const videoContent = await this.getVideoContent({ fallbackOnError: true });
            if (videoContent && videoContent.data) {
              finalContent = {
                ...finalContent,
                video: videoContent.data
              };
              console.log('CONTENIDO DE VIDEO AGREGADO AL CONTENIDO COMPLETO');
            }
          } catch (videoError) {
            console.log('CONTENIDO DE VIDEO FALLÓ, CONTINUANDO SIN VIDEO:', videoError.message);
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
        
        console.log('CONTENIDO COMPLETO PROCESADO Y CACHEADO');
        console.groupEnd();
        
        return {
          status: 'loaded',
          data: finalContent,
          timestamp: Date.now(),
          includesVideo: includeVideo
        };
      }
      
      // Sin datos del backend
      console.log('NO HAY CONTENIDO COMPLETO DEL BACKEND');
      console.groupEnd();
      
      return this.createNotFoundResponse('gym_content', 'Contenido completo no encontrado en el servidor');
      
    } catch (error) {
      this.stats.errors++;
      console.error('Error obteniendo contenido completo del gimnasio:', error);
      console.groupEnd();
      
      return this.createErrorResponse('gym_content', error.message);
    }
  }

  // Obtener contenido de video específicamente
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
      
      console.group('OBTENIENDO CONTENIDO DE VIDEO');
      console.log('Opciones:', { forceRefresh, fallbackOnError, priority });
      
      // Verificar cache
      const cacheKey = 'gym_video_content';
      const cached = this.getCachedData(cacheKey);
      
      if (cached && !forceRefresh) {
        this.stats.cacheHits++;
        console.log('RETORNANDO CONTENIDO DE VIDEO CACHEADO');
        console.groupEnd();
        return cached;
      }
      
      this.stats.cacheMisses++;
      
      // Usar RequestManager con configuración de video
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
        console.log('CONTENIDO DE VIDEO RECIBIDO DEL BACKEND');
        console.log('Detalles del video:', {
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
        
        console.log('CONTENIDO DE VIDEO CACHEADO');
        console.groupEnd();
        
        return videoContent;
      }
      
      // Sin video disponible
      console.log('NO HAY CONTENIDO DE VIDEO DISPONIBLE DEL BACKEND');
      console.groupEnd();
      
      if (fallbackOnError) {
        this.stats.fallbacksUsed++;
        return {
          status: 'not_found',
          message: 'Contenido de video no disponible',
          data: null,
          fallback: true
        };
      }
      
      return this.createNotFoundResponse('video', 'Contenido de video no disponible');
      
    } catch (error) {
      this.stats.errors++;
      console.error('Error obteniendo contenido de video:', error);
      console.groupEnd();
      
      // Manejo especial para errores de video
      if (fallbackOnError) {
        this.stats.fallbacksUsed++;
        console.log('ERROR DE VIDEO: Usando fallback (video es opcional)');
        return {
          status: 'error_fallback',
          message: 'Contenido de video falló al cargar, usando fallback',
          error: error.message,
          data: null,
          fallback: true
        };
      }
      
      return this.createErrorResponse('video', error.message);
    }
  }

  // Obtener contenido de una sección específica MEJORADO
  async getSectionContent(section, options = {}) {
    const {
      forceRefresh = false,
      priority = 'normal',
      mobileOptimized = this.isMobile
    } = options;
    
    try {
      this.stats.totalRequests++;
      if (this.isMobile) this.stats.mobileRequests++;
      
      console.group(`OBTENIENDO CONTENIDO DE SECCION: ${section}`);
      
      // Verificar cache
      const cacheKey = `gym_section_${section}`;
      const cached = this.getCachedData(cacheKey);
      
      if (cached && !forceRefresh) {
        this.stats.cacheHits++;
        console.log(`RETORNANDO SECCION CACHEADA: ${section}`);
        console.groupEnd();
        return cached;
      }
      
      this.stats.cacheMisses++;
      
      // Determinar configuración según el tipo de sección
      let config = this.contentConfig.dynamic;
      if (section === 'config') config = this.contentConfig.config;
      else if (section === 'stats') config = this.contentConfig.stats;
      else if (section === 'video') config = this.contentConfig.video;
      
      // Usar RequestManager
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
        console.log(`CONTENIDO DE SECCION RECIBIDO: ${section}`);
        
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
      
      console.log(`NO HAY CONTENIDO DE SECCION: ${section}`);
      console.groupEnd();
      
      return this.createNotFoundResponse(section, `Contenido de la sección "${section}" no encontrado`);
      
    } catch (error) {
      this.stats.errors++;
      console.error(`Error obteniendo sección ${section}:`, error);
      console.groupEnd();
      
      return this.createErrorResponse(section, error.message);
    }
  }

  // METODOS DE ACTUALIZACION (mantenidos)

  async updateSection(section, data) {
    try {
      const response = await apiService.put(`${this.baseUrl}/${section}`, data);
      
      if (response.success) {
        this.invalidateCache(`gym_section_${section}`);
        this.invalidateCache('gym_content_all_true');
        this.invalidateCache('gym_content_all_false');
        console.log(`SECCION ACTUALIZADA Y CACHE INVALIDADO: ${section}`);
        return response.data;
      }
      
      throw new Error('Falló al actualizar contenido');
      
    } catch (error) {
      console.error(`Error actualizando contenido de ${section}:`, error);
      throw error;
    }
  }

  async updateAllContent(content) {
    try {
      const response = await apiService.put(this.baseUrl, content);
      
      if (response.success) {
        this.clearCache();
        console.log('TODO EL CONTENIDO ACTUALIZADO Y CACHE LIMPIADO');
        return response.data;
      }
      
      throw new Error('Falló al actualizar contenido');
      
    } catch (error) {
      console.error('Error actualizando todo el contenido:', error);
      throw error;
    }
  }

  // METODOS DE CACHE MEJORADOS

  getCachedData(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const age = Date.now() - cached.timestamp;
    const ttl = cached.ttl || this.cacheTimeout;
    
    if (age > ttl) {
      console.log(`CACHE EXPIRADO: ${key} | Edad: ${age}ms > TTL: ${ttl}ms`);
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
    
    console.log(`CACHEADO: ${key} | TTL: ${ttl}ms | Tamaño cache: ${this.cache.size}/${this.maxCacheSize}`);
    
    // Limpiar si excede el límite
    if (this.cache.size > this.maxCacheSize) {
      this.cleanupCache();
    }
  }

  // Limpieza de cache optimizada
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
      console.log(`LIMPIEZA DE CACHE: Eliminadas ${cleaned} entradas | Restantes: ${this.cache.size}`);
    }
    
    this.stats.lastCleanup = Date.now();
  }

  // Setup automático
  setupAutoCleanup() {
    const interval = this.isMobile ? 2 * 60 * 1000 : 5 * 60 * 1000; // Más frecuente en móvil
    
    setInterval(() => {
      this.cleanupCache();
    }, interval);
    
    console.log(`AUTO-LIMPIEZA CONFIGURADA: Cada ${interval / 1000}s (Móvil: ${this.isMobile})`);
  }

  // METODOS DE MONITOREO MEJORADOS

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
    
    console.group(`ESTADISTICAS GYM CONTENT SERVICE ${this.isMobile ? '(Móvil)' : '(Escritorio)'}`);
    console.log('Total Peticiones:', stats.totalRequests);
    console.log('Tasa Cache Hit:', stats.cacheHitRate);
    console.log('Uso de Cache:', `${stats.cacheSize}/${stats.maxCacheSize}`);
    console.log('Peticiones Video:', `${stats.videoRequests} (${stats.videoRequestsPercent})`);
    console.log('Peticiones Móvil:', `${stats.mobileRequests} (${stats.mobileRequestsPercent})`);
    console.log('Fallbacks Usados:', `${stats.fallbacksUsed} (${stats.fallbacksUsedPercent})`);
    console.log('Errores:', stats.errors);
    console.log('Última Limpieza:', stats.lastCleanup);
    console.groupEnd();
  }

  // METODOS DE UTILIDAD MEJORADOS

  // Invalidar cache específico
  invalidateCache(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`CACHE INVALIDADO: ${key}`);
    }
    return deleted;
  }

  // Limpiar todo el cache
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`CACHE LIMPIADO | Eliminadas ${size} entradas`);
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

  // Obtener estadísticas de contenido
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
      console.error('Error obteniendo estadísticas de contenido:', error);
      return this.createErrorResponse('content_stats', error.message);
    }
  }

  // Crear contenido inicial
  async createInitialContent() {
    try {
      const response = await apiService.post(`${this.baseUrl}/initialize`);
      
      if (response.success) {
        this.clearCache();
        console.log('CONTENIDO INICIAL CREADO');
        return response.data;
      }
      
      throw new Error('Falló al crear contenido inicial');
      
    } catch (error) {
      console.error('Error creando contenido inicial:', error);
      throw error;
    }
  }

  // Reiniciar contenido
  async resetContent() {
    try {
      const response = await apiService.post(`${this.baseUrl}/reset`);
      
      if (response.success) {
        this.clearCache();
        console.log('CONTENIDO REINICIADO');
        return response.data;
      }
      
      throw new Error('Falló al reiniciar contenido');
      
    } catch (error) {
      console.error('Error reiniciando contenido:', error);
      throw error;
    }
  }

  // METODOS UTILITARIOS DE ESTADOS (mantenidos)

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

/*
=== COMENTARIOS FINALES ===

PROPOSITO DEL ARCHIVO:
Este GymContentService es un servicio especializado para gestionar todo el contenido
dinámico del gimnasio Elite Fitness. Maneja desde información básica como horarios y
servicios hasta contenido multimedia como videos promocionales, todo optimizado para
dispositivos móviles y con un sistema inteligente de cache para mejorar el rendimiento.

FUNCIONALIDAD PRINCIPAL:
- Gestión completa de contenido dinámico del gimnasio
- Soporte especializado para contenido de video con fallbacks
- Detección automática de dispositivos móviles con optimizaciones específicas
- Sistema de cache inteligente con límites adaptativos según dispositivo
- Priorización de contenido (crítico vs opcional)
- Sistema de fallbacks para contenido no esencial
- Invalidación inteligente de cache relacionado
- Monitoreo avanzado con estadísticas detalladas

ARCHIVOS A LOS QUE SE CONECTA:
- ./apiService: Servicio principal de API para peticiones HTTP
- ./RequestManager: Gestor de peticiones optimizado con cache
- Hooks personalizados: useGymConfig, useGymStats, useTestimonials
- Componentes React que muestran contenido dinámico
- Contextos de aplicación que consumen contenido del gimnasio

ENDPOINTS DEL BACKEND UTILIZADOS:
- GET /api/gym/content: Obtener todo el contenido del gimnasio
- GET /api/gym/content/{section}: Obtener contenido de sección específica
- GET /api/gym/video: Obtener contenido de video específicamente
- PUT /api/gym/content/{section}: Actualizar contenido de sección
- PUT /api/gym/content: Actualizar todo el contenido
- GET /api/gym/content/health: Verificar disponibilidad
- GET /api/gym/content/stats: Obtener estadísticas de contenido
- POST /api/gym/content/initialize: Crear contenido inicial
- POST /api/gym/content/reset: Reiniciar contenido

TIPOS DE CONTENIDO GESTIONADOS:
- Config: Configuración básica del gimnasio (horarios, contacto, ubicación)
- Stats: Estadísticas dinámicas (miembros activos, clases hoy, equipos)
- Video: Contenido multimedia (videos promocionales, tours virtuales)
- Dynamic: Contenido que cambia frecuentemente (ofertas, noticias)
- Services: Servicios del gimnasio (entrenamientos, clases, facilidades)
- Testimonials: Testimonios de clientes y reseñas

OPTIMIZACIONES PARA MOVIL:
- Cache reducido de 15 entradas vs 30 en desktop
- TTL reducido para datos más frescos en móvil
- Limpieza de cache cada 2 minutos vs 5 en desktop
- Detección automática de capacidades del dispositivo
- Priorización de contenido crítico en conexiones lentas

SISTEMA DE PRIORIDADES:
- High: Contenido crítico (configuración básica del gimnasio)
- Normal: Contenido importante (estadísticas, servicios)
- Low: Contenido opcional (videos, contenido dinámico)

SISTEMA DE FALLBACKS:
- Video: Si falla, la aplicación continúa sin video
- Dynamic: Si falla, usa contenido por defecto
- Config: Si falla, se considera error crítico
- Stats: Si falla, muestra mensaje informativo

BENEFICIOS PARA EL USUARIO FINAL:
- Carga rápida de información del gimnasio
- Experiencia fluida en dispositivos móviles
- Contenido siempre actualizado (horarios, clases, ofertas)
- Videos promocionales para mejor presentación
- Información detallada de servicios y facilidades
- Testimonios reales de otros miembros
- Menor consumo de datos en móviles
- Funcionamiento sin interrupciones aunque falle contenido opcional

CASOS DE USO PRINCIPALES:
- Mostrar horarios actualizados del gimnasio
- Presentar servicios y clases disponibles
- Reproducir videos promocionales y tours
- Mostrar estadísticas en tiempo real
- Presentar testimonios de clientes satisfechos
- Gestionar ofertas y promociones dinámicas
- Proporcionar información de contacto actualizada

MONITOREO Y ESTADISTICAS:
- Tracking de peticiones totales y por tipo
- Métricas de cache hit/miss rate
- Porcentaje de peticiones desde móvil
- Seguimiento de uso de fallbacks
- Monitoreo específico de peticiones de video
- Estadísticas de limpieza de cache
- Detección de errores por tipo de contenido

Este servicio es fundamental para mantener la información del gimnasio
actualizada y presentarla de manera eficiente, especialmente en dispositivos
móviles donde la optimización es crucial para una buena experiencia de usuario.
*/