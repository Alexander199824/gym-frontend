// public/sw.js
// FUNCIÓN: SERVICE WORKER AVANZADO - Cache persistente + Background Sync
// CAPACIDAD: Funciona offline, cache inteligente, sync en background
// OPTIMIZADO: Para miles de usuarios concurrentes

const CACHE_VERSION = 'elite-fitness-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 📁 Archivos estáticos a cachear
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/assets/images/logo.png',
  '/assets/images/hero.jpg'
];

// 🎯 Configuración de cache por tipo de recurso
const CACHE_STRATEGIES = {
  // Archivos estáticos - Cache First
  static: {
    strategy: 'CacheFirst',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    maxEntries: 50
  },
  
  // API calls - Network First con fallback
  api: {
    strategy: 'NetworkFirst',
    maxAge: 10 * 60 * 1000, // 10 minutos
    maxEntries: 100,
    networkTimeout: 5000 // 5s timeout
  },
  
  // Imágenes y assets - Stale While Revalidate
  images: {
    strategy: 'StaleWhileRevalidate',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    maxEntries: 200
  },
  
  // Datos críticos - Network First con cache largo
  critical: {
    strategy: 'NetworkFirst',
    maxAge: 60 * 60 * 1000, // 1 hora
    maxEntries: 20,
    networkTimeout: 3000
  }
};

// 📊 Estadísticas del Service Worker
let swStats = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  backgroundSyncs: 0,
  errors: 0,
  startTime: Date.now()
};

// 🚀 EVENTO: Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets...');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'no-cache' })));
      })
      .then(() => {
        console.log('✅ Service Worker: Static assets cached');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
        swStats.errors++;
      })
  );
});

