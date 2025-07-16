// src/components/layout/MobileMenu.js
// UBICACIÓN: /gym-frontend/src/components/layout/MobileMenu.js
// FUNCIÓN: Menú lateral para dispositivos móviles con navegación completa
// CONECTA CON: AuthContext para permisos, Router para navegación

import React from 'react';
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
  Dumbbell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const MobileMenu = ({ onClose }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  
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
  
  // 🔐 Manejar logout
  const handleLogout = () => {
    onClose();
    logout();
  };
  
  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">
            Gym System
          </span>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* 👤 INFORMACIÓN DEL USUARIO */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.getFullName()}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-white">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </span>
            )}
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-900">
              {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
            </div>
            <div className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'Administrador' : 
               user?.role === 'colaborador' ? 'Personal' : 'Cliente'}
            </div>
          </div>
        </div>
      </div>
      
      {/* 📋 NAVEGACIÓN */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={onClose}
            className={`
              flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${isActiveRoute(item.path) || isActiveSection([item.path])
                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* 🔗 ENLACES ADICIONALES */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          to="/dashboard/profile"
          onClick={onClose}
          className={`
            flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
            ${isActiveRoute('/dashboard/profile')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
          `}
        >
          <User className="w-5 h-5 mr-3" />
          <span>Mi Perfil</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
      
    </div>
  );
};

export default MobileMenu;