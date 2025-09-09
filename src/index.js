// Autor: Alexander Echeverria
// Archivo: src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Importar estilos globales
import './styles/index.css';

// Componente principal de la aplicación
import App from './App';

// Importar contextos globales
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
// Nota: CartProvider ahora está dentro de App.js para acceso a Auth y App contexts

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error en consulta:', error);
        
        if (error.response?.status === 401) {
          localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
          window.location.href = '/login';
        }
      }
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Error en mutación:', error);
      }
    }
  }
});

// Configuración de desarrollo
if (process.env.REACT_APP_DEBUG_MODE === 'true') {
  console.log('Sistema de Gestión de Gimnasio - Frontend Iniciado');
  console.log('URL del Backend:', process.env.REACT_APP_API_URL);
  console.log('Entorno:', process.env.REACT_APP_ENVIRONMENT);
  console.log('Versión:', process.env.REACT_APP_VERSION);
}

// Verificar variables de entorno críticas
console.log('ELITE FITNESS CLUB - INICIANDO APLICACIÓN REACT...');
console.log('Versión de React:', React.version);
console.log('Modo:', process.env.NODE_ENV);

const requiredEnvVars = [
  'REACT_APP_API_URL',
  'REACT_APP_GYM_NAME'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('VARIABLES DE ENTORNO FALTANTES:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('');
  console.error('SOLUCIÓN: Verifica tu archivo .env');
} else {
  console.log('Variables de entorno verificadas correctamente');
}

// Renderizado de la aplicación con orden correcto manteniendo estructura
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* AuthProvider - nivel más alto para autenticación */}
        <AuthProvider>
          {/* AppProvider - configuración global de la app */}
          <AppProvider>
            {/* App principal - incluye CartProvider internamente en orden correcto */}
            <App />
            
            {/* Toaster - notificaciones globales con estilos mantenidos */}
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

// Debug info en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('=====================================');
  console.log('ELITE FITNESS CLUB - PROVEEDORES');
  console.log('=====================================');
  console.log('');
  console.log('JERARQUÍA DE PROVEEDORES:');
  console.log('   1. BrowserRouter (React Router)');
  console.log('   2. QueryClientProvider (React Query)');
  console.log('   3. AuthProvider (Autenticación)');
  console.log('   4. AppProvider (Estado global)');
  console.log('   5. CartProvider (Carrito - dentro de App)');
  console.log('   6. App (Componente principal)');
  console.log('   7. Toaster (Notificaciones)');
  console.log('');
  console.log('FUNCIONALIDADES DISPONIBLES:');
  console.log('   Autenticación completa');
  console.log('   Gestión de estado global');
  console.log('   Carrito de compras persistente');
  console.log('   React Query para cache');
  console.log('   Notificaciones toast');
  console.log('   Debug en desarrollo');
  console.log('   Google OAuth integrado');
  console.log('   Cache de backend');
  console.log('   Rutas protegidas');
  console.log('   Roles y permisos');
  console.log('   Precios en Quetzales guatemaltecos');
  console.log('');
  console.log('ENDPOINTS PRINCIPALES:');
  console.log(`   Inicio: ${window.location.origin}/`);
  console.log(`   Tienda: ${window.location.origin}/store`);
  console.log(`   Iniciar Sesión: ${window.location.origin}/login`);
  console.log(`   Registro: ${window.location.origin}/register`);
  console.log(`   Panel: ${window.location.origin}/dashboard`);
  console.log('');
  console.log('BACKEND:');
  console.log(`   URL: ${process.env.REACT_APP_API_URL || 'NO CONFIGURADA'}`);
  console.log(`   Estado: ${process.env.REACT_APP_API_URL || 'N/A'}/api/health`);
  console.log('');
  console.log('=====================================');
  console.log('ELITE FITNESS CLUB - LISTO');
  console.log('=====================================');
}

// Reportes de rendimiento
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

