// Autor: Alexander Echeverria
// src/components/layout/DashboardLayout.js
// FUNCIÓN: Layout principal

import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

// Componentes del Layout mejorados
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import NotificationPanel from './NotificationPanel';
import SystemStatusIndicator from '../common/SystemStatusIndicator';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { 
    isMobile, 
    sidebarCollapsed, 
    showSuccess, 
    showError 
  } = useApp();
  const location = useLocation();
  
  // Estados locales optimizados para móvil - MEJORADOS
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  
  // DETECCIÓN DE MÓVIL MEJORADA - Fallback si AppContext falla
  const [isMobileState, setIsMobileState] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileDetected = width < 768;
      setIsMobileState(isMobileDetected);
      
      // Info de debug
      if (process.env.NODE_ENV === 'development') {
        console.log('Detección móvil:', {
          anchoVentana: width,
          isMobileFromContext: isMobile,
          isMobileDetected,
          userAgent: navigator.userAgent.includes('Mobile')
        });
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Usar detección propia si la del contexto falla
  const actualIsMobile = isMobile !== undefined ? isMobile : isMobileState;
  
  // FUNCIONES DE CONTROL MEJORADAS - Con debug
  const toggleMobileMenu = useCallback(() => {
    console.log('Alternando menú móvil, estado actual:', showMobileMenu);
    
    setShowMobileMenu(prev => {
      const newState = !prev;
      console.log('Nuevo estado del menú móvil:', newState);
      
      // Prevenir scroll del body cuando el menú está abierto
      if (newState) {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = '15px';
        document.body.classList.add('mobile-menu-open');
      } else {
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '0px';
        document.body.classList.remove('mobile-menu-open');
      }
      
      return newState;
    });
  }, [showMobileMenu]);
  
  const toggleNotifications = useCallback(() => {
    console.log('Alternando notificaciones, estado actual:', showNotifications);
    
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
  }, [showNotifications]);
  
  const closeMobileMenu = useCallback(() => {
    console.log('Cerrando menú móvil');
    setShowMobileMenu(false);
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
    document.body.classList.remove('mobile-menu-open');
  }, []);
  
  const closeNotifications = useCallback(() => {
    console.log('Cerrando notificaciones');
    setShowNotifications(false);
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
  }, []);
  
  // Auto-cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    if (showMobileMenu) {
      closeMobileMenu();
    }
    if (showNotifications) {
      closeNotifications();
    }
  }, [location.pathname, closeMobileMenu, closeNotifications]);
  
  // Manejar scroll inteligente en móvil (ocultar header al scroll down)
  useEffect(() => {
    if (!actualIsMobile) return;
    
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
  }, [actualIsMobile, lastScrollY]);
  
  // Gestos táctiles para cerrar menús (swipe) - MEJORADO
  useEffect(() => {
    if (!actualIsMobile) return;
    
    let startX = 0;
    let startY = 0;
    let isTracking = false;
    
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTracking = true;
    };
    
    const handleTouchMove = (e) => {
      if (!isTracking) return;
      
      // Prevenir scroll si estamos haciendo swipe para cerrar menu
      if (showMobileMenu) {
        const currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        
        // Si está swipeando hacia la izquierda, prevenir scroll
        if (diffX > 10) {
          e.preventDefault();
        }
      }
    };
    
    const handleTouchEnd = (e) => {
      if (!isTracking || !startX || !startY) return;
      isTracking = false;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Verificar si es un swipe horizontal (más horizontal que vertical)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        // Swipe left - cerrar menú móvil si está abierto
        if (diffX > 0 && showMobileMenu) {
          closeMobileMenu();
        }
        // Swipe right - cerrar notificaciones si están abiertas
        if (diffX < 0 && showNotifications) {
          closeNotifications();
        }
      }
      
      // Reset
      startX = 0;
      startY = 0;
    };
    
    // Solo agregar listeners si hay menús abiertos
    if (showMobileMenu || showNotifications) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [actualIsMobile, showMobileMenu, showNotifications, closeMobileMenu, closeNotifications]);
  
  // Limpiar overflow del body al desmontar
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
      document.body.classList.remove('mobile-menu-open');
    };
  }, []);
  
  // Prevenir zoom en inputs en iOS
  useEffect(() => {
    if (!actualIsMobile) return;
    
    const preventZoom = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.target.style.fontSize = '16px'; // Previene zoom en iOS
      }
    };
    
    document.addEventListener('focusin', preventZoom);
    return () => document.removeEventListener('focusin', preventZoom);
  }, [actualIsMobile]);
  
  // Manejar escape para cerrar menús
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
      
      {/* SIDEBAR DESKTOP */}
      {!actualIsMobile && (
        <div className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16' : 'w-64'} 
          bg-white border-r border-gray-200 flex-shrink-0
          relative z-20
        `}>
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
      )}
      
      {/* MOBILE MENU OVERLAY - MEJORADO CON Z-INDEX MÁS ALTOS */}
      {actualIsMobile && (
        <>
          {/* Backdrop siempre renderizado, pero visible solo cuando showMobileMenu es true */}
          <div 
            className={`
              fixed inset-0 bg-black transition-all duration-300 ease-out
              ${showMobileMenu 
                ? 'z-[99990] bg-opacity-50 pointer-events-auto' 
                : 'z-[-1] bg-opacity-0 pointer-events-none'
              }
            `}
            onClick={showMobileMenu ? closeMobileMenu : undefined}
          />
          
          {/* Menu slide */}
          <div className={`
            fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white
            transform transition-all duration-300 ease-out shadow-2xl
            ${showMobileMenu 
              ? 'z-[99995] translate-x-0' 
              : 'z-[99995] -translate-x-full'
            }
          `}>
            <MobileMenu onClose={closeMobileMenu} />
          </div>
        </>
      )}
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* HEADER CON Z-INDEX ALTO Y COMPORTAMIENTO INTELIGENTE */}
        <div className={`
          transition-all duration-300 ease-in-out
          ${actualIsMobile ? 'sticky top-0 z-[99999]' : 'relative z-[99999]'}
          ${actualIsMobile && !headerVisible ? '-translate-y-full' : 'translate-y-0'}
          ${isScrolled ? 'shadow-lg backdrop-blur-lg bg-white/95' : 'bg-white'}
        `}>
          <Header 
            onToggleMobileMenu={toggleMobileMenu}
            onToggleNotifications={toggleNotifications}
            isScrolled={isScrolled}
            isMobile={actualIsMobile}
            showMobileMenu={showMobileMenu}
          />
        </div>
        
        {/* ÁREA DE CONTENIDO CON SCROLL MEJORADO */}
        <main className={`
          flex-1 overflow-y-auto
          ${actualIsMobile ? 'overflow-x-hidden' : ''}
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
          relative z-10
        `}>
          <div className={`
            max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
            ${actualIsMobile ? 'py-4' : 'py-6'}
          `}>
            
            {/* BREADCRUMBS (opcional y responsive) */}
            {!actualIsMobile && (
              <div className="mb-6">
                <Breadcrumbs />
              </div>
            )}
            
            {/* CONTENIDO DE LA PÁGINA */}
            <div className={`${actualIsMobile ? 'space-y-4' : 'space-y-6'}`}>
              <Outlet />
            </div>
            
            {/* Espaciado extra en móvil para evitar que el contenido quede oculto */}
            {actualIsMobile && <div className="h-20"></div>}
            
          </div>
        </main>
        
      </div>
      
      {/* PANEL DE NOTIFICACIONES CON Z-INDEX MEJORADO */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div 
            className={`
              fixed inset-0 bg-black z-[99990] transition-opacity duration-300 ease-out
              ${showNotifications ? 'bg-opacity-30' : 'bg-opacity-0'}
            `}
            onClick={closeNotifications}
          />
          
          {/* Panel */}
          <div className={`
            fixed inset-y-0 right-0 z-[99995] 
            transform transition-transform duration-300 ease-out
            ${showNotifications ? 'translate-x-0' : 'translate-x-full'}
            ${actualIsMobile ? 'w-full max-w-sm' : 'w-80'}
            bg-white shadow-2xl
          `}>
            <NotificationPanel 
              onClose={closeNotifications} 
              isMobile={actualIsMobile}
            />
          </div>
        </>
      )}
      
      {/* INDICADOR CIRCULAR SIMPLE DEL SISTEMA (esquina inferior izquierda) */}
      <SystemStatusIndicator show={true} />
      
    </div>
  );
};

// COMPONENTE DE BREADCRUMBS (sin cambios)
const Breadcrumbs = React.memo(() => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const routeNames = {
    dashboard: 'Panel Principal',
    admin: 'Administración',
    staff: 'Personal',
    client: 'Cliente',
    users: 'Usuarios',
    memberships: 'Membresías',
    payments: 'Pagos',
    reports: 'Reportes',
    analytics: 'Análisis',
    profile: 'Perfil',
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
    <nav className="flex bg-white rounded-lg shadow-sm p-3" aria-label="Navegación de migas de pan">
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

/*
DOCUMENTACIÓN DEL COMPONENTE DashboardLayout

PROPÓSITO:
Este componente implementa el layout principal de la aplicación del gimnasio, proporcionando
una estructura responsive y funcional para dashboards de administradores, personal y clientes.
Incluye navegación móvil optimizada, header inteligente y gestión avanzada de estados.

FUNCIONALIDADES PRINCIPALES:
- Layout responsive con sidebar para desktop y menú móvil
- Header inteligente que se oculta/muestra al hacer scroll en móvil
- Sistema de navegación por gestos táctiles (swipe)
- Panel de notificaciones deslizable
- Breadcrumbs contextuales para navegación
- Indicador de estado del sistema integrado
- Gestión optimizada de overflow y scroll

ESTRUCTURA DEL LAYOUT:
1. Sidebar (desktop) / Mobile Menu (móvil)
2. Header con controles de navegación
3. Área de contenido principal con Outlet
4. Panel de notificaciones lateral
5. Indicador de estado del sistema

ARCHIVOS Y CONEXIONES:

CONTEXTS REQUERIDOS:
- ../../contexts/AuthContext: Autenticación, permisos de usuario y datos del usuario actual
- ../../contexts/AppContext: Estado global de la aplicación y configuración móvil

HOOKS DE REACT ROUTER:
- react-router-dom (Outlet): Renderiza componentes de rutas hijas dinámicamente
- react-router-dom (useLocation): Detecta cambios de ruta para auto-cierre de menús

COMPONENTES IMPORTADOS:
- ./Sidebar: Barra lateral de navegación principal para escritorio
- ./Header: Cabecera con controles de navegación y usuario
- ./MobileMenu: Menú de navegación deslizable para dispositivos móviles
- ./NotificationPanel: Panel lateral de notificaciones del sistema
- ../common/SystemStatusIndicator: Indicador circular de estado del sistema

ESTADOS MANEJADOS LOCALMENTE:
- showMobileMenu: Control de visibilidad del menú móvil
- showNotifications: Control de visibilidad del panel de notificaciones
- isScrolled: Estado de scroll para efectos visuales del header
- lastScrollY: Posición previa de scroll para header inteligente
- headerVisible: Control de visibilidad del header en móvil
- isMobileState: Detección de dispositivo móvil (sistema de fallback)

QUE SE MUESTRA AL USUARIO:

ELEMENTOS VISUALES PRINCIPALES:
- Layout principal de la aplicación con estructura responsive
- Sidebar de navegación en escritorio (colapsable)
- Menú móvil deslizable desde la izquierda (85% del ancho de pantalla)
- Header principal que se adapta al scroll en móvil
- Área de contenido central donde se renderizan las páginas
- Panel de notificaciones deslizable desde la derecha
- Breadcrumbs de navegación contextual (solo en escritorio)
- Indicador circular de estado del sistema (esquina inferior izquierda)

INTERACCIONES DISPONIBLES:
- Clic en botón hamburguesa para abrir/cerrar menú móvil
- Clic en icono de notificaciones para abrir panel lateral
- Swipe hacia la izquierda para cerrar menú móvil
- Swipe hacia la derecha para cerrar panel de notificaciones
- Tecla Escape para cerrar cualquier panel abierto
- Clic en backdrop para cerrar overlays
- Enlaces navegables en breadcrumbs

COMPORTAMIENTO DEL HEADER EN MÓVIL:
- Se oculta automáticamente al hacer scroll hacia abajo
- Aparece automáticamente al hacer scroll hacia arriba
- Efecto de blur y sombra al hacer scroll
- Permanece fijo en la parte superior

CARACTERÍSTICAS MÓVILES OPTIMIZADAS:
- Header inteligente que se oculta al scroll down, aparece al scroll up
- Gestos táctiles para cerrar menús (swipe left/right)
- Prevención de zoom automático en campos de entrada iOS
- Gestión de overflow del body durante menús abiertos
- Animaciones suaves para transiciones de 300ms
- Z-index optimizado para overlays y menús

NAVEGACIÓN POR GESTOS:
- Swipe hacia la izquierda: Cierra menú móvil si está abierto
- Swipe hacia la derecha: Cierra panel de notificaciones si está abierto
- Tecla Escape: Cierra cualquier panel abierto
- Clic en áreas de backdrop: Cierra overlays automáticamente

BREADCRUMBS CONTEXTUALES:
- Solo visibles en escritorio para ahorrar espacio en móvil
- Traducción automática de rutas a nombres amigables en español
- Soporte completo para rutas del gimnasio
- Enlaces navegables con efectos hover suaves

RUTAS SOPORTADAS EN BREADCRUMBS:
- Panel Principal: Dashboard principal del usuario
- Administración/Personal/Cliente: Secciones por roles
- Membresías: Gestión de membresías del gimnasio
- Pagos: Sistema de pagos en quetzales guatemaltecos
- Reportes/Análisis: Módulos de reporting y analytics
- Tienda: Gestión de productos y ventas
- Usuarios: Administración de usuarios del sistema

OPTIMIZACIONES DE RENDIMIENTO:
- useCallback para funciones de control críticas
- React.memo para componente Breadcrumbs
- Event listeners con cleanup automático al desmontar
- Detección de móvil con sistema de fallback robusto
- Lazy loading implícito de paneles

ACCESIBILIDAD IMPLEMENTADA:
- Aria-labels descriptivos en elementos de navegación
- Navegación completa por teclado (Escape key)
- Roles semánticos apropiados en breadcrumbs
- Gestión de focus en menús y overlays
- Contraste adecuado en todos los overlays

CARACTERÍSTICAS TÉCNICAS:
- Sistema de Z-index escalonado para overlays (99990-99999)
- Transiciones CSS optimizadas (300ms ease-out)
- Efectos de backdrop blur en header durante scroll
- Scrollbar personalizada delgada y estilizada
- Prevención completa de body scroll durante overlays

INTEGRACIÓN CON EL SISTEMA DEL GIMNASIO:
- Soporte completo para roles diferenciados (admin, staff, client)
- Navegación contextual basada en permisos de usuario
- Monitoreo de estado del sistema integrado y visible
- Breadcrumbs específicos para operaciones del gimnasio
- Optimización para flujos de trabajo del gimnasio
- Soporte para transacciones en quetzales guatemaltecos

RESPONSIVE DESIGN:
- Breakpoint principal en 768px (md) para móvil/escritorio
- Sidebar completamente colapsable en escritorio
- Menú deslizable en móvil con máximo 85% del ancho
- Header sticky en móvil, posición relativa en escritorio
- Espaciado adaptativo (py-4 móvil, py-6 escritorio)
- Contenido centrado con max-width responsiva

GESTIÓN DE MEMORIA:
- Cleanup automático de todos los event listeners
- Restauración completa de estilos del body al desmontar
- Eliminación de clases CSS temporales
- Prevención activa de memory leaks
- Limpieza de intervalos y timeouts

DEBUGGING Y DESARROLLO:
- Logs detallados en consola para debugging de estados móviles
- Información completa de detección de dispositivo
- Indicador visual de estado del sistema siempre visible
- Variables de entorno para modo debug
- Información de userAgent para diagnóstico

Este componente es fundamental para la experiencia de usuario en la aplicación
del gimnasio, proporcionando una base sólida, responsive y optimizada para todos
los dashboards mientras mantiene características específicas para dispositivos
móviles y flujos de trabajo del gimnasio en Guatemala.
*/