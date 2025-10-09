// Autor: Alexander Echeverria
// Archivo: src/App.js
// ACTUALIZADO: Rutas para estructura modular con inventario independiente

import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useApp } from './contexts/AppContext';
import { CartProvider } from './contexts/CartContext';

// Componentes de Layout
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Componentes del carrito
import GlobalCart from './components/cart/GlobalCart';

// Landing Page (página principal)
const LandingPage = React.lazy(() => import('./pages/dashboard/LandingPage'));

// Tienda (página separada)
const StorePage = React.lazy(() => import('./pages/store/StorePage'));
const ProductDetailPage = React.lazy(() => import('./pages/store/ProductDetailPage'));

// Página de Checkout
const CheckoutPage = React.lazy(() => import('./pages/checkout/CheckoutPage'));

// Páginas de Autenticación (Lazy Loading)
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));

// Callback de Google OAuth
const GoogleOAuthCallback = React.lazy(() => import('./components/auth/GoogleOAuthCallback'));

// Páginas del Dashboard (Lazy Loading)
const DashboardLayout = React.lazy(() => import('./components/layout/DashboardLayout'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const StaffDashboard = React.lazy(() => import('./pages/dashboard/StaffDashboard'));
const ClientDashboard = React.lazy(() => import('./pages/dashboard/ClientDashboard'));

// 🆕 NUEVAS IMPORTACIONES: Gestión separada y modular
const WebsiteManager = React.lazy(() => import('./pages/dashboard/admin/WebsiteManager'));
const ScheduleManager = React.lazy(() => import('./pages/dashboard/admin/ScheduleManager'));
const InventoryDashboard = React.lazy(() => import('./pages/dashboard/inventory/InventoryDashboard'));

// Componentes específicos del dashboard
const UsersManager = React.lazy(() => import('./pages/dashboard/components/UsersManager'));
const MembershipsManager = React.lazy(() => import('./pages/dashboard/components/MembershipsManager'));
const ReportsManager = React.lazy(() => import('./pages/dashboard/components/ReportsManager'));
const ProfileManager = React.lazy(() => import('./pages/dashboard/components/ProfileManager'));
const PaymentsManager = React.lazy(() => import('./pages/dashboard/components/PaymentsManager'));
const ExpensesManager = React.lazy(() => import('./pages/dashboard/components/ExpensesManager'));

// Páginas de Error (Lazy Loading)
const NotFoundPage = React.lazy(() => import('./pages/error/NotFoundPage'));
const ForbiddenPage = React.lazy(() => import('./pages/error/ForbiddenPage'));

// Componente de ruta protegida
function ProtectedRoute({ children, requiredRole = null, requiredPermissions = [] }) {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  
  console.log('Verificación de ruta protegida:', {
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
    console.log('Usuario no autenticado, redirigiendo a login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    console.log('Usuario sin el rol requerido:', {
      userRole: user?.role,
      requiredRole
    });
    return <Navigate to="/forbidden" replace />;
  }
  
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
    if (!hasAllPermissions) {
      console.log('Usuario sin permisos requeridos:', {
        userPermissions: user?.permissions,
        requiredPermissions
      });
      return <Navigate to="/forbidden" replace />;
    }
  }
  
  console.log('Acceso autorizado a ruta protegida');
  return children;
}

// Componente de ruta pública
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user, getDashboardPathForRole } = useAuth();
  
  console.log('Verificación de ruta pública:', {
    isAuthenticated,
    isLoading,
    user: user ? { id: user.id, role: user.role } : null
  });
  
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Cargando Elite Fitness..." />;
  }
  
  if (isAuthenticated && user) {
    const dashboardPath = getDashboardPathForRole(user.role);
    console.log('Usuario autenticado, redirigiendo a dashboard:', dashboardPath);
    return <Navigate to={dashboardPath} replace />;
  }
  
  console.log('Usuario no autenticado, mostrando página pública');
  return children;
}

