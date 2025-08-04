// src/components/layout/Sidebar.js
// FUNCIÓN: Sidebar SOLO para desktop - reparado para colapso correcto
// CAMBIOS: Texto que desaparece correctamente, logout sin errores

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import GymLogo from '../common/GymLogo';

const Sidebar = ({ collapsed }) => {
  const { user, logout, hasPermission } = useAuth();
  const { toggleSidebar, showSuccess, showError } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 🎯 Verificar si una ruta está activa
  const isActiveRoute = (path) => location.pathname === path;
  const isActiveSection = (paths) => paths.some(path => location.pathname.startsWith(path));
  
  // 📋 Obtener elementos del menú según el rol
  const getMenuItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        path: getDashboardPath(),
        show: true
      }
    ];
    
    // 👥 Usuarios
    if (hasPermission('view_users')) {
      baseItems.push({
        id: 'users',
        label: 'Usuarios',
        icon: Users,
        path: '/dashboard/users',
        show: true
      });
    }
    
    // 🎫 Membresías
    if (hasPermission('view_memberships')) {
      baseItems.push({
        id: 'memberships',
        label: 'Membresías',
        icon: CreditCard,
        path: '/dashboard/memberships',
        show: true
      });
    }
    
    // 💰 Pagos
    if (hasPermission('view_payments')) {
      baseItems.push({
        id: 'payments',
        label: 'Pagos',
        icon: DollarSign,
        path: '/dashboard/payments',
        show: true
      });
    }
    
    // 📊 Reportes
    if (hasPermission('view_reports')) {
      baseItems.push({
        id: 'reports',
        label: 'Reportes',
        icon: BarChart3,
        path: '/dashboard/reports',
        show: true
      });
    }
    
    // ⚙️ Configuración
    if (hasPermission('manage_system_settings')) {
      baseItems.push({
        id: 'settings',
        label: 'Configuración',
        icon: Settings,
        path: '/dashboard/settings',
        show: true
      });
    }
    
    return baseItems.filter(item => item.show);
  };
  
  // 🏠 Obtener ruta del dashboard según rol
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
  
  // 🔐 Manejar logout REPARADO
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login', { replace: true });
      showSuccess && showSuccess('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error durante logout:', error);
      showError && showError('Error al cerrar sesión');
      
      // Fallback si hay error
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } catch {
        window.location.reload();
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      
      {/* 🔝 HEADER CON TOGGLE */}
      <div className={`flex items-center justify-between border-b border-gray-200 transition-all duration-300 ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        
        {/* Logo - SE OCULTA COMPLETAMENTE cuando está colapsado */}
        {!collapsed && (
          <div className="transition-opacity duration-300">
            <GymLogo size="md" variant="professional" showText={true} />
          </div>
        )}
        
        {/* Botón toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      
      {/* 👤 INFORMACIÓN DEL USUARIO */}
      <div className={`border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50 transition-all duration-300 ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          
          {/* Avatar - SIEMPRE visible */}
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
          
          {/* Información del usuario - DESAPARECE cuando está colapsado */}
          {!collapsed && (
            <div className="transition-opacity duration-300 min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'colaborador' ? 'Personal' : 'Cliente'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 📋 NAVEGACIÓN PRINCIPAL */}
      <nav className={`flex-1 space-y-2 transition-all duration-300 ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`
              flex items-center rounded-xl transition-all duration-300
              ${isActiveRoute(item.path) || isActiveSection([item.path])
                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
              ${collapsed ? 'p-2 justify-center' : 'px-3 py-3'}
            `}
            title={collapsed ? item.label : undefined}
          >
            {/* Icono - SIEMPRE visible */}
            <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
            
            {/* Texto - DESAPARECE cuando está colapsado */}
            {!collapsed && (
              <span className="text-sm font-medium transition-opacity duration-300">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>
      
      {/* 🔗 ENLACES ADICIONALES */}
      <div className={`border-t border-gray-200 space-y-2 transition-all duration-300 ${
        collapsed ? 'p-2' : 'p-4'
      }`}>
        
        {/* 👤 Mi Perfil */}
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
        
        {/* 🔴 Cerrar Sesión */}
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
              {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
            </span>
          )}
        </button>
      </div>
      
    </div>
  );
};

export default Sidebar;