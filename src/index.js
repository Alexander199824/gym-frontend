// src/index.js
// UBICACIÓN: /gym-frontend/src/index.js
// FUNCIÓN: Punto de entrada principal MEJORADO con orden correcto de providers
// MANTIENE: Toda la estructura existente + Query Client + CartProvider en orden correcto

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // ✅ MANTENIDO
import { Toaster } from 'react-hot-toast';

// 🎨 Importar estilos globales - ✅ MANTENIDO
import './styles/index.css';

// 🏠 Componente principal de la aplicación
import App from './App';

// 📊 Importar contextos globales - ✅ RUTAS MANTENIDAS
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
// NOTA: CartProvider ahora está dentro de App.js para acceso a Auth y App contexts

// ⚙️ CONFIGURACIÓN DE REACT QUERY - ✅ MANTENIDA IGUAL
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('❌ Error en query:', error);
        
        if (error.response?.status === 401) {
          localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
          window.location.href = '/login';
        }
      }
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('❌ Error en mutación:', error);
      }
    }
  }
});

// 🔧 CONFIGURACIÓN DE DESARROLLO - ✅ MANTENIDA IGUAL
if (process.env.REACT_APP_DEBUG_MODE === 'true') {
  console.log('🏋️‍♂️ Gym Management System - Frontend Iniciado');
  console.log('🔗 Backend URL:', process.env.REACT_APP_API_URL);
  console.log('🌍 Entorno:', process.env.REACT_APP_ENVIRONMENT);
  console.log('📱 Versión:', process.env.REACT_APP_VERSION);
}

// ✅ NUEVO: Verificar variables de entorno críticas
console.log('🚀 ELITE FITNESS CLUB - INICIANDO APLICACIÓN REACT...');
console.log('📦 Versión de React:', React.version);
console.log('🌐 Modo:', process.env.NODE_ENV);

const requiredEnvVars = [
  'REACT_APP_API_URL',
  'REACT_APP_GYM_NAME'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ VARIABLES DE ENTORNO FALTANTES:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('');
  console.error('🛠️ SOLUCIÓN: Verifica tu archivo .env');
} else {
  console.log('✅ Variables de entorno verificadas correctamente');
}

// 🚀 RENDERIZADO DE LA APLICACIÓN - ✅ ORDEN CORREGIDO MANTENIENDO ESTRUCTURA
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* 🔐 AUTHPROVIDER - Nivel más alto para autenticación */}
        <AuthProvider>
          {/* 📱 APPPROVIDER - Configuración global de la app */}
          <AppProvider>
            {/* 🚀 APP PRINCIPAL - Incluye CartProvider internamente en orden correcto */}
            <App />
            
            {/* 🔔 TOASTER - Notificaciones globales - ✅ ESTILOS MANTENIDOS */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  borderRadius: '0.75rem',
                  padding: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                }
              }}
            />
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// 🔍 DEBUG INFO EN DESARROLLO - ✅ MEJORADO
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 =====================================');
  console.log('🏋️ ELITE FITNESS CLUB - PROVEEDORES');
  console.log('🔍 =====================================');
  console.log('');
  console.log('📊 JERARQUÍA DE PROVEEDORES:');
  console.log('   1. 🌐 BrowserRouter (React Router)');
  console.log('   2. 🔍 QueryClientProvider (React Query)');
  console.log('   3. 🔐 AuthProvider (Autenticación)');
  console.log('   4. 📱 AppProvider (Estado global)');
  console.log('   5. 🛍️ CartProvider (Carrito - dentro de App)');
  console.log('   6. 🚀 App (Componente principal)');
  console.log('   7. 🔔 Toaster (Notificaciones)');
  console.log('');
  console.log('🎯 FUNCIONALIDADES DISPONIBLES:');
  console.log('   ✅ Autenticación completa');
  console.log('   ✅ Gestión de estado global');
  console.log('   ✅ Carrito de compras persistente');
  console.log('   ✅ React Query para cache');
  console.log('   ✅ Notificaciones toast');
  console.log('   ✅ Debug en desarrollo');
  console.log('   ✅ Google OAuth integrado');
  console.log('   ✅ Cache de backend');
  console.log('   ✅ Rutas protegidas');
  console.log('   ✅ Roles y permisos');
  console.log('');
  console.log('🔗 ENDPOINTS PRINCIPALES:');
  console.log(`   🏠 Landing: ${window.location.origin}/`);
  console.log(`   🛍️ Tienda: ${window.location.origin}/store`);
  console.log(`   🔐 Login: ${window.location.origin}/login`);
  console.log(`   📝 Registro: ${window.location.origin}/register`);
  console.log(`   🏋️ Dashboard: ${window.location.origin}/dashboard`);
  console.log('');
  console.log('🌐 BACKEND:');
  console.log(`   📡 URL: ${process.env.REACT_APP_API_URL || 'NO CONFIGURADA'}`);
  console.log(`   🔍 Health: ${process.env.REACT_APP_API_URL || 'N/A'}/api/health`);
  console.log('');
  console.log('🔍 =====================================');
  console.log('🏋️ ELITE FITNESS CLUB - LISTO');
  console.log('🔍 =====================================');
}

