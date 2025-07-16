// src/App.js
// UBICACIÓN: /gym-frontend/src/App.js
// FUNCIÓN: Componente principal que maneja las rutas y layout general
// CONECTA CON: Todos los componentes y páginas del sistema

import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';

// 📱 Componentes de Layout
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

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
    return <LoadingSpinner fullScreen message="Verificando autenticación..." />;
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
    return <LoadingSpinner fullScreen message="Cargando aplicación..." />;
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
  
  // 🔥 DEBUGGING TEMPORAL - Verificar variables de entorno
  console.log('🚀 APP INICIANDO - Variables de entorno:');
  console.log('  🔍 REACT_APP_DEBUG_MODE:', process.env.REACT_APP_DEBUG_MODE);
  console.log('  🔗 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('  🌍 NODE_ENV:', process.env.NODE_ENV);
  console.log('  📱 REACT_APP_NAME:', process.env.REACT_APP_NAME);
  console.log('  🎯 Todas las variables REACT_APP_*:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
  
  // 🔍 VERIFICACIÓN DE CONEXIÓN AL BACKEND AL INICIAR
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose...');
    
    const checkBackendConnection = async () => {
      console.log('🏋️‍♂️ Gym Management System - INICIANDO VERIFICACIÓN BACKEND...');
      console.log('🔗 URL del Backend configurada:', process.env.REACT_APP_API_URL);
      console.log('🔍 DEBUG_MODE configurado:', process.env.REACT_APP_DEBUG_MODE);
      
      // 🔥 FORZAR LA EJECUCIÓN (quitar condición temporal)
      // if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.log('🏋️‍♂️ Gym Management System - Verificando Backend...');
        console.log('🔗 URL del Backend:', process.env.REACT_APP_API_URL || 'http://localhost:5000');
        
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
            // Agregar timeout manual
            signal: AbortSignal.timeout(10000) // 10 segundos
          });
          
          const responseTime = Date.now() - startTime;
          
          console.log('📊 Respuesta recibida:');
          console.log('  📊 Status:', response.status);
          console.log('  📊 StatusText:', response.statusText);
          console.log('  📊 OK:', response.ok);
          console.log(`  ⚡ Tiempo de respuesta: ${responseTime}ms`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ BACKEND CONECTADO EXITOSAMENTE!');
            console.log('📊 Respuesta del servidor:', data);
            console.log(`⚡ Tiempo de respuesta: ${responseTime}ms`);
            console.log('🎯 Estado: Backend funcionando correctamente');
            
            // Mostrar notificación si está disponible
            if (addNotification) {
              addNotification({
                type: 'success',
                title: 'Conexión exitosa',
                message: `Backend conectado en ${responseTime}ms`
              });
            }
          } else {
            console.error('❌ BACKEND RESPONDIÓ CON ERROR!');
            console.error('📊 Status:', response.status);
            console.error('📊 Status Text:', response.statusText);
            console.error('🔧 Verifica que el endpoint /api/health exista en el backend');
            
            // Intentar leer la respuesta de error
            try {
              const errorData = await response.text();
              console.error('📊 Respuesta de error:', errorData);
            } catch (e) {
              console.error('📊 No se pudo leer la respuesta de error');
            }
          }
        } catch (error) {
          console.error('💥 ERROR: NO SE PUDO CONECTAR AL BACKEND!');
          console.error('🔍 Tipo de error:', error.name);
          console.error('🔍 Mensaje del error:', error.message);
          console.error('🔍 Error completo:', error);
          console.error('');
          console.error('🚫 CAUSAS POSIBLES:');
          console.error('   1. El backend NO está corriendo en puerto 5000');
          console.error('   2. El backend está en un puerto diferente');
          console.error('   3. Problema de CORS en el backend');
          console.error('   4. URL incorrecta en REACT_APP_API_URL');
          console.error('   5. Firewall o antivirus bloqueando la conexión');
          console.error('');
          console.error('🛠️ SOLUCIONES:');
          console.error('   1. Verifica: http://localhost:5000/api/health en el navegador');
          console.error('   2. Ejecuta: cd gym-backend && npm run dev');
          console.error('   3. Verifica que veas: "✅ URL: http://localhost:5000"');
          console.error('   4. Verifica tu archivo .env tiene: REACT_APP_API_URL=http://localhost:5000');
          console.error('   5. Prueba desde otra pestaña: curl http://localhost:5000/api/health');
          
          // Mostrar notificación de error si está disponible
          if (addNotification) {
            addNotification({
              type: 'error',
              title: 'Error de conexión',
              message: 'No se pudo conectar al backend',
              persistent: true
            });
          }
        }
      // } // FIN DE CONDICIÓN COMENTADA
    };
    
    // 🔄 EJECUTAR VERIFICACIÓN INMEDIATAMENTE
    console.log('🚀 Ejecutando verificación de backend...');
    checkBackendConnection();
    
    // 🔄 EJECUTAR VERIFICACIÓN CADA 30 SEGUNDOS (TEMPORAL)
    const interval = setInterval(() => {
      console.log('🔄 Verificación periódica del backend...');
      checkBackendConnection();
    }, 30000);
    
    // Limpiar interval al desmontar
    return () => {
      console.log('🧹 Limpiando interval de verificación');
      clearInterval(interval);
    };
  }, []); // Solo se ejecuta una vez al montar
  
  // 📱 EFECTO: Notificar cambios de ruta en desarrollo
  useEffect(() => {
    console.log('🧭 Navegando a:', location.pathname);
    
    // Verificar si las variables de entorno siguen disponibles
    if (!process.env.REACT_APP_API_URL) {
      console.warn('⚠️ REACT_APP_API_URL no está definida después de la navegación');
    }
  }, [location]);
  
  // 🔄 EFECTO: Verificar variables de entorno periódicamente
  useEffect(() => {
    const checkEnvVars = () => {
      console.log('🔍 Verificación periódica de variables de entorno:');
      console.log('  REACT_APP_DEBUG_MODE:', process.env.REACT_APP_DEBUG_MODE);
      console.log('  REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
      
      if (!process.env.REACT_APP_API_URL) {
        console.error('❌ REACT_APP_API_URL no está definida!');
        console.error('🔧 Verifica tu archivo .env');
        console.error('🔧 Reinicia el servidor de desarrollo: npm start');
      }
    };
    
    // Verificar inmediatamente
    checkEnvVars();
    
    // Verificar cada 60 segundos
    const interval = setInterval(checkEnvVars, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <ErrorBoundary>
      <div className="app min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingSpinner fullScreen message="Cargando página..." />}>
          <Routes>
            
            {/* ================================
                RUTAS PÚBLICAS (NO AUTENTICADAS)
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
                RUTAS PROTEGIDAS (AUTENTICADAS)
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
              
            </Route>
            
            {/* ================================
                RUTAS ESPECIALES
            ================================ */}
            
            {/* Redirección de la raíz */}
            <Route path="/" element={
              isAuthenticated && user ? 
                <Navigate to={getDashboardPath(user.role)} replace /> :
                <Navigate to="/login" replace />
            } />
            
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