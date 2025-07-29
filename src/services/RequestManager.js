// src/services/RequestManager.js
// FUNCIÓN: SISTEMA AVANZADO DE AUTOMATIZACIÓN DE PETICIONES - Anti-Sobrecarga
// NUEVO: Circuit Breaker + Request Batching + Background Refresh + Intelligent Throttling
// CAPACIDAD: Maneja miles de usuarios concurrentes sin saturar el backend

import EventEmitter from 'events';

// 🚦 CIRCUIT BREAKER - Previene saturación del backend
class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.threshold = options.threshold || 5; // Fallos para abrir circuito
    this.timeout = options.timeout || 30000; // 30s para intentar de nuevo
    this.monitor = options.monitor || 10000; // 10s para monitoreo
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
    
    console.log('🚦 Circuit Breaker initialized:', options);
  }

  async call(request) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        const error = new Error('Circuit breaker is OPEN - Backend overloaded');
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }
      this.state = 'HALF_OPEN';
      console.log('🔄 Circuit breaker: OPEN → HALF_OPEN');
    }

    try {
      const result = await request();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('✅ Circuit breaker: HALF_OPEN → CLOSED (Backend recovered)');
      this.emit('closed');
    }
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`🔴 Circuit breaker: OPENED (${this.failures} failures) - Backend protection active`);
      this.emit('opened', { failures: this.failures, nextAttempt: this.nextAttempt });
    }
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      isOpen: this.state === 'OPEN',
      nextAttempt: this.nextAttempt,
      timeUntilRetry: this.state === 'OPEN' ? Math.max(0, this.nextAttempt - Date.now()) : 0
    };
  }
}

// 📦 REQUEST BATCHER - Agrupa peticiones similares
class RequestBatcher {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 50; // 50ms
    this.batches = new Map();
    
    console.log('📦 Request Batcher initialized:', options);
  }

  async batch(key, request, options = {}) {
    const batchKey = this.getBatchKey(key, options);
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        requests: [],
        promise: null,
        timeout: null,
        created: Date.now()
      });
    }

    const batch = this.batches.get(batchKey);
    
    return new Promise((resolve, reject) => {
      batch.requests.push({ request, resolve, reject, options });
      
      // Ejecutar batch si alcanza el tamaño máximo
      if (batch.requests.length >= this.batchSize) {
        this.executeBatch(batchKey);
      } else if (!batch.timeout) {
        // Programar ejecución por timeout
        batch.timeout = setTimeout(() => {
          this.executeBatch(batchKey);
        }, this.batchTimeout);
      }
    });
  }

  async executeBatch(batchKey) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;
    
    console.log(`📦 Executing batch: ${batchKey} (${batch.requests.length} requests)`);
    
    if (batch.timeout) {
      clearTimeout(batch.timeout);
    }
    
    this.batches.delete(batchKey);
    
    try {
      // Ejecutar todas las peticiones del batch
      const results = await Promise.allSettled(
        batch.requests.map(({ request }) => request())
      );
      
      // Resolver cada promesa individual
      batch.requests.forEach(({ resolve, reject }, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });
      
    } catch (error) {
      // Si hay error general, rechazar todas
      batch.requests.forEach(({ reject }) => reject(error));
    }
  }

  getBatchKey(endpoint, options = {}) {
    // Agrupar por endpoint y opciones similares
    const keyParts = [endpoint];
    if (options.priority) keyParts.push(options.priority);
    if (options.forceRefresh) keyParts.push('force');
    return keyParts.join('|');
  }

  getStats() {
    return {
      activeBatches: this.batches.size,
      totalRequests: Array.from(this.batches.values())
        .reduce((sum, batch) => sum + batch.requests.length, 0)
    };
  }
}

// ⏰ REQUEST SCHEDULER - Prioriza peticiones críticas
class RequestScheduler {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 6; // Máximo 6 peticiones concurrentes
    this.queues = {
      critical: [], // Config, Auth
      high: [],     // Stats, Services
      normal: [],   // Products, Plans  
      low: []       // Testimonials, Content
    };
    this.running = 0;
    this.processing = false;
    