// 🔍 REPORTES DE RENDIMIENTO - ✅ MANTENIDOS IGUAL
if (process.env.REACT_APP_ENVIRONMENT === 'development') {
  const reportWebVitals = (onPerfEntry) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
      });
    }
  };
  
  reportWebVitals(console.log);
}

// ✅ NUEVO: Performance monitoring en desarrollo
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_MODE === 'true') {
  // Monitoreo de performance
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        console.log('📊 PERFORMANCE - Navigation Timing:');
        console.log(`   🚀 DOM Content Loaded: ${entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart}ms`);
        console.log(`   ✅ Page Load Complete: ${entry.loadEventEnd - entry.loadEventStart}ms`);
        console.log(`   📡 Total Load Time: ${entry.loadEventEnd - entry.fetchStart}ms`);
      }
    });
  });
  
  observer.observe({ entryTypes: ['navigation'] });
  
  // Cleanup del observer
  setTimeout(() => {
    observer.disconnect();
  }, 10000);
}

// ✅ NUEVO: Error handling global
window.addEventListener('error', (event) => {
  console.error('🚨 ERROR GLOBAL CAPTURADO:');
  console.error('📍 Archivo:', event.filename);
  console.error('📍 Línea:', event.lineno);
  console.error('📍 Columna:', event.colno);
  console.error('📍 Mensaje:', event.message);
  console.error('📍 Error:', event.error);
  
  // Solo en desarrollo mostrar toast de error
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      if (window.toast && window.toast.error) {
        window.toast.error('Error inesperado en la aplicación');
      }
    }, 100);
  }
});

// ✅ NUEVO: Promise rejection handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 PROMISE REJECTION NO MANEJADA:');
  console.error('📍 Razón:', event.reason);
  console.error('📍 Promise:', event.promise);
  
  // Solo en desarrollo mostrar toast de error
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      if (window.toast && window.toast.error) {
        window.toast.error('Error de conexión o promesa no resuelta');
      }
    }, 100);
  }
});

// ✅ NUEVO: Reportar errores de React
if (process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Detectar errores de React
    if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
      console.log('⚛️ REACT ERROR DETECTADO:', args);
    }
    originalConsoleError.apply(console, args);
  };
}

// 📝 CAMBIOS REALIZADOS EN ESTA VERSIÓN:
// 
// ✅ ESTRUCTURA MANTENIDA:
// - QueryClient y QueryClientProvider preservados
// - Toaster con estilos originales mantenido
// - Debug info y configuración original intacta
// - Reportes de rendimiento mantenidos
// 
// ✅ ORDEN CORREGIDO:
// - CartProvider movido a App.js para acceso a contexts
// - AuthProvider > AppProvider > App (con CartProvider interno)
// - QueryClient mantenido en nivel alto
// 
// ✅ FUNCIONALIDADES AGREGADAS:
// - Verificación de variables de entorno mejorada
// - Error handling global agregado
// - Performance monitoring mejorado
// - Debug info actualizado con carrito
// 
// ✅ COMPATIBILIDAD 100%:
// - No se rompió ninguna funcionalidad existente
// - Mantiene la misma estructura de providers principales
// - Preserva configuración de React Query
// - Mantiene estilos de Toaster originales