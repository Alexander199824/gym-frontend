// src/services/RequestManager.js
// Autor: Alexander Echeverria
// Archivo: src/services/RequestManager.js

// FUNCION: ELIMINADOR DE PETICIONES DUPLICADAS - Optimizado para video y móvil
// MEJORAS: Soporte para video, optimizaciones móviles, mejor cache, monitoring

class RequestManager {
  constructor() {
    // Map de promesas activas: endpoint -> Promise
    this.activeRequests = new Map();
    
    // Cache con TTL: endpoint -> { data, timestamp, ttl }
    this.cache = new Map();
    
    // Queue de peticiones pendientes (prioridad)
    this.requestQueue = [];
    
    // Configuración de TTL por endpoint ACTUALIZADA con video
    this.defaultTTL = {
      '/api/gym/config': 10 * 60 * 1000,        // 10 min (casi nunca cambia)
      '/api/gym/stats': 3 * 60 * 1000,          // 3 min (puede cambiar)
      '/api/gym/services': 15 * 60 * 1000,      // 15 min (muy estático)
      '/api/gym/testimonials': 8 * 60 * 1000,   // 8 min (cambia poco)
      '/api/gym/video': 20 * 60 * 1000,         // 20 min (video rara vez cambia) NUEVO
      '/api/store/featured-products': 5 * 60 * 1000, // 5 min (stock cambia)
      '/api/gym/membership-plans': 20 * 60 * 1000,    // 20 min (muy estático)
      '/api/gym/branding': 30 * 60 * 1000,      // 30 min (branding muy estático)
      '/api/gym/navigation': 15 * 60 * 1000,    // 15 min (navegación estática)
      '/api/gym/promotions': 5 * 60 * 1000,     // 5 min (promociones cambian)
    };
    
    // Configuración específica para móvil
    this.mobileConfig = {
      maxCacheSize: 25, // Reducido para móvil (memoria limitada)
      reducedTTL: 0.7,  // Reducir TTL en 30% en móvil para datos más frescos
      batchDelay: 200,  // Delay entre peticiones en lote para móvil
      priorityTimeout: 1000, // Timeout para peticiones de alta prioridad
    };
    
    // Estadísticas para monitoring AMPLIADAS
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      deduplicatedRequests: 0,
      errors: 0,
      videoRequests: 0,      // Específico para video
      mobileRequests: 0,     // Específico para móvil
      highPriorityRequests: 0,
      averageResponseTime: 0,
      lastCleanup: Date.now()
    };
    
    // Rate limiting MEJORADO
    this.lastRequestTime = 0;
    this.minRequestInterval = this.detectMobile() ? 150 : 100; // Más conservador en móvil
    
    // Detectar dispositivo móvil
    this.isMobile = this.detectMobile();
    
    // Auto-limpieza periódica más frecuente en móvil
    this.setupAutoCleanup();
    
