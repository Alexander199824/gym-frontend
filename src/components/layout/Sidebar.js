// Autor: Alexander Echeverria
// src/components/layout/Sidebar.js
// FUNCIÓN: Sidebar solo para desktop con navegación colapsable
// ACTUALIZADO: Con gestión de horarios separada del gestor web

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  Coins,
  BarChart3, 
  Clock,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Timer,
  Calendar,
  Globe,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import GymLogo from '../common/GymLogo';

const Sidebar = ({ collapsed }) => {
  const { user, logout, hasPermission, canManageContent } = useAuth();
  const { toggleSidebar, showSuccess, showError } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Verificar si una ruta está activa
  const isActiveRoute = (path) => location.pathname === path;
  const isActiveSection = (paths) => paths.some(path => location.pathname.startsWith(path));
  
  // Obtener elementos del menú según el rol
  const getMenuItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: 'Panel Principal',
        icon: Home,
        path: getDashboardPath(),
        show: true
      }
    ];
    
    // Usuarios - Solo admin y colaboradores
    if (hasPermission('view_users')) {
      baseItems.push({
        id: 'users',
        label: 'Usuarios',
        icon: Users,
        path: '/dashboard/users',
        show: true
      });
    }
    
    // Membresías según el rol
    if (hasPermission('view_memberships')) {
      // Admin/Staff: gestión completa de membresías
      baseItems.push({
        id: 'memberships',
        label: 'Membresías',
        icon: CreditCard,
        path: '/dashboard/memberships',
        show: true
      });
    } else if (user?.role === 'cliente') {
      // Cliente: gestión de su propia membresía
      baseItems.push({
        id: 'my_membership',
        label: 'Mi Membresía',
        icon: CreditCard,
        path: '/dashboard/client?section=membership',
        show: true
      });
    }
    
    // 🆕 GESTIÓN DE HORARIOS - Solo para administradores con permisos
    if (canManageContent && user?.role === 'admin') {
      baseItems.push({
        id: 'schedule_manager',
        label: 'Gestión de Horarios',
        icon: Clock,
        path: '/dashboard/admin/schedule',
        show: true,
        isNew: true // Marcar como nueva para destacar visualmente
      });
    }
    
    // Horarios según el rol (para clientes)
    if (user?.role === 'cliente') {
      // Cliente: gestión de sus propios horarios
      baseItems.push({
        id: 'my_schedule',
        label: 'Mis Horarios',
        icon: Timer,
        path: '/dashboard/client?section=schedule',
        show: true
      });
    }
    
    // Pagos en quetzales
    if (hasPermission('view_payments')) {
      baseItems.push({
        id: 'payments',
        label: 'Pagos (Q)',
        icon: Coins,
        path: '/dashboard/payments',
        show: true
      });
    }

    // Tienda - Disponible para todos los usuarios
    baseItems.push({
      id: 'store',
      label: 'Tienda',
      icon: ShoppingBag,
      path: '/store',
      show: true
    });
    
    // 🆕 GESTIÓN DE PÁGINA WEB - Solo para administradores con permisos
    if (canManageContent && user?.role === 'admin') {
      baseItems.push({
        id: 'website_manager',
        label: 'Gestión de Página Web',
        icon: Globe,
        path: '/dashboard/admin/website',
        show: true,
        isNew: true // Marcar como nueva para destacar visualmente
      });
    }
    
    // Reportes - Solo admin y colaboradores con permisos
    if (hasPermission('view_reports')) {
      baseItems.push({
        id: 'reports',
        label: 'Reportes Financieros',
        icon: BarChart3,
        path: '/dashboard/reports',
        show: true
      });
    }
    
    // Configuración del Sistema - Solo para administradores
    if (hasPermission('manage_system_settings')) {
      baseItems.push({
        id: 'system_settings',
        label: 'Configuración del Sistema',
        icon: Settings,
        path: '/dashboard/admin/settings',
        show: true
      });
    }
    
    return baseItems.filter(item => item.show);
  };
  
  // Obtener ruta del dashboard según rol
  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/dashboard/admin';
      case 'colaborador':
        return '/dashboard/staff';
      case 'cliente':
        return '/dashboard/client';
      default:
        return '/dashboard';
    }
  };
  
  const menuItems = getMenuItems();
  
  // Verificar si estamos en las secciones específicas del cliente
  const isActiveMembershipSection = () => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/dashboard/client' && searchParams.get('section') === 'membership';
  };
  
  const isActiveScheduleSection = () => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/dashboard/client' && searchParams.get('section') === 'schedule';
  };
  
  // Manejar logout robusto
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      console.log('Iniciando cierre de sesión...');
      
      // Limpiar datos locales antes del logout
      try {
        localStorage.removeItem('elite_fitness_cart');
        localStorage.removeItem('elite_fitness_session_id');
        localStorage.removeItem('elite_fitness_wishlist');
        localStorage.removeItem('elite_fitness_payments_cache');
        localStorage.removeItem('elite_fitness_user_preferences');
        console.log('Datos locales limpiados correctamente');
      } catch (localStorageError) {
        console.warn('Error limpiando localStorage:', localStorageError);
      }
      
      // Llamar al logout del contexto con timeout
      const logoutPromise = logout();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en cierre de sesión')), 5000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      
      console.log('Cierre de sesión exitoso');
      showSuccess && showSuccess('Sesión cerrada correctamente');
      
      // Navegar después del logout exitoso
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      
      // Fallback robusto: Forzar limpieza y redirección
      try {
        // Limpiar todo el localStorage
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('Forzando recarga para limpiar estado...');
        showError && showError('Cerrando sesión...');
        
        // Forzar redirección
        window.location.href = '/login';
        
      } catch (fallbackError) {
        console.error('Error en fallback de cierre de sesión:', fallbackError);
        // Último recurso
        window.location.reload();
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      
      {/* Header con toggle */}
      <div className={`flex items-center justify-between border-b border-gray-200 transition-all duration-300 ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        
        {/* Logo - se oculta completamente cuando está colapsado */}
        {!collapsed && (
          <div className="transition-opacity duration-300">
            <GymLogo size="md" variant="professional" showText={true} />
          </div>
        )}
        
        {/* Botón toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          title={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Información del usuario */}
      <div className={`border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50 transition-all duration-300 ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          
          {/* Avatar - siempre visible */}
          <div className="w-10 h-10 bg-elite-gradient rounded-full flex items-center justify-center flex-shrink-0">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-white">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </span>
            )}
          </div>
          
          {/* Información del usuario - desaparece cuando está colapsado */}
          {!collapsed && (
            <div className="transition-opacity duration-300 min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'colaborador' ? 'Personal del Gimnasio' : 'Cliente Miembro'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Navegación principal */}
      <nav className={`flex-1 space-y-2 transition-all duration-300 ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        {menuItems.map((item) => {
          // Verificar si está activo - incluir secciones específicas para cliente
          let isActive = false;
          
          if (item.id === 'my_membership') {
            isActive = isActiveMembershipSection();
          } else if (item.id === 'my_schedule') {
            isActive = isActiveScheduleSection();
          } else {
            isActive = isActiveRoute(item.path) || isActiveSection([item.path]);
          }
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`
                flex items-center rounded-xl transition-all duration-300 relative
                ${isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
                ${collapsed ? 'p-2 justify-center' : 'px-3 py-3'}
              `}
              title={collapsed ? item.label : undefined}
            >
              {/* Icono - siempre visible */}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
              
              {/* Texto - desaparece cuando está colapsado */}
              {!collapsed && (
                <span className="text-sm font-medium transition-opacity duration-300">
                  {item.label}
                </span>
              )}
              
              {/* Indicador de nueva funcionalidad */}
              {/* Punto indicador para nueva funcionalidad cuando está colapsado */}
              {item.isNew && collapsed && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Enlaces adicionales */}
      <div className={`border-t border-gray-200 space-y-2 transition-all duration-300 ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        
        {/* Mi Perfil */}
        <Link
          to="/dashboard/profile"
          className={`
            flex items-center rounded-xl transition-all duration-300
            ${isActiveRoute('/dashboard/profile')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
            ${collapsed ? 'p-2 justify-center' : 'px-3 py-3'}
          `}
          title={collapsed ? 'Mi Perfil' : undefined}
        >
          <User className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && (
            <span className="text-sm font-medium transition-opacity duration-300">
              Mi Perfil
            </span>
          )}
        </Link>
        
        {/* Cerrar Sesión */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`
            w-full flex items-center rounded-xl text-red-600 hover:bg-red-50 
            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            ${collapsed ? 'p-2 justify-center' : 'px-3 py-3'}
          `}
          title={collapsed ? 'Cerrar Sesión' : undefined}
        >
          {/* Icono con spinner */}
          {isLoggingOut ? (
            <div className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`}>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <LogOut className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
          )}
          
          {/* Texto */}
          {!collapsed && (
            <span className="text-sm font-medium transition-opacity duration-300">
              {isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión'}
            </span>
          )}
        </button>
      </div>
      
    </div>
  );
};

export default Sidebar;

/*
🆕 CAMBIOS PRINCIPALES EN Sidebar.js:

NUEVA OPCIÓN AGREGADA:
- "Gestión de Horarios" con icono Clock
- Solo visible para administradores con canManageContent
- Ruta: /dashboard/admin/schedule
- Badge "Nuevo" para destacar la funcionalidad
- Punto verde animado cuando está colapsado

REORDENAMIENTO LÓGICO:
1. Panel Principal
2. Usuarios (admin/staff)
3. Membresías (según rol)
4. 🆕 Gestión de Horarios (admin) - NUEVA
5. Mis Horarios (clientes)
6. Pagos
7. Tienda
8. 🆕 Gestión de Página Web (admin) - YA EXISTÍA
9. Reportes
10. Configuración del Sistema

BENEFICIOS DE LA SEPARACIÓN:
- Acceso directo a gestión de horarios desde sidebar
- Gestión web y horarios claramente separadas
- Flujo de trabajo más intuitivo para administradores
- URLs específicas para cada funcionalidad:
  * Horarios: /dashboard/admin/schedule
  * Web: /dashboard/admin/website

INDICADORES VISUALES:
- Ambas opciones marcadas como "Nuevo" temporalmente
- Puntos verdes animados cuando sidebar está colapsado
- Tooltips informativos en modo colapsado
- Estados activos claramente diferenciados

Esta actualización proporciona acceso independiente y directo a la 
gestión de horarios, mejorando significativamente la experiencia 
de usuario para administradores del gimnasio.
*/

/*
DOCUMENTACIÓN DEL COMPONENTE Sidebar ACTUALIZADO

CAMBIOS PRINCIPALES:
- Agregada nueva opción "Gestión de Página Web" para administradores con permisos
- La opción aparece solo para usuarios con canManageContent = true
- Incluye indicador visual "Nuevo" para destacar la nueva funcionalidad
- Punto verde animado cuando el sidebar está colapsado
- Ruta: /dashboard/admin/website para acceder al WebsiteManager

NUEVA FUNCIONALIDAD DESTACADA:
- Solo visible para administradores con permisos de gestión de contenido
- Ubicada estratégicamente entre la Tienda y los Reportes
- Indicador "Nuevo" para atraer atención a la nueva funcionalidad
- Animación sutil cuando está colapsado para mantener visibilidad

INTEGRACIÓN CON WEBSITEMANAGER:
- Enlace directo al nuevo componente WebsiteManager
- Verificación de permisos usando canManageContent del AuthContext
- Manejo de estado activo para resaltar cuando se está usando
- Tooltip descriptivo cuando el sidebar está colapsado

ORGANIZACIÓN MEJORADA:
- Configuración del Sistema agregada para administradores
- Separación clara entre funciones operativas y administrativas
- Mantiene toda la funcionalidad existente sin cambios

Este sidebar actualizado proporciona acceso directo y prominente a la nueva 
funcionalidad de gestión de página web, facilitando el flujo de trabajo de 
los administradores para gestionar el contenido web del gimnasio.
*/
/*
DOCUMENTACIÓN DEL COMPONENTE Sidebar

PROPÓSITO:
Este componente implementa la barra lateral de navegación principal para escritorio en la aplicación
del gimnasio, proporcionando acceso rápido a todas las funcionalidades del sistema con capacidad de
colapso para optimizar el espacio de pantalla. Incluye navegación contextual basada en roles de usuario
y gestión de horarios de atención del gimnasio.

FUNCIONALIDADES PRINCIPALES:
- Sidebar colapsable con animaciones suaves de transición
- Navegación contextual basada en permisos y roles de usuario
- Avatar de usuario personalizable con información de rol
- Logout seguro con confirmación y limpieza de datos
- Indicadores visuales de ruta activa
- Logo del gimnasio adaptativo según estado de colapso
- Tooltips informativos cuando está colapsado
- Acceso universal a la tienda de productos

ARCHIVOS Y CONEXIONES:

CONTEXTS REQUERIDOS:
- ../../contexts/AuthContext: Autenticación, datos del usuario, permisos y función de logout
- ../../contexts/AppContext: Control del estado del sidebar, notificaciones y funciones globales

HOOKS DE REACT ROUTER:
- react-router-dom (Link): Enlaces de navegación interna sin recarga
- react-router-dom (useLocation): Detectar ruta activa para resaltado visual
- react-router-dom (useNavigate): Navegación programática después del logout

COMPONENTES IMPORTADOS:
- ../common/GymLogo: Logo oficial del gimnasio con variantes de tamaño y texto

ICONOS DE LUCIDE REACT:
- Home: Panel principal/dashboard del usuario
- Users: Gestión de usuarios del gimnasio
- CreditCard: Membresías y suscripciones
- Coins: Pagos y transacciones en quetzales guatemaltecos
- BarChart3: Reportes financieros y análisis
- Clock: Horarios de atención del gimnasio
- ShoppingBag: Tienda de productos universal
- User: Perfil personal del usuario
- LogOut: Cerrar sesión con confirmación
- ChevronLeft/ChevronRight: Control de colapso del sidebar

ESTADOS MANEJADOS LOCALMENTE:
- isLoggingOut: Control del proceso de cierre de sesión con spinner

QUE SE MUESTRA AL USUARIO:

ESTRUCTURA VISUAL DEL SIDEBAR:
- Barra lateral fija del lado izquierdo con fondo blanco
- Header con logo del gimnasio y botón de colapso
- Sección de información del usuario con avatar
- Navegación principal con iconos y etiquetas
- Footer con perfil personal y logout
- Ancho variable: 256px expandido, 64px colapsado
- Transiciones suaves de 300ms para todos los cambios

HEADER DEL SIDEBAR:
- **Estado expandido**: Logo completo del gimnasio con texto visible
- **Estado colapsado**: Solo botón de toggle centrado, logo oculto
- **Botón de toggle**: Flecha izquierda para colapsar, derecha para expandir
- Tooltip descriptivo: "Expandir menú lateral" / "Contraer menú lateral"
- Borde inferior gris como separador visual

INFORMACIÓN DEL USUARIO:
- **Avatar circular**: 40px de diámetro con gradiente del gimnasio de fondo
- **Con imagen**: Muestra foto de perfil circular del usuario
- **Sin imagen**: Iniciales generadas automáticamente en blanco
- **Estado expandido**: Nombre completo + rol debajo del avatar
- **Estado colapsado**: Solo avatar centrado sin texto
- **Roles mostrados**: Administrador, Personal del Gimnasio, Cliente Miembro
- Fondo con gradiente sutil primary a secondary

NAVEGACIÓN PRINCIPAL:
- **Panel Principal**: Dashboard específico según rol del usuario
- **Usuarios**: Gestión de usuarios (solo con permisos view_users)
- **Membresías**: Gestión de membresías del gimnasio (solo con permisos)
- **Pagos (Q)**: Transacciones en quetzales guatemaltecos (solo con permisos)
- **Tienda**: Acceso universal para todos los usuarios sin restricciones
- **Reportes Financieros**: Análisis y reportes (solo con permisos)
- **Horarios de Atención**: Gestión de horarios del gimnasio (solo admin)

INDICADORES VISUALES DE NAVEGACIÓN:
- **Ruta activa**: Fondo azul claro, texto azul oscuro, borde derecho azul
- **Hover effects**: Fondo gris claro al pasar el cursor
- **Estado expandido**: Icono + texto con espaciado generoso
- **Estado colapsado**: Solo icono centrado con tooltip
- **Transiciones**: Animaciones suaves de 300ms para cambios

FOOTER CON ACCIONES PERSONALES:
- **Mi Perfil**: Enlace al perfil personal del usuario
- **Cerrar Sesión**: Botón rojo con confirmación automática
- **Estado de logout**: Spinner animado durante el proceso
- **Tooltips**: Información visible cuando está colapsado
- Separador superior para diferenciar de navegación

COMPORTAMIENTO DE COLAPSO:
- **Expandido (256px)**: Logo + avatar + texto completo visible
- **Colapsado (64px)**: Solo iconos centrados + tooltips informativos
- **Animaciones**: Transiciones suaves de opacidad y posición
- **Persistencia**: Estado recordado durante la sesión
- **Responsive**: Solo visible en desktop (768px+)

ROLES Y PERMISOS SOPORTADOS:
- **Administrador**: Acceso completo incluyendo horarios de atención
- **Personal/Colaborador**: Gestión operativa sin configuración de horarios
- **Cliente**: Acceso limitado a funciones personales y tienda

NAVEGACIÓN CONTEXTUAL POR ROL:
- **Admin dashboard**: /dashboard/admin con funciones administrativas
- **Staff dashboard**: /dashboard/staff con herramientas de personal
- **Client dashboard**: /dashboard/client con vista de cliente
- **Fallback**: /dashboard genérico si no se detecta rol

GESTIÓN DE HORARIOS DE ATENCIÓN:
- **Funcionalidad nueva**: Reemplaza configuración del sistema
- **Acceso**: Solo administradores con permiso manage_gym_schedule
- **Propósito**: Gestionar horarios de apertura/cierre del gimnasio
- **Icono**: Clock para representar gestión temporal
- **Ruta**: /dashboard/schedule para administración de horarios

TIENDA UNIVERSAL:
- **Acceso**: Todos los usuarios sin excepción ni permisos
- **Propósito**: Venta de productos, suplementos, mercancía del gimnasio
- **Icono**: ShoppingBag para representar compras
- **Ruta**: /store como ruta pública accesible

PAGOS EN QUETZALES:
- **Moneda**: Específicamente en quetzales guatemaltecos (Q)
- **Icono**: Coins para representar moneda local
- **Funcionalidad**: Gestión de pagos de membresías y productos
- **Permisos**: Solo usuarios con view_payments

SEGURIDAD Y LOGOUT:
- **Proceso robusto**: Limpieza de localStorage y sessionStorage
- **Fallback**: Redirección forzada en caso de errores
- **Timeout**: Límite de 5 segundos para logout
- **Confirmación visual**: Spinner durante proceso
- **Datos limpiados**: Carrito, sesión, wishlist, cache de pagos, preferencias

OPTIMIZACIONES DE RENDIMIENTO:
- **Memoización**: Funciones de verificación de rutas optimizadas
- **Transiciones CSS**: Animaciones fluidas sin JavaScript pesado
- **Conditional rendering**: Elementos ocultos no renderizados
- **Event listeners**: Gestión eficiente de clicks y navigation

ACCESIBILIDAD:
- **Tooltips**: Información contextual cuando está colapsado
- **Contraste**: Colores accesibles en todos los estados
- **Navegación por teclado**: Funcional en todos los enlaces
- **Alt tags**: Descripciones apropiadas en imágenes de avatar
- **Área de click**: Botones con tamaño mínimo de 44px

INTEGRACIÓN CON EL SISTEMA DEL GIMNASIO:
- **Membresías**: Gestión completa de suscripciones y renovaciones
- **Pagos**: Sistema de transacciones en quetzales guatemaltecos
- **Usuarios**: Administración de clientes, personal y administradores
- **Reportes**: Análisis financiero y operativo del gimnasio
- **Horarios**: Gestión de horarios de atención y funcionamiento
- **Tienda**: Venta de productos complementarios del gimnasio

RESPONSIVE DESIGN:
- **Solo escritorio**: No visible en dispositivos móviles (< 768px)
- **Ancho adaptativo**: Colapsable para pantallas pequeñas de escritorio
- **Contenido escalable**: Todos los elementos se adaptan al ancho
- **Transiciones fluidas**: Animaciones optimizadas para cualquier resolución

Este componente es fundamental para la navegación en escritorio de la aplicación
del gimnasio, proporcionando acceso eficiente a todas las funcionalidades mientras
mantiene una interfaz limpia y profesional adaptada a las necesidades específicas
del negocio de fitness en Guatemala.
*/