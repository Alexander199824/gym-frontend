// src/App.js
// UBICACIÓN: /gym-frontend/src/App.js
// FUNCIÓN: Componente principal con LANDING PAGE corregida para Elite Fitness
// CONECTA CON: LandingPage como página principal, login como secundaria


// src/App.js
// UBICACIÓN: /gym-frontend/src/App.js
// FUNCIÓN: Componente principal CON TIENDA INTEGRADA para Elite Fitness
// CONECTA CON: LandingPage, StorePage, AuthContext, CartContext

import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';

// 📱 Componentes de Layout
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// 🏠 Landing Page (página principal)
const LandingPage = React.lazy(() => import('./pages/dashboard/LandingPage'));

// 🛍️ Tienda (página separada)
const StorePage = React.lazy(() => import('./pages/store/StorePage'));

// 🔐 Páginas de Autenticación (Lazy Loading)
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));

// 🏠 Páginas del Dashboard (Lazy Loading)
const DashboardLayout = React.lazy(() => import('./components/layout/DashboardLayout'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const StaffDashboard = React.lazy(() => import('./pages/dashboard/StaffDashboard'));
const ClientDashboard = React.lazy(() => import('./pages/dashboard/ClientDashboard'));

// 🚫 Páginas de Error (Lazy Loading)
const NotFoundPage = React.lazy(() => import('./pages/error/NotFoundPage'));
const ForbiddenPage = React.lazy(() => import('./pages/error/ForbiddenPage'));

// 🛡️ COMPONENTE DE RUTA PROTEGIDA
function ProtectedRoute({ children, requiredRole = null, requiredPermissions = [] }) {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Verificando autenticación..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
    if (!hasAllPermissions) {
      return <Navigate to="/forbidden" replace />;
    }
  }
  
  return children;
}

// 🎯 COMPONENTE DE RUTA PÚBLICA (solo para no autenticados)
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Cargando Elite Fitness..." />;
  }
  
  if (isAuthenticated && user) {
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }
  
  return children;
}

// 🏠 HELPER: Obtener ruta del dashboard según rol
function getDashboardPath(role) {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'colaborador':
      return '/dashboard/staff';
    case 'cliente':
      return '/dashboard/client';
    default:
      return '/dashboard';
  }
}

// 🔍 FUNCIÓN DE DEBUG INTEGRADA
function runCompleteDebug() {
  console.clear();
  
  console.log('🚀 =====================================');
  console.log('🏋️ ELITE FITNESS CLUB - DEBUG COMPLETO');
  console.log('🚀 =====================================');
  console.log('');
  
  // 📊 1. DEBUG DE VARIABLES DE ENTORNO
  console.log('📋 1. VARIABLES DE ENTORNO:');
  console.log('----------------------------------');
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 REACT_APP_DEBUG_MODE:', process.env.REACT_APP_DEBUG_MODE);
  console.log('🔍 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('');
  
  // 🏋️ 2. DEBUG DE CONFIGURACIÓN DEL GIMNASIO
  console.log('🏋️ 2. CONFIGURACIÓN DEL GIMNASIO:');
  console.log('----------------------------------');
  console.log('📱 REACT_APP_GYM_NAME:', process.env.REACT_APP_GYM_NAME);
  console.log('🏷️ REACT_APP_GYM_TAGLINE:', process.env.REACT_APP_GYM_TAGLINE);
  console.log('📍 REACT_APP_GYM_ADDRESS:', process.env.REACT_APP_GYM_ADDRESS);
  console.log('📞 REACT_APP_GYM_PHONE:', process.env.REACT_APP_GYM_PHONE);
  console.log('📧 REACT_APP_GYM_EMAIL:', process.env.REACT_APP_GYM_EMAIL);
  console.log('🕐 REACT_APP_GYM_HOURS_FULL:', process.env.REACT_APP_GYM_HOURS_FULL);
  console.log('');
  
  // 🖼️ 3. DEBUG DEL LOGO
  console.log('🖼️ 3. CONFIGURACIÓN DEL LOGO:');
  console.log('----------------------------------');
  const logoUrl = process.env.REACT_APP_LOGO_URL;
  console.log('📁 REACT_APP_LOGO_URL (crudo):', logoUrl);
  
  if (logoUrl) {
    const baseUrl = window.location.origin;
    const cleanPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    const finalUrl = `${baseUrl}${cleanPath}`;
    
    console.log('🌐 Base URL:', baseUrl);
    console.log('🛤️ Path limpio:', cleanPath);
    console.log('🔗 URL final construida:', finalUrl);
    console.log('');
    console.log('🔍 Verificando si la imagen existe...');
    
    // Verificar si la imagen existe
    fetch(finalUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          console.log('✅ ¡IMAGEN ENCONTRADA! La imagen existe y es accesible');
          console.log('📊 Status HTTP:', response.status);
          console.log('📊 Content-Type:', response.headers.get('content-type'));
          console.log('📊 Content-Length:', response.headers.get('content-length'));
        } else {
          console.error('❌ IMAGEN NO ENCONTRADA');
          console.error('📊 Status HTTP:', response.status);
          console.error('📊 Status Text:', response.statusText);
          console.error('');
          console.error('🛠️ SOLUCIONES:');
          console.error('   1. Verifica que el archivo existe en: public/assets/images/image.png');
          console.error('   2. Verifica que el .env tiene: REACT_APP_LOGO_URL=/assets/images/image.png');
          console.error('   3. Reinicia el servidor: npm start');
        }
      })
      .catch(error => {
        console.error('❌ ERROR AL VERIFICAR LA IMAGEN:', error.message);
        console.error('🛠️ POSIBLES CAUSAS:');
        console.error('   1. El archivo no existe en la ruta especificada');
        console.error('   2. Problema de permisos de archivo');
        console.error('   3. El servidor de desarrollo no está sirviendo archivos estáticos');
      });
  } else {
    console.error('❌ NO HAY REACT_APP_LOGO_URL CONFIGURADA');
    console.error('🛠️ SOLUCIÓN: Agrega REACT_APP_LOGO_URL=/assets/images/image.png al archivo .env');
  }
  console.log('');
  
  console.log('🔚 =====================================');
  console.log('🏋️ FIN DEL DEBUG - ELITE FITNESS CLUB');
  console.log('🔚 =====================================');
}

// 🔍 FUNCIÓN PARA VERIFICAR BACKEND
async function debugBackendConnection() {
  console.log('🌐 6. VERIFICANDO CONEXIÓN AL BACKEND:');
  console.log('----------------------------------');
  console.log('🔗 URL del Backend configurada:', process.env.REACT_APP_API_URL);
  
  try {
    const startTime = Date.now();
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const healthUrl = `${apiUrl}/api/health`;
    
    console.log('📡 Haciendo petición a:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ BACKEND CONECTADO EXITOSAMENTE!');
      console.log('📊 Respuesta del servidor:', data);
      console.log(`⚡ Tiempo de respuesta: ${responseTime}ms`);
    } else {
      console.error('❌ BACKEND RESPONDIÓ CON ERROR!');
      console.error('📊 Status:', response.status);
    }
  } catch (error) {
    console.error('💥 ERROR: NO SE PUDO CONECTAR AL BACKEND!');
    console.error('🔍 Mensaje del error:', error.message);
    console.error('');
    console.error('🛠️ SOLUCIONES:');
    console.error('   1. Verifica: http://localhost:5000/api/health en el navegador');
    console.error('   2. Ejecuta: cd gym-backend && npm run dev');
    console.error('   3. Verifica que veas: "✅ URL: http://localhost:5000"');
    console.error('   4. Verifica tu archivo .env tiene: REACT_APP_API_URL=http://localhost:5000');
  }
  
  console.log('');
}

// 🚀 COMPONENTE PRINCIPAL DE LA APLICACIÓN
function App() {
  const { isAuthenticated, user } = useAuth();
  const { isMobile, addNotification } = useApp();
  const location = useLocation();
  
  // 🔥 EFECTO PRINCIPAL: DEBUG COMPLETO AL INICIAR
  useEffect(() => {
    console.log('🚀 ELITE FITNESS CLUB - INICIANDO APLICACIÓN...');
    
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      setTimeout(() => {
        runCompleteDebug();
        
        setTimeout(() => {
          debugBackendConnection();
        }, 2000);
      }, 1000);
    }
    
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('🔄 Debug periódico - Elite Fitness...');
        debugBackendConnection();
      }, 60000);
      
      return () => {
        console.log('🧹 Limpiando interval de debug');
        clearInterval(interval);
      };
    }
  }, []);
  
  // 📱 EFECTO: Notificar cambios de ruta en desarrollo
  useEffect(() => {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log('🧭 Elite Fitness - Navegando a:', location.pathname);
      
      if (!process.env.REACT_APP_API_URL) {
        console.warn('⚠️ REACT_APP_API_URL no está definida después de la navegación');
      }
      
      if (!process.env.REACT_APP_LOGO_URL) {
        console.warn('⚠️ REACT_APP_LOGO_URL no está definida después de la navegación');
      }
    }
  }, [location]);
  
  // 🔔 EFECTO: Notificación de bienvenida (solo una vez)
  useEffect(() => {
    if (isAuthenticated && user) {
      const hasShownWelcome = localStorage.getItem('elite_fitness_welcome_shown');
      
      if (!hasShownWelcome) {
        setTimeout(() => {
          addNotification({
            type: 'success',
            title: '🏋️‍♂️ ¡Bienvenido a Elite Fitness!',
            message: `Hola ${user.firstName}, bienvenido al mejor gimnasio de Guatemala.`,
            persistent: false
          });
          localStorage.setItem('elite_fitness_welcome_shown', 'true');
        }, 1000);
      }
    }
  }, [isAuthenticated, user, addNotification]);
  
  // 📱 EFECTO: Configuraciones específicas para móvil
  useEffect(() => {
    if (isMobile) {
      const viewportMeta = document.querySelector('meta[name=viewport]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }
  }, [isMobile]);
  
  const showDebugInfo = process.env.REACT_APP_DEBUG_MODE === 'true' && process.env.NODE_ENV === 'development';

  return (
    <ErrorBoundary>
      <div className="app min-h-screen bg-gray-50">
        
        {/* 🔍 DEBUG INFO EN PANTALLA (solo en desarrollo) */}
        {showDebugInfo && (
          <div className="fixed top-0 right-0 z-50 bg-black bg-opacity-80 text-white p-4 text-xs max-w-xs">
            <div className="font-bold mb-2">🔍 DEBUG ELITE FITNESS</div>
            <div>Logo: {process.env.REACT_APP_LOGO_URL ? '✅' : '❌'}</div>
            <div>Nombre: {process.env.REACT_APP_GYM_NAME || '❌'}</div>
            <div>API: {process.env.REACT_APP_API_URL ? '✅' : '❌'}</div>
            <div className="mt-2 text-yellow-300">
              Revisa la consola para más detalles
            </div>
          </div>
        )}
        
        <Suspense fallback={<LoadingSpinner fullScreen message="Cargando Elite Fitness..." />}>
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
              
              <Route index element={
                isAuthenticated && user ? 
                  <Navigate to={getDashboardPath(user.role)} replace /> :
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
      </div>
    </ErrorBoundary>
  );
}

export default App;

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