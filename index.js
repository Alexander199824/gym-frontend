// src/index.js
// UBICACIÓN: /gym-frontend/src/index.js
// FUNCIÓN: Punto de entrada principal de la aplicación React
// CONECTA CON: Backend Express.js en puerto 5000

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// 🎨 Importar estilos globales de Tailwind
import './styles/index.css';

// 🏠 Componente principal de la aplicación
import App from './App';

// 📊 Importar contextos globales
import { AuthProvider } from './src/contexts/AuthContext';
import { AppProvider } from './src/contexts/AppContext';
import { CartProvider } from './src/contexts/CartContext'; // ✅ IMPORTA CartProvider

import CartSidebar from './src/components/cart/CartSidebar'; // ✅ IMPORTA CartSidebar

// ⚙️ CONFIGURACIÓN DE REACT QUERY
// React Query maneja el cache y sincronización con el backend
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache queries por 5 minutos
      staleTime: 5 * 60 * 1000, 
      // Mantener cache por 10 minutos
      cacheTime: 10 * 60 * 1000,
      // Reintentar en caso de error
      retry: 2,
      // Revalidar al volver a la ventana
      refetchOnWindowFocus: false,
      // Configuración de error
      onError: (error) => {
        console.error('❌ Error en query:', error);
        
        // Si el token expiró, limpiar autenticación
        if (error.response?.status === 401) {
          localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
          window.location.href = '/login';
        }
      }
    },
    mutations: {
      // Configuración para mutaciones (POST, PUT, DELETE)
      retry: 1,
      onError: (error) => {
        console.error('❌ Error en mutación:', error);
      }
    }
  }
});

// 🔧 CONFIGURACIÓN DE DESARROLLO
if (process.env.REACT_APP_DEBUG_MODE === 'true') {
  console.log('🏋️‍♂️ Gym Management System - Frontend Iniciado');
  console.log('🔗 Backend URL:', process.env.REACT_APP_API_URL);
  console.log('🌍 Entorno:', process.env.REACT_APP_ENVIRONMENT);
  console.log('📱 Versión:', process.env.REACT_APP_VERSION);
}

// 🚀 RENDERIZADO DE LA APLICACIÓN
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 🧭 Router para navegación entre páginas */}
    <BrowserRouter>
      {/* 📊 Provider de React Query para cache de datos */}
      <QueryClientProvider client={queryClient}>
        {/* 🔐 Provider de autenticación (conecta con /api/auth) */}
        <AuthProvider>
          {/* 🏪 Provider de estado global de la app */}
          <AppProvider>
            {/* 🛒 Provider de carrito de compras */}
            <CartProvider>
              {/* 🏠 Componente principal */}
              <App />

              {/* 📦 Sidebar del carrito */}
              <CartSidebar />

              {/* 🍞 Toaster para notificaciones */}
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
            </CartProvider>
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// 🔍 REPORTES DE RENDIMIENTO (opcional)
// Mide el rendimiento de la aplicación
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
  
  // Reportar métricas en desarrollo
  reportWebVitals(console.log);
}

// 📝 NOTAS SOBRE LA ESTRUCTURA:
// - BrowserRouter: Habilita navegación SPA
// - QueryClientProvider: Cache inteligente de datos del backend
// - AuthProvider: Maneja login/logout y tokens JWT
// - AppProvider: Estado global de la aplicación
// - CartProvider: Estado del carrito de compras
// - CartSidebar: Sidebar flotante del carrito
// - Toaster: Notificaciones modernas