// 🔄 EVENTO: Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker: Activating...');
  
  event.waitUntil(
    // Limpiar caches antiguos
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('elite-fitness-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE && 
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log(`🗑️ Service Worker: Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated successfully');
        return self.clients.claim(); // Tomar control de todas las páginas
      })
      .catch((error) => {
        console.error('❌ Service Worker: Activation failed', error);
        swStats.errors++;
      })
  );
});

// 🌐 EVENTO: Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptar peticiones HTTP/HTTPS
  if (!request.url.startsWith('http')) return;
  
  // Determinar estrategia de cache
  const strategy = determineStrategy(request, url);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('❌ Service Worker: Request failed', error);
        swStats.errors++;
        return createErrorResponse(error);
      })
  );
});

// 🎯 Determinar estrategia de cache según el tipo de petición
function determineStrategy(request, url) {
  // API calls del gimnasio
  if (url.pathname.startsWith('/api/gym/') || url.pathname.startsWith('/api/store/')) {
    if (url.pathname.includes('/config') || url.pathname.includes('/auth')) {
      return 'critical';
    }
    return 'api';
  }
  
  // Archivos estáticos
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    return 'static';
  }
  
  // Imágenes y assets
  if (request.destination === 'image' || 
      url.pathname.includes('/assets/') || 
      url.pathname.includes('/images/')) {
    return 'images';
  }
  
  // Por defecto: estrategia de red con fallback
  return 'api';
}

// 🔧 Manejar petición según estrategia
async function handleRequest(request, strategyName) {
  const strategy = CACHE_STRATEGIES[strategyName];
  const cacheName = getCacheName(strategyName);
  
  switch (strategy.strategy) {
    case 'CacheFirst':
      return cacheFirst(request, cacheName, strategy);
    
    case 'NetworkFirst':
      return networkFirst(request, cacheName, strategy);
    
    case 'StaleWhileRevalidate':
      return staleWhileRevalidate(request, cacheName, strategy);
    
    default:
      return networkFirst(request, cacheName, strategy);
  }
}

// 📦 Cache First - Para recursos estáticos
async function cacheFirst(request, cacheName, strategy) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    swStats.cacheHits++;
    
    // Verificar si está expirado
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
    const age = Date.now() - cacheDate.getTime();
    
    if (age < strategy.maxAge) {
      console.log(`📦 Cache First HIT: ${request.url}`);
      return cachedResponse;
    }
  }
  
  // Si no está en cache o expiró, buscar en red
  swStats.cacheMisses++;
  swStats.networkRequests++;
  
  try {
    console.log(`🌐 Cache First MISS: ${request.url}`);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clonar respuesta para cachear
      const responseToCache = networkResponse.clone();
      
      // Agregar timestamp al header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', Date.now().toString());
      
      const cacheResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, cacheResponse);
      await cleanupCache(cache, strategy.maxEntries);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Si falla la red, usar cache aunque esté expirado
    if (cachedResponse) {
      console.log(`📦 Cache First FALLBACK: ${request.url}`);
      return cachedResponse;
    }
    throw error;
  }
}

// 🌐 Network First - Para APIs y datos dinámicos
async function networkFirst(request, cacheName, strategy) {
  const cache = await caches.open(cacheName);
  
  try {
    swStats.networkRequests++;
    
    // Crear timeout para la petición de red
    const networkPromise = fetch(request);
    const timeoutPromise = strategy.networkTimeout 
      ? Promise.race([
          networkPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), strategy.networkTimeout)
          )
        ])
      : networkPromise;
    
    console.log(`🌐 Network First TRY: ${request.url}`);
    const networkResponse = await timeoutPromise;
    
    if (networkResponse.ok) {
      // Clonar y cachear respuesta
      const responseToCache = networkResponse.clone();
      
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', Date.now().toString());
      
      const cacheResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, cacheResponse);
      await cleanupCache(cache, strategy.maxEntries);
    }
    
    return networkResponse;
    
  } catch (error) {
    // Si falla la red, buscar en cache
    swStats.cacheMisses++;
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log(`📦 Network First FALLBACK: ${request.url}`);
      swStats.cacheHits++;
      return cachedResponse;
    }
    
    console.log(`❌ Network First FAILED: ${request.url}`);
    throw error;
  }
}

// 🔄 Stale While Revalidate - Para imágenes y recursos no críticos
async function staleWhileRevalidate(request, cacheName, strategy) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Respuesta inmediata desde cache si existe
  const responsePromise = cachedResponse || fetch(request);
  
  // Actualizar cache en background si hay respuesta cacheada
  if (cachedResponse) {
    swStats.cacheHits++;
    console.log(`📦 Stale While Revalidate HIT: ${request.url}`);
    
    // Actualizar en background
    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          swStats.networkRequests++;
          
          const headers = new Headers(networkResponse.headers);
          headers.set('sw-cache-date', Date.now().toString());
          
          const cacheResponse = new Response(networkResponse.body, {
            status: networkResponse.status,
            statusText: networkResponse.statusText,
            headers: headers
          });
          
          await cache.put(request, cacheResponse);
          await cleanupCache(cache, strategy.maxEntries);
          console.log(`🔄 Background update: ${request.url}`);
        }
      })
      .catch(() => {
        // Fallar silenciosamente en background update
      });
  } else {
    swStats.cacheMisses++;
    swStats.networkRequests++;
    console.log(`🌐 Stale While Revalidate MISS: ${request.url}`);
  }
  
  return responsePromise;
}

// 🗑️ Limpiar cache cuando supera el límite máximo
async function cleanupCache(cache, maxEntries) {
  if (!maxEntries) return;
  
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Eliminar las entradas más antiguas
    const entriesToDelete = keys.length - maxEntries;
    const keysToDelete = keys.slice(0, entriesToDelete);
    
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
    
    console.log(`🗑️ Cache cleanup: Deleted ${entriesToDelete} old entries`);
  }
}

// 📁 Obtener nombre de cache según estrategia
function getCacheName(strategy) {
  switch (strategy) {
    case 'static': return STATIC_CACHE;
    case 'api':
    case 'critical': return API_CACHE;
    case 'images': return DYNAMIC_CACHE;
    default: return DYNAMIC_CACHE;
  }
}

// ❌ Crear respuesta de error
function createErrorResponse(error) {
  return new Response(
    JSON.stringify({
      error: 'Service Worker Error',
      message: error.message,
      offline: !navigator.onLine
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// 🔄 EVENTO: Background Sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  swStats.backgroundSyncs++;
  
  if (event.tag === 'gym-data-sync') {
    event.waitUntil(syncGymData());
  } else if (event.tag === 'user-actions-sync') {
    event.waitUntil(syncUserActions());
  }
});

// 🔄 Sincronizar datos del gimnasio en background
async function syncGymData() {
  try {
    console.log('🔄 Syncing gym data in background...');
    
    // URLs críticas para sincronizar
    const criticalUrls = [
      '/api/gym/config',
      '/api/gym/stats',
      '/api/gym/services',
      '/api/store/featured-products'
    ];
    
    const baseUrl = self.location.origin;
    const cache = await caches.open(API_CACHE);
    
    for (const url of criticalUrls) {
      try {
        const fullUrl = `${baseUrl}${url}`;
        const response = await fetch(fullUrl);
        
        if (response.ok) {
          const headers = new Headers(response.headers);
          headers.set('sw-cache-date', Date.now().toString());
          
          const cacheResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
          
          await cache.put(fullUrl, cacheResponse);
          console.log(`✅ Background sync success: ${url}`);
        }
      } catch (error) {
        console.warn(`⚠️ Background sync failed: ${url}`, error.message);
      }
    }
    
    console.log('✅ Gym data background sync completed');
    
  } catch (error) {
    console.error('❌ Background sync failed:', error);
    throw error;
  }
}

// 🔄 Sincronizar acciones del usuario
async function syncUserActions() {
  try {
    console.log('🔄 Syncing user actions in background...');
    
    // Obtener acciones pendientes del IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await processUserAction(action);
        await removePendingAction(action.id);
        console.log(`✅ User action synced: ${action.type}`);
      } catch (error) {
        console.warn(`⚠️ User action sync failed: ${action.type}`, error.message);
      }
    }
    
    console.log('✅ User actions background sync completed');
    
  } catch (error) {
    console.error('❌ User actions sync failed:', error);
    throw error;
  }
}

// 💾 Funciones de IndexedDB para acciones offline (simplificadas)
async function getPendingActions() {
  // Implementación simplificada - en producción usar IndexedDB
  return [];
}

async function processUserAction(action) {
  // Implementación simplificada - en producción procesar la acción
  return true;
}

async function removePendingAction(actionId) {
  // Implementación simplificada - en producción remover de IndexedDB
  return true;
}

// 📱 EVENTO: Mensaje desde la aplicación principal
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'GET_STATS':
      event.ports[0].postMessage(getServiceWorkerStats());
      break;
    
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    
    case 'FORCE_SYNC':
      self.registration.sync.register('gym-data-sync').then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    
    default:
      console.warn('Unknown message type:', type);
  }
});

// 📊 Obtener estadísticas del Service Worker
function getServiceWorkerStats() {
  const uptime = Date.now() - swStats.startTime;
  const hitRate = swStats.cacheHits + swStats.cacheMisses > 0 
    ? ((swStats.cacheHits / (swStats.cacheHits + swStats.cacheMisses)) * 100).toFixed(1)
    : 0;
  
  return {
    ...swStats,
    uptime,
    hitRate: `${hitRate}%`,
    version: CACHE_VERSION
  };
}

// 🗑️ Limpiar todos los caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('elite-fitness-'))
        .map(name => caches.delete(name))
    );
    
    console.log('🗑️ All caches cleared');
    
    // Reset stats
    swStats = {
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      backgroundSyncs: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
    return false;
  }
}

// 🔔 EVENTO: Push notification (para futuras funcionalidades)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const options = {
    body: event.data.text(),
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Elite Fitness', options)
  );
});

// 🔔 EVENTO: Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// 🚀 Auto-limpieza periódica (cada 6 horas)
setInterval(async () => {
  try {
    const cache = await caches.open(API_CACHE);
    await cleanupCache(cache, CACHE_STRATEGIES.api.maxEntries);
    
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    await cleanupCache(dynamicCache, CACHE_STRATEGIES.images.maxEntries);
    
    console.log('🧹 Periodic cache cleanup completed');
  } catch (error) {
    console.error('❌ Periodic cleanup failed:', error);
  }
}, 6 * 60 * 60 * 1000); // 6 horas

console.log(`🚀 Elite Fitness Service Worker ${CACHE_VERSION} loaded successfully`);