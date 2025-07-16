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

// 👥 Páginas de Usuarios (Lazy Loading)
const UsersListPage = React.lazy(() => import('./pages/users/UsersListPage'));
const UserDetailPage = React.lazy(() => import('./pages/users/UserDetailPage'));
const CreateUserPage = React.lazy(() => import('./pages/users/CreateUserPage'));

// 🎫 Páginas de Membresías (Lazy Loading)
const MembershipsListPage = React.lazy(() => import('./pages/memberships/MembershipsListPage'));
const MembershipDetailPage = React.lazy(() => import('./pages/memberships/MembershipDetailPage'));
const CreateMembershipPage = React.lazy(() => import('./pages/memberships/CreateMembershipPage'));
const ExpiredMembershipsPage = React.lazy(() => import('./pages/memberships/ExpiredMembershipsPage'));

// 💰 Páginas de Pagos (Lazy Loading)
const PaymentsListPage = React.lazy(() => import('./pages/payments/PaymentsListPage'));
const PaymentDetailPage = React.lazy(() => import('./pages/payments/PaymentDetailPage'));
const CreatePaymentPage = React.lazy(() => import('./pages/payments/CreatePaymentPage'));
const PendingTransfersPage = React.lazy(() => import('./pages/payments/PendingTransfersPage'));

// 📊 Páginas de Reportes (Lazy Loading)
const ReportsPage = React.lazy(() => import('./pages/reports/ReportsPage'));
const AnalyticsPage = React.lazy(() => import('./pages/reports/AnalyticsPage'));

// 🔧 Páginas de Configuración (Lazy Loading)
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));

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
  const { isMobile, isTablet, addNotification } = useApp();
  const location = useLocation();
  
  // 📱 EFECTO: Notificar cambios de ruta en desarrollo
  useEffect(() => {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log('🧭 Navegando a:', location.pathname);
    }
  }, [location]);
  
  // 🔔 EFECTO: Notificación de bienvenida (solo una vez)
  useEffect(() => {
    if (isAuthenticated && user) {
      const hasShownWelcome = localStorage.getItem('gym_welcome_shown');
      
      if (!hasShownWelcome) {
        setTimeout(() => {
          addNotification({
            type: 'success',
            title: '¡Bienvenido!',
            message: `Hola ${user.firstName}, bienvenido al sistema de gestión del gimnasio.`,
            persistent: false
          });
          localStorage.setItem('gym_welcome_shown', 'true');
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
              
              {/* 👥 RUTAS DE USUARIOS */}
              <Route path="users" element={
                <ProtectedRoute requiredPermissions={['view_users']}>
                  <UsersListPage />
                </ProtectedRoute>
              } />
              
              <Route path="users/create" element={
                <ProtectedRoute requiredPermissions={['create_users']}>
                  <CreateUserPage />
                </ProtectedRoute>
              } />
              
              <Route path="users/:id" element={
                <ProtectedRoute requiredPermissions={['view_users']}>
                  <UserDetailPage />
                </ProtectedRoute>
              } />
              
              {/* 🎫 RUTAS DE MEMBRESÍAS */}
              <Route path="memberships" element={
                <ProtectedRoute requiredPermissions={['view_memberships']}>
                  <MembershipsListPage />
                </ProtectedRoute>
              } />
              
              <Route path="memberships/create" element={
                <ProtectedRoute requiredPermissions={['create_memberships']}>
                  <CreateMembershipPage />
                </ProtectedRoute>
              } />
              
              <Route path="memberships/:id" element={
                <ProtectedRoute requiredPermissions={['view_memberships']}>
                  <MembershipDetailPage />
                </ProtectedRoute>
              } />
              
              <Route path="memberships/expired" element={
                <ProtectedRoute requiredPermissions={['view_expired_memberships']}>
                  <ExpiredMembershipsPage />
                </ProtectedRoute>
              } />
              
              {/* 💰 RUTAS DE PAGOS */}
              <Route path="payments" element={
                <ProtectedRoute requiredPermissions={['view_payments']}>
                  <PaymentsListPage />
                </ProtectedRoute>
              } />
              
              <Route path="payments/create" element={
                <ProtectedRoute requiredPermissions={['create_payments']}>
                  <CreatePaymentPage />
                </ProtectedRoute>
              } />
              
              <Route path="payments/:id" element={
                <ProtectedRoute requiredPermissions={['view_payments']}>
                  <PaymentDetailPage />
                </ProtectedRoute>
              } />
              
              <Route path="payments/transfers/pending" element={
                <ProtectedRoute requiredPermissions={['validate_transfers']}>
                  <PendingTransfersPage />
                </ProtectedRoute>
              } />
              
              {/* 📊 RUTAS DE REPORTES */}
              <Route path="reports" element={
                <ProtectedRoute requiredPermissions={['view_reports']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              
              <Route path="analytics" element={
                <ProtectedRoute requiredPermissions={['view_reports']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              
              {/* 🔧 RUTAS DE CONFIGURACIÓN */}
              <Route path="profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              <Route path="settings" element={
                <ProtectedRoute requiredPermissions={['manage_system_settings']}>
                  <SettingsPage />
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

// 📝 NOTAS SOBRE LA ESTRUCTURA:
// 
// 🔐 AUTENTICACIÓN:
// - PublicRoute: Solo para usuarios NO autenticados
// - ProtectedRoute: Solo para usuarios autenticados
// - Verificación automática de roles y permisos
// 
// 📱 LAZY LOADING:
// - Todos los componentes se cargan bajo demanda
// - Mejora significativamente el tiempo de carga inicial
// - Cada página se descarga solo cuando se necesita
// 
// 🛡️ SEGURIDAD:
// - Validación de permisos en cada ruta
// - Redirecciones automáticas según rol
// - Protección contra acceso no autorizado
// 
// 🎯 RUTAS POR ROL:
// - Admin: Acceso completo a todo el sistema
// - Colaborador: Gestión de usuarios, membresías y pagos
// - Cliente: Solo su perfil y membresías
// 
// 🚀 OPTIMIZACIONES:
// - Error boundaries para capturar errores
// - Loading states mientras cargan componentes
// - Configuraciones específicas para móvil