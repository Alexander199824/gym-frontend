// src/index.js
// UBICACIÓN: /gym-frontend/src/index.js
// FUNCIÓN: Punto de entrada principal CORREGIDO con CartProvider
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

// 📊 Importar contextos globales - RUTAS CORREGIDAS
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { CartProvider } from './contexts/CartContext'; // ✅ RUTA CORREGIDA

// 🛒 Importar componente del carrito - RUTA CORREGIDA
import CartSidebar from './components/cart/CartSidebar'; // ✅ RUTA CORREGIDA

// ⚙️ CONFIGURACIÓN DE REACT QUERY
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            {/* 🛒 CartProvider CORRECTAMENTE INCLUIDO */}
            <CartProvider>
              <App />
              
              {/* 📦 Sidebar del carrito */}
              <CartSidebar />
              
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