// Performance monitoring en desarrollo
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_MODE === 'true') {
  // Monitoreo de performance
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        console.log('RENDIMIENTO - Tiempos de Navegación:');
        console.log(`   DOM Cargado: ${entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart}ms`);
        console.log(`   Página Completa: ${entry.loadEventEnd - entry.loadEventStart}ms`);
        console.log(`   Tiempo Total: ${entry.loadEventEnd - entry.fetchStart}ms`);
      }
    });
  });
  
  observer.observe({ entryTypes: ['navigation'] });
  
  // Cleanup del observer
  setTimeout(() => {
    observer.disconnect();
  }, 10000);
}

// Error handling global
window.addEventListener('error', (event) => {
  console.error('ERROR GLOBAL CAPTURADO:');
  console.error('Archivo:', event.filename);
  console.error('Línea:', event.lineno);
  console.error('Columna:', event.colno);
  console.error('Mensaje:', event.message);
  console.error('Error:', event.error);
  
  // Solo en desarrollo mostrar toast de error
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      if (window.toast && window.toast.error) {
        window.toast.error('Error inesperado en la aplicación');
      }
    }, 100);
  }
});

// Promise rejection handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('PROMISE REJECTION NO MANEJADA:');
  console.error('Razón:', event.reason);
  console.error('Promise:', event.promise);
  
  // Solo en desarrollo mostrar toast de error
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      if (window.toast && window.toast.error) {
        window.toast.error('Error de conexión o promesa no resuelta');
      }
    }, 100);
  }
});

// Reportar errores de React
if (process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Detectar errores de React
    if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
      console.log('REACT ERROR DETECTADO:', args);
    }
    originalConsoleError.apply(console, args);
  };
}

/*
EXPLICACIÓN DEL ARCHIVO:

Este archivo es el punto de entrada principal de la aplicación Elite Fitness Club,
donde se configura y renderiza toda la jerarquía de componentes y proveedores de contexto.
Es el archivo más importante que inicializa el sistema completo.

FUNCIONALIDADES PRINCIPALES:
- Configuración del cliente de React Query para manejo de cache y sincronización con el backend
- Establecimiento de la jerarquía de proveedores de contexto en el orden correcto
- Configuración del sistema de notificaciones toast con estilos personalizados
- Inicialización del sistema de ruteo con React Router
- Monitoreo de rendimiento y manejo de errores a nivel global
- Verificación automática de variables de entorno críticas
- Sistema de debug completo para desarrollo y troubleshooting
- Configuración de manejo de errores global para capturar problemas no controlados

CONEXIONES CON OTROS ARCHIVOS:
- App.js: Componente principal que contiene toda la lógica de rutas y navegación
- AuthContext: Proveedor de autenticación que maneja login, logout y estados de usuario
- AppContext: Proveedor de estado global para configuraciones y funciones utilitarias
- CartContext: Proveedor del carrito de compras (incluido dentro de App.js)
- styles/index.css: Estilos globales de la aplicación incluyendo Tailwind CSS
- Componentes de páginas: LandingPage, StorePage, Dashboard, etc. (a través de App.js)

CARACTERÍSTICAS ESPECIALES:
- Jerarquía de contextos optimizada para acceso correcto a datos entre componentes
- Sistema de cache inteligente con React Query que reduce llamadas innecesarias al backend
- Manejo automático de tokens de autenticación y redirección en caso de expiración
- Notificaciones toast configuradas con tema oscuro y estilos guatemaltecos
- Monitoreo de métricas web vitales para optimización de rendimiento
- Sistema de error boundary a nivel global para capturar errores no manejados
- Debug automático que muestra la estructura completa de la aplicación en consola
- Soporte nativo para precios en Quetzales guatemaltecos
- Configuración específica para manejo de errores de React en desarrollo

PROPÓSITO:
Servir como la base arquitectónica que sostiene toda la aplicación Elite Fitness Club,
asegurando que todos los sistemas (autenticación, estado global, carrito de compras,
cache de datos, notificaciones) estén correctamente inicializados y disponibles para
todos los componentes de la aplicación. Este archivo garantiza que la experiencia del
usuario sea fluida desde el primer momento que accede a la aplicación, ya sea como
visitante explorando la landing page, cliente comprando productos, o administrador
gestionando el gimnasio. La configuración está optimizada para el mercado guatemalteco
con soporte completo para Quetzales y una arquitectura robusta que maneja tanto
usuarios ocasionales como operaciones críticas del negocio.
*/