// src/hooks/useNavigation.js
// FUNCIÓN: Hook para navegación y menús
// CONECTA CON: GET /api/gym/navigation

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiService from '../services/apiService';

const useNavigation = () => {
  // 🏗️ Estados
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const location = useLocation();

  // 📱 Navegación por defecto mientras carga
  const defaultNavigation = {
    header: [
      { text: "Inicio", href: "#inicio", active: true },
      { text: "Servicios", href: "#servicios", active: true },
      { text: "Planes", href: "#planes", active: true },
      { text: "Tienda", href: "#tienda", active: true },
      { text: "Contacto", href: "#contacto", active: true }
    ],
    footer: {
      links: [
        { text: "Inicio", href: "#inicio" },
        { text: "Servicios", href: "#servicios" },
        { text: "Planes", href: "#planes" },
        { text: "Tienda", href: "#tienda" }
      ],
      store_links: [
        { text: "Suplementos", href: "/store?category=suplementos" },
        { text: "Ropa Deportiva", href: "/store?category=ropa" },
        { text: "Accesorios", href: "/store?category=accesorios" },
        { text: "Equipamiento", href: "/store?category=equipamiento" }
      ]
    }
  };

  // 🚀 Función para obtener navegación
  const fetchNavigation = async (force = false) => {
    // Cache de 30 minutos (navegación no cambia frecuentemente)
    if (navigation && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 30 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🧭 Obteniendo navegación desde backend...');
      
      const response = await apiService.getNavigation();
      
      if (response.success && response.data) {
        console.log('✅ Navegación obtenida:', response.data);
        setNavigation(response.data);
        setLastFetch(Date.now());
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al obtener navegación:', error);
      setError(error.message);
      
      // En caso de error, usar navegación por defecto
      if (!navigation) {
        setNavigation(defaultNavigation);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Efecto para cargar navegación al montar
  useEffect(() => {
    fetchNavigation();
  }, []);

  // 🎯 Función para refrescar navegación
  const refresh = () => {
    fetchNavigation(true);
  };

  // 🔝 Función para obtener elementos del header
  const getHeaderItems = () => {
    return navigation?.header?.filter(item => item.active) || defaultNavigation.header;
  };

  // 🔽 Función para obtener enlaces del footer
  const getFooterLinks = () => {
    return navigation?.footer?.links || defaultNavigation.footer.links;
  };

  // 🛍️ Función para obtener enlaces de la tienda en footer
  const getStoreLinks = () => {
    return navigation?.footer?.store_links || defaultNavigation.footer.store_links;
  };

  // 🎯 Función para verificar si un enlace está activo
  const isActive = (href) => {
    if (href.startsWith('#')) {
      // Para enlaces de hash (#inicio, #servicios, etc.)
      return window.location.hash === href || 
             (href === '#inicio' && !window.location.hash);
    } else {
      // Para rutas normales
      return location.pathname === href;
    }
  };

  // 🔍 Función para obtener elemento de navegación por texto
  const getNavItemByText = (text) => {
    const headerItems = getHeaderItems();
    return headerItems.find(item => item.text.toLowerCase() === text.toLowerCase());
  };

  // 📱 Función para obtener elementos de navegación móvil
  const getMobileNavItems = () => {
    // En móvil, podemos incluir elementos adicionales
    const headerItems = getHeaderItems();
    const additionalItems = [
      { text: "Mi Cuenta", href: "/login", active: true },
      { text: "Registro", href: "/register", active: true }
    ];
    
    return [...headerItems, ...additionalItems];
  };

  // 🎨 Función para obtener clase CSS de elemento activo
  const getNavItemClass = (href, baseClass = '', activeClass = 'active') => {
    return `${baseClass} ${isActive(href) ? activeClass : ''}`.trim();
  };

  // 🔗 Función para manejar navegación suave (smooth scroll)
  const handleSmoothScroll = (href) => {
    if (href.startsWith('#')) {
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Actualizar la URL sin recargar
        window.history.pushState(null, null, href);
        return true;
      }
    }
    return false;
  };

  // 🧭 Función para obtener breadcrumbs basado en la ruta actual
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    const breadcrumbs = [
      { text: 'Inicio', href: '/' }
    ];
    
    let currentPath = '';
    segments.forEach(segment => {
      currentPath += `/${segment}`;
      
      // Mapear segmentos a nombres legibles
      const segmentNames = {
        'store': 'Tienda',
        'dashboard': 'Dashboard',
        'login': 'Iniciar Sesión',
        'register': 'Registro',
        'profile': 'Perfil',
        'settings': 'Configuración'
      };
      
      const displayName = segmentNames[segment] || 
        segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        text: displayName,
        href: currentPath
      });
    });
    
    return breadcrumbs;
  };

  // 🔄 Función para verificar si hay navegación personalizada disponible
  const hasCustomNavigation = () => {
    return navigation && 
           navigation !== defaultNavigation && 
           navigation.header && 
           navigation.header.length > 0;
  };

  // 🏠 Retornar navegación y funciones
  return {
    // Estado
    navigation: navigation || defaultNavigation,
    loading,
    error,
    lastFetch,
    
    // Funciones principales
    refresh,
    getHeaderItems,
    getFooterLinks,
    getStoreLinks,
    getMobileNavItems,
    getNavItemByText,
    getBreadcrumbs,
    
    // Funciones de utilidad
    isActive,
    getNavItemClass,
    handleSmoothScroll,
    hasCustomNavigation,
    
    // Acceso directo (para compatibilidad)
    headerItems: getHeaderItems(),
    footerLinks: getFooterLinks(),
    storeLinks: getStoreLinks(),
    mobileNavItems: getMobileNavItems(),
    breadcrumbs: getBreadcrumbs(),
    
    // Estado útil
    isLoaded: !loading && !!navigation && !error,
    hasError: !!error,
    isEmpty: !navigation || !navigation.header || navigation.header.length === 0
  };
};

export default useNavigation;