    console.log('⏰ Request Scheduler initialized:', options);
  }

  async schedule(request, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const queueItem = {
        request,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9)
      };
      
      this.queues[priority].push(queueItem);
      console.log(`📋 Queued request [${priority}]: ${queueItem.id} (Queue: ${this.queues[priority].length})`);
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.running >= this.maxConcurrent) {
      return;
    }
    
    this.processing = true;
    
    while (this.running < this.maxConcurrent) {
      const nextRequest = this.getNextRequest();
      if (!nextRequest) break;
      
      this.running++;
      console.log(`🚀 Executing request [${nextRequest.priority}]: ${nextRequest.id} (Running: ${this.running})`);
      
      this.executeRequest(nextRequest).finally(() => {
        this.running--;
        this.processQueue(); // Procesar siguiente
      });
    }
    
    this.processing = false;
  }

  getNextRequest() {
    // Prioridad: critical > high > normal > low
    for (const priority of ['critical', 'high', 'normal', 'low']) {
      if (this.queues[priority].length > 0) {
        return this.queues[priority].shift();
      }
    }
    return null;
  }

  async executeRequest(queueItem) {
    try {
      const result = await queueItem.request();
      queueItem.resolve(result);
    } catch (error) {
      queueItem.reject(error);
    }
  }

  getStats() {
    const totalQueued = Object.values(this.queues)
      .reduce((sum, queue) => sum + queue.length, 0);
    
    return {
      running: this.running,
      queued: totalQueued,
      queuesByPriority: Object.entries(this.queues)
        .reduce((acc, [priority, queue]) => {
          acc[priority] = queue.length;
          return acc;
        }, {})
    };
  }
}

// 🔄 BACKGROUND SYNC - Actualiza cache sin bloquear UI
class BackgroundSync {
  constructor(requestManager) {
    this.requestManager = requestManager;
    this.syncIntervals = new Map();
    this.isActive = true;
    
    console.log('🔄 Background Sync initialized');
  }

  startSync(endpoint, interval = 60000) { // 1 minuto por defecto
    if (this.syncIntervals.has(endpoint)) {
      clearInterval(this.syncIntervals.get(endpoint));
    }
    
    const intervalId = setInterval(async () => {
      if (!this.isActive) return;
      
      try {
        console.log(`🔄 Background sync: ${endpoint}`);
        await this.requestManager.refreshInBackground(endpoint);
      } catch (error) {
        console.warn(`⚠️ Background sync failed: ${endpoint}`, error.message);
      }
    }, interval);
    
    this.syncIntervals.set(endpoint, intervalId);
    console.log(`🔄 Started background sync: ${endpoint} (${interval}ms)`);
  }

  stopSync(endpoint) {
    if (this.syncIntervals.has(endpoint)) {
      clearInterval(this.syncIntervals.get(endpoint));
      this.syncIntervals.delete(endpoint);
      console.log(`🛑 Stopped background sync: ${endpoint}`);
    }
  }

  pauseAll() {
    this.isActive = false;
    console.log('⏸️ Background sync paused');
  }

  resumeAll() {
    this.isActive = true;
    console.log('▶️ Background sync resumed');
  }

  destroy() {
    this.isActive = false;
    this.syncIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.syncIntervals.clear();
    console.log('🗑️ Background sync destroyed');
  }
}

// 🎯 ENHANCED REQUEST MANAGER - Sistema principal mejorado
class EnhancedRequestManager extends EventEmitter {
  constructor() {
    super();
    
    // Componentes del sistema
    this.circuitBreaker = new CircuitBreaker({
      threshold: 5,
      timeout: 30000,
      monitor: 10000
    });
    
    this.batcher = new RequestBatcher({
      batchSize: 8,
      batchTimeout: 100
    });
    
    this.scheduler = new RequestScheduler({
      maxConcurrent: 6
    });
    
    this.backgroundSync = new BackgroundSync(this);
    
    // Cache con TTL dinámico
    this.cache = new Map();
    this.cacheStats = { hits: 0, misses: 0, evictions: 0 };
    
    // Request tracking
    this.activeRequests = new Map();
    this.requestStats = {
      total: 0,
      success: 0,
      errors: 0,
      circuitBreakerBlocks: 0,
      cacheHits: 0,
      batched: 0
    };
    
    // TTL dinámico por endpoint
    this.dynamicTTL = new Map([
      ['/api/gym/config', { base: 10 * 60 * 1000, factor: 1.0 }],      // 10min base
      ['/api/gym/stats', { base: 2 * 60 * 1000, factor: 0.5 }],        // 2min base, muy dinámico
      ['/api/gym/services', { base: 15 * 60 * 1000, factor: 1.5 }],    // 15min base, muy estático
      ['/api/gym/testimonials', { base: 8 * 60 * 1000, factor: 1.2 }], // 8min base
      ['/api/store/featured-products', { base: 3 * 60 * 1000, factor: 0.8 }], // 3min base
      ['/api/gym/membership-plans', { base: 20 * 60 * 1000, factor: 2.0 }]    // 20min base, muy estático
    ]);
    
    // Rate limiting adaptativo
    this.rateLimiter = {
      requests: [],
      maxPerMinute: 120, // Base: 120 req/min
      currentLimit: 120,
      lastAdjustment: Date.now()
    };
    
    // Inicializar background sync para datos críticos
    this.initializeBackgroundSync();
    
    // Escuchar eventos del circuit breaker
    this.circuitBreaker.on('opened', (data) => {
      this.emit('circuitBreakerOpened', data);
      this.adjustRateLimit(0.5); // Reducir límite al 50%
    });
    
    this.circuitBreaker.on('closed', () => {
      this.emit('circuitBreakerClosed');
      this.adjustRateLimit(1.2); // Aumentar límite al 120%
    });
    
    console.log('🎯 Enhanced Request Manager initialized');
  }

  // 🔥 MÉTODO PRINCIPAL MEJORADO
  async executeRequest(endpoint, requestFn, options = {}) {
    const {
      ttl,
      forceRefresh = false,
      priority = this.determinePriority(endpoint),
      enableBatching = true,
      enableBackground = true
    } = options;

    this.requestStats.total++;
    const requestId = `${endpoint}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    console.group(`🎯 Enhanced Request: ${endpoint} [${priority}]`);
    console.log(`📊 Request ID: ${requestId}`);

    try {
      // 1️⃣ Verificar rate limiting
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded - Too many requests');
      }

      // 2️⃣ Verificar cache válido
      if (!forceRefresh) {
        const cachedData = this.getCachedData(endpoint, ttl);
        if (cachedData !== null) {
          this.requestStats.cacheHits++;
          this.cacheStats.hits++;
          console.log(`✅ CACHE HIT | Age: ${this.getCacheAge(endpoint)}ms`);
          console.groupEnd();
          return cachedData;
        }
      }

      this.cacheStats.misses++;

      // 3️⃣ Verificar si hay petición activa (deduplicación)
      if (this.activeRequests.has(endpoint)) {
        console.log(`🔄 DEDUPLICATING | Reusing active request`);
        const existingPromise = this.activeRequests.get(endpoint);
        console.groupEnd();
        return await existingPromise;
      }

      // 4️⃣ Crear nueva petición con todos los mecanismos
      const requestPromise = this.createEnhancedRequest(
        endpoint, 
        requestFn, 
        { ...options, priority, requestId, enableBatching }
      );
      
      // Registrar como activa
      this.activeRequests.set(endpoint, requestPromise);
      
      // Limpiar al completarse
      requestPromise.finally(() => {
        this.activeRequests.delete(endpoint);
      });

      const result = await requestPromise;
      
      // 5️⃣ Iniciar background sync si está habilitado
      if (enableBackground && !this.backgroundSync.syncIntervals.has(endpoint)) {
        const syncInterval = this.calculateSyncInterval(endpoint);
        this.backgroundSync.startSync(endpoint, syncInterval);
      }

      console.groupEnd();
      return result;

    } catch (error) {
      this.requestStats.errors++;
      
      if (error.code === 'CIRCUIT_BREAKER_OPEN') {
        this.requestStats.circuitBreakerBlocks++;
      }
      
      console.log(`❌ REQUEST FAILED | ${error.message}`);
      console.groupEnd();
      throw error;
    }
  }

  // 🔨 Crear petición mejorada con todos los mecanismos
  async createEnhancedRequest(endpoint, requestFn, options) {
    const { priority, requestId, enableBatching, ttl } = options;
    
    // Función wrapper que incluye circuit breaker
    const protectedRequest = () => this.circuitBreaker.call(requestFn);
    
    // Usar scheduler para priorizar
    const scheduledRequest = () => this.scheduler.schedule(protectedRequest, priority);
    
    // Usar batching si está habilitado y es apropiado
    const finalRequest = enableBatching && this.shouldBatch(endpoint) 
      ? () => this.batcher.batch(endpoint, scheduledRequest, options)
      : scheduledRequest;
    
    console.log(`🔧 Request pipeline: ${endpoint} | Batching: ${enableBatching} | Priority: ${priority}`);
    
    const startTime = Date.now();
    
    try {
      const data = await finalRequest();
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ REQUEST SUCCESS | ${responseTime}ms | ID: ${requestId}`);
      
      // Guardar en cache con TTL dinámico
      const dynamicTTL = this.calculateDynamicTTL(endpoint, ttl, responseTime);
      this.setCachedData(endpoint, data, dynamicTTL);
      
      this.requestStats.success++;
      this.emit('requestSuccess', { endpoint, responseTime, requestId });
      
      return data;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ REQUEST FAILED | ${responseTime}ms | ID: ${requestId} | Error: ${error.message}`);
      
      this.emit('requestError', { endpoint, error, responseTime, requestId });
      throw error;
    }
  }

  // 🧠 Determinar prioridad automáticamente
  determinePriority(endpoint) {
    if (endpoint.includes('/auth') || endpoint.includes('/config')) return 'critical';
    if (endpoint.includes('/stats') || endpoint.includes('/services')) return 'high';
    if (endpoint.includes('/products') || endpoint.includes('/plans')) return 'normal';
    return 'low';
  }

  // 🎯 Verificar si debe usar batching
  shouldBatch(endpoint) {
    // No hacer batch para endpoints críticos o únicos
    return !endpoint.includes('/auth') && 
           !endpoint.includes('/config') && 
           !endpoint.includes('/health');
  }

  // ⏰ Calcular TTL dinámico basado en rendimiento
  calculateDynamicTTL(endpoint, baseTTL, responseTime) {
    if (baseTTL) return baseTTL;
    
    const config = this.dynamicTTL.get(endpoint);
    if (!config) return 5 * 60 * 1000; // 5 min por defecto
    
    let dynamicTTL = config.base * config.factor;
    
    // Ajustar basado en tiempo de respuesta
    if (responseTime > 2000) { // Si tarda más de 2s
      dynamicTTL *= 1.5; // Aumentar TTL para no sobrecargar
    } else if (responseTime < 200) { // Si es muy rápido
      dynamicTTL *= 0.8; // Reducir TTL para datos más frescos
    }
    
    // Ajustar basado en estado del circuit breaker
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      dynamicTTL *= 2; // TTL más largo si el backend está recuperándose
    }
    
    return Math.max(30000, Math.min(dynamicTTL, 30 * 60 * 1000)); // Entre 30s y 30min
  }

  // ⏰ Calcular intervalo de background sync
  calculateSyncInterval(endpoint) {
    const ttlConfig = this.dynamicTTL.get(endpoint);
    if (!ttlConfig) return 60000; // 1 minuto por defecto
    
    // Sync interval = TTL / 3 (actualizar antes de que expire)
    return Math.max(30000, (ttlConfig.base * ttlConfig.factor) / 3);
  }

  // 🚦 Rate limiting adaptativo
  checkRateLimit() {
    const now = Date.now();
    const minute = 60 * 1000;
    
    // Limpiar peticiones antiguas
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      time => now - time < minute
    );
    
    // Verificar límite
    if (this.rateLimiter.requests.length >= this.rateLimiter.currentLimit) {
      console.warn(`🚦 Rate limit exceeded: ${this.rateLimiter.requests.length}/${this.rateLimiter.currentLimit}`);
      return false;
    }
    
    // Registrar petición
    this.rateLimiter.requests.push(now);
    return true;
  }

  // 🔧 Ajustar rate limit dinámicamente
  adjustRateLimit(factor) {
    const now = Date.now();
    
    // Solo ajustar cada 30 segundos mínimo
    if (now - this.rateLimiter.lastAdjustment < 30000) return;
    
    const oldLimit = this.rateLimiter.currentLimit;
    this.rateLimiter.currentLimit = Math.max(
      10, // Mínimo 10 req/min
      Math.min(300, Math.round(this.rateLimiter.currentLimit * factor)) // Máximo 300 req/min
    );
    
    this.rateLimiter.lastAdjustment = now;
    
    console.log(`🚦 Rate limit adjusted: ${oldLimit} → ${this.rateLimiter.currentLimit} req/min`);
  }

  // 🔄 Refresh en background
  async refreshInBackground(endpoint) {
    try {
      const ttlConfig = this.dynamicTTL.get(endpoint);
      const requestFn = this.getDefaultRequestFunction(endpoint);
      
      if (!requestFn) {
        console.warn(`⚠️ No default request function for: ${endpoint}`);
        return;
      }
      
      console.log(`🔄 Background refresh: ${endpoint}`);
      
      const data = await this.circuitBreaker.call(requestFn);
      
      // Actualizar cache silenciosamente
      const ttl = ttlConfig ? ttlConfig.base * ttlConfig.factor : 5 * 60 * 1000;
      this.setCachedData(endpoint, data, ttl);
      
      this.emit('backgroundRefresh', { endpoint, success: true });
      
    } catch (error) {
      console.warn(`⚠️ Background refresh failed: ${endpoint}`, error.message);
      this.emit('backgroundRefresh', { endpoint, success: false, error });
    }
  }

  // 🔧 Obtener función de petición por defecto
  getDefaultRequestFunction(endpoint) {
    // Mapeo de endpoints a funciones por defecto
    const functionMap = {
      '/api/gym/config': () => import('./apiService').then(api => api.default.getGymConfig()),
      '/api/gym/stats': () => import('./apiService').then(api => api.default.getGymStats()),
      '/api/gym/services': () => import('./apiService').then(api => api.default.getGymServices()),
      '/api/gym/testimonials': () => import('./apiService').then(api => api.default.getTestimonials()),
      '/api/store/featured-products': () => import('./apiService').then(api => api.default.getFeaturedProducts()),
      '/api/gym/membership-plans': () => import('./apiService').then(api => api.default.getMembershipPlans())
    };
    
    return functionMap[endpoint];
  }

  // 💾 MÉTODOS DE CACHE MEJORADOS
  getCachedData(endpoint, ttl) {
    const cached = this.cache.get(endpoint);
    if (!cached) return null;
    
    const dynamicTTL = ttl || this.calculateDynamicTTL(endpoint, null, 0);
    const age = Date.now() - cached.timestamp;
    
    if (age > dynamicTTL) {
      this.cache.delete(endpoint);
      this.cacheStats.evictions++;
      return null;
    }
    
    return cached.data;
  }

  setCachedData(endpoint, data, ttl) {
    this.cache.set(endpoint, {
      data,
      timestamp: Date.now(),
      ttl,
      size: JSON.stringify(data).length
    });
    
    // Limpiar cache si es muy grande (>100 entradas)
    if (this.cache.size > 100) {
      this.cleanupExpiredCache();
    }
  }

  getCacheAge(endpoint) {
    const cached = this.cache.get(endpoint);
    return cached ? Date.now() - cached.timestamp : 0;
  }

  cleanupExpiredCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [endpoint, cached] of this.cache.entries()) {
      const age = now - cached.timestamp;
      if (age > cached.ttl) {
        this.cache.delete(endpoint);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.cacheStats.evictions += cleaned;
      console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
    }
  }

  // 🔧 Inicializar background sync
  initializeBackgroundSync() {
    // Sync automático para datos críticos
    setTimeout(() => {
      this.backgroundSync.startSync('/api/gym/stats', 2 * 60 * 1000);    // 2 min
      this.backgroundSync.startSync('/api/gym/config', 10 * 60 * 1000);  // 10 min
      this.backgroundSync.startSync('/api/store/featured-products', 3 * 60 * 1000); // 3 min
    }, 5000); // Esperar 5s después de inicializar
  }

  // 📊 MÉTODOS DE MONITOREO AVANZADOS
  getAdvancedStats() {
    const circuitBreakerStatus = this.circuitBreaker.getStatus();
    const batcherStats = this.batcher.getStats();
    const schedulerStats = this.scheduler.getStats();
    
    const cacheHitRate = this.requestStats.total > 0 
      ? ((this.requestStats.cacheHits / this.requestStats.total) * 100).toFixed(1)
      : 0;
    
    const successRate = this.requestStats.total > 0
      ? ((this.requestStats.success / this.requestStats.total) * 100).toFixed(1)
      : 0;

    return {
      // Stats generales
      requests: {
        ...this.requestStats,
        successRate: `${successRate}%`,
        cacheHitRate: `${cacheHitRate}%`
      },
      
      // Circuit breaker
      circuitBreaker: circuitBreakerStatus,
      
      // Batching
      batching: batcherStats,
      
      // Scheduling
      scheduling: schedulerStats,
      
      // Cache
      cache: {
        size: this.cache.size,
        ...this.cacheStats,
        hitRate: this.cacheStats.hits + this.cacheStats.misses > 0
          ? `${((this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100).toFixed(1)}%`
          : '0%'
      },
      
      // Rate limiting
      rateLimiting: {
        currentLimit: this.rateLimiter.currentLimit,
        currentUsage: this.rateLimiter.requests.length,
        usagePercentage: `${((this.rateLimiter.requests.length / this.rateLimiter.currentLimit) * 100).toFixed(1)}%`
      },
      
      // Background sync
      backgroundSync: {
        activeEndpoints: this.backgroundSync.syncIntervals.size,
        isActive: this.backgroundSync.isActive
      }
    };
  }

  // 📊 Log estadísticas detalladas
  logAdvancedStats() {
    const stats = this.getAdvancedStats();
    
    console.group('📊 ENHANCED REQUEST MANAGER - Advanced Stats');
    console.log('🎯 Requests:', stats.requests);
    console.log('🚦 Circuit Breaker:', stats.circuitBreaker);
    console.log('📦 Batching:', stats.batching);
    console.log('⏰ Scheduling:', stats.scheduling);
    console.log('💾 Cache:', stats.cache);
    console.log('🚦 Rate Limiting:', stats.rateLimiting);
    console.log('🔄 Background Sync:', stats.backgroundSync);
    console.groupEnd();
  }

  // 🛠️ MÉTODOS DE CONTROL
  pauseBackgroundSync() {
    this.backgroundSync.pauseAll();
  }

  resumeBackgroundSync() {
    this.backgroundSync.resumeAll();
  }

  resetCircuitBreaker() {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failures = 0;
    console.log('🔄 Circuit breaker reset to CLOSED');
  }

  clearAllCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cleared ${size} cache entries`);
  }

  // 🗑️ Cleanup al destruir
  destroy() {
    this.backgroundSync.destroy();
    this.clearAllCache();
    this.removeAllListeners();
    console.log('🗑️ Enhanced Request Manager destroyed');
  }
}

// 🏭 EXPORTAR INSTANCIA SINGLETON MEJORADA
export const requestManager = new EnhancedRequestManager();

// 🔧 Auto-monitoring en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Log estadísticas cada 60 segundos
  setInterval(() => {
    if (requestManager.requestStats.total > 0) {
      requestManager.logAdvancedStats();
    }
  }, 60000);
  
  // Cleanup automático cada 5 minutos
  setInterval(() => {
    requestManager.cleanupExpiredCache();
  }, 5 * 60 * 1000);
  
  // Exponer en window para debug
  if (typeof window !== 'undefined') {
    window.requestManager = requestManager;
  }
}

export default requestManager;