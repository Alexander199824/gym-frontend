// src/App.js
// UBICACIÓN: /gym-frontend/src/App.js
// FUNCIÓN: Componente principal con LANDING PAGE corregida para Elite Fitness
// CONECTA CON: LandingPage como página principal, login como secundaria


import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';

// 📱 Componentes de Layout
import { InitialLoadingSpinner } from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// 🏠 Landing Page (página principal para no autenticados)
const LandingPage = React.lazy(() => import('./pages/dashboard/LandingPage'));

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
  
  // Mostrar loading si aún estamos verificando autenticación
  if (isLoading) {
    return <InitialLoadingSpinner />;
  }
  
  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Verificar rol específico
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  // Verificar permisos específicos
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
    return <InitialLoadingSpinner />;
  }
  
  // Si ya está autenticado, redirigir al dashboard apropiado
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

// 🚀 COMPONENTE PRINCIPAL DE LA APLICACIÓN
function App() {
  const { isAuthenticated, user } = useAuth();
  const { isMobile, addNotification } = useApp();
  const location = useLocation();
  
  // 🔥 DEBUGGING PROFESIONAL - Solo en desarrollo
  console.log('🚀 ELITE FITNESS APP INICIANDO - Variables de entorno:');
  console.log('  🔍 REACT_APP_DEBUG_MODE:', process.env.REACT_APP_DEBUG_MODE);
  console.log('  🔗 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('  🌍 NODE_ENV:', process.env.NODE_ENV);
  console.log('  📱 REACT_APP_NAME:', process.env.REACT_APP_NAME);
  console.log('  🖼️ REACT_APP_LOGO_URL:', process.env.REACT_APP_LOGO_URL);
  
  // 🔍 VERIFICACIÓN DE CONEXIÓN AL BACKEND AL INICIAR
  useEffect(() => {
    const checkBackendConnection = async () => {
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log('🏋️‍♂️ Elite Fitness Club - INICIANDO VERIFICACIÓN BACKEND...');
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
            signal: AbortSignal.timeout(10000) // 10 segundos
          });
          
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ BACKEND ELITE FITNESS CONECTADO EXITOSAMENTE!');
            console.log('📊 Respuesta del servidor:', data);
            console.log(`⚡ Tiempo de respuesta: ${responseTime}ms`);
          } else {
            console.error('❌ BACKEND ELITE FITNESS RESPONDIÓ CON ERROR!');
            console.error('📊 Status:', response.status);
          }
        } catch (error) {
          console.error('💥 ERROR: NO SE PUDO CONECTAR AL BACKEND ELITE FITNESS!');
          console.error('🔍 Mensaje del error:', error.message);
          console.error('');
          console.error('🛠️ SOLUCIONES:');
          console.error('   1. Verifica: http://localhost:5000/api/health en el navegador');
          console.error('   2. Ejecuta: cd gym-backend && npm run dev');
          console.error('   3. Verifica que veas: "✅ URL: http://localhost:5000"');
          console.error('   4. Verifica tu archivo .env tiene: REACT_APP_API_URL=http://localhost:5000');
        }
      }
    };
    
    // 🔄 EJECUTAR VERIFICACIÓN INMEDIATAMENTE
    checkBackendConnection();
  }, []);
  
  // 📱 EFECTO: Notificar cambios de ruta en desarrollo
  useEffect(() => {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log('🧭 Elite Fitness - Navegando a:', location.pathname);
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
      // Prevenir zoom en inputs en iOS
      const viewportMeta = document.querySelector('meta[name=viewport]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }
  }, [isMobile]);
  
  return (
    <ErrorBoundary>
      <div className="app min-h-screen bg-slate-50">
        <Suspense fallback={<InitialLoadingSpinner />}>
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
            
            {/* 🏠 DASHBOARD PRINCIPAL */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              
              {/* Dashboard por rol */}
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
              
              {/* Redirección automática del dashboard base */}
              <Route index element={
                isAuthenticated && user ? 
                  <Navigate to={getDashboardPath(user.role)} replace /> :
                  <Navigate to="/login" replace />
              } />
              
            </Route>
            
            {/* ================================
                🚫 PÁGINAS DE ERROR
            ================================ */}
            
            {/* Página de acceso denegado */}
            <Route path="/forbidden" element={<ForbiddenPage />} />
            
            {/* Página 404 - Debe ser la última ruta */}
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