    console.log(`REQUEST MANAGER INITIALIZED ${this.isMobile ? '(Mobile Mode)' : '(Desktop Mode)'}`);
  }

  // Detectar si estamos en móvil
  detectMobile() {
    if (typeof navigator === 'undefined') return false;
    
    // Detectar por user agent y características del dispositivo
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(navigator.userAgent);
    
    // Detectar por tamaño de pantalla
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    
    // Detectar por capacidades táctiles
    const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
    
    return isMobileUA || (isSmallScreen && isTouchDevice);
  }

  // METODO PRINCIPAL MEJORADO: Ejecutar petición con optimizaciones móviles
  async executeRequest(endpoint, requestFn, options = {}) {
    const {
      ttl = this.getTTL(endpoint),
      forceRefresh = false,
      priority = 'normal', // 'high', 'normal', 'low'
      mobileOptimized = true // Aplicar optimizaciones móviles
    } = options;

    this.stats.totalRequests++;
    
    // Contadores específicos
    if (this.isMobile) this.stats.mobileRequests++;
    if (priority === 'high') this.stats.highPriorityRequests++;
    if (endpoint.includes('/video')) this.stats.videoRequests++;
    
    console.group(`REQUEST MANAGER: ${endpoint} ${this.isMobile ? '(Móvil)' : '(Escritorio)'}`);
    console.log(`Petición #${this.stats.totalRequests} | Prioridad: ${priority} | Móvil: ${this.isMobile}`);

    try {
      // VERIFICAR CACHE VALIDO (con optimización móvil)
      if (!forceRefresh) {
        const cachedData = this.getCachedData(endpoint, ttl, mobileOptimized);
        if (cachedData !== null) {
          this.stats.cacheHits++;
          console.log(`CACHE HIT | Edad: ${this.getCacheAge(endpoint)}ms | Optimizado móvil: ${mobileOptimized}`);
          console.log(`Estadísticas Cache: ${this.stats.cacheHits} hits / ${this.stats.cacheMisses} misses`);
          console.groupEnd();
          return cachedData;
        }
      }

      this.stats.cacheMisses++;

      // VERIFICAR DEDUPLICACION
      if (this.activeRequests.has(endpoint)) {
        this.stats.deduplicatedRequests++;
        console.log(`DEDUPLICANDO PETICION | Reutilizando promesa activa`);
        console.log(`Deduplicadas: ${this.stats.deduplicatedRequests} peticiones`);
        
        const existingPromise = this.activeRequests.get(endpoint);
        console.groupEnd();
        return await existingPromise;
      }

      // APLICAR RATE LIMITING (ajustado para móvil y prioridad)
      await this.applyRateLimit(priority);

      // CREAR NUEVA PETICION CON MONITOREO DE TIEMPO
      console.log(`NUEVA PETICION | Creando petición fresca | Tipo endpoint: ${this.getEndpointType(endpoint)}`);
      
      const startTime = Date.now();
      const requestPromise = this.createRequest(endpoint, requestFn, ttl, priority);
      
      // Registrar como petición activa
      this.activeRequests.set(endpoint, requestPromise);
      
      // Limpiar al completarse con medición de tiempo
      requestPromise
        .then((result) => {
          const responseTime = Date.now() - startTime;
          this.updateAverageResponseTime(responseTime);
          console.log(`Tiempo respuesta: ${responseTime}ms | Promedio: ${this.stats.averageResponseTime}ms`);
          return result;
        })
        .finally(() => {
          this.activeRequests.delete(endpoint);
          console.log(`Limpieza de petición activa: ${endpoint}`);
        });

      const result = await requestPromise;
      console.groupEnd();
      return result;

    } catch (error) {
      this.stats.errors++;
      console.log(`PETICION FALLÓ | Error: ${error.message}`);
      console.log(`Total Errores: ${this.stats.errors}`);
      
      // Análisis específico para errores de video
      if (endpoint.includes('/video')) {
        console.log('ANALISIS PETICION VIDEO:');
        console.log('  - Esta es una petición de video que falló');
        console.log('  - El contenido de video es opcional, la UI debe fallar graciosamente');
        console.log('  - Considerar implementar placeholder de video o fallback de imagen');
      }
      
      console.groupEnd();
      throw error;
    }
  }

  // Crear y ejecutar petición CON OPTIMIZACIONES
  async createRequest(endpoint, requestFn, ttl, priority) {
    const startTime = Date.now();
    
    try {
      console.log(`Ejecutando función de petición... Prioridad: ${priority}`);
      
      // Timeout especial para alta prioridad en móvil
      let data;
      if (priority === 'high' && this.isMobile) {
        data = await Promise.race([
          requestFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout alta prioridad')), this.mobileConfig.priorityTimeout)
          )
        ]);
      } else {
        data = await requestFn();
      }
      
      const responseTime = Date.now() - startTime;
      console.log(`PETICION EXITOSA | Tiempo respuesta: ${responseTime}ms | Tamaño datos: ${this.getDataSize(data)}`);
      
      // Guardar en cache con optimizaciones móviles
      this.setCachedData(endpoint, data, ttl);
      
      return data;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`PETICION FALLÓ | Tiempo respuesta: ${responseTime}ms | Error: ${error.message}`);
      
      // Manejo especial para errores de video
      if (endpoint.includes('/video') && error.message.includes('404')) {
        console.log('VIDEO 404: Esto es esperado si el endpoint de video no está implementado aún');
        console.log('SOLUCION: El video es opcional, la app debe funcionar sin él');
      }
      
      throw error;
    }
  }

  // Rate limiting MEJORADO con prioridades
  async applyRateLimit(priority = 'normal') {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Alta prioridad tiene menos delay
    let minInterval = this.minRequestInterval;
    if (priority === 'high') {
      minInterval = Math.floor(minInterval * 0.5); // 50% menos delay
    } else if (priority === 'low') {
      minInterval = Math.floor(minInterval * 1.5); // 50% más delay
    }
    
    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      console.log(`RATE LIMITING | Prioridad: ${priority} | Esperando ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  // METODOS DE CACHE MEJORADOS

  // Obtener TTL con ajustes móviles
  getTTL(endpoint) {
    let baseTTL = this.defaultTTL[endpoint] || 5 * 60 * 1000;
    
    // Reducir TTL en móvil para datos más frescos (mejor UX)
    if (this.isMobile) {
      baseTTL = Math.floor(baseTTL * this.mobileConfig.reducedTTL);
    }
    
    return baseTTL;
  }

  // Obtener datos del cache CON optimizaciones móviles
  getCachedData(endpoint, ttl, mobileOptimized = true) {
    const cached = this.cache.get(endpoint);
    
    if (!cached) {
      return null;
    }
    
    const age = Date.now() - cached.timestamp;
    const effectiveTTL = mobileOptimized && this.isMobile ? 
      Math.floor(ttl * this.mobileConfig.reducedTTL) : ttl;
    
    if (age > effectiveTTL) {
      console.log(`CACHE EXPIRADO | Edad: ${age}ms > TTL: ${effectiveTTL}ms | Móvil: ${this.isMobile}`);
      this.cache.delete(endpoint);
      return null;
    }
    
    return cached.data;
  }

  // Obtener edad del cache
  getCacheAge(endpoint) {
    const cached = this.cache.get(endpoint);
    return cached ? Date.now() - cached.timestamp : 0;
  }

  // Guardar datos en cache CON límites móviles
  setCachedData(endpoint, data, ttl) {
    // Límite de cache más estricto en móvil
    const maxCacheSize = this.isMobile ? this.mobileConfig.maxCacheSize : 50;
    
    this.cache.set(endpoint, {
      data,
      timestamp: Date.now(),
      ttl,
      size: this.getDataSize(data),
      endpoint
    });
    
    console.log(`DATOS CACHEADOS | TTL: ${ttl}ms | Tamaño: ${this.cache.size}/${maxCacheSize} entradas | Móvil: ${this.isMobile}`);
    
    // Limpiar cache si excede el límite
    if (this.cache.size > maxCacheSize) {
      this.cleanupCache(true);
    }
  }

  // Limpieza de cache MEJORADA
  cleanupCache(forceFull = false) {
    const now = Date.now();
    let cleaned = 0;
    let totalSize = 0;
    
    // Crear array de entradas con metadatos para mejor limpieza
    const entries = Array.from(this.cache.entries()).map(([endpoint, cached]) => ({
      endpoint,
      cached,
      age: now - cached.timestamp,
      expired: (now - cached.timestamp) > cached.ttl,
      size: cached.size || 0
    }));
    
    // Primero: eliminar expirados
    entries.filter(entry => entry.expired).forEach(entry => {
      this.cache.delete(entry.endpoint);
      cleaned++;
    });
    
    // Si necesitamos más espacio (móvil o forzado), eliminar los más antiguos
    const remainingEntries = entries.filter(entry => !entry.expired);
    if (forceFull && remainingEntries.length > (this.isMobile ? this.mobileConfig.maxCacheSize : 50)) {
      // Ordenar por edad (más antiguos primero)
      remainingEntries
        .sort((a, b) => b.age - a.age)
        .slice(this.isMobile ? this.mobileConfig.maxCacheSize : 40) // Mantener solo los más recientes
        .forEach(entry => {
          this.cache.delete(entry.endpoint);
          cleaned++;
        });
    }
    
    totalSize = Array.from(this.cache.values()).reduce((sum, cached) => sum + (cached.size || 0), 0);
    
    if (cleaned > 0) {
      console.log(`LIMPIEZA CACHE | Eliminadas ${cleaned} entradas | Tamaño total: ${this.formatBytes(totalSize)} | Móvil: ${this.isMobile}`);
    }
    
    this.stats.lastCleanup = now;
  }

  // METODOS DE MONITOREO AMPLIADOS

  // Actualizar tiempo promedio de respuesta
  updateAverageResponseTime(responseTime) {
    if (this.stats.totalRequests === 1) {
      this.stats.averageResponseTime = responseTime;
    } else {
      // Media móvil simple
      this.stats.averageResponseTime = Math.round(
        (this.stats.averageResponseTime * 0.8) + (responseTime * 0.2)
      );
    }
  }

  // Obtener estadísticas MEJORADAS
  getStats() {
    const cacheHitRate = this.stats.totalRequests > 0 
      ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(1)
      : 0;

    const totalCacheSize = Array.from(this.cache.values())
      .reduce((sum, cached) => sum + (cached.size || 0), 0);

    return {
      ...this.stats,
      cacheHitRate: `${cacheHitRate}%`,
      activeRequests: this.activeRequests.size,
      cachedEndpoints: this.cache.size,
      totalCacheSize: this.formatBytes(totalCacheSize),
      efficiency: `${this.stats.deduplicatedRequests} duplicados prevenidos`,
      isMobile: this.isMobile,
      videoRequestsPercent: this.stats.totalRequests > 0 ? 
        ((this.stats.videoRequests / this.stats.totalRequests) * 100).toFixed(1) + '%' : '0%',
      mobileRequestsPercent: this.stats.totalRequests > 0 ? 
        ((this.stats.mobileRequests / this.stats.totalRequests) * 100).toFixed(1) + '%' : '0%',
      averageResponseTime: `${this.stats.averageResponseTime}ms`,
      lastCleanup: new Date(this.stats.lastCleanup).toLocaleTimeString()
    };
  }

  // METODOS DE UTILIDAD NUEVOS

  // Determinar tipo de endpoint
  getEndpointType(endpoint) {
    if (endpoint.includes('/video')) return 'VIDEO';
    if (endpoint.includes('/config')) return 'CONFIG';
    if (endpoint.includes('/stats')) return 'STATS';
    if (endpoint.includes('/products')) return 'PRODUCTS';
    if (endpoint.includes('/services')) return 'SERVICES';
    return 'OTHER';
  }

  // Calcular tamaño aproximado de datos
  getDataSize(data) {
    if (!data) return 0;
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  // Formatear bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Setup auto-limpieza
  setupAutoCleanup() {
    // Más frecuente en móvil
    const cleanupInterval = this.isMobile ? 2 * 60 * 1000 : 5 * 60 * 1000; // 2 min móvil, 5 min desktop
    
    setInterval(() => {
      this.cleanupCache(false);
    }, cleanupInterval);
  }

  // Log de estadísticas MEJORADO
  logStats() {
    const stats = this.getStats();
    
    console.group(`ESTADISTICAS REQUEST MANAGER ${this.isMobile ? '(Móvil)' : '(Escritorio)'}`);
    console.log('Total Peticiones:', stats.totalRequests);
    console.log('Tasa Cache Hit:', stats.cacheHitRate);
    console.log('Deduplicadas:', stats.deduplicatedRequests);
    console.log('Peticiones Activas:', stats.activeRequests);
    console.log('Endpoints Cacheados:', stats.cachedEndpoints);
    console.log('Tamaño Total Cache:', stats.totalCacheSize);
    console.log('Tiempo Respuesta Promedio:', stats.averageResponseTime);
    console.log('Peticiones Video:', `${stats.videoRequests} (${stats.videoRequestsPercent})`);
    console.log('Peticiones Móvil:', `${stats.mobileRequests} (${stats.mobileRequestsPercent})`);
    console.log('Errores:', stats.errors);
    console.log('Última Limpieza:', stats.lastCleanup);
    console.groupEnd();
  }

  // METODOS DE UTILIDAD EXISTENTES (mantenidos)

  invalidateCache(endpoint) {
    const deleted = this.cache.delete(endpoint);
    if (deleted) {
      console.log(`CACHE INVALIDADO: ${endpoint}`);
    }
    return deleted;
  }

  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`CACHE LIMPIADO | Eliminadas ${size} entradas`);
  }

  hasActiveRequest(endpoint) {
    return this.activeRequests.has(endpoint);
  }

  cancelRequest(endpoint) {
    if (this.activeRequests.has(endpoint)) {
      this.activeRequests.delete(endpoint);
      console.log(`PETICION CANCELADA: ${endpoint}`);
      return true;
    }
    return false;
  }

  getCacheInfo() {
    const info = [];
    
    for (const [endpoint, cached] of this.cache.entries()) {
      const age = Date.now() - cached.timestamp;
      const remaining = cached.ttl - age;
      
      info.push({
        endpoint,
        type: this.getEndpointType(endpoint),
        age: `${Math.round(age / 1000)}s`,
        remaining: remaining > 0 ? `${Math.round(remaining / 1000)}s` : 'EXPIRADO',
        size: this.formatBytes(cached.size || 0)
      });
    }
    
    return info.sort((a, b) => a.endpoint.localeCompare(b.endpoint));
  }
}

// Instancia global singleton
export const requestManager = new RequestManager();

// Auto-logging MEJORADO en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Log estadísticas cada 30 segundos si hay actividad
  setInterval(() => {
    if (requestManager.stats.totalRequests > 0) {
      requestManager.logStats();
    }
  }, 30000);
  
  // Limpiar cache expirado según el dispositivo
  const cleanupInterval = requestManager.isMobile ? 2 * 60 * 1000 : 5 * 60 * 1000;
  setInterval(() => {
    requestManager.cleanupCache(false);
  }, cleanupInterval);
  
  // Log específico para móvil
  if (requestManager.isMobile) {
    console.log('REQUEST MANAGER: Optimizaciones móviles habilitadas');
    console.log('  - TTL reducido para datos más frescos');
    console.log('  - Tamaño de cache más pequeño para conservar memoria');
    console.log('  - Ciclos de limpieza más frecuentes');
    console.log('  - Manejo de peticiones basado en prioridad');
  }
}

export default requestManager;

/*
=== COMENTARIOS FINALES ===

PROPOSITO DEL ARCHIVO:
Este RequestManager es un sistema avanzado de gestión de peticiones HTTP que elimina
duplicados, implementa cache inteligente y optimiza el rendimiento especialmente para
dispositivos móviles. Actúa como middleware entre los servicios de API y los componentes
React para mejorar significativamente la experiencia del usuario.

FUNCIONALIDAD PRINCIPAL:
- Eliminación automática de peticiones HTTP duplicadas
- Sistema de cache con TTL (Time To Live) configurable por endpoint
- Detección automática de dispositivos móviles con optimizaciones específicas
- Rate limiting inteligente con prioridades (high, normal, low)
- Monitoreo en tiempo real de rendimiento y estadísticas
- Limpieza automática de cache basada en el dispositivo
- Soporte especializado para contenido de video
- Sistema de timeout especial para peticiones de alta prioridad

ARCHIVOS A LOS QUE SE CONECTA:
- ../services/apiService: Servicio principal de API que utiliza este manager
- Hooks personalizados: useOptimizedAPI, usePromoContent, useTestimonials
- Contextos de aplicación que hacen peticiones frecuentes
- Componentes React que cargan datos del backend
- Sistema de notificaciones para manejo de errores

ENDPOINTS OPTIMIZADOS:
- /api/gym/config: Configuración del gimnasio (TTL: 10 min)
- /api/gym/stats: Estadísticas dinámicas (TTL: 3 min)
- /api/gym/services: Servicios del gimnasio (TTL: 15 min)
- /api/gym/testimonials: Testimonios de clientes (TTL: 8 min)
- /api/gym/video: Contenido de video (TTL: 20 min)
- /api/store/featured-products: Productos destacados (TTL: 5 min)
- /api/gym/membership-plans: Planes de membresía (TTL: 20 min)
- /api/gym/branding: Elementos de marca (TTL: 30 min)
- /api/gym/navigation: Navegación (TTL: 15 min)
- /api/gym/promotions: Promociones activas (TTL: 5 min)

OPTIMIZACIONES PARA MOVIL:
- TTL reducido en 30% para datos más frescos
- Cache limitado a 25 entradas vs 50 en desktop
- Limpieza de cache cada 2 minutos vs 5 en desktop
- Rate limiting más conservador (150ms vs 100ms)
- Timeouts especiales para peticiones de alta prioridad
- Monitoreo específico de peticiones móviles

SISTEMA DE PRIORIDADES:
- High: Peticiones críticas con timeout reducido
- Normal: Peticiones estándar con comportamiento default
- Low: Peticiones no críticas con delay aumentado

ESTADISTICAS Y MONITOREO:
- Total de peticiones realizadas
- Tasa de cache hit/miss
- Número de peticiones deduplicadas
- Tiempo promedio de respuesta
- Peticiones específicas de video
- Porcentaje de peticiones móviles
- Tamaño total del cache
- Última limpieza realizada

BENEFICIOS PARA EL USUARIO:
- Carga más rápida de contenido (evita peticiones duplicadas)
- Menor consumo de datos móviles (cache inteligente)
- Experiencia más fluida en dispositivos móviles
- Tiempo de respuesta optimizado según prioridad
- Interfaz más responsiva especialmente en conexiones lentas
- Menor uso de batería en dispositivos móviles

LOGGING Y DEBUG:
- Logs detallados en modo desarrollo
- Estadísticas automáticas cada 30 segundos
- Información específica sobre errores de video
- Monitoreo del tamaño y estado del cache
- Análisis de patrones de uso móvil vs desktop

Este sistema es transparente para el usuario final pero mejora significativamente
el rendimiento y la responsividad de toda la aplicación, especialmente en
dispositivos móviles donde los recursos son más limitados.
*/