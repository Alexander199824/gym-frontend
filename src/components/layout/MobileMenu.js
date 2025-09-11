// Autor: Alexander Echeverria
// src/components/layout/MobileMenu.js
// FUNCIÓN: Menú móvil optimizado para rendimiento sin errores de timeout
// ACTUALIZADO: Con gestión de horarios separada del gestor web

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, 
  Home, 
  Users, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  User,
  Calendar,
  Search,
  ChevronRight,
  Bell,
  ShoppingCart,
  Package,
  Star,
  TrendingUp,
  Clock,
  HelpCircle,
  Phone,
  Timer,
  Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GymLogo from '../common/GymLogo';

const MobileMenu = React.memo(({ onClose }) => {
  const { user, logout, hasPermission, canManageContent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados locales optimizados
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [recentPages, setRecentPages] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Memoizar datos del usuario para evitar re-renders
  const userStats = useMemo(() => {
    if (!user) return {
      name: 'Usuario',
      initials: 'U',
      role: 'Cliente',
      avatar: null
    };
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const userRole = user.role || 'cliente';
    
    return {
      name: firstName && lastName ? `${firstName} ${lastName}` : 'Usuario',
      initials: firstName && lastName ? `${firstName[0]}${lastName[0]}` : 'U',
      role: userRole === 'admin' ? 'Administrador' : 
            userRole === 'colaborador' ? 'Personal' : 'Cliente',
      avatar: user.profileImage
    };
  }, [user]);
  
  // Función memoizada: Verificar rutas activas
  const isActiveRoute = useCallback((path) => location.pathname === path, [location.pathname]);
  const isActiveSection = useCallback((paths) => paths.some(path => location.pathname.startsWith(path)), [location.pathname]);
  
  // Función memoizada: Obtener ruta del dashboard
  const getDashboardPath = useCallback(() => {
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
  }, [user?.role]);
  
  // Verificar secciones específicas del cliente
  const isActiveMembershipSection = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/dashboard/client' && searchParams.get('section') === 'membership';
  }, [location]);
  
  const isActiveScheduleSection = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/dashboard/client' && searchParams.get('section') === 'schedule';
  }, [location]);
  
  // Memoizar elementos del menú para evitar re-renders
  const menuItems = useMemo(() => {
    const baseItems = [
      {
        id: 'dashboard',
        label: 'Panel Principal',
        icon: Home,
        path: getDashboardPath(),
        show: true,
        badge: null,
        color: 'text-blue-600'
      }
    ];
    
    // Usuarios
    if (hasPermission('view_users')) {
      baseItems.push({
        id: 'users',
        label: 'Usuarios',
        icon: Users,
        path: '/dashboard/users',
        show: true,
        badge: null,
        color: 'text-green-600'
      });
    }
    
    // Membresías (Admin/Staff: gestión, Cliente: mi membresía)
    if (hasPermission('view_memberships')) {
      baseItems.push({
        id: 'memberships',
        label: 'Membresías',
        icon: CreditCard,
        path: '/dashboard/memberships',
        show: true,
        badge: null,
        color: 'text-purple-600'
      });
    } else if (user?.role === 'cliente') {
      baseItems.push({
        id: 'my_membership',
        label: 'Mi Membresía',
        icon: CreditCard,
        path: '/dashboard/client?section=membership',
        show: true,
        badge: null,
        color: 'text-purple-600'
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
        badge: 'Nuevo',
        color: 'text-orange-600',
        isNew: true
      });
    }
    
    // Horarios (Cliente: mis horarios)
    if (user?.role === 'cliente') {
      baseItems.push({
        id: 'my_schedule',
        label: 'Mis Horarios',
        icon: Timer,
        path: '/dashboard/client?section=schedule',
        show: true,
        badge: null,
        color: 'text-orange-600'
      });
    }
    
    // Pagos
    if (hasPermission('view_payments')) {
      baseItems.push({
        id: 'payments',
        label: 'Pagos',
        icon: DollarSign,
        path: '/dashboard/payments',
        show: true,
        badge: null,
        color: 'text-yellow-600'
      });
    }
    
    // Tienda - Disponible para todos los usuarios
    baseItems.push({
      id: 'store',
      label: 'Tienda',
      icon: ShoppingCart,
      path: '/store',
      show: true,
      badge: user?.role === 'cliente' ? 'Comprar' : user?.role === 'admin' ? 'Gestionar' : 'Ver',
      color: 'text-pink-600'
    });
    
    // 🆕 GESTIÓN DE PÁGINA WEB - Solo para administradores con permisos
    if (canManageContent && user?.role === 'admin') {
      baseItems.push({
        id: 'website_manager',
        label: 'Gestión de Página Web',
        icon: Globe,
        path: '/dashboard/admin/website',
        show: true,
        badge: 'Nuevo',
        color: 'text-blue-500',
        isNew: true
      });
    }
    
    // Reportes
    if (hasPermission('view_reports')) {
      baseItems.push({
        id: 'reports',
        label: 'Reportes',
        icon: BarChart3,
        path: '/dashboard/reports',
        show: true,
        badge: null,
        color: 'text-indigo-600'
      });
    }
    
    // Configuración Personal
    baseItems.push({
      id: 'personal_settings',
      label: 'Configuración Personal',
      icon: Settings,
      path: '/dashboard/profile/settings',
      show: true,
      badge: null,
      color: 'text-gray-600'
    });
    
    return baseItems.filter(item => item.show);
  }, [hasPermission, user?.role, getDashboardPath, canManageContent]);
  
  // Memoizar elementos filtrados
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return menuItems;
    return menuItems.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menuItems, searchTerm]);
  
  // Memoizar accesos rápidos según el rol
  const quickActions = useMemo(() => {
    const actions = [];
    const userRole = user?.role;
    
    if (userRole === 'admin') {
      actions.push(
        { icon: TrendingUp, label: 'Estadísticas', path: '/dashboard/analytics' },
        { icon: Clock, label: 'Horarios', path: '/dashboard/admin/schedule' }, // 🆕 Nueva acción rápida
        { icon: Globe, label: 'Página Web', path: '/dashboard/admin/website' },
        { icon: Bell, label: 'Notificaciones', path: '/dashboard/notifications' },
        { icon: Package, label: 'Inventario', path: '/dashboard/inventory' }
      );
    } else if (userRole === 'colaborador') {
      actions.push(
        { icon: Clock, label: 'Horarios', path: '/dashboard/schedule' },
        { icon: Users, label: 'Clientes', path: '/dashboard/clients' },
        { icon: Calendar, label: 'Citas', path: '/dashboard/appointments' }
      );
    } else {
      actions.push(
        { icon: CreditCard, label: 'Mi Membresía', path: '/dashboard/client?section=membership' },
        { icon: Timer, label: 'Mis Horarios', path: '/dashboard/client?section=schedule' },
        { icon: ShoppingCart, label: 'Tienda', path: '/store' }
      );
    }
    
    return actions;
  }, [user?.role]);
  
  // Función memoizada: Manejar navegación
  const handleNavigation = useCallback((path, label) => {
    // Guardar en páginas recientes
    setRecentPages(prev => {
      const filtered = prev.filter(page => page.path !== path);
      return [{ path, label, timestamp: Date.now() }, ...filtered].slice(0, 3);
    });
    
    onClose();
  }, [onClose]);
  
  // Función memoizada: Logout mejorado
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      try {
        setIsLoggingOut(true);
        onClose();
        
        // Limpiar datos locales antes del logout
        try {
          localStorage.removeItem('elite_fitness_cart');
          localStorage.removeItem('elite_fitness_session_id');
          localStorage.removeItem('elite_fitness_wishlist');
        } catch (error) {
          console.warn('Error limpiando datos locales:', error);
        }
        
        await logout();
        
        // Forzar redirección después del logout
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        
      } catch (error) {
        console.error('Error de logout móvil:', error);
        // Fallback robusto
        localStorage.clear();
        window.location.href = '/login';
      } finally {
        setIsLoggingOut(false);
      }
    }
  }, [isLoggingOut, onClose, logout]);
  
  // Función memoizada: Toggle búsqueda
  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
  }, []);
  
  // Función memoizada: Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);
  
  // Effect para foco de búsqueda - optimizado
  useEffect(() => {
    if (showSearch) {
      const searchInput = document.getElementById('mobile-search');
      if (searchInput) {
        // Usar setTimeout para evitar conflictos de render
        const timer = setTimeout(() => searchInput.focus(), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [showSearch]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      
      {/* Header del menú */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="flex items-center space-x-3">
          <GymLogo size="sm" variant="professional" showText={false} priority="high" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Menú</h2>
            <p className="text-xs text-gray-500">{userStats.role}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Botón de búsqueda */}
          <button
            onClick={toggleSearch}
            className={`p-2 rounded-lg transition-colors ${
              showSearch ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Barra de búsqueda expandible */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="mobile-search"
              type="text"
              placeholder="Buscar en el menú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Información del usuario */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {userStats.avatar ? (
              <img 
                src={userStats.avatar} 
                alt={userStats.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">
                  {userStats.initials}
                </span>
              </div>
            )}
            {/* Indicador de estado */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {userStats.name}
            </div>
            <div className="text-xs text-gray-500">
              {userStats.role}
            </div>
            <div className="text-xs text-primary-600 font-medium">
              En línea
            </div>
          </div>
        </div>
      </div>
      
      {/* Accesos rápidos */}
      {quickActions.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Accesos Rápidos
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(action.path, action.label)}
                className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                type="button"
              >
                <action.icon className="w-6 h-6 text-primary-600 mb-1" />
                <span className="text-xs font-medium text-gray-700 text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Navegación principal */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => {
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
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.label)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                type="button"
              >
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 mr-3 ${item.color || 'text-current'}`} />
                  <span>{item.label}</span>
                  
                  {/* Badges */}
                  {item.badge && (
                    <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full ${
                      item.isNew 
                        ? 'bg-green-100 text-green-800 animate-pulse' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                
                {/* Indicador especial para nueva funcionalidad */}
                {item.isNew && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Páginas recientes */}
        {recentPages.length > 0 && !searchTerm && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Visitado Recientemente
            </h3>
            <div className="space-y-1">
              {recentPages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(page.path, page.label)}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  type="button"
                >
                  <Clock className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{page.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Sin resultados de búsqueda */}
        {searchTerm && filteredMenuItems.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No se encontraron resultados para "{searchTerm}"
            </p>
          </div>
        )}
      </nav>
      
      {/* Enlaces adicionales y acciones */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
        
        {/* Mi Perfil */}
        <button
          onClick={() => handleNavigation('/dashboard/profile', 'Mi Perfil')}
          className={`
            w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors
            ${isActiveRoute('/dashboard/profile')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-white hover:text-gray-900'
            }
          `}
          type="button"
        >
          <User className="w-5 h-5 mr-3" />
          <span>Mi Perfil</span>
        </button>
        
        {/* Ayuda y Soporte */}
        <button
          onClick={() => handleNavigation('/help', 'Ayuda')}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
          type="button"
        >
          <HelpCircle className="w-5 h-5 mr-3" />
          <span>Ayuda y Soporte</span>
        </button>
        
        {/* Contacto */}
        <button
          onClick={() => handleNavigation('/contact', 'Contacto')}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
          type="button"
        >
          <Phone className="w-5 h-5 mr-3" />
          <span>Contacto</span>
        </button>
        
        {/* Cerrar Sesión */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          {isLoggingOut ? (
            <>
              <div className="w-5 h-5 mr-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
              </div>
              <span>Cerrando sesión...</span>
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5 mr-3" />
              <span>Cerrar Sesión</span>
            </>
          )}
        </button>
      </div>
      
    </div>
  );
});

MobileMenu.displayName = 'MobileMenu';

export default MobileMenu;

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
4. 🆕 Gestión de Horarios (admin) - NUEVA
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