// src/components/layout/DashboardLayout.js
// UBICACIÓN: /gym-frontend/src/components/layout/DashboardLayout.js
// FUNCIÓN: Layout principal que envuelve todas las páginas del dashboard
// CONECTA CON: Sidebar, Header, todas las páginas autenticadas

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

// 📱 Componentes del Layout
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import NotificationPanel from './NotificationPanel';

const DashboardLayout = () => {
  const { user } = useAuth();
  const { isMobile, sidebarCollapsed } = useApp();
  
  // 📱 Estados locales
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // 🎯 FUNCIONES DE CONTROL
  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);
  const toggleNotifications = () => setShowNotifications(!showNotifications);
  const closeMobileMenu = () => setShowMobileMenu(false);
  const closeNotifications = () => setShowNotifications(false);

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* 🖥️ SIDEBAR DESKTOP */}
      {!isMobile && (
        <div className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16' : 'w-64'} 
          bg-white border-r border-gray-200 flex-shrink-0
        `}>
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
      )}
      
      {/* 📱 MOBILE MENU OVERLAY */}
      {isMobile && showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMobileMenu}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out">
            <MobileMenu onClose={closeMobileMenu} />
          </div>
        </>
      )}
      
      {/* 🏠 CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 🔝 HEADER */}
        <Header 
          onToggleMobileMenu={toggleMobileMenu}
          onToggleNotifications={toggleNotifications}
        />
        
        {/* 📄 ÁREA DE CONTENIDO */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            {/* 🎯 BREADCRUMBS (opcional) */}
            <div className="mb-6">
              <Breadcrumbs />
            </div>
            
            {/* 📊 CONTENIDO DE LA PÁGINA */}
            <div className="space-y-6">
              <Outlet />
            </div>
            
          </div>
        </main>
        
      </div>
      
      {/* 🔔 PANEL DE NOTIFICACIONES */}
      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={closeNotifications}
          />
          <div className="fixed inset-y-0 right-0 w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out">
            <NotificationPanel onClose={closeNotifications} />
          </div>
        </>
      )}
      
    </div>
  );
};

// 🍞 COMPONENTE DE BREADCRUMBS
const Breadcrumbs = () => {
  const location = window.location.pathname;
  const pathSegments = location.split('/').filter(Boolean);
  
  // 📍 MAPEO DE RUTAS A NOMBRES LEGIBLES
  const routeNames = {
    dashboard: 'Dashboard',
    admin: 'Administración',
    staff: 'Personal',
    client: 'Cliente',
    users: 'Usuarios',
    memberships: 'Membresías',
    payments: 'Pagos',
    reports: 'Reportes',
    analytics: 'Análisis',
    profile: 'Perfil',
    settings: 'Configuración',
    create: 'Crear',
    edit: 'Editar',
    expired: 'Vencidas',
    pending: 'Pendientes',
    transfers: 'Transferencias'
  };
  
  if (pathSegments.length <= 1) return null;
  
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const displayName = routeNames[segment] || segment;
          
          return (
            <li key={segment} className="inline-flex items-center">
              {index > 0 && (
                <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {isLast ? (
                <span className="text-sm font-medium text-gray-500 capitalize">
                  {displayName}
                </span>
              ) : (
                <a
                  href={`/${pathSegments.slice(0, index + 1).join('/')}`}
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 capitalize"
                >
                  {displayName}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default DashboardLayout;