// src/components/layout/Sidebar.js
// UBICACIÓN: /gym-frontend/src/components/layout/Sidebar.js
// FUNCIÓN: Navegación lateral con menú adaptativo según rol del usuario
// CONECTA CON: AuthContext para permisos, Router para navegación

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  UserPlus,
  Receipt,
  FileText,
  ChevronDown,
  ChevronRight,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const Sidebar = ({ collapsed = false }) => {
  const { user, hasPermission } = useAuth();
  const { liveMetrics } = useApp();
  const location = useLocation();
  
  // 📱 Estado para submenús
  const [expandedMenus, setExpandedMenus] = useState({});
  
  // 🔄 Toggle submenú
  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };
  
  // 🎯 Verificar si una ruta está activa
  const isActiveRoute = (path) => location.pathname === path;
  const isActiveSection = (paths) => paths.some(path => location.pathname.startsWith(path));
  
  // 📋 CONFIGURACIÓN DE MENÚS POR ROL
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
    
    // 👥 Menú de Usuarios
    if (hasPermission('view_users')) {
      baseItems.push({
        id: 'users',
        label: 'Usuarios',
        icon: Users,
        show: true,
        badge: null,
        submenu: [
          {
            label: 'Todos los usuarios',
            path: '/dashboard/users',
            show: hasPermission('view_users')
          },
          {
            label: 'Crear usuario',
            path: '/dashboard/users/create',
            show: hasPermission('create_users')
          },
          {
            label: 'Clientes frecuentes',
            path: '/dashboard/users/frequent-daily-clients',
            show: hasPermission('view_users')
          }
        ]
      });
    }
    
    // 🎫 Menú de Membresías
    if (hasPermission('view_memberships')) {
      baseItems.push({
        id: 'memberships',
        label: 'Membresías',
        icon: CreditCard,
        show: true,
        badge: liveMetrics.expiredMemberships > 0 ? liveMetrics.expiredMemberships : null,
        submenu: [
          {
            label: 'Todas las membresías',
            path: '/dashboard/memberships',
            show: hasPermission('view_memberships')
          },
          {
            label: 'Crear membresía',
            path: '/dashboard/memberships/create',
            show: hasPermission('create_memberships')
          },
          {
            label: 'Vencidas',
            path: '/dashboard/memberships/expired',
            show: hasPermission('view_expired_memberships'),
            badge: liveMetrics.expiredMemberships
          }
        ]
      });
    }
    
    // 💰 Menú de Pagos
    if (hasPermission('view_payments')) {
      baseItems.push({
        id: 'payments',
        label: 'Pagos',
        icon: DollarSign,
        show: true,
        badge: liveMetrics.todayPayments > 0 ? liveMetrics.todayPayments : null,
        submenu: [
          {
            label: 'Todos los pagos',
            path: '/dashboard/payments',
            show: hasPermission('view_payments')
          },
          {
            label: 'Registrar pago',
            path: '/dashboard/payments/create',
            show: hasPermission('create_payments')
          },
          {
            label: 'Transferencias pendientes',
            path: '/dashboard/payments/transfers/pending',
            show: hasPermission('validate_transfers')
          }
        ]
      });
    }
    
    // 📊 Menú de Reportes
    if (hasPermission('view_reports')) {
      baseItems.push({
        id: 'reports',
        label: 'Reportes',
        icon: BarChart3,
        show: true,
        submenu: [
          {
            label: 'Reportes generales',
            path: '/dashboard/reports',
            show: hasPermission('view_reports')
          },
          {
            label: 'Análisis avanzado',
            path: '/dashboard/analytics',
            show: hasPermission('view_reports')
          }
        ]
      });
    }
    
    // ⚙️ Configuración (solo admin)
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
  
  return (
    <div className="flex flex-col h-full">
      
      {/* 🏠 HEADER DEL SIDEBAR */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-white">
        {collapsed ? (
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">
              Gym System
            </span>
          </div>
        )}
      </div>
      
      {/* 📋 NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.id}>
            
            {/* 🔗 ELEMENTO DE MENÚ */}
            {item.submenu ? (
              // Menú con submenús
              <div>
                <button
                  onClick={() => toggleSubmenu(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActiveSection(item.submenu?.map(sub => sub.path) || [])
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {!collapsed && (
                      <>
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {!collapsed && (
                    expandedMenus[item.id] ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {/* 📂 SUBMENÚ */}
                {!collapsed && expandedMenus[item.id] && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => (
                      subItem.show && (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`
                            flex items-center px-3 py-2 text-sm rounded-lg transition-colors
                            ${isActiveRoute(subItem.path)
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }
                          `}
                        >
                          <span>{subItem.label}</span>
                          {subItem.badge && (
                            <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Menú simple sin submenús
              <Link
                to={item.path}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActiveRoute(item.path)
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>
      
      {/* 📊 MÉTRICAS EN TIEMPO REAL */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs font-medium text-gray-500 mb-2">
            Métricas del día
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pagos hoy</span>
              <span className="font-medium text-green-600">
                {liveMetrics.todayPayments}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Vencidas</span>
              <span className="font-medium text-red-600">
                {liveMetrics.expiredMemberships}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Usuarios online</span>
              <span className="font-medium text-blue-600">
                {liveMetrics.onlineUsers}
              </span>
            </div>
          </div>
          {liveMetrics.lastUpdate && (
            <div className="mt-2 text-xs text-gray-400">
              Actualizado: {new Date(liveMetrics.lastUpdate).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
      
      {/* 👤 USUARIO ACTUAL */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'colaborador' ? 'Personal' : 'Cliente'}
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Sidebar;