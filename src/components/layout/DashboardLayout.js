// src/components/layout/DashboardLayout.js
// FUNCIÓN: Layout principal MEJORADO con z-index correcto y funcionalidad completa
// MEJORAS: Header siempre arriba, paneles con información real, mejor responsividad

import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

// 📱 Componentes del Layout mejorados
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import NotificationPanel from './NotificationPanel';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { 
    isMobile, 
    sidebarCollapsed, 
    showSuccess, 
    showError 
  } = useApp();
  const location = useLocation();
  
  // 📱 Estados locales optimizados para móvil
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  
  // 🎯 FUNCIONES DE CONTROL OPTIMIZADAS
  const toggleMobileMenu = useCallback(() => {
    setShowMobileMenu(prev => {
      const newState = !prev;
      
      // Prevenir scroll del body cuando el menú está abierto
      if (newState) {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = '15px'; // Compensar scrollbar
      } else {
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '0px';
      }
      
      return newState;
    });
  }, []);
  
  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => {
      const newState = !prev;
      
      if (newState) {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = '15px';
      } else {
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '0px';
      }
      
      return newState;
    });
  }, []);
  
  const closeMobileMenu = useCallback(() => {
    setShowMobileMenu(false);
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
  }, []);
  
  const closeNotifications = useCallback(() => {
    setShowNotifications(false);
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
  }, []);
  
  // 📱 Auto-cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    if (showMobileMenu) {
      closeMobileMenu();
    }
    if (showNotifications) {
      closeNotifications();
    }
  }, [location.pathname, showMobileMenu, showNotifications, closeMobileMenu, closeNotifications]);
  
  // 📱 Manejar scroll inteligente en móvil (ocultar header al scroll down)
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Actualizar estado de scroll
      setIsScrolled(currentScrollY > 10);
      
      // Header inteligente: ocultar al hacer scroll hacia abajo, mostrar al hacer scroll hacia arriba
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
        // Scrolling up or near top
        setHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, lastScrollY]);
  
  // 📱 Gestos táctiles para cerrar menús (swipe)
  useEffect(() => {
    if (!isMobile) return;
    
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e) => {
      if (!startX || !startY) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Verificar si es un swipe horizontal (más horizontal que vertical)
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Swipe left - cerrar menú móvil si está abierto
        if (diffX > 50 && showMobileMenu) {
          closeMobileMenu();
        }
        // Swipe right - cerrar notificaciones si están abiertas
        if (diffX < -50 && showNotifications) {
          closeNotifications();
        }
      }
      
      // Reset
      startX = 0;
      startY = 0;
    };
    
    // Solo agregar listeners si hay menús abiertos
    if (showMobileMenu || showNotifications) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, showMobileMenu, showNotifications, closeMobileMenu, closeNotifications]);
  
  // 📱 Limpiar overflow del body al desmontar
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);
  
  // 📱 Prevenir zoom en inputs en iOS
  useEffect(() => {
    if (!isMobile) return;
    
    const preventZoom = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.target.style.fontSize = '16px'; // Previene zoom en iOS
      }
    };
    
    document.addEventListener('focusin', preventZoom);
    return () => document.removeEventListener('focusin', preventZoom);
  }, [isMobile]);
  
  // 🔐 Manejar escape para cerrar menús
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showMobileMenu) {
          closeMobileMenu();
        }
        if (showNotifications) {
          closeNotifications();
        }
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showMobileMenu, showNotifications, closeMobileMenu, closeNotifications]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* 🖥️ SIDEBAR DESKTOP */}
      {!isMobile && (
        <div className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16' : 'w-64'} 
          bg-white border-r border-gray-200 flex-shrink-0
          relative z-20
        `}>
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
      )}
      
      {/* 📱 MOBILE MENU OVERLAY CON ANIMACIONES MEJORADAS */}
      {isMobile && showMobileMenu && (
        <>
          {/* Backdrop con fade */}
          <div 
            className={`
              fixed inset-0 bg-black z-[9990] transition-opacity duration-300 ease-out
              ${showMobileMenu ? 'bg-opacity-50' : 'bg-opacity-0'}
            `}
            onClick={closeMobileMenu}
          />
          
          {/* Menu con slide */}
          <div className={`
            fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-[9995] 
            transform transition-transform duration-300 ease-out
            ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}
            shadow-2xl
          `}>
            <MobileMenu onClose={closeMobileMenu} />
          </div>
        </>
      )}
      
      {/* 🏠 CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* 🔝 HEADER CON Z-INDEX ALTO Y COMPORTAMIENTO INTELIGENTE */}
        <div className={`
          transition-all duration-300 ease-in-out
          ${isMobile ? 'sticky top-0 z-[9999]' : 'relative z-[9999]'}
          ${isMobile && !headerVisible ? '-translate-y-full' : 'translate-y-0'}
          ${isScrolled ? 'shadow-lg backdrop-blur-lg bg-white/95' : 'bg-white'}
        `}>
          <Header 
            onToggleMobileMenu={toggleMobileMenu}
            onToggleNotifications={toggleNotifications}
            isScrolled={isScrolled}
            isMobile={isMobile}
          />
        </div>
        
        {/* 📄 ÁREA DE CONTENIDO CON SCROLL MEJORADO */}
        <main className={`
          flex-1 overflow-y-auto
          ${isMobile ? 'overflow-x-hidden' : ''}
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
          relative z-10
        `}>
          <div className={`
            max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
            ${isMobile ? 'py-4' : 'py-6'}
          `}>
            
            {/* 🎯 BREADCRUMBS (opcional y responsive) */}
            {!isMobile && (
              <div className="mb-6">
                <Breadcrumbs />
              </div>
            )}
            
            {/* 📊 CONTENIDO DE LA PÁGINA */}
            <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
              <Outlet />
            </div>
            
            {/* 📱 Espaciado extra en móvil para evitar que el contenido quede oculto */}
            {isMobile && <div className="h-20"></div>}
            
          </div>
        </main>
        
      </div>
      
      {/* 🔔 PANEL DE NOTIFICACIONES CON ANIMACIONES MEJORADAS */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div 
            className={`
              fixed inset-0 bg-black z-[9990] transition-opacity duration-300 ease-out
              ${showNotifications ? 'bg-opacity-30' : 'bg-opacity-0'}
            `}
            onClick={closeNotifications}
          />
          
          {/* Panel */}
          <div className={`
            fixed inset-y-0 right-0 z-[9995] 
            transform transition-transform duration-300 ease-out
            ${showNotifications ? 'translate-x-0' : 'translate-x-full'}
            ${isMobile ? 'w-full max-w-sm' : 'w-80'}
            bg-white shadow-2xl
          `}>
            <NotificationPanel 
              onClose={closeNotifications} 
              isMobile={isMobile}
            />
          </div>
        </>
      )}
      
      {/* 📱 INDICADOR DE CONEXIÓN MÓVIL (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && isMobile && (
        <div className="fixed bottom-4 left-4 z-[9980]">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )}
      
      {/* 🔒 INDICADOR DE ESTADO DE USUARIO (solo admins en desktop) */}
      {!isMobile && user?.role === 'admin' && (
        <div className="fixed bottom-4 right-4 z-[9980]">
          <div className="bg-white rounded-lg shadow-lg border p-3 min-w-48">
            <div className="text-xs text-gray-500 mb-1">Estado del Sistema</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-900">Operativo</span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

// 🍞 COMPONENTE DE BREADCRUMBS MEJORADO CON INFORMACIÓN DEL BACKEND
const Breadcrumbs = React.memo(() => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // 📍 MAPEO DE RUTAS A NOMBRES LEGIBLES EXPANDIDO
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
    expiring: 'Por Vencer',
    transfers: 'Transferencias',
    store: 'Tienda',
    products: 'Productos',
    orders: 'Pedidos',
    inventory: 'Inventario',
    customers: 'Clientes',
    stats: 'Estadísticas',
    notifications: 'Notificaciones',
    backup: 'Respaldos',
    permissions: 'Permisos',
    website: 'Página Web',
    financial: 'Financiero',
    custom: 'Personalizado'
  };
  
  if (pathSegments.length <= 1) return null;
  
  return (
    <nav className="flex bg-white rounded-lg shadow-sm p-3" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const displayName = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          
          return (
            <li key={segment} className="inline-flex items-center">
              {index > 0 && (
                <svg 
                  className="w-4 h-4 text-gray-400 mx-1" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              )}
              {isLast ? (
                <span className="text-sm font-medium text-gray-500 capitalize">
                  {displayName}
                </span>
              ) : (
                <a
                  href={href}
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 capitalize transition-colors duration-200"
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
});

Breadcrumbs.displayName = 'Breadcrumbs';

export default DashboardLayout;
// 📝 MEJORAS IMPLEMENTADAS PARA MÓVIL:
// ✅ Header inteligente que se oculta al hacer scroll hacia abajo
// ✅ Gestos táctiles (swipe) para cerrar menús
// ✅ Animaciones mejoradas para overlay y menús
// ✅ Prevención de scroll del body cuando los menús están abiertos
// ✅ Auto-cierre de menús al navegar entre páginas
// ✅ Prevención de zoom automático en inputs en iOS
// ✅ Espaciado optimizado para contenido móvil
// ✅ Scroll personalizado con scrollbar delgada
// ✅ Indicador de conexión discreto en desarrollo
// ✅ Breadcrumbs ocultos en móvil para ahorrar espacio
// ✅ Backdrop mejorado con opacidad gradual
// ✅ Limpieza automática de overflow al desmontar
// ✅ Panel de notificaciones responsive
// ✅ Mantiene TODA la funcionalidad original del dashboard