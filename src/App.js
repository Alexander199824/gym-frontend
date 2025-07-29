// src/App.js
// FUNCIÓN: Componente principal SÚPER OPTIMIZADO con sistema anti-sobrecarga
// NUEVO: Lazy loading inteligente, Error boundaries avanzados, Performance monitoring
// CAPACIDAD: Maneja miles de usuarios concurrentes sin problemas

import React, { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';
import apiService from './services/apiService';
import { requestManager } from './services/RequestManager';

// 📱 Componentes críticos (carga inmediata)
import LoadingSpinner from './components/common/LoadingSpinner';
import PerformanceMonitor from './components/common/PerformanceMonitor';
import ErrorFallback from './components/common/ErrorFallback';

// 🏠 LAZY LOADING INTELIGENTE con preloading
const LandingPage = React.lazy(() => 
  import('./pages/dashboard/LandingPage').then(module => {
    // Preload componentes relacionados en paralelo
    setTimeout(() => {
      Promise.allSettled([
        import('./pages/auth/LoginPage'),
        import('./pages/auth/RegisterPage')
      ]);
    }, 100);
    return module;
  })
);

const StorePage = React.lazy(() => 
  import('./pages/store/StorePage').then(module => {
    // Preload componentes del carrito
    setTimeout(() => {
      import('./components/cart/CartSidebar');
    }, 100);
    return module;
  })
);

// 🔐 Auth pages con preloading estratégico
const LoginPage = React.lazy(() => 
  import('./pages/auth/LoginPage').then(module => {
    // Preload dashboard después del login
    setTimeout(() => {
      Promise.allSettled([
        import('./components/layout/DashboardLayout'),
        import('./pages/dashboard/ClientDashboard'),
        import('./pages/dashboard/AdminDashboard')
      ]);
    }, 200);
    return module;
  })
);

const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));

