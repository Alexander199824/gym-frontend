// Autor: Alexander Echeverria
// src/components/layout/MobileMenu.js
// FUNCIÓN: Menú móvil deslizable con navegación completa

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X,
  Home, 
  Users, 
  CreditCard, 
  Coins,
  BarChart3, 
  Clock,
  LogOut,
  User,
  ShoppingBag,
  Timer,
  Globe,
  Settings,
  Package,
  TrendingDown,
  Search,
  ChevronRight,
  Heart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import GymLogo from '../common/GymLogo';

const MobileMenu = React.memo(({ onClose }) => {
  const { user, logout, hasPermission, canManageContent } = useAuth();
  const { showSuccess, showError } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [recentPages, setRecentPages] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // ✅ DEFINIR getDashboardPath PRIMERO (antes de usarlo en menuItems)
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
  
  // Guardar página actual en historial
  useEffect(() => {
    const currentPath = location.pathname;
    const pathName = getPathName(currentPath);
    
    if (pathName && !recentPages.some(page => page.path === currentPath)) {
      setRecentPages(prev => {
        const updated = [
          { path: currentPath, name: pathName, timestamp: Date.now() },
          ...prev.filter(page => page.path !== currentPath)
        ].slice(0, 3);
        return updated;
      });
    }
  }, [location.pathname]);
  
  // Obtener nombre amigable de la ruta
  const getPathName = (path) => {
    const routes = {
      '/dashboard/admin': 'Panel de Administración',
      '/dashboard/staff': 'Panel de Personal',
      '/dashboard/client': 'Mi Panel',
      '/dashboard/users': 'Usuarios',
      '/dashboard/memberships': 'Membresías',
      '/dashboard/payments': 'Pagos',
      '/dashboard/expenses': 'Gastos',
      '/dashboard/reports': 'Reportes',
      '/dashboard/profile': 'Mi Perfil',
      '/dashboard/admin/schedule': 'Gestión de Horarios',
      '/dashboard/admin/inventory': 'Inventario y Ventas',
      '/dashboard/admin/website': 'Gestión Web',
      '/dashboard/admin/settings': 'Configuración del Sistema',
      '/store': 'Tienda'
    };
    return routes[path] || null;
  };
  
  // Obtener elementos del menú según el rol - MEMOIZADO (AHORA getDashboardPath ya está definido)
  const menuItems = useMemo(() => {
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
      baseItems.push({
        id: 'memberships',
        label: 'Membresías',
        icon: CreditCard,
        path: '/dashboard/memberships',
        show: true
      });
    } else if (user?.role === 'cliente') {
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
      baseItems.push({
        id: 'my_schedule',
        label: 'Mis Horarios',
        icon: Timer,
        path: '/dashboard/client?section=schedule',
        show: true
      });
      
      // ✅ Mis Reseñas para clientes
      baseItems.push({
        id: 'my_testimonials',
        label: 'Mis Reseñas',
        icon: Heart,
        path: '/dashboard/client?section=testimonials',
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
    
    // Gastos - Solo para administradores
    if (user?.role === 'admin') {
      baseItems.push({
        id: 'expenses',
        label: 'Gastos',
        icon: TrendingDown,
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
      show: true,
      badge: user?.role === 'cliente' ? 'Comprar' : 
             user?.role === 'admin' ? 'Gestionar' : 'Ver'
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
  }, [user?.role, hasPermission, canManageContent, getDashboardPath]);
  
  // Verificar si estamos en las secciones específicas del cliente
  const isActiveMembershipSection = () => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/dashboard/client' && searchParams.get('section') === 'membership';
  };
  
  const isActiveScheduleSection = () => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/dashboard/client' && searchParams.get('section') === 'schedule';
  };
  
  // ✅ Verificar si estamos en la sección de testimonials
  const isActiveTestimonialsSection = () => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/dashboard/client' && searchParams.get('section') === 'testimonials';
  };
  
  // Verificar si una ruta está activa
  const isActiveRoute = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);
  
  // Filtrar elementos del menú según búsqueda - MEMOIZADO
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) return menuItems;
    
    const search = searchTerm.toLowerCase();
    return menuItems.filter(item => 
      item.label.toLowerCase().includes(search)
    );
  }, [menuItems, searchTerm]);
  
  // Navegación con cierre - MEMOIZADA
  const handleNavigate = useCallback((path) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);
  
  // Manejar logout robusto - MEMOIZADO
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    if (!window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      return;
    }
    
    try {
      setIsLoggingOut(true);
      console.log('MobileMenu: Iniciando cierre de sesión...');
      
      // Limpiar datos locales antes del logout
      try {
        localStorage.removeItem('elite_fitness_cart');
        localStorage.removeItem('elite_fitness_session_id');
        localStorage.removeItem('elite_fitness_wishlist');
        localStorage.removeItem('elite_fitness_payments_cache');
        localStorage.removeItem('elite_fitness_user_preferences');
        console.log('MobileMenu: Datos locales limpiados');
      } catch (localStorageError) {
        console.warn('MobileMenu: Error limpiando localStorage:', localStorageError);
      }
      
      // Llamar al logout del contexto con timeout
      const logoutPromise = logout();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en cierre de sesión')), 5000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      
      console.log('MobileMenu: Cierre de sesión exitoso');
      showSuccess && showSuccess('Sesión cerrada correctamente');
      
      // Cerrar menú y navegar
      onClose();
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('MobileMenu: Error durante cierre de sesión:', error);
      
      // Fallback robusto
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('MobileMenu: Forzando redirección...');
        showError && showError('Cerrando sesión...');
        
        onClose();
        window.location.href = '/login';
        
      } catch (fallbackError) {
        console.error('MobileMenu: Error en fallback:', fallbackError);
        window.location.reload();
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, showSuccess, showError, onClose, navigate]);
  
  // Toggle búsqueda
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => {
        document.getElementById('mobile-menu-search')?.focus();
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* HEADER */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <GymLogo size="sm" variant="professional" showText={false} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'colaborador' ? 'Personal' : 'Cliente'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleSearch}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Barra de búsqueda */}
        {showSearch && (
          <div className="relative">
            <input
              id="mobile-menu-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el menú..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* INFORMACIÓN DEL USUARIO */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-elite-gradient rounded-full flex items-center justify-center relative">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-white">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </span>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
            </div>
            <div className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'Administrador' : 
               user?.role === 'colaborador' ? 'Personal del Gimnasio' : 'Cliente Miembro'}
            </div>
            <div className="text-xs text-primary-600 font-medium mt-0.5">
              En línea
            </div>
          </div>
        </div>
      </div>
      
      {/* NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 overflow-y-auto p-4">
        {searchTerm && (
          <div className="mb-3">
            <p className="text-xs text-gray-500">
              {filteredMenuItems.length} resultado{filteredMenuItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
        
        <div className="space-y-1">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => {
              // Verificar si está activo - incluir secciones específicas para cliente
              let isActive = false;
              
              if (item.id === 'my_membership') {
                isActive = isActiveMembershipSection();
              } else if (item.id === 'my_schedule') {
                isActive = isActiveScheduleSection();
              } else if (item.id === 'my_testimonials') {
                isActive = isActiveTestimonialsSection();
              } else {
                isActive = isActiveRoute(item.path);
              }
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${item.badge === 'Comprar' ? 'bg-pink-100 text-pink-700' :
                          item.badge === 'Gestionar' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                No se encontraron resultados
              </p>
            </div>
          )}
        </div>
        
        {/* PÁGINAS RECIENTES */}
        {!searchTerm && recentPages.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Páginas Recientes
            </h3>
            <div className="space-y-1">
              {recentPages.map((page, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleNavigate(page.path)}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm truncate">{page.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
      
      {/* FOOTER CON ENLACES ADICIONALES */}
      <div className="border-t border-gray-200 p-4 space-y-2 bg-gray-50">
        
        <button
          type="button"
          onClick={() => handleNavigate('/dashboard/profile')}
          className={`
            w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
            ${isActiveRoute('/dashboard/profile')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <User className="w-5 h-5" />
          <span className="text-sm font-medium">Mi Perfil</span>
        </button>
        
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <>
              <div className="w-5 h-5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
              </div>
              <span className="text-sm font-medium">Cerrando sesión...</span>
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
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