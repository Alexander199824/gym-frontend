// Autor: Alexander Echeverria
// src/components/layout/Sidebar.js
// FUNCIÓN: Sidebar solo para desktop con navegación colapsable
// ACTUALIZADO: Con inventario separado, sin badges

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
  Settings,
  Package,
  Receipt
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
    
    // Gestión de Horarios - Solo para administradores con permisos
    if (canManageContent && user?.role === 'admin') {
      baseItems.push({
        id: 'schedule_manager',
        label: 'Gestión de Horarios',
        icon: Clock,
        path: '/dashboard/admin/schedule',
        show: true
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

    // 💰 Gastos - Solo para administradores y personal con permisos
    if (hasPermission('view_expenses')) {
      baseItems.push({
        id: 'expenses',
        label: 'Gastos',
        icon: Receipt,
        path: '/dashboard/expenses',
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
    
    // INVENTARIO Y VENTAS - Solo para administradores con permisos
    if (canManageContent && user?.role === 'admin') {
      baseItems.push({
        id: 'inventory_manager',
        label: 'Inventario y Ventas',
        icon: Package,
        path: '/dashboard/admin/inventory',
        show: true
      });
    }
    
    // Gestión de Página Web - Solo para administradores con permisos
    if (canManageContent && user?.role === 'admin') {
      baseItems.push({
        id: 'website_manager',
        label: 'Gestión de Página Web',
        icon: Globe,
        path: '/dashboard/admin/website',
        show: true
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
🆕 CAMBIOS PRINCIPALES EN MobileMenu.js:

NUEVA OPCIÓN AGREGADA:
- "Gestión de Horarios" para administradores con permisos
- Icono Clock con color orange (text-orange-600)
- Badge "Nuevo" con animación pulse
- Ruta: /dashboard/admin/schedule
- Solo visible para administradores con canManageContent

ACCESOS RÁPIDOS ACTUALIZADOS:
- Para administradores: "Horarios" apunta a la nueva gestión independiente
- Se mantienen "Página Web" y otras acciones existentes
- Reordenamiento lógico de acciones por importancia

REORDENAMIENTO DE NAVEGACIÓN:
1. Panel Principal
2. Usuarios (admin/staff)
3. Membresías (según rol)
4. Gestión de Horarios (admin) - NUEVA
5. Mis Horarios (clientes)
6. Pagos
7. Tienda
8. Gestión de Página Web (admin)
9. Reportes
10. Configuración Personal

INDICADORES VISUALES MEJORADOS:
- Badge "Nuevo" con animación pulse para destacar
- Punto verde animado en esquina para nueva funcionalidad
- Colores diferenciados por tipo de funcionalidad
- Estados activos claramente marcados

BÚSQUEDA COMPATIBLE:
- La nueva opción es totalmente compatible con el sistema de búsqueda
- Aparece en resultados al buscar "horarios", "gestión", etc.
- Mantiene todos los filtros y funcionalidades existentes

EXPERIENCIA MÓVIL OPTIMIZADA:
- Navegación táctil mejorada para la nueva opción
- Indicadores visuales claros en pantallas pequeñas
- Accesos rápidos reorganizados para mejor usabilidad
- Historial de páginas recientes incluye la nueva página

Esta actualización del menú móvil proporciona acceso completo e 
intuitivo a la nueva gestión de horarios independiente, manteniendo 
la excelente experiencia móvil mientras organiza mejor las opciones 
administrativas por categorías lógicas.
*/
/*
DOCUMENTACIÓN DEL COMPONENTE MobileMenu ACTUALIZADO

CAMBIOS PRINCIPALES:
- Agregada nueva opción "Gestión de Página Web" para administradores con permisos
- La opción aparece solo para usuarios con canManageContent = true
- Incluye badge "Nuevo" con animación pulse para destacar la funcionalidad
- Punto verde animado en la esquina superior derecha del elemento
- Agregada como acción rápida para administradores

NUEVA FUNCIONALIDAD DESTACADA:
- Solo visible para administradores con permisos de gestión de contenido
- Badge "Nuevo" con animación especial para atraer atención
- Incluida en accesos rápidos para administradores
- Color azul distintivo (text-blue-500) para diferenciarse
- Indicador visual especial con punto verde animado

INTEGRACIÓN CON WEBSITEMANAGER:
- Enlace directo al nuevo componente WebsiteManager
- Verificación de permisos usando canManageContent del AuthContext
- Manejo de estado activo para resaltar cuando se está usando
- Búsqueda compatible con el nuevo elemento

ACCESOS RÁPIDOS MEJORADOS:
- Para administradores: se agregó "Página Web" como segunda opción
- Enlace directo a /dashboard/admin/website
- Icono Globe para representar gestión web
- Manejo de navegación optimizado

CARACTERÍSTICAS VISUALES:
- Badge "Nuevo" con fondo verde y animación pulse
- Punto indicador animado en esquina superior derecha
- Color azul especial para diferenciarse de otras opciones
- Integración perfecta con el sistema de búsqueda existente

Este menú móvil actualizado proporciona acceso rápido y destacado a la nueva 
funcionalidad de gestión de página web, manteniendo la experiencia móvil 
optimizada mientras destaca visualmente las nuevas características para 
los administradores del gimnasio.
*/
/*
DOCUMENTACIÓN DEL COMPONENTE MobileMenu

PROPÓSITO:
Este componente implementa el menú de navegación móvil deslizable para la aplicación del gimnasio,
optimizado para dispositivos móviles con navegación por gestos, búsqueda integrada y accesos
rápidos contextuales según el rol del usuario. Incluye optimizaciones de rendimiento para
evitar errores de timeout y re-renders innecesarios.

FUNCIONALIDADES PRINCIPALES:
- Menú deslizable responsive desde el lado izquierdo
- Sistema de búsqueda integrado en tiempo real
- Navegación contextual basada en roles de usuario
- Accesos rápidos personalizados por tipo de usuario
- Historial de páginas visitadas recientemente
- Avatar personalizable con indicador de estado
- Logout seguro con confirmación y limpieza de datos
- Optimizaciones de rendimiento con React.memo y hooks memoizados

ARCHIVOS Y CONEXIONES:

CONTEXTS REQUERIDOS:
- ../../contexts/AuthContext: Autenticación, datos del usuario, permisos y función de logout

HOOKS DE REACT ROUTER:
- react-router-dom (Link): Enlaces de navegación interna
- react-router-dom (useLocation): Detectar ruta activa para resaltado
- react-router-dom (useNavigate): Navegación programática

COMPONENTES IMPORTADOS:
- ../common/GymLogo: Logo oficial del gimnasio con variantes de tamaño

ICONOS DE LUCIDE REACT:
- X: Botón cerrar menú y limpiar búsqueda
- Home: Panel principal/dashboard
- Users: Gestión de usuarios
- CreditCard: Membresías del gimnasio
- DollarSign: Pagos y transacciones en quetzales
- BarChart3: Reportes y análisis
- Settings: Configuración personal del usuario
- LogOut: Cerrar sesión
- User: Perfil personal
- Calendar: Clases y citas
- Search: Búsqueda en menú
- ChevronRight: Indicador de navegación
- Bell: Notificaciones
- ShoppingCart: Tienda de productos
- Package: Inventario
- Star: Progreso del usuario
- TrendingUp: Estadísticas
- Clock: Horarios y páginas recientes
- HelpCircle: Ayuda y soporte
- Phone: Contacto

ESTADOS MANEJADOS LOCALMENTE:
- searchTerm: Término de búsqueda actual en el menú
- showSearch: Control de visibilidad de barra de búsqueda
- recentPages: Historial de páginas visitadas recientemente (máximo 3)
- isLoggingOut: Control del proceso de cierre de sesión

QUE SE MUESTRA AL USUARIO:

ESTRUCTURA VISUAL DEL MENÚ:
- Menú deslizable de ancho completo desde el lado izquierdo
- Header con logo del gimnasio, título "Menú" y rol del usuario
- Botones de búsqueda y cerrar en la esquina superior derecha
- Barra de búsqueda expandible con placeholder "Buscar en el menú..."
- Sección de información del usuario con avatar y estado
- Grid de accesos rápidos (3 columnas) según rol
- Lista de navegación principal con iconos y badges
- Historial de páginas recientes (cuando aplique)
- Footer con enlaces adicionales y logout

HEADER DEL MENÚ:
- Logo pequeño del gimnasio en variante profesional
- Título "Menú" con rol del usuario debajo
- Botón de búsqueda que activa/desactiva la barra
- Botón X para cerrar el menú completo
- Fondo con gradiente sutil de primary a secondary

INFORMACIÓN DEL USUARIO:
- Avatar circular de 48px con imagen de perfil o iniciales generadas
- Indicador verde de estado "En línea" en esquina del avatar
- Nombre completo del usuario (truncado si es muy largo)
- Rol del usuario (Administrador/Personal/Cliente)
- Estado "En línea" en color primary
- Fondo con gradiente gris sutil

ACCESOS RÁPIDOS POR ROL:
- **Administrador**: Estadísticas, Notificaciones, Inventario
- **Personal**: Horarios, Clientes, Citas
- **Cliente**: Mis Clases, Progreso, Tienda
- Grid de 3 columnas con iconos grandes y etiquetas
- Fondos grises con hover effects

NAVEGACIÓN PRINCIPAL:
- Panel Principal: Enlace al dashboard correspondiente según rol
- Usuarios: Gestión de usuarios (con permisos)
- Membresías: Gestión de membresías del gimnasio (con permisos)
- Pagos: Transacciones y pagos en quetzales (con permisos)
- Tienda: Acceso universal con badges contextuales
- Reportes: Análisis y reportes (con permisos)
- Configuración Personal: Preferencias del usuario
- Indicador visual de ruta activa con borde izquierdo azul
- Badges rojos para notificaciones o estados especiales

HISTORIAL RECIENTE:
- Máximo 3 páginas visitadas recientemente
- Icono de reloj con nombre de la página
- Solo visible cuando hay historial y no hay búsqueda activa
- Ordenado por timestamp de visita

BÚSQUEDA INTEGRADA:
- Barra expandible con icono de lupa
- Búsqueda en tiempo real por nombre de elementos del menú
- Botón X para limpiar término de búsqueda
- Mensaje "No se encontraron resultados" cuando no hay coincidencias
- Focus automático al expandir la búsqueda

FOOTER CON ENLACES ADICIONALES:
- Mi Perfil: Enlace al perfil personal del usuario
- Ayuda y Soporte: Acceso a documentación y soporte
- Contacto: Información de contacto del gimnasio
- Cerrar Sesión: Botón rojo con confirmación obligatoria
- Spinner animado durante proceso de logout

TIENDA UNIVERSAL:
- Accesible para todos los roles de usuario sin excepción
- Badge contextual: "Comprar" para clientes, "Gestionar" para admin, "Ver" para personal
- Icono de carrito de compras en color rosa
- Enlace directo a la tienda de productos del gimnasio

ROLES Y PERMISOS SOPORTADOS:
- **Administrador**: Acceso completo a gestión, reportes y configuración
- **Personal/Colaborador**: Acceso a gestión de clientes y operaciones
- **Cliente**: Acceso a funciones personales y tienda

INTERACCIONES DISPONIBLES:
- Tap en cualquier elemento de navegación navega y cierra menú
- Tap en búsqueda despliega/oculta barra de búsqueda
- Tap en X cierra menú completamente
- Búsqueda filtra elementos en tiempo real
- Confirmación obligatoria antes de logout
- Swipe para cerrar menú (gestionado por componente padre)

OPTIMIZACIONES DE RENDIMIENTO:
- Componente completamente memoizado con React.memo
- Funciones de navegación memoizadas con useCallback
- Datos de usuario y menú memoizados con useMemo
- Elementos filtrados memoizados para búsqueda eficiente
- Event listeners optimizados con cleanup automático
- Estados estables que previenen re-renders infinitos

CARACTERÍSTICAS DE ACCESIBILIDAD:
- Todos los botones tienen type="button" explícito
- Alt tags apropiados en imágenes de avatar
- Focus automático en campo de búsqueda
- Navegación clara con indicadores visuales
- Contraste adecuado en todos los elementos

GESTIÓN DE MEMORIA:
- Cleanup automático de timeouts y event listeners
- Prevención de memory leaks con useCallback y useMemo
- Estados locales mínimos necesarios
- Referencias optimizadas con cleanup

INTEGRACIÓN CON EL SISTEMA DEL GIMNASIO:
- Navegación específica para entidades del gimnasio
- Roles contextuales para gestión de permisos
- Enlaces a pagos en quetzales guatemaltecos
- Acceso a inventario y productos del gimnasio
- Gestión de membresías y clientes
- Reportes financieros y operativos

SEGURIDAD Y LOGOUT:
- Confirmación obligatoria antes de cerrar sesión
- Limpieza automática de localStorage y sessionStorage
- Fallback robusto en caso de errores de logout
- Redirección forzada después de cierre exitoso
- Prevención de clicks múltiples durante logout

Este componente es esencial para la experiencia móvil en la aplicación del gimnasio,
proporcionando navegación completa, búsqueda eficiente y accesos rápidos optimizados
según el tipo de usuario, todo con rendimiento optimizado para dispositivos móviles.
*/