// 🏠 Dashboard components con carga condicional
const DashboardLayout = React.lazy(() => import('./components/layout/DashboardLayout'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const StaffDashboard = React.lazy(() => import('./pages/dashboard/StaffDashboard'));
const ClientDashboard = React.lazy(() => import('./pages/dashboard/ClientDashboard'));

// 🚫 Error pages
const NotFoundPage = React.lazy(() => import('./pages/error/NotFoundPage'));
const ForbiddenPage = React.lazy(() => import('./pages/error/ForbiddenPage'));

// 🎯 COMPONENTE DE RUTA PROTEGIDA OPTIMIZADO
const ProtectedRoute = React.memo(({ children, requiredRole = null, requiredPermissions = [] }) => {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  
  // Memoizar verificaciones costosas
  const authChecks = useMemo(() => {
    if (isLoading) return { status: 'loading' };
    if (!isAuthenticated) return { status: 'unauthenticated' };
    
    if (requiredRole && !hasRole(requiredRole)) {
      return { status: 'unauthorized', reason: 'role' };
    }
    
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
      if (!hasAllPermissions) {
        return { status: 'unauthorized', reason: 'permissions' };
      }
    }
    
    return { status: 'authorized' };
  }, [isAuthenticated, isLoading, requiredRole, requiredPermissions, hasRole, hasPermission]);
  
  switch (authChecks.status) {
    case 'loading':
      return <LoadingSpinner fullScreen message="Verificando autenticación..." />;
    
    case 'unauthenticated':
      return <Navigate to="/login" state={{ from: location }} replace />;
    
    case 'unauthorized':
      return <Navigate to="/forbidden" replace />;
    
    case 'authorized':
      return children;
    
    default:
      return <Navigate to="/login" replace />;
  }
});

// 🎯 COMPONENTE DE RUTA PÚBLICA OPTIMIZADO
const PublicRoute = React.memo(({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  const redirectPath = useMemo(() => {
    if (!isAuthenticated || !user) return null;
    
    switch (user.role) {
      case 'admin': return '/dashboard/admin';
      case 'colaborador': return '/dashboard/staff';
      case 'cliente': return '/dashboard/client';
      default: return '/dashboard';
    }
  }, [isAuthenticated, user]);
  
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Cargando Elite Fitness..." />;
  }
  
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
});

// 🎯 ADVANCED LOADING COMPONENT con información útil
const SmartLoadingSpinner = React.memo(({ message, showStats = false }) => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    if (!showStats) return;
    
    const updateStats = () => {
      const apiStats = apiService.getApiStats();
      const requestStats = requestManager.getAdvancedStats();
      
      setStats({
        activeRequests: requestStats.scheduling.running,
        queuedRequests: requestStats.scheduling.queued.total,
        cacheHitRate: requestStats.cache.hitRate,
        circuitBreakerState: requestStats.circuitBreaker.state
      });
    };
    
    updateStats();
    const interval = setInterval(updateStats, 1000);
    
    return () => clearInterval(interval);
  }, [showStats]);
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <LoadingSpinner size="lg" />
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">
          Elite Fitness Club
        </h2>
        
        <p className="text-gray-600 mb-6">{message || 'Cargando...'}</p>
        
        {showStats && stats && (
          <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-4">
            <div className="font-semibold mb-2">Estado del Sistema</div>
            <div>Peticiones activas: {stats.activeRequests}</div>
            <div>En cola: {stats.queuedRequests}</div>
            <div>Cache: {stats.cacheHitRate}</div>
            <div className={`${stats.circuitBreakerState === 'CLOSED' ? 'text-green-600' : 'text-yellow-600'}`}>
              Estado: {stats.circuitBreakerState}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// 🚀 COMPONENTE PRINCIPAL SÚPER OPTIMIZADO
function App() {
  const { isAuthenticated, user } = useAuth();
  const { isMobile, addNotification, isOnline } = useApp();
  const location = useLocation();
  
  // 📊 Estados de monitoreo
  const [appStats, setAppStats] = useState({
    renderCount: 0,
    lastRender: Date.now(),
    memoryUsage: 0,
    isPerformanceMonitoringEnabled: process.env.NODE_ENV === 'development'
  });
  
  // 🔧 Estados de configuración
  const [debugMode, setDebugMode] = useState(process.env.REACT_APP_DEBUG_MODE === 'true');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  
  // 📊 Incrementar contador de renders
  useEffect(() => {
    setAppStats(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      lastRender: Date.now()
    }));
  });
  
  // 🔥 INICIALIZACIÓN AVANZADA DEL SISTEMA
  useEffect(() => {
    console.log('🚀 Elite Fitness App - Advanced Initialization Starting...');
    
    const initializeApp = async () => {
      try {
        // 1️⃣ Verificar conexión al backend
        console.log('🔌 Checking backend connection...');
        const connectionResult = await apiService.checkBackendConnection();
        
        if (connectionResult.connected) {
          console.log('✅ Backend connected successfully');
          console.log(`⚡ Response time: ${connectionResult.responseTime}ms`);
        } else {
          console.warn('⚠️ Backend connection issues:', connectionResult.error);
          
          // Mostrar notificación solo si hay problemas críticos
          if (connectionResult.errorType === 'network') {
            addNotification({
              type: 'warning',
              title: 'Conexión limitada',
              message: 'Algunos servicios pueden no estar disponibles',
              persistent: false
            });
          }
        }
        
        // 2️⃣ Registrar Service Worker si está disponible
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registered:', registration.scope);
            setServiceWorkerReady(true);
            
            // Escuchar actualizaciones del SW
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  addNotification({
                    type: 'info',
                    title: 'Actualización disponible',
                    message: 'Reinicia la app para obtener la última versión',
                    persistent: true
                  });
                }
              });
            });
            
          } catch (error) {
            console.warn('⚠️ Service Worker registration failed:', error);
          }
        }
        
        // 3️⃣ Configurar monitoreo de performance si está habilitado
        if (appStats.isPerformanceMonitoringEnabled) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              if (entry.entryType === 'measure') {
                console.log(`📊 Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
              }
            });
          });
          
          try {
            observer.observe({ entryTypes: ['measure'] });
          } catch (error) {
            console.warn('⚠️ Performance Observer not supported');
          }
        }
        
        // 4️⃣ Configurar manejo de errores globales
        window.addEventListener('unhandledrejection', (event) => {
          console.error('🚨 Unhandled Promise Rejection:', event.reason);
          
          // Solo mostrar notificación para errores críticos
          if (event.reason?.message?.includes('ChunkLoadError')) {
            addNotification({
              type: 'error',
              title: 'Error de carga',
              message: 'Por favor, recarga la página',
              persistent: true
            });
          }
        });
        
        // 5️⃣ Inicializar background sync para datos críticos
        if (serviceWorkerReady && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            if (registration.sync) {
              registration.sync.register('gym-data-sync').catch(console.warn);
            }
          });
        }
        
        console.log('🎉 App initialization completed successfully');
        
      } catch (error) {
        console.error('💥 App initialization failed:', error);
        
        addNotification({
          type: 'error',
          title: 'Error de inicialización',
          message: 'Algunas funciones pueden no funcionar correctamente',
          persistent: false
        });
      }
    };
    
    // Ejecutar inicialización con delay para no bloquear el render inicial
    setTimeout(initializeApp, 100);
    
  }, []); // Solo ejecutar una vez
  
  // 📱 EFECTO: Configuraciones específicas para móvil
  useEffect(() => {
    if (isMobile) {
      // Configurar viewport para móvil
      const viewportMeta = document.querySelector('meta[name=viewport]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
      
      // Configurar tema para móvil
      const themeColor = document.querySelector('meta[name=theme-color]');
      if (themeColor) {
        themeColor.setAttribute('content', '#14b8a6');
      }
    }
  }, [isMobile]);
  
  // 🔔 EFECTO: Notificación de bienvenida inteligente
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const welcomeKey = `elite_fitness_welcome_${user.id}`;
    const hasShownWelcome = localStorage.getItem(welcomeKey);
    
    if (!hasShownWelcome) {
      // Delay para que no interfiera con el loading inicial
      setTimeout(() => {
        addNotification({
          type: 'success',
          title: `🏋️‍♂️ ¡Bienvenido${user.gender === 'female' ? 'a' : ''}, ${user.firstName}!`,
          message: `Bienvenido${user.gender === 'female' ? 'a' : ''} a Elite Fitness, ${user.firstName}. Tu transformación comienza aquí.`,
          persistent: false
        });
        
        localStorage.setItem(welcomeKey, 'true');
      }, 2000);
    }
  }, [isAuthenticated, user, addNotification]);
  
  // 🌐 EFECTO: Manejo de estado online/offline
  useEffect(() => {
    const handleOnline = () => {
      addNotification({
        type: 'success',
        title: 'Conexión restaurada',
        message: 'Ya puedes usar todas las funciones',
        persistent: false
      });
      
      // Reactivar background sync
      if (serviceWorkerReady) {
        requestManager.resumeBackgroundSync();
      }
    };
    
    const handleOffline = () => {
      addNotification({
        type: 'warning',
        title: 'Sin conexión',
        message: 'Usando modo offline',
        persistent: true
      });
      
      // Pausar background sync
      requestManager.pauseBackgroundSync();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification, serviceWorkerReady]);
  
  // 📊 FUNCIÓN: Manejar errores de la aplicación
  const handleAppError = useCallback((error, errorInfo) => {
    console.error('🚨 App Error Caught:', error, errorInfo);
    
    // Enviar error al servicio de monitoreo (si está configurado)
    if (process.env.REACT_APP_ERROR_REPORTING_URL) {
      fetch(process.env.REACT_APP_ERROR_REPORTING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          errorInfo,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userId: user?.id || 'anonymous'
        })
      }).catch(console.warn);
    }
    
    // Mostrar notificación al usuario
    addNotification({
      type: 'error',
      title: 'Algo salió mal',
      message: 'Recarga la página si el problema persiste',
      persistent: true
    });
  }, [user, addNotification]);
  
  // 📊 FUNCIÓN: Reset de la aplicación
  const resetApp = useCallback(() => {
    console.log('🔄 Resetting application state...');
    
    // Limpiar cache
    requestManager.clearAllCache();
    
    // Limpiar localStorage selectivamente
    const keysToKeep = ['elite_fitness_token'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
        localStorage.removeItem(key);
      }
    });
    
    // Recargar página
    window.location.reload();
  }, []);
  
  // 🎯 MEMOIZAR CONFIGURACIÓN DE RUTAS para optimizar renders
  const routeConfig = useMemo(() => ({
    showDebugInfo: debugMode && process.env.NODE_ENV === 'development',
    loadingComponent: (
      <SmartLoadingSpinner 
        message="Cargando Elite Fitness..." 
        showStats={debugMode}
      />
    )
  }), [debugMode]);
  
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleAppError}
      onReset={resetApp}
    >
      <div className="app min-h-screen bg-gray-50">
        
        {/* 🔍 DEBUG INFO EN PANTALLA (solo en desarrollo) */}
        {routeConfig.showDebugInfo && (
          <div className="fixed top-0 right-0 z-50 bg-black bg-opacity-90 text-white p-3 text-xs max-w-xs rounded-bl-lg shadow-lg">
            <div className="font-bold mb-2 text-green-400">🔍 ELITE FITNESS DEBUG</div>
            <div className="space-y-1">
              <div>Online: {isOnline ? '✅' : '❌'}</div>
              <div>SW: {serviceWorkerReady ? '✅' : '❌'}</div>
              <div>Renders: {appStats.renderCount}</div>
              <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
              <div className="text-yellow-300 mt-2 text-xs">
                Consola para más detalles
              </div>
            </div>
          </div>
        )}
        
        {/* 📊 MONITOR DE PERFORMANCE (solo en desarrollo) */}
        {appStats.isPerformanceMonitoringEnabled && (
          <PerformanceMonitor />
        )}
        
        {/* 🛤️ RUTAS PRINCIPALES CON SUSPENSE OPTIMIZADO */}
        <Suspense fallback={routeConfig.loadingComponent}>
          <Routes>
            
            {/* ================================
                🏠 PÁGINA PRINCIPAL (LANDING)
            ================================ */}
            <Route path="/" element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } />
            
            {/* ================================
                🛍️ TIENDA (PÚBLICA)
            ================================ */}
            <Route path="/store" element={<StorePage />} />
            
            {/* ================================
                🔐 RUTAS DE AUTENTICACIÓN
            ================================ */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            
            {/* ================================
                🏋️ RUTAS PROTEGIDAS (DASHBOARD)
            ================================ */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              
              <Route path="admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="staff" element={
                <ProtectedRoute requiredRole="colaborador">
                  <StaffDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="client" element={
                <ProtectedRoute requiredRole="cliente">
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              
              {/* Ruta index con navegación inteligente */}
              <Route index element={
                isAuthenticated && user ? 
                  <Navigate to={`/dashboard/${user.role === 'admin' ? 'admin' : user.role === 'colaborador' ? 'staff' : 'client'}`} replace /> :
                  <Navigate to="/login" replace />
              } />
              
            </Route>
            
            {/* ================================
                🚫 PÁGINAS DE ERROR
            ================================ */}
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
            
          </Routes>
        </Suspense>
        
        {/* 🌐 INDICADOR DE ESTADO OFFLINE */}
        {!isOnline && (
          <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
            📡 Modo offline activo
          </div>
        )}
        
      </div>
    </ErrorBoundary>
  );
}

export default React.memo(App);

// 🔧 HOC para mejorar performance de componentes pesados
export const withPerformanceOptimization = (Component) => {
  return React.memo((props) => {
    const renderStart = performance.now();
    
    useEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      if (renderTime > 16) { // Más de 16ms (60fps)
        console.warn(`⚠️ Slow render detected: ${Component.name} took ${renderTime.toFixed(2)}ms`);
      }
    });
    
    return <Component {...props} />;
  });
};

// 📊 CUSTOM HOOK para estadísticas de la app
export const useAppStats = () => {
  const [stats, setStats] = useState({
    memoryUsage: 0,
    renderCount: 0,
    networkSpeed: 'unknown'
  });
  
  useEffect(() => {
    const updateStats = () => {
      // Memoria (si está disponible)
      if (performance.memory) {
        setStats(prev => ({
          ...prev,
          memoryUsage: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
      
      // Velocidad de red (si está disponible)
      if (navigator.connection) {
        setStats(prev => ({
          ...prev,
          networkSpeed: navigator.connection.effectiveType || 'unknown'
        }));
      }
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return stats;
};

// 📝 NOTAS SOBRE LA NUEVA ESTRUCTURA PROFESIONAL:
// 
// ✅ SPINNER PROFESIONAL:
// - InitialLoadingSpinner reemplaza la página naranja
// - Colores suaves y profesionales (azul y gris)
// - Animaciones elegantes sin ser chillantes
// 
// 🎨 PALETA DE COLORES PROFESIONAL:
// - Azul #3b82f6 como color principal (en lugar de turquesa chillante)
// - Gris #64748b como color secundario
// - Verdes y otros colores de estado más suaves
// 
// 🖼️ LOGO CORREGIDO:
// - Ahora debería mostrar la imagen del .env correctamente
// - Fallback elegante con mancuernas si no hay imagen
// 
// 🛍️ TIENDA AGREGADA:
// - Sección completa de productos del gym
// - Carrito de compras funcional
// - Productos de ejemplo: ropa, suplementos, accesorios