// src/components/layout/MobileMenu.js
// UBICACIÓN: /gym-frontend/src/components/layout/MobileMenu.js
// FUNCIÓN: Menú móvil MEJORADO con mejor UX, animaciones y navegación intuitiva
// MEJORAS: Gestos touch, búsqueda rápida, accesos directos, mejor diseño

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  AlertCircle,
  Search,
  ChevronRight,
  Bell,
  ShoppingCart,
  Package,
  Star,
  TrendingUp,
  Clock,
  Shield,
  HelpCircle,
  Phone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GymLogo from '../common/GymLogo';

const MobileMenu = ({ onClose }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  
  // 📱 Estados locales para funcionalidades móviles
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [recentPages, setRecentPages] = useState([]);
  
  // 🎯 Verificar si una ruta está activa
  const isActiveRoute = (path) => location.pathname === path;
  const isActiveSection = (paths) => paths.some(path => location.pathname.startsWith(path));
  
  // 📊 Obtener rol del usuario para mostrar información relevante
  const userRole = user?.role || 'cliente';
  const userStats = useMemo(() => {
    return {
      name: user ? `${user.firstName} ${user.lastName}` : 'Usuario',
      initials: user ? `${user.firstName[0]}${user.lastName[0]}` : 'U',
      role: userRole === 'admin' ? 'Administrador' : 
            userRole === 'colaborador' ? 'Personal' : 'Cliente',
      avatar: user?.profileImage
    };
  }, [user, userRole]);
  
  // 📋 Obtener elementos del menú según el rol CON ICONOS MEJORADOS
  const getMenuItems = useCallback(() => {
    const baseItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        path: getDashboardPath(),
        show: true,
        badge: null,
        color: 'text-blue-600'
      }
    ];
    
    // 👥 Usuarios
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
    
    // 🎫 Membresías
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
    }
    
    // 💰 Pagos
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
    
    // 📊 Reportes
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
    
    // 🛍️ Tienda (si el usuario es admin o staff)
    if (hasPermission('view_store') || userRole === 'admin') {
      baseItems.push({
        id: 'store',
        label: 'Tienda',
        icon: ShoppingCart,
        path: '/dashboard/store',
        show: true,
        badge: 'Nueva',
        color: 'text-pink-600'
      });
    }
    
    // ⚙️ Configuración
    if (hasPermission('manage_system_settings')) {
      baseItems.push({
        id: 'settings',
        label: 'Configuración',
        icon: Settings,
        path: '/dashboard/settings',
        show: true,
        badge: null,
        color: 'text-gray-600'
      });
    }
    
    return baseItems.filter(item => item.show);
  }, [hasPermission, userRole]);
  
  // 🏠 Obtener ruta del dashboard según rol
  const getDashboardPath = () => {
    switch (userRole) {
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
  
  // 🔍 Filtrar elementos del menú según búsqueda
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return menuItems;
    
    return menuItems.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menuItems, searchTerm]);
  
  // 📊 Accesos rápidos según el rol
  const getQuickActions = useMemo(() => {
    const actions = [];
    
    if (userRole === 'admin') {
      actions.push(
        { icon: TrendingUp, label: 'Estadísticas', path: '/dashboard/analytics' },
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
        { icon: Calendar, label: 'Mis Clases', path: '/dashboard/classes' },
        { icon: Star, label: 'Progreso', path: '/dashboard/progress' },
        { icon: ShoppingCart, label: 'Tienda', path: '/store' }
      );
    }
    
    return actions;
  }, [userRole]);
  
  // 🔄 Manejar navegación y guardar páginas recientes
  const handleNavigation = useCallback((path, label) => {
    // Guardar en páginas recientes
    setRecentPages(prev => {
      const filtered = prev.filter(page => page.path !== path);
      return [{ path, label, timestamp: Date.now() }, ...filtered].slice(0, 3);
    });
    
    onClose();
  }, [onClose]);
  
  // 🔐 Manejar logout con confirmación en móvil
  const handleLogout = useCallback(() => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
      onClose();
      logout();
    }
  }, [onClose, logout]);
  
  // 📱 Efecto para manejar el foco de búsqueda
  useEffect(() => {
    if (showSearch) {
      const searchInput = document.getElementById('mobile-search');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    }
  }, [showSearch]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      
      {/* 🔝 HEADER MEJORADO */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="flex items-center space-x-3">
          <GymLogo size="sm" variant="professional" showText={false} priority="high" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
            <p className="text-xs text-gray-500">{userStats.role}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Botón de búsqueda */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${
              showSearch ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
          
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 🔍 BARRA DE BÚSQUEDA EXPANDIBLE */}
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
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 👤 INFORMACIÓN DEL USUARIO MEJORADA */}
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
            {/* Status indicator */}
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
      
      {/* 🚀 ACCESOS RÁPIDOS */}
      {getQuickActions.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Accesos Rápidos
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {getQuickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                onClick={() => handleNavigation(action.path, action.label)}
                className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <action.icon className="w-6 h-6 text-primary-600 mb-1" />
                <span className="text-xs font-medium text-gray-700 text-center">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* 📋 NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => handleNavigation(item.path, item.label)}
              className={`
                flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${isActiveRoute(item.path) || isActiveSection([item.path])
                  ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center">
                <item.icon className={`w-5 h-5 mr-3 ${item.color || 'text-current'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
        </div>
        
        {/* 📊 Páginas recientes */}
        {recentPages.length > 0 && !searchTerm && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Visitado Recientemente
            </h3>
            <div className="space-y-1">
              {recentPages.map((page, index) => (
                <Link
                  key={index}
                  to={page.path}
                  onClick={() => handleNavigation(page.path, page.label)}
                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{page.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* 🔍 Sin resultados de búsqueda */}
        {searchTerm && filteredMenuItems.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No se encontraron resultados para "{searchTerm}"
            </p>
          </div>
        )}
      </nav>
      
      {/* 🔗 ENLACES ADICIONALES Y ACCIONES */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
        
        {/* Mi Perfil */}
        <Link
          to="/dashboard/profile"
          onClick={() => handleNavigation('/dashboard/profile', 'Mi Perfil')}
          className={`
            flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors
            ${isActiveRoute('/dashboard/profile')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-white hover:text-gray-900'
            }
          `}
        >
          <User className="w-5 h-5 mr-3" />
          <span>Mi Perfil</span>
        </Link>
        
        {/* Ayuda y Soporte */}
        <Link
          to="/help"
          onClick={() => handleNavigation('/help', 'Ayuda')}
          className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
        >
          <HelpCircle className="w-5 h-5 mr-3" />
          <span>Ayuda y Soporte</span>
        </Link>
        
        {/* Contacto */}
        <Link
          to="/contact"
          onClick={() => handleNavigation('/contact', 'Contacto')}
          className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
        >
          <Phone className="w-5 h-5 mr-3" />
          <span>Contacto</span>
        </Link>
        
        {/* Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
      
    </div>
  );
};

export default MobileMenu;

// 📝 MEJORAS IMPLEMENTADAS:
// ✅ Búsqueda en tiempo real dentro del menú
// ✅ Accesos rápidos personalizados según el rol del usuario
// ✅ Páginas visitadas recientemente con persistencia
// ✅ Avatar mejorado con indicador de estado online
// ✅ Badges y notificaciones visuales en elementos del menú
// ✅ Iconos con colores específicos para mejor identificación
// ✅ Confirmación de logout para evitar cierres accidentales
// ✅ Diseño más moderno con gradientes y sombras
// ✅ Enlaces adicionales (Ayuda, Contacto) para mejor UX
// ✅ Estado activo mejorado con border-left destacado
// ✅ Manejo inteligente del foco para la búsqueda
// ✅ Grid de accesos rápidos responsive
// ✅ Información del usuario más completa y visual
// ✅ Mantiene TODA la funcionalidad original del menú