// Función de debug integrada
function runCompleteDebug() {
  console.clear();
  
  console.log('=====================================');
  console.log('ELITE FITNESS CLUB - DEBUG COMPLETO');
  console.log('=====================================');
  console.log('');
  
  // Debug de variables de entorno
  console.log('1. VARIABLES DE ENTORNO:');
  console.log('----------------------------------');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REACT_APP_DEBUG_MODE:', process.env.REACT_APP_DEBUG_MODE);
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('');
  
  // Debug de configuración del gimnasio
  console.log('2. CONFIGURACIÓN DEL GIMNASIO:');
  console.log('----------------------------------');
  console.log('REACT_APP_GYM_NAME:', process.env.REACT_APP_GYM_NAME);
  console.log('REACT_APP_GYM_TAGLINE:', process.env.REACT_APP_GYM_TAGLINE);
  console.log('REACT_APP_GYM_ADDRESS:', process.env.REACT_APP_GYM_ADDRESS);
  console.log('REACT_APP_GYM_PHONE:', process.env.REACT_APP_GYM_PHONE);
  console.log('REACT_APP_GYM_EMAIL:', process.env.REACT_APP_GYM_EMAIL);
  console.log('REACT_APP_GYM_HOURS_FULL:', process.env.REACT_APP_GYM_HOURS_FULL);
  console.log('');
  
  // Debug del logo
  console.log('3. CONFIGURACIÓN DEL LOGO:');
  console.log('----------------------------------');
  const logoUrl = process.env.REACT_APP_LOGO_URL;
  console.log('REACT_APP_LOGO_URL (crudo):', logoUrl);
  
  if (logoUrl) {
    const baseUrl = window.location.origin;
    const cleanPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    const finalUrl = `${baseUrl}${cleanPath}`;
    
    console.log('Base URL:', baseUrl);
    console.log('Path limpio:', cleanPath);
    console.log('URL final construida:', finalUrl);
    console.log('');
    console.log('Verificando si la imagen existe...');
    
    // Verificar si la imagen existe
    fetch(finalUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          console.log('IMAGEN ENCONTRADA! La imagen existe y es accesible');
          console.log('Status HTTP:', response.status);
          console.log('Content-Type:', response.headers.get('content-type'));
          console.log('Content-Length:', response.headers.get('content-length'));
        } else {
          console.error('IMAGEN NO ENCONTRADA');
          console.error('Status HTTP:', response.status);
          console.error('Status Text:', response.statusText);
          console.error('');
          console.error('SOLUCIONES:');
          console.error('   1. Verifica que el archivo existe en: public/assets/images/image.png');
          console.error('   2. Verifica que el .env tiene: REACT_APP_LOGO_URL=/assets/images/image.png');
          console.error('   3. Reinicia el servidor: npm start');
        }
      })
      .catch(error => {
        console.error('ERROR AL VERIFICAR LA IMAGEN:', error.message);
        console.error('POSIBLES CAUSAS:');
        console.error('   1. El archivo no existe en la ruta especificada');
        console.error('   2. Problema de permisos de archivo');
        console.error('   3. El servidor de desarrollo no está sirviendo archivos estáticos');
      });
  } else {
    console.error('NO HAY REACT_APP_LOGO_URL CONFIGURADA');
    console.error('SOLUCIÓN: Agrega REACT_APP_LOGO_URL=/assets/images/image.png al archivo .env');
  }
  console.log('');
  
  console.log('=====================================');
  console.log('FIN DEL DEBUG - ELITE FITNESS CLUB');
  console.log('=====================================');
}

// Función para verificar backend
async function debugBackendConnection() {
  console.log('4. VERIFICANDO CONEXIÓN AL BACKEND:');
  console.log('----------------------------------');
  console.log('URL del Backend configurada:', process.env.REACT_APP_API_URL);
  
  try {
    const startTime = Date.now();
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const healthUrl = `${apiUrl}/api/health`;
    
    console.log('Haciendo petición a:', healthUrl);
    
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
      console.log('BACKEND CONECTADO EXITOSAMENTE!');
      console.log('Respuesta del servidor:', data);
      console.log(`Tiempo de respuesta: ${responseTime}ms`);
    } else {
      console.error('BACKEND RESPONDIÓ CON ERROR!');
      console.error('Status:', response.status);
    }
  } catch (error) {
    console.error('ERROR: NO SE PUDO CONECTAR AL BACKEND!');
    console.error('Mensaje del error:', error.message);
    console.error('');
    console.error('SOLUCIONES:');
    console.error('   1. Verifica: http://localhost:5000/api/health en el navegador');
    console.error('   2. Ejecuta: cd gym-backend && npm run dev');
    console.error('   3. Verifica que veas: "URL: http://localhost:5000"');
    console.error('   4. Verifica tu archivo .env tiene: REACT_APP_API_URL=http://localhost:5000');
  }
  
  console.log('');
}

// Componente principal de la aplicación
function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isMobile, addNotification } = useApp();
  const location = useLocation();
  
  // Efecto principal: debug completo al iniciar
  useEffect(() => {
    console.log('ELITE FITNESS CLUB - INICIANDO APLICACIÓN...');
    
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
        console.log('Debug periódico - Elite Fitness...');
        debugBackendConnection();
      }, 60000);
      
      return () => {
        console.log('Limpiando interval de debug');
        clearInterval(interval);
      };
    }
  }, []);
  
  // Efecto: notificar cambios de ruta en desarrollo
  useEffect(() => {
    if (process.env.REACT_APP_DEBUG_MODE === 'true') {
      console.log('Elite Fitness - Navegando a:', location.pathname);
      console.log('Usuario actual:', user ? {
        id: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        authenticated: isAuthenticated
      } : 'No autenticado');
      
      if (!process.env.REACT_APP_API_URL) {
        console.warn('REACT_APP_API_URL no está definida después de la navegación');
      }
      
      if (!process.env.REACT_APP_LOGO_URL) {
        console.warn('REACT_APP_LOGO_URL no está definida después de la navegación');
      }
    }
  }, [location, user, isAuthenticated]);
  
  // Efecto: notificación de bienvenida
  useEffect(() => {
    if (isAuthenticated && user) {
      const hasShownWelcome = localStorage.getItem('elite_fitness_welcome_shown');
      
      if (!hasShownWelcome) {
        setTimeout(() => {
          addNotification({
            type: 'success',
            title: '¡Bienvenido a Elite Fitness!',
            message: `Hola ${user.firstName}, bienvenido al mejor gimnasio de Guatemala.`,
            persistent: false
          });
          localStorage.setItem('elite_fitness_welcome_shown', 'true');
        }, 1000);
      }
    }
  }, [isAuthenticated, user, addNotification]);
  
  // Efecto: configuraciones específicas para móvil
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
      
      {/* Debug info en pantalla */}
      {showDebugInfo && (
        <div className="fixed top-0 right-0 z-50 bg-black bg-opacity-80 text-white p-4 text-xs max-w-xs">
          <div className="font-bold mb-2">DEBUG ELITE FITNESS</div>
          <div>Logo: {process.env.REACT_APP_LOGO_URL ? 'Configurado' : 'No configurado'}</div>
          <div>Nombre: {process.env.REACT_APP_GYM_NAME || 'No configurado'}</div>
          <div>API: {process.env.REACT_APP_API_URL ? 'Configurada' : 'No configurada'}</div>
          <div>OAuth: Google configurado</div>
          <div>Carrito: Integrado con backend</div>
          <div>Checkout: Invitados + autenticados</div>
          <div>Moneda: Quetzales guatemaltecos</div>
          <div>Gastos: Sistema completo</div>
          <div>Horarios: Gestor independiente</div>
          <div>Web: Gestor separado</div>
          <div>Inventario: Sistema modular</div>
          {user && (
            <div className="mt-2 text-green-300">
              Usuario: {user.firstName} ({user.role})
            </div>
          )}
          <div className="mt-2 text-yellow-300">
            Revisa la consola para más detalles
          </div>
        </div>
      )}
      
      {/* Carrito global - disponible en toda la app */}
      <GlobalCart />
      
      <Suspense fallback={<LoadingSpinner fullScreen message="Cargando Elite Fitness..." />}>
        <Routes>
          
          {/* Página principal (landing) */}
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          
          {/* Tienda (pública) */}
          <Route path="/store" element={<StorePage />} />

           {/* Detalle de producto (público) */}
          <Route path="/store/product/:productId" element={<ProductDetailPage />} />
          
          {/* Checkout (público) */}
          <Route path="/checkout" element={<CheckoutPage />} />
          
          {/* Rutas de autenticación */}
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
          
          {/* Callback Google OAuth */}
          <Route path="/auth/google-success" element={
            <GoogleOAuthCallback />
          } />
          
          {/* Rutas protegidas (dashboard) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            
            {/* Dashboard de Admin */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* 🆕 NUEVA RUTA: Gestión de Página Web - Solo para administradores */}
            <Route path="admin/website" element={
              <ProtectedRoute requiredRole="admin">
                <WebsiteManager />
              </ProtectedRoute>
            } />
            
            {/* 🆕 NUEVA RUTA: Gestión de Horarios - Solo para administradores */}
            <Route path="admin/schedule" element={
              <ProtectedRoute requiredRole="admin">
                <ScheduleManager />
              </ProtectedRoute>
            } />
            
            {/* 🆕 NUEVA RUTA: Inventario y Ventas - Solo para administradores */}
            <Route path="admin/inventory" element={
              <ProtectedRoute requiredRole="admin">
                <InventoryDashboard />
              </ProtectedRoute>
            } />
            
            {/* Dashboard de Staff/Colaborador */}
            <Route path="staff" element={
              <ProtectedRoute requiredRole="colaborador">
                <StaffDashboard />
              </ProtectedRoute>
            } />
            
            {/* Dashboard de Cliente */}
            <Route path="client" element={
              <ProtectedRoute requiredRole="cliente">
                <ClientDashboard />
              </ProtectedRoute>
            } />
            
            {/* Componentes específicos */}
            
            {/* Usuarios - solo admin y staff con permisos */}
            <Route path="users" element={
              <ProtectedRoute requiredPermissions={['view_users']}>
                <UsersManager />
              </ProtectedRoute>
            } />
            
            {/* Membresías - admin y staff con permisos */}
            <Route path="memberships" element={
              <ProtectedRoute requiredPermissions={['view_memberships']}>
                <MembershipsManager />
              </ProtectedRoute>
            } />
            
            {/* Pagos - admin, staff y clientes pueden ver sus pagos */}
            <Route path="payments" element={
              <ProtectedRoute requiredPermissions={['view_payments']}>
                <PaymentsManager />
              </ProtectedRoute>
            } />
            
            {/* 💰 Gastos  */}
            <Route path="expenses" element={
              <ProtectedRoute requiredRole="admin">
                <ExpensesManager />
              </ProtectedRoute>
            } />

            {/* Reportes - solo admin y staff con permisos */}
            <Route path="reports" element={
              <ProtectedRoute requiredPermissions={['view_reports']}>
                <ReportsManager />
              </ProtectedRoute>
            } />
            
            {/* Perfil - todos los usuarios autenticados */}
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfileManager />
              </ProtectedRoute>
            } />
            
            {/* Redirección automática desde /dashboard */}
            <Route index element={
              <DashboardRedirect />
            } />
            
          </Route>
          
          {/* Páginas de error */}
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
          
        </Routes>
      </Suspense>
    </div>
  );
}

// Componente: redirección automática desde /dashboard
function DashboardRedirect() {
  const { isAuthenticated, user, getDashboardPathForRole } = useAuth();
  
  console.log('DashboardRedirect - Redirigiendo usuario:', {
    isAuthenticated,
    user: user ? { id: user.id, role: user.role } : null
  });
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  const dashboardPath = getDashboardPathForRole(user.role);
  console.log('Redirigiendo a dashboard específico:', dashboardPath);
  
  return <Navigate to={dashboardPath} replace />;
}

// Componente principal con CartProvider
function App() {
  return (
    <ErrorBoundary>
      {/* CartProvider envuelve el contenido después de Auth y App contexts */}
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;

/*
🆕 CAMBIOS PRINCIPALES EN App.js:

NUEVA RUTA AGREGADA:
- Importación de InventoryDashboard desde './pages/dashboard/inventory/InventoryDashboard'
- Nueva ruta protegida: /dashboard/admin/inventory
- Solo accesible para administradores (requiredRole="admin")
- Lazy loading para optimización de rendimiento

ESTRUCTURA MODULAR ACTUALIZADA:
1. Panel Principal
2. Usuarios (admin/staff)
3. Membresías (según rol)
4. 🆕 Gestión de Horarios (admin) - /dashboard/admin/schedule
5. 🆕 Gestión de Página Web (admin) - /dashboard/admin/website
6. 🆕 Inventario y Ventas (admin) - /dashboard/admin/inventory - NUEVA
7. Pagos
8. Tienda
9. Reportes
10. Perfil Personal

DEBUG INFO ACTUALIZADO:
- Agregado "Inventario: Sistema modular" en debug info
- Monitoreo de nueva ruta en logs de desarrollo
- Verificación de permisos específicos para inventario

BENEFICIOS DE LA NUEVA ESTRUCTURA:
- Sistema de inventario completamente independiente
- URLs específicas y amigables:
  * Horarios: /dashboard/admin/schedule
  * Web: /dashboard/admin/website
  * Inventario: /dashboard/admin/inventory
- Gestión modular de productos, ventas y reportes
- Separación clara de responsabilidades
- Carga optimizada con lazy loading

La nueva estructura permite administrar:
- Productos de la tienda del gimnasio
- Inventario y stock de productos
- Registro de ventas en tienda física
- Reportes de inventario y ventas
- Métricas de productos más vendidos
- Control de stock mínimo y alertas
*/

/*
CAMBIOS PRINCIPALES EN App.js:

🆕 NUEVA RUTA AGREGADA:
- Importación de ScheduleManager desde './pages/dashboard/admin/ScheduleManager'
- Nueva ruta protegida: /dashboard/admin/schedule
- Solo accesible para administradores (requiredRole="admin")
- Lazy loading para optimización de rendimiento

🔧 ACTUALIZACIONES:
- Debug info actualizado para mostrar "Horarios: Gestor independiente"
- Comentarios actualizados para reflejar la nueva estructura
- Mantenida toda la funcionalidad existente sin modificaciones

🎯 BENEFICIOS:
- Separación clara entre gestión de horarios y gestión web
- URL específica para gestión de horarios: /dashboard/admin/schedule
- Acceso directo desde el sidebar sin necesidad de navegar por pestañas
- Mantiene toda la seguridad y verificación de permisos

La nueva estructura permite:
- WebsiteManager: /dashboard/admin/website (gestión de contenido web)
- ScheduleManager: /dashboard/admin/schedule (gestión exclusiva de horarios)
- Ambos accesibles desde el sidebar como opciones independientes
*/
/*
EXPLICACIÓN DEL ARCHIVO:

Este archivo define el componente principal App de la aplicación Elite Fitness Club,
que actúa como el punto de entrada y controlador de rutas de toda la aplicación.
Es el componente raíz que coordina el sistema completo de navegación y autenticación.

FUNCIONALIDADES PRINCIPALES:
- Sistema de rutas completo con navegación protegida y pública
- Integración con Google OAuth para autenticación social
- Sistema de carrito de compras global disponible en toda la aplicación
- Checkout público para compras sin necesidad de registro
- Dashboard personalizado según el rol del usuario (admin, staff, cliente)
- Sistema de debug completo para desarrollo y troubleshooting
- Gestión de estados de carga y errores de manera centralizada
- Redirección automática basada en el estado de autenticación
- Soporte para múltiples roles con permisos granulares

CONEXIONES CON OTROS ARCHIVOS:
- AuthContext: Manejo de autenticación y autorización de usuarios
- AppContext: Estado global de la aplicación y funciones utilitarias
- CartContext: Gestión del carrito de compras y persistencia
- LandingPage: Página principal para usuarios no autenticados
- StorePage: Tienda pública accesible sin autenticación
- CheckoutPage: Proceso de compra para invitados y usuarios registrados
- Páginas de Dashboard: AdminDashboard, StaffDashboard, ClientDashboard
- Componentes de gestión: UsersManager, MembershipsManager, PaymentsManager, etc.
- Páginas de autenticación: LoginPage, RegisterPage
- Páginas de error: NotFoundPage, ForbiddenPage

CARACTERÍSTICAS ESPECIALES:
- Sistema de rutas protegidas con verificación de roles y permisos específicos
- Debug automático de conectividad con el backend en desarrollo
- Verificación automática de assets como logos e imágenes
- Notificaciones de bienvenida personalizadas para usuarios autenticados
- Configuración automática de viewport para dispositivos móviles
- Manejo de estados de carga con componentes lazy loading
- Sistema de redirección inteligente basado en el rol del usuario
- Integración completa con el sistema de carrito flotante global
- Soporte para precios en Quetzales guatemaltecos
- Monitoreo en tiempo real del estado de la aplicación

PROPÓSITO:
Servir como el núcleo arquitectónico de la aplicación Elite Fitness Club, proporcionando
una experiencia de navegación fluida y segura para todos los tipos de usuarios. La aplicación
está diseñada para manejar desde visitantes casuales que exploran la tienda y pueden
realizar compras sin registrarse, hasta administradores que gestionan todo el sistema del
gimnasio. El archivo App.js garantiza que cada usuario vea exactamente el contenido
apropiado para su nivel de acceso, mientras mantiene la funcionalidad del carrito y
checkout accesible para todos, optimizado para el mercado guatemalteco con soporte
nativo para Quetzales y una experiencia móvil excepcional.
*/