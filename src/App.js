// src/App.js
// UBICACIÓN: /gym-frontend/src/App.js
// FUNCIÓN: Componente principal con rutas COMPLETAS + Google OAuth + Carrito Integrado + CHECKOUT AGREGADO
// CAMBIOS: ✅ CartProvider integrado ✅ GlobalCart agregado ✅ RUTA DE CHECKOUT AGREGADA ✅ TODAS las funcionalidades preservadas

import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';
import { CartProvider } from './contexts/CartContext'; // ✅ EXISTENTE

// 📱 Componentes de Layout
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// 🛒 Componentes del carrito - ✅ EXISTENTE
import GlobalCart from './components/cart/GlobalCart';

// 🏠 Landing Page (página principal)
const LandingPage = React.lazy(() => import('./pages/dashboard/LandingPage'));

// 🛍️ Tienda (página separada)
const StorePage = React.lazy(() => import('./pages/store/StorePage'));

// ✅ NUEVO: Página de Checkout - RUTA QUE FALTABA
const CheckoutPage = React.lazy(() => import('./pages/checkout/CheckoutPage'));

// 🔐 Páginas de Autenticación (Lazy Loading)
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));

// 🔗 ✅ EXISTENTE: Callback de Google OAuth
const GoogleOAuthCallback = React.lazy(() => import('./components/auth/GoogleOAuthCallback'));

// 🏠 Páginas del Dashboard (Lazy Loading)
const DashboardLayout = React.lazy(() => import('./components/layout/DashboardLayout'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const StaffDashboard = React.lazy(() => import('./pages/dashboard/StaffDashboard'));
const ClientDashboard = React.lazy(() => import('./pages/dashboard/ClientDashboard'));

// 🧩 COMPONENTES ESPECÍFICOS DEL DASHBOARD
const UsersManager = React.lazy(() => import('./pages/dashboard/components/UsersManager'));
const MembershipsManager = React.lazy(() => import('./pages/dashboard/components/MembershipsManager'));
const SettingsManager = React.lazy(() => import('./pages/dashboard/components/SettingsManager'));
const ReportsManager = React.lazy(() => import('./pages/dashboard/components/ReportsManager'));
const ProfileManager = React.lazy(() => import('./pages/dashboard/components/ProfileManager'));
const PaymentsManager = React.lazy(() => import('./pages/dashboard/components/PaymentsManager'));

// 🚫 Páginas de Error (Lazy Loading)
const NotFoundPage = React.lazy(() => import('./pages/error/NotFoundPage'));
const ForbiddenPage = React.lazy(() => import('./pages/error/ForbiddenPage'));

// 🛡️ COMPONENTE DE RUTA PROTEGIDA MEJORADO - ✅ MANTENIDO IGUAL
function ProtectedRoute({ children, requiredRole = null, requiredPermissions = [] }) {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  
  console.log('🛡️ ProtectedRoute Check:', {
    isAuthenticated,
    isLoading,
    user: user ? { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` } : null,
    requiredRole,
    currentPath: location.pathname
  });
  
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Verificando autenticación..." />;
  }
  
  if (!isAuthenticated) {
    console.log('❌ Usuario no autenticado, redirigiendo a login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    console.log('❌ Usuario sin el rol requerido:', {
      userRole: user?.role,
      requiredRole
    });
    return <Navigate to="/forbidden" replace />;
  }
  
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
    if (!hasAllPermissions) {
      console.log('❌ Usuario sin permisos requeridos:', {
        userPermissions: user?.permissions,
        requiredPermissions
      });
      return <Navigate to="/forbidden" replace />;
    }
  }
  
  console.log('✅ Acceso autorizado a ruta protegida');
  return children;
}

// 🎯 COMPONENTE DE RUTA PÚBLICA MEJORADO - ✅ MANTENIDO IGUAL
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user, getDashboardPathForRole } = useAuth();
  
  console.log('🎯 PublicRoute Check:', {
    isAuthenticated,
    isLoading,
    user: user ? { id: user.id, role: user.role } : null
  });
  
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Cargando Elite Fitness..." />;
  }
  
  if (isAuthenticated && user) {
    const dashboardPath = getDashboardPathForRole(user.role);
    console.log('✅ Usuario autenticado, redirigiendo a dashboard:', dashboardPath);
    return <Navigate to={dashboardPath} replace />;
  }
  
  console.log('✅ Usuario no autenticado, mostrando página pública');
  return children;
}

// 🔍 FUNCIÓN DE DEBUG INTEGRADA - ✅ MANTENIDA IGUAL
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

// 🔍 FUNCIÓN PARA VERIFICAR BACKEND - ✅ MANTENIDA IGUAL
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

// 🚀 COMPONENTE PRINCIPAL DE LA APLICACIÓN - ✅ CON CARRITO INTEGRADO Y CHECKOUT AGREGADO
function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isMobile, addNotification } = useApp();
  const location = useLocation();
  
  // 🔥 EFECTO PRINCIPAL: DEBUG COMPLETO AL INICIAR - ✅ MANTENIDO IGUAL
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
  
  // 📱 EFECTO: Notificar cambios de ruta en desarrollo - ✅ MANTENIDO IGUAL
  useEffect(() => {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log('🧭 Elite Fitness - Navegando a:', location.pathname);
      console.log('👤 Usuario actual:', user ? {
        id: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        authenticated: isAuthenticated
      } : 'No autenticado');
      
      if (!process.env.REACT_APP_API_URL) {
        console.warn('⚠️ REACT_APP_API_URL no está definida después de la navegación');
      }
      
      if (!process.env.REACT_APP_LOGO_URL) {
        console.warn('⚠️ REACT_APP_LOGO_URL no está definida después de la navegación');
      }
    }
  }, [location, user, isAuthenticated]);
  
  // 🔔 EFECTO: Notificación de bienvenida - ✅ MANTENIDO IGUAL
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
  
  // 📱 EFECTO: Configuraciones específicas para móvil - ✅ MANTENIDO IGUAL
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
    <div className="app min-h-screen bg-gray-50">
      
      {/* 🔍 DEBUG INFO EN PANTALLA - ✅ ACTUALIZADO CON INFO DEL CARRITO */}
      {showDebugInfo && (
        <div className="fixed top-0 right-0 z-50 bg-black bg-opacity-80 text-white p-4 text-xs max-w-xs">
          <div className="font-bold mb-2">🔍 DEBUG ELITE FITNESS</div>
          <div>Logo: {process.env.REACT_APP_LOGO_URL ? '✅' : '❌'}</div>
          <div>Nombre: {process.env.REACT_APP_GYM_NAME || '❌'}</div>
          <div>API: {process.env.REACT_APP_API_URL ? '✅' : '❌'}</div>
          <div>OAuth: ✅ Google configurado</div>
          <div>Carrito: ✅ Integrado con backend</div>
          <div>Checkout: ✅ Invitados + autenticados</div>
          {user && (
            <div className="mt-2 text-green-300">
              👤 {user.firstName} ({user.role})
            </div>
          )}
          <div className="mt-2 text-yellow-300">
            Revisa la consola para más detalles
          </div>
        </div>
      )}
      
      {/* ✅ EXISTENTE: CARRITO GLOBAL - Disponible en toda la app */}
      <GlobalCart />
      
      <Suspense fallback={<LoadingSpinner fullScreen message="Cargando Elite Fitness..." />}>
        <Routes>
          
          {/* ================================
              🏠 PÁGINA PRINCIPAL (LANDING) - ✅ MANTENIDA IGUAL
          ================================ */}
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          
          {/* ================================
              🛍️ TIENDA (PÚBLICA) - ✅ MANTENIDA IGUAL
          ================================ */}
          <Route path="/store" element={<StorePage />} />
          
          {/* ================================
              ✅ NUEVO: CHECKOUT (PÚBLICO) - RUTA QUE FALTABA
          ================================ */}
          <Route path="/checkout" element={<CheckoutPage />} />
          
          {/* ================================
              🔐 RUTAS DE AUTENTICACIÓN - ✅ MANTENIDAS IGUAL
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
              🔗 ✅ CALLBACK GOOGLE OAUTH - ✅ MANTENIDO IGUAL
          ================================ */}
          <Route path="/auth/google-success" element={
            <GoogleOAuthCallback />
          } />
          
          {/* ================================
              🏋️ RUTAS PROTEGIDAS (DASHBOARD) - ✅ MANTENIDAS IGUAL
          ================================ */}
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            
            {/* 🔧 Dashboard de Admin */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* 👥 Dashboard de Staff/Colaborador */}
            <Route path="staff" element={
              <ProtectedRoute requiredRole="colaborador">
                <StaffDashboard />
              </ProtectedRoute>
            } />
            
            {/* 👤 Dashboard de Cliente */}
            <Route path="client" element={
              <ProtectedRoute requiredRole="cliente">
                <ClientDashboard />
              </ProtectedRoute>
            } />
            
            {/* ================================
                🧩 COMPONENTES ESPECÍFICOS - ✅ MANTENIDOS IGUAL
            ================================ */}
            
            {/* 👥 USUARIOS - Solo Admin y Staff con permisos */}
            <Route path="users" element={
              <ProtectedRoute requiredPermissions={['view_users']}>
                <UsersManager />
              </ProtectedRoute>
            } />
            
            {/* 🎫 MEMBRESÍAS - Admin y Staff con permisos */}
            <Route path="memberships" element={
              <ProtectedRoute requiredPermissions={['view_memberships']}>
                <MembershipsManager />
              </ProtectedRoute>
            } />
            
            {/* 💰 PAGOS - Admin, Staff y Clientes pueden ver sus pagos */}
            <Route path="payments" element={
              <ProtectedRoute requiredPermissions={['view_payments']}>
                <PaymentsManager />
              </ProtectedRoute>
            } />
            
            {/* 📊 REPORTES - Solo Admin y Staff con permisos */}
            <Route path="reports" element={
              <ProtectedRoute requiredPermissions={['view_reports']}>
                <ReportsManager />
              </ProtectedRoute>
            } />
            
            {/* ⚙️ CONFIGURACIÓN - Solo Admin */}
            <Route path="settings" element={
              <ProtectedRoute requiredPermissions={['manage_system_settings']}>
                <SettingsManager />
              </ProtectedRoute>
            } />
            
            {/* 👤 PERFIL - Todos los usuarios autenticados */}
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfileManager />
              </ProtectedRoute>
            } />
            
            {/* ✅ REDIRECCIÓN AUTOMÁTICA DESDE /dashboard */}
            <Route index element={
              <DashboardRedirect />
            } />
            
          </Route>
          
          {/* ================================
              🚫 PÁGINAS DE ERROR - ✅ MANTENIDAS IGUAL
          ================================ */}
          
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
          
        </Routes>
      </Suspense>
    </div>
  );
}

// ✅ COMPONENTE: Redirección automática desde /dashboard - ✅ MANTENIDO IGUAL
function DashboardRedirect() {
  const { isAuthenticated, user, getDashboardPathForRole } = useAuth();
  
  console.log('🎯 DashboardRedirect - Redirigiendo usuario:', {
    isAuthenticated,
    user: user ? { id: user.id, role: user.role } : null
  });
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  const dashboardPath = getDashboardPathForRole(user.role);
  console.log('🏠 Redirigiendo a dashboard específico:', dashboardPath);
  
  return <Navigate to={dashboardPath} replace />;
}

// 🚀 COMPONENTE PRINCIPAL CON CARTPROVIDER - ✅ EXISTENTE WRAPPER
function App() {
  return (
    <ErrorBoundary>
      {/* ✅ CartProvider envuelve el contenido después de Auth y App contexts */}
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;

// 📝 CAMBIOS REALIZADOS EN ESTA VERSIÓN:
// 
// ✅ RUTA DE CHECKOUT AGREGADA:
// - Import de CheckoutPage agregado
// - Ruta `/checkout` agregada como pública
// - Debug info actualizado con "Checkout: ✅ Invitados + autenticados"
// 
// ✅ TODAS LAS FUNCIONALIDADES PRESERVADAS:
// - Sistema de debug completo intacto
// - Google OAuth mantenido igual
// - Rutas protegidas con permisos funcionando igual
// - Debug periódico del backend mantenido
// - Redirección automática de dashboard preservada
// - Componentes específicos (Users, Memberships, etc.) intactos
// - PublicRoute y ProtectedRoute mantienen su lógica exacta
// - CartProvider y GlobalCart funcionando igual
// 
// ✅ COMPATIBILIDAD 100%:
// - No se eliminó ninguna funcionalidad existente
// - Solo se agregó la ruta de checkout que faltaba
// - Logs y debug system funcionan igual
// - Estructura de rutas mantiene todo lo existente
// 
// ✅ NUEVO EN ESTA VERSIÓN:
// - Ruta `/checkout` para compras sin iniciar sesión
// - CheckoutPage accesible desde cualquier lugar
// - Debug info actualizado para mostrar estado del checkout