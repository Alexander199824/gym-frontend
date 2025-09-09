// Autor: Alexander Echeverria
// Dirección: src/hooks/useNavigation.js

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiService from '../services/apiService';

const useNavigation = () => {
  // Estados principales
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const location = useLocation();

  // Navegación por defecto mientras carga
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

  // Función para obtener navegación
  const fetchNavigation = async (force = false) => {
    // Cache de 30 minutos (navegación no cambia frecuentemente)
    if (navigation && !force && lastFetch) {
      const timeDiff = Date.now() - lastFetch;
      if (timeDiff < 30 * 60 * 1000) return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Obteniendo navegación desde backend...');
      
      const response = await apiService.getNavigation();
      
      if (response.success && response.data) {
        console.log('Navegación obtenida correctamente:', response.data);
        setNavigation(response.data);
        setLastFetch(Date.now());
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error al obtener navegación:', error);
      setError(error.message);
      
      // En caso de error, usar navegación por defecto
      if (!navigation) {
        setNavigation(defaultNavigation);
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar navegación al montar el componente
  useEffect(() => {
    fetchNavigation();
  }, []);

  // Función para refrescar navegación manualmente
  const refresh = () => {
    fetchNavigation(true);
  };

  // Función para obtener elementos del header
  const getHeaderItems = () => {
    return navigation?.header?.filter(item => item.active) || defaultNavigation.header;
  };

  // Función para obtener enlaces del footer
  const getFooterLinks = () => {
    return navigation?.footer?.links || defaultNavigation.footer.links;
  };

  // Función para obtener enlaces de la tienda en footer
  const getStoreLinks = () => {
    return navigation?.footer?.store_links || defaultNavigation.footer.store_links;
  };

  // Función para verificar si un enlace está activo
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

  // Función para obtener elemento de navegación por texto
  const getNavItemByText = (text) => {
    const headerItems = getHeaderItems();
    return headerItems.find(item => item.text.toLowerCase() === text.toLowerCase());
  };

  // Función para obtener elementos de navegación móvil
  const getMobileNavItems = () => {
    // En móvil, podemos incluir elementos adicionales
    const headerItems = getHeaderItems();
    const additionalItems = [
      { text: "Mi Cuenta", href: "/login", active: true },
      { text: "Registro", href: "/register", active: true }
    ];
    
    return [...headerItems, ...additionalItems];
  };

  // Función para obtener clase CSS de elemento activo
  const getNavItemClass = (href, baseClass = '', activeClass = 'active') => {
    return `${baseClass} ${isActive(href) ? activeClass : ''}`.trim();
  };

  // Función para manejar navegación suave (smooth scroll)
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

  // Función para obtener breadcrumbs basado en la ruta actual
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
        'dashboard': 'Tablero',
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

  // Función para verificar si hay navegación personalizada disponible
  const hasCustomNavigation = () => {
    return navigation && 
           navigation !== defaultNavigation && 
           navigation.header && 
           navigation.header.length > 0;
  };

  // Retornar navegación y funciones
  return {
    // Estado principal
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
    
    // Estados útiles
    isLoaded: !loading && !!navigation && !error,
    hasError: !!error,
    isEmpty: !navigation || !navigation.header || navigation.header.length === 0
  };
};

export default useNavigation;

/**
 * DOCUMENTACIÓN DEL HOOK useNavigation
 * 
 * PROPÓSITO:
 * Hook personalizado de React que gestiona toda la navegación del sitio web
 * del gimnasio, incluyendo menús de header, footer, navegación móvil, breadcrumbs
 * y funcionalidades de scroll suave. Proporciona una interfaz unificada para
 * manejar la navegación tanto estática como dinámica desde el backend.
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Obtiene configuración de navegación desde la API backend
 * - Implementa sistema de cache de 30 minutos para optimizar rendimiento
 * - Proporciona navegación por defecto robusta en caso de fallos
 * - Maneja navegación tanto para desktop como móvil
 * - Genera breadcrumbs automáticamente basados en la ruta actual
 * - Implementa navegación suave (smooth scroll) para anchors
 * - Detecta elementos de navegación activos automáticamente
 * - Mapea rutas a nombres legibles en español
 * 
 * ARCHIVOS CON LOS QUE SE CONECTA:
 * - '../services/apiService': Servicio principal para comunicación con backend
 *   └── Función específica: getNavigation()
 * - 'react-router-dom': Para detección de rutas y ubicación actual
 * - Backend API endpoint: '/api/gym/navigation'
 * - Componentes de navegación (Header, Footer, MobileMenu, Breadcrumbs)
 * - Cualquier componente que requiera navegación o detección de rutas
 * 
 * ESTRUCTURA DE DATOS ESPERADA DEL BACKEND:
 * Respuesta del API: { success: true, data: {...} }
 * 
 * Estructura de navegación: {
 *   header: [                    // Elementos del menú principal
 *     {
 *       text: string,            // Texto del enlace
 *       href: string,            // URL o anchor (#inicio)
 *       active: boolean,         // Si está activo/visible
 *       icon?: string,           // Icono opcional
 *       submenu?: Array          // Submenú opcional
 *     }
 *   ],
 *   footer: {
 *     links: [                   // Enlaces del footer principal
 *       {
 *         text: string,
 *         href: string
 *       }
 *     ],
 *     store_links: [             // Enlaces específicos de la tienda
 *       {
 *         text: string,
 *         href: string           // URLs con parámetros (?category=...)
 *       }
 *     ]
 *   }
 * }
 * 
 * NAVEGACIÓN POR DEFECTO:
 * - Header: Inicio, Servicios, Planes, Tienda, Contacto
 * - Footer: Enlaces principales + categorías de tienda
 * - Tienda: Suplementos, Ropa Deportiva, Accesorios, Equipamiento
 * - Navegación móvil: Incluye "Mi Cuenta" y "Registro" adicionales
 * 
 * USO TÍPICO EN COMPONENTES:
 * 
 * // En Header.js:
 * const { headerItems, isActive, getNavItemClass, handleSmoothScroll } = useNavigation();
 * 
 * return (
 *   <nav>
 *     {headerItems.map(item => (
 *       <a 
 *         key={item.text}
 *         href={item.href}
 *         className={getNavItemClass(item.href, 'nav-link')}
 *         onClick={(e) => {
 *           e.preventDefault();
 *           if (!handleSmoothScroll(item.href)) {
 *             window.location.href = item.href;
 *           }
 *         }}
 *       >
 *         {item.text}
 *       </a>
 *     ))}
 *   </nav>
 * );
 * 
 * // En Footer.js:
 * const { footerLinks, storeLinks } = useNavigation();
 * 
 * return (
 *   <footer>
 *     <div className="main-links">
 *       {footerLinks.map(link => (
 *         <a key={link.text} href={link.href}>{link.text}</a>
 *       ))}
 *     </div>
 *     <div className="store-links">
 *       <h4>Tienda</h4>
 *       {storeLinks.map(link => (
 *         <a key={link.text} href={link.href}>{link.text}</a>
 *       ))}
 *     </div>
 *   </footer>
 * );
 * 
 * // En Breadcrumbs.js:
 * const { breadcrumbs } = useNavigation();
 * 
 * return (
 *   <nav aria-label="breadcrumb">
 *     {breadcrumbs.map((crumb, index) => (
 *       <span key={crumb.href}>
 *         {index > 0 && " > "}
 *         <a href={crumb.href}>{crumb.text}</a>
 *       </span>
 *     ))}
 *   </nav>
 * );
 * 
 * ESTADOS RETORNADOS:
 * - navigation: Objeto completo con toda la configuración de navegación
 * - loading: Boolean indicando si está cargando la configuración
 * - error: Mensaje de error si ocurrió algún problema
 * - lastFetch: Timestamp de la última carga exitosa
 * - isLoaded: Boolean indicando si ya se cargó exitosamente
 * - hasError: Boolean indicando si hay algún error
 * - isEmpty: Boolean indicando si no hay elementos de navegación
 * 
 * FUNCIONES PRINCIPALES:
 * - refresh(): Fuerza actualización de la configuración desde el backend
 * - getHeaderItems(): Obtiene elementos activos del menú principal
 * - getFooterLinks(): Obtiene enlaces del footer principal
 * - getStoreLinks(): Obtiene enlaces específicos de la tienda
 * - getMobileNavItems(): Obtiene elementos para navegación móvil (incluye extras)
 * - getNavItemByText(text): Busca elemento de navegación por texto
 * - getBreadcrumbs(): Genera breadcrumbs basados en la ruta actual
 * 
 * FUNCIONES DE UTILIDAD:
 * - isActive(href): Verifica si un enlace está activo (ruta actual o hash)
 * - getNavItemClass(href, baseClass, activeClass): Genera clases CSS con estado activo
 * - handleSmoothScroll(href): Maneja scroll suave para anchors (#inicio, #servicios)
 * - hasCustomNavigation(): Verifica si hay navegación personalizada del backend
 * 
 * ACCESO DIRECTO (CONVENIENCIA):
 * - headerItems: Array de elementos del header
 * - footerLinks: Array de enlaces del footer
 * - storeLinks: Array de enlaces de la tienda
 * - mobileNavItems: Array de elementos para móvil
 * - breadcrumbs: Array de breadcrumbs para la ruta actual
 * 
 * MANEJO DE RUTAS Y ANCHORS:
 * - Enlaces con hash (#): Activan scroll suave y actualizan URL
 * - Rutas normales (/tienda): Navegación estándar de React Router
 * - Detección automática de elemento activo basado en location
 * - Soporte para parámetros de query (?category=suplementos)
 * 
 * MAPEO DE RUTAS A ESPAÑOL:
 * - /store → "Tienda"
 * - /dashboard → "Tablero"
 * - /login → "Iniciar Sesión"
 * - /register → "Registro"
 * - /profile → "Perfil"
 * - /settings → "Configuración"
 * 
 * NAVEGACIÓN MÓVIL:
 * - Incluye todos los elementos del header
 * - Agrega "Mi Cuenta" y "Registro" para acceso rápido
 * - Optimizada para pantallas pequeñas
 * - Soporta menús colapsables
 * 
 * CATEGORÍAS DE TIENDA:
 * - Suplementos: Productos nutricionales y proteínas
 * - Ropa Deportiva: Vestimenta para entrenamientos
 * - Accesorios: Guantes, correas, shakers, etc.
 * - Equipamiento: Pesas, bandas, equipos de ejercicio
 * (Precios en quetzales - Q)
 * 
 * OPTIMIZACIONES DE RENDIMIENTO:
 * - Cache de 30 minutos para navegación (cambia poco)
 * - Navegación por defecto inmediata mientras carga
 * - Memoización implícita de funciones calculadas
 * - Detección eficiente de elementos activos
 * - Scroll suave nativo del navegador
 * 
 * CONSIDERACIONES DE UX:
 * - Indicadores visuales claros de navegación activa
 * - Scroll suave mejora la experiencia del usuario
 * - Breadcrumbs ayudan con la orientación
 * - Navegación móvil accesible y táctil
 * - Fallbacks robustos evitan pantallas en blanco
 * 
 * ACCESIBILIDAD:
 * - Navegación semántica con elementos <nav>
 * - ARIA labels para breadcrumbs
 * - Estados activos claramente marcados
 * - Soporte para navegación por teclado
 * - Contraste adecuado en estados hover/active
 * 
 * INTEGRACIÓN CON ANALYTICS:
 * - Trackear clics en elementos de navegación
 * - Medir efectividad de diferentes menús
 * - Análisis de rutas más utilizadas
 * - Optimización basada en comportamiento del usuario
 * 
 * NOTA PARA DESARROLLADORES:
 * Este hook es fundamental para toda la navegación del sitio. Cualquier
 * cambio debe considerarse cuidadosamente ya que afecta la UX completa.
 * La navegación por defecto garantiza que el sitio siempre sea funcional.
 * Mantener consistencia en la traducción de rutas al español. Los enlaces
 * de tienda deben considerar los precios en quetzales (Q) al dirigir a
 * productos específicos.
 */