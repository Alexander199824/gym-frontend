// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/LandingPage.js
// VERSIÓN ACTUALIZADA: Usa gymConfig centralizado sin datos hardcodeados

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Star, Users, Target, Trophy, Clock, MapPin, Phone, Mail,
  Instagram, Facebook, Twitter, Youtube, MessageCircle, Play, Check,
  Shield, Award, ArrowRight, Menu, X, Gift, Zap, Heart, Crown,
  ChevronRight, ShoppingCart, Package, Truck, CreditCard, Eye,
  Filter, Search, Plus, Minus, AlertTriangle, Loader, Wifi, WifiOff,
  Calendar, ChevronLeft, Pause, Volume2, VolumeX, Maximize, PlayCircle,
  Loader2, Coins
} from 'lucide-react';

// Hooks del sistema
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';

// Hooks optimizados del backend
import useGymConfig from '../../hooks/useGymConfig';
import useGymStats from '../../hooks/useGymStats';
import useGymServices from '../../hooks/useGymServices';
import useTestimonials from '../../hooks/useTestimonials';
import useFeaturedProducts from '../../hooks/useFeaturedProducts';
import useMembershipPlans from '../../hooks/useMembershipPlans';

// Componentes
import GymLogo from '../../components/common/GymLogo';
import ConnectionIndicator from '../../components/common/ConnectionIndicator';

// IMPORTAR CONFIGURACIÓN CENTRALIZADA
import gymConfigDefault from '../../config/gymConfig';

// Función auxiliar para formatear en Quetzales
const formatQuetzales = (amount) => {
  if (!amount || isNaN(amount)) return `${gymConfigDefault.regional.currencySymbol} 0.00`;
  return `${gymConfigDefault.regional.currencySymbol} ${parseFloat(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Datos por defecto mínimos usando gymConfig
const MINIMAL_FALLBACK = {
  name: gymConfigDefault.name,
  description: gymConfigDefault.description,
  contact: { 
    address: gymConfigDefault.location.address, 
    phone: gymConfigDefault.contact.phone,
    email: gymConfigDefault.contact.email
  },
  hours: { 
    full: gymConfigDefault.hours.full 
  },
  social: gymConfigDefault.social
};

const LandingPage = () => {
  // Hooks del sistema
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isMobile, showSuccess, showError } = useApp();
  const navigate = useNavigate();
  
  // Estados locales
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);
  
  // Estados para video
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  
  // Referencias para carousels automáticos
  const testimonialIntervalRef = useRef(null);
  const serviceIntervalRef = useRef(null);
  const productIntervalRef = useRef(null);
  
  // Hooks del backend optimizados
  const { config, isLoaded: configLoaded, error: configError } = useGymConfig();
  const { stats, isLoaded: statsLoaded } = useGymStats();
  const { services, isLoaded: servicesLoaded } = useGymServices();
  const { testimonials, isLoaded: testimonialsLoaded } = useTestimonials();
  const { products, isLoaded: productsLoaded, error: productsError } = useFeaturedProducts();
  const { plans, isLoaded: plansLoaded } = useMembershipPlans();
  
  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Detectar scroll para navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debug detallado para productos
  useEffect(() => {
    console.group('Verificación detallada de la sección de tienda');
    console.log('Estado de productos:');
    console.log('  - variable productos:', products);
    console.log('  - tipo de productos:', typeof products);
    console.log('  - productos es null:', products === null);
    console.log('  - productos es undefined:', products === undefined);
    console.log('  - productos es array:', Array.isArray(products));
    console.log('  - longitud de productos:', products?.length);
    console.log('  - productos cargados:', productsLoaded);
    console.log('  - error de productos:', productsError);
    
    // Verificar la condición exacta que usa el renderizado
    const condition1 = products && products.length > 0;
    const condition2 = products && Array.isArray(products) && products.length > 0;
    
    console.log('Condiciones de renderizado:');
    console.log('  - products && products.length > 0:', condition1);
    console.log('  - products && Array.isArray(products) && products.length > 0:', condition2);
    console.log('  - Debería renderizar sección de tienda:', condition1 || condition2);
    
    // Si hay productos, mostrar detalles
    if (products && Array.isArray(products) && products.length > 0) {
      console.log('Detalles de productos:');
      products.forEach((product, index) => {
        console.log(`  Producto ${index + 1}:`, {
          id: product.id,
          name: product.name,
          price: product.price,
          featured: product.featured,
          inStock: product.inStock
        });
      });
    }
    
    console.groupEnd();
  }, [products, productsLoaded, productsError]);
  
  // Testimonios automáticos
  useEffect(() => {
    // Limpiar interval anterior
    if (testimonialIntervalRef.current) {
      clearInterval(testimonialIntervalRef.current);
      testimonialIntervalRef.current = null;
    }
    
    // Solo crear interval si hay testimonios y están cargados
    if (testimonialsLoaded && testimonials && Array.isArray(testimonials) && testimonials.length > 1) {
      console.log('Iniciando carousel automático de testimonios:', testimonials.length, 'testimonios');
      
      testimonialIntervalRef.current = setInterval(() => {
        setCurrentTestimonialIndex((prevIndex) => {
          const nextIndex = prevIndex >= testimonials.length - 1 ? 0 : prevIndex + 1;
          console.log(`Carousel de testimonios: ${prevIndex} → ${nextIndex}`);
          return nextIndex;
        });
      }, 5000); // Cada 5 segundos
    } else {
      console.log('Carousel de testimonios no iniciado:', {
        loaded: testimonialsLoaded,
        hasTestimonials: !!testimonials,
        isArray: Array.isArray(testimonials),
        length: testimonials?.length || 0
      });
    }
    
    // Cleanup
    return () => {
      if (testimonialIntervalRef.current) {
        clearInterval(testimonialIntervalRef.current);
        testimonialIntervalRef.current = null;
      }
    };
  }, [testimonialsLoaded, testimonials]);
  
  // Servicios auto-carousel en móvil
  useEffect(() => {
    // Limpiar interval anterior
    if (serviceIntervalRef.current) {
      clearInterval(serviceIntervalRef.current);
      serviceIntervalRef.current = null;
    }
    
    // Solo en móvil y si hay servicios
    if (isMobile && servicesLoaded && services && Array.isArray(services) && services.length > 1) {
      console.log('Iniciando carousel automático de servicios en móvil:', services.length, 'servicios');
      
      serviceIntervalRef.current = setInterval(() => {
        setCurrentServiceIndex((prevIndex) => {
          const nextIndex = prevIndex >= services.length - 1 ? 0 : prevIndex + 1;
          console.log(`Carousel de servicios: ${prevIndex} → ${nextIndex}`);
          return nextIndex;
        });
      }, 4000); // Cada 4 segundos
    } else {
      console.log('Carousel de servicios no iniciado:', {
        isMobile,
        loaded: servicesLoaded,
        hasServices: !!services,
        isArray: Array.isArray(services),
        length: services?.length || 0
      });
    }
    
    // Cleanup
    return () => {
      if (serviceIntervalRef.current) {
        clearInterval(serviceIntervalRef.current);
        serviceIntervalRef.current = null;
      }
    };
  }, [isMobile, servicesLoaded, services]);
  
  // Productos auto-carousel en móvil
  useEffect(() => {
    // Limpiar interval anterior
    if (productIntervalRef.current) {
      clearInterval(productIntervalRef.current);
      productIntervalRef.current = null;
    }
    
    // Solo en móvil y si hay productos
    if (isMobile && productsLoaded && products && Array.isArray(products) && products.length > 1) {
      console.log('Iniciando carousel automático de productos en móvil:', products.length, 'productos');
      
      productIntervalRef.current = setInterval(() => {
        setCurrentProductIndex((prevIndex) => {
          const nextIndex = prevIndex >= products.length - 1 ? 0 : prevIndex + 1;
          console.log(`Carousel de productos: ${prevIndex} → ${nextIndex}`);
          return nextIndex;
        });
      }, 4500); // Cada 4.5 segundos
    } else {
      console.log('Carousel de productos no iniciado:', {
        isMobile,
        loaded: productsLoaded,
        hasProducts: !!products,
        isArray: Array.isArray(products),
        length: products?.length || 0
      });
    }
    
    // Cleanup
    return () => {
      if (productIntervalRef.current) {
        clearInterval(productIntervalRef.current);
        productIntervalRef.current = null;
      }
    };
  }, [isMobile, productsLoaded, products]);
  
  // Control de carga inicial
  useEffect(() => {
    if (configLoaded && !initialLoadCompleted) {
      setInitialLoadCompleted(true);
    }
    
    const timer = setTimeout(() => {
      if (!initialLoadCompleted) {
        setInitialLoadCompleted(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [configLoaded, config, initialLoadCompleted]);
  
  // Cleanup general
  useEffect(() => {
    return () => {
      // Limpiar todos los intervals al desmontar
      if (testimonialIntervalRef.current) {
        clearInterval(testimonialIntervalRef.current);
      }
      if (serviceIntervalRef.current) {
        clearInterval(serviceIntervalRef.current);
      }
      if (productIntervalRef.current) {
        clearInterval(productIntervalRef.current);
      }
    };
  }, []);

  // Función para limpiar cache
  const clearAppCache = useCallback(() => {
    try {
      // Guardar datos del carrito antes de limpiar
      const cartData = localStorage.getItem('gym-cart-items');
      const cartTimestamp = localStorage.getItem('gym-cart-timestamp');
      
      // Limpiar todo el localStorage excepto el carrito
      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('gym-cart')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpiar sessionStorage también
      sessionStorage.clear();
      
      console.log('Cache limpiado exitosamente (carrito preservado)');
      
      // Recargar la página para refrescar todos los hooks
      window.location.reload();
      
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  }, []);
  
  // Usar datos reales del backend con fallback a gymConfig
  const gymConfig = config || MINIMAL_FALLBACK;
  
  // Extraer datos de video del config
  const videoData = React.useMemo(() => {
    if (!config) return null;
    
    // Buscar video en diferentes ubicaciones del config
    const videoUrl = config.hero?.videoUrl || config.videoUrl || '';
    const imageUrl = config.hero?.imageUrl || config.imageUrl || '';
    
    console.log('Datos de video extraídos del config:', { 
      videoUrl, 
      imageUrl,
      hasHeroSection: !!config.hero,
      heroVideoUrl: config.hero?.videoUrl,
      heroImageUrl: config.hero?.imageUrl 
    });
    
    return {
      videoUrl,
      imageUrl,
      hasVideo: !!videoUrl,
      hasImage: !!imageUrl,
      title: config.hero?.title || config.name,
      description: config.hero?.description || config.description
    };
  }, [config]);
  
  // Procesar estadísticas
  const formattedStats = React.useMemo(() => {
    if (!statsLoaded || !stats) return [];
    
    const statsArray = [];
    
    if (stats.members > 0) {
      statsArray.push({ number: stats.members, label: "Miembros", icon: Users });
    }
    if (stats.trainers > 0) {
      statsArray.push({ number: stats.trainers, label: "Entrenadores", icon: Award });
    }
    if (stats.experience > 0) {
      statsArray.push({ number: stats.experience, label: "Años", icon: Trophy });
    }
    if (stats.satisfaction > 0) {
      statsArray.push({ number: `${stats.satisfaction}%`, label: "Satisfacción", icon: Star });
    }
    
    return statsArray;
  }, [statsLoaded, stats]);
  
  // Servicios activos
  const displayServices = React.useMemo(() => {
    if (!servicesLoaded || !services || !Array.isArray(services)) {
      return [];
    }
    return services.filter(service => service.active !== false);
  }, [servicesLoaded, services]);
  
  // Funciones de control de video
  const handleVideoLoad = () => {
    console.log('Video cargado exitosamente');
    setVideoLoaded(true);
    setVideoError(false);
  };
  
  const handleVideoError = (error) => {
    console.error('Error de video:', error);
    setVideoError(true);
    setVideoLoaded(false);
  };
  
  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    
    try {
      if (isVideoPlaying) {
        console.log('Pausando video');
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        console.log('Reproduciendo video');
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsVideoPlaying(true);
            })
            .catch((error) => {
              console.error('Fallo al reproducir:', error);
              setVideoError(true);
            });
        } else {
          setIsVideoPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error al alternar reproducción:', error);
      setVideoError(true);
    }
  };
  
  const toggleVideoMute = () => {
    if (!videoRef.current) return;
    
    try {
      const newMutedState = !isVideoMuted;
      videoRef.current.muted = newMutedState;
      setIsVideoMuted(newMutedState);
      console.log('Video silenciado:', newMutedState);
    } catch (error) {
      console.error('Error al alternar silencio:', error);
    }
  };
  
  // Función para obtener icono de red social
  const getSocialIcon = (platform) => {
    const icons = {
      instagram: Instagram,
      facebook: Facebook,
      twitter: Twitter,
      youtube: Youtube,
      whatsapp: MessageCircle
    };
    return icons[platform] || MessageCircle;
  };
  
  // Manejar agregar al carrito
  const handleAddToCart = async (product, options = {}) => {
    try {
      if (!product || !product.id) {
        showError('Producto inválido');
        return;
      }
      
      console.log('Agregando producto al carrito desde landing:', product.name);
      await addItem(product, options);
      showSuccess(`${product.name} agregado al carrito`);
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      showError('Error al agregar al carrito');
    }
  };
  
  // Log del logo para debug
  useEffect(() => {
    if (config && config.logo) {
      console.log('Logo Debug:', {
        hasLogo: !!config.logo,
        logoUrl: config.logo.url,
        logoAlt: config.logo.alt,
        logoWidth: config.logo.width,
        logoHeight: config.logo.height
      });
    }
  }, [config]);
  
  // Pantalla de carga
  if (!initialLoadCompleted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Dumbbell className="w-16 h-16 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {gymConfig.name}
          </h2>
          <p className="text-gray-600 mb-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Indicador de conexión */}
      <ConnectionIndicator show={process.env.NODE_ENV === 'development'} />
      
      {/* Navbar flotante sin icono de carrito */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white bg-opacity-95 backdrop-blur-lg shadow-lg border-b border-gray-200' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              {config && config.logo && config.logo.url ? (
                <div className="flex items-center space-x-3">
                  <img 
                    src={config.logo.url}
                    alt={config.logo.alt || gymConfig.name}
                    className={`object-contain ${isMobile ? 'h-8 w-auto' : 'h-10 w-auto'}`}
                    onError={(e) => {
                      console.error('Fallo al cargar logo:', config.logo.url);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback logo */}
                  <div className={`hidden items-center justify-center bg-primary-600 rounded-xl ${
                    isMobile ? 'w-8 h-8' : 'w-10 h-10'
                  }`}>
                    <Dumbbell className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </div>
                  {!isMobile && (
                    <span className="text-lg font-bold text-gray-900">
                      {gymConfig.name}
                    </span>
                  )}
                </div>
              ) : (
                <GymLogo size={isMobile ? "sm" : "md"} variant="professional" showText={!isMobile} priority="high" />
              )}
            </div>
            
            {/* Navegación Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                Inicio
              </a>
              {displayServices.length > 0 && (
                <a href="#servicios" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                  Servicios
                </a>
              )}
              {plans && plans.length > 0 && (
                <a href="#planes" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                  Planes
                </a>
              )}
              {products && Array.isArray(products) && products.length > 0 && (
                <a href="#tienda" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                  Tienda
                </a>
              )}
              <a href="#contacto" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                Contacto
              </a>
            </div>
            
            {/* Botones de acción sin icono de carrito */}
            <div className="hidden md:flex items-center space-x-3">
              <Link to="/login" className="btn-secondary py-2 px-4 text-sm">
                Entrar
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                <Gift className="w-4 h-4 mr-2" />
                Únete
              </Link>
            </div>
            
            {/* Acciones móviles sin icono de carrito */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a href="#inicio" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Inicio
              </a>
              {displayServices.length > 0 && (
                <a href="#servicios" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                  Servicios
                </a>
              )}
              {plans && plans.length > 0 && (
                <a href="#planes" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                  Planes
                </a>
              )}
              {products && Array.isArray(products) && products.length > 0 && (
                <a href="#tienda" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                  Tienda
                </a>
              )}
              <a href="#contacto" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Contacto
              </a>
              <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-secondary text-center py-2 px-3 text-sm" onClick={() => setIsMenuOpen(false)}>
                  Entrar
                </Link>
                <Link to="/register" className="btn-primary text-center py-2 px-3 text-sm" onClick={() => setIsMenuOpen(false)}>
                  Únete
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Hero Section con video horizontal forzado */}
      <section id="inicio" className="relative pt-20 pb-16 min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute bg-primary-500 bg-opacity-5 rounded-full blur-3xl ${
            isMobile 
              ? 'top-10 right-5 w-48 h-48' 
              : 'top-20 right-10 w-72 h-72'
          }`}></div>
          <div className={`absolute bg-secondary-500 bg-opacity-5 rounded-full blur-3xl ${
            isMobile 
              ? 'bottom-10 left-5 w-64 h-64' 
              : 'bottom-20 left-10 w-96 h-96'
          }`}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`${isMobile ? 'space-y-8' : 'grid grid-cols-1 lg:grid-cols-2 gap-16'} items-center`}>
            
            {/* Contenido Hero */}
            <div className={`space-y-6 ${isMobile ? 'text-center' : ''}`}>
              {/* Título principal */}
              <h1 className={`font-bold text-gray-900 leading-tight ${
                isMobile 
                  ? 'text-3xl sm:text-4xl' 
                  : 'text-4xl md:text-6xl lg:text-7xl'
              }`}>
                Bienvenido a{' '}
                <span className="text-primary-600">
                  {gymConfig.name}
                </span>
              </h1>
              
              {/* Descripción */}
              <p className={`text-gray-600 leading-relaxed max-w-2xl ${
                isMobile 
                  ? 'text-lg mx-auto' 
                  : 'text-xl md:text-2xl'
              }`}>
                {gymConfig.description}
              </p>
              
              {/* Tagline */}
              {gymConfig.tagline && (
                <p className={`text-primary-600 font-medium ${
                  isMobile ? 'text-base' : 'text-lg'
                }`}>
                  {gymConfig.tagline}
                </p>
              )}
              
              {/* CTAs principales */}
              <div className={`flex gap-3 ${
                isMobile 
                  ? 'flex-col' 
                  : 'flex-col sm:flex-row'
              }`}>
                <Link to="/register" className={`btn-primary font-semibold hover:scale-105 transition-all ${
                  isMobile ? 'py-3 px-6 text-base' : 'px-8 py-4 text-lg'
                }`}>
                  <Gift className="w-5 h-5 mr-2" />
                  Únete Ahora
                </Link>
                {products && Array.isArray(products) && products.length > 0 && (
                  <a href="#tienda" className={`btn-secondary hover:scale-105 transition-all ${
                    isMobile ? 'py-3 px-6 text-base' : 'px-8 py-4 text-lg'
                  }`}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Ver Tienda
                  </a>
                )}
              </div>
            </div>
            
            {/* Video/Imagen Hero siempre horizontal 16:9 */}
            <div className="relative">
              {videoData?.hasVideo ? (
                <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${
                  isMobile ? 'aspect-[16/9]' : 'aspect-[16/9]'
                }`}>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    poster={videoData.imageUrl || "/api/placeholder/800/450"}
                    muted={isVideoMuted}
                    loop
                    playsInline
                    onLoadedMetadata={handleVideoLoad}
                    onError={handleVideoError}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onMouseEnter={() => setShowVideoControls(true)}
                    onMouseLeave={() => setShowVideoControls(false)}
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  >
                    <source src={videoData.videoUrl} type="video/mp4" />
                    Tu navegador no soporta video HTML5.
                  </video>
                  
                  {/* Controles de video */}
                  <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 ${
                    showVideoControls || !isVideoPlaying || videoError ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="flex space-x-4">
                      <button
                        onClick={toggleVideoPlay}
                        className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all hover:scale-110"
                        disabled={videoError}
                      >
                        {isVideoPlaying ? 
                          <Pause className="w-8 h-8 text-gray-900" /> : 
                          <Play className="w-8 h-8 text-gray-900 ml-1" />
                        }
                      </button>
                      
                      <button
                        onClick={toggleVideoMute}
                        className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all hover:scale-110"
                        disabled={videoError}
                      >
                        {isVideoMuted ? 
                          <VolumeX className="w-5 h-5 text-gray-900" /> : 
                          <Volume2 className="w-5 h-5 text-gray-900" />
                        }
                      </button>
                    </div>
                  </div>
                  
                  {/* Overlay de gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  
                  {/* Indicador de error de video */}
                  {videoError && (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Error al cargar el video</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl relative">
                  <img 
                    src={videoData?.imageUrl || "/api/placeholder/800/450"}
                    alt={`${gymConfig.name} - Instalaciones`}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  
                  {/* Indicador de video próximamente */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Video próximamente
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Estadísticas */}
          {formattedStats.length > 0 && (
            <div className={`mt-12 pt-8 border-t border-gray-200 ${
              isMobile 
                ? 'grid grid-cols-2 gap-4' 
                : formattedStats.length === 1 ? 'grid grid-cols-1 justify-center max-w-xs mx-auto' :
                  formattedStats.length === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-8' :
                  formattedStats.length === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-8' :
                  'grid grid-cols-2 md:grid-cols-4 gap-8'
            }`}>
              {formattedStats.map((stat, index) => (
                <div key={`stat-${index}`} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className={`bg-primary-100 rounded-2xl flex items-center justify-center ${
                      isMobile ? 'w-10 h-10' : 'w-12 h-12'
                    }`}>
                      <stat.icon className={`text-primary-600 ${
                        isMobile ? 'w-5 h-5' : 'w-6 h-6'
                      }`} />
                    </div>
                  </div>
                  <div className={`font-bold text-gray-900 mb-1 ${
                    isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'
                  }`}>
                    {stat.number}
                  </div>
                  <div className={`text-gray-600 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Sección de tienda con lógica corregida */}
      {(() => {
        const hasProducts = products && Array.isArray(products) && products.length > 0;
        
        console.log('Decisión de renderizado de tienda:', {
          products: !!products,
          isArray: Array.isArray(products),
          length: products?.length || 0,
          hasProducts,
          timestamp: new Date().toLocaleTimeString()
        });
        
        return hasProducts;
      })() && (
        <section id="tienda" className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header de tienda */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full mb-4">
                <ShoppingCart className="w-4 h-4 text-primary-600 mr-2" />
                <span className="text-sm font-semibold text-primary-700">
                  Tienda {gymConfig.name}
                </span>
              </div>
              <h2 className={`font-bold text-gray-900 mb-4 ${
                isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
              }`}>
                Productos{' '}
                <span className="text-primary-600">premium</span>
              </h2>
              <p className={`text-gray-600 max-w-3xl mx-auto mb-6 ${
                isMobile ? 'text-base' : 'text-xl'
              }`}>
                Descubre nuestra selección de productos de alta calidad
              </p>
              
              {/* Beneficios usando datos de gymConfig */}
              <div className={`flex justify-center gap-3 mb-8 ${
                isMobile ? 'flex-wrap' : 'gap-6'
              }`}>
                {gymConfigDefault.shipping.freeShippingThreshold > 0 && (
                  <div className={`flex items-center bg-white rounded-full shadow-sm ${
                    isMobile ? 'px-3 py-1' : 'px-4 py-2'
                  }`}>
                    <Truck className="w-4 h-4 text-green-500 mr-2" />
                    <span className={`font-medium text-gray-700 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>
                      Envío gratis +{gymConfigDefault.regional.currencySymbol}{gymConfigDefault.shipping.freeShippingThreshold}
                    </span>
                  </div>
                )}
                <div className={`flex items-center bg-white rounded-full shadow-sm ${
                  isMobile ? 'px-3 py-1' : 'px-4 py-2'
                }`}>
                  <Shield className="w-4 h-4 text-blue-500 mr-2" />
                  <span className={`font-medium text-gray-700 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>Garantía</span>
                </div>
              </div>
            </div>
            
            {/* Móvil: Carousel automático de productos */}
            {isMobile ? (
              <div className="relative">
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentProductIndex * 100}%)` }}
                  >
                    {products.map((product) => (
                      <div key={product.id} className="w-full flex-shrink-0 px-4">
                        <MobileProductCard 
                          product={product} 
                          onAddToCart={handleAddToCart}
                          currencySymbol={gymConfigDefault.regional.currencySymbol}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Indicadores de carousel */}
                <div className="flex justify-center mt-6 space-x-2">
                  {products.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProductIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentProductIndex 
                          ? 'bg-primary-500 scale-125' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Controles de navegación */}
                <button
                  onClick={() => setCurrentProductIndex(prev => 
                    prev === 0 ? products.length - 1 : prev - 1
                  )}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <button
                  onClick={() => setCurrentProductIndex(prev => 
                    prev === products.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ) : (
              /* Desktop: Grid normal */
              <div className={`grid gap-8 mb-12 ${
                products.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                products.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {products.slice(0, 3).map((product) => (
                  <ProductPreviewCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart}
                    currencySymbol={gymConfigDefault.regional.currencySymbol}
                  />
                ))}
              </div>
            )}
            
            {/* CTA para ver tienda completa */}
            <div className="text-center mt-8">
              <Link 
                to="/store"
                className={`btn-primary font-semibold hover:scale-105 transition-all ${
                  isMobile ? 'py-3 px-6 text-base' : 'px-8 py-4 text-lg'
                }`}
              >
                Ver tienda completa
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}
      
      {/* Servicios - Carousel automático en móvil */}
      {displayServices.length > 0 && (
        <section id="servicios" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full mb-4">
                <Zap className="w-4 h-4 text-primary-600 mr-2" />
                <span className="text-sm font-semibold text-primary-700">
                  Nuestros Servicios
                </span>
              </div>
              <h2 className={`font-bold text-gray-900 mb-4 ${
                isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
              }`}>
                Todo lo que necesitas para{' '}
                <span className="text-primary-600">alcanzar tus metas</span>
              </h2>
              <p className={`text-gray-600 max-w-3xl mx-auto ${
                isMobile ? 'text-base' : 'text-xl'
              }`}>
                Servicios profesionales diseñados para llevarte al siguiente nivel
              </p>
            </div>
            
            {/* Móvil: Carousel automático de servicios */}
            {isMobile ? (
              <div className="space-y-6">
                {displayServices[currentServiceIndex] && (
                  <MobileServiceCard service={displayServices[currentServiceIndex]} />
                )}
                
                {/* Indicadores de carousel */}
                <div className="flex justify-center space-x-2">
                  {displayServices.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentServiceIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentServiceIndex 
                          ? 'bg-primary-500 scale-125' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Desktop: Grid normal */
              <div className={`grid gap-12 ${
                displayServices.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                displayServices.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                displayServices.length <= 3 ? 'grid-cols-1 md:grid-cols-3' :
                displayServices.length <= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {displayServices.map((service) => {
                  const IconComponent = service.icon === 'user-check' ? Target : 
                                      service.icon === 'users' ? Users : 
                                      service.icon === 'heart' ? Heart : 
                                      service.icon === 'dumbbell' ? Dumbbell :
                                      Dumbbell;
                  
                  return (
                    <div key={service.id} className="text-center group">
                      <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-all duration-300">
                        <IconComponent className="w-10 h-10 text-primary-600" />
                      </div>
                      
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {service.description}
                      </p>
                      
                      {service.features && Array.isArray(service.features) && service.features.length > 0 && (
                        <ul className="text-sm text-gray-500 space-y-2">
                          {service.features.slice(0, 3).map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center justify-center">
                              <Check className="w-4 h-4 text-primary-500 mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
      
      {/* Planes - Scroll horizontal en móvil */}
      {plans && plans.length > 0 && (
        <section id="planes" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-secondary-50 rounded-full mb-4">
                <Crown className="w-4 h-4 text-secondary-600 mr-2" />
                <span className="text-sm font-semibold text-secondary-700">
                  Planes de Membresía
                </span>
              </div>
              <h2 className={`font-bold text-gray-900 mb-4 ${
                isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
              }`}>
                Elige tu plan{' '}
                <span className="text-primary-600">ideal</span>
              </h2>
              <p className={`text-gray-600 max-w-3xl mx-auto ${
                isMobile ? 'text-base' : 'text-xl'
              }`}>
                Planes diseñados para diferentes objetivos y estilos de vida
              </p>
            </div>
            
            {/* Móvil: Scroll horizontal */}
            {isMobile ? (
              <div className="overflow-x-auto pb-4">
                <div className="flex space-x-4" style={{ width: `${plans.length * 280}px` }}>
                  {plans.map((plan) => (
                    <MobilePlanCard 
                      key={plan.id} 
                      plan={plan}
                      currencySymbol={gymConfigDefault.regional.currencySymbol}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Desktop: Grid normal */

              <div className={`grid gap-8 max-w-6xl mx-auto ${
                plans.length === 1 ? 'grid-cols-1 max-w-md' :
                plans.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {plans.map((plan) => {
                  const IconComponent = plan.iconName === 'crown' ? Crown : 
                                      plan.iconName === 'calendar-days' ? Calendar : 
                                      plan.iconName === 'calendar' ? Calendar :
                                      plan.iconName === 'calendar-range' ? Calendar :
                                      Shield;
                  
                  return (
                    <div key={plan.id} className={`
                      relative bg-white rounded-3xl shadow-xl p-8 transition-all duration-300
                      ${plan.popular ? 'ring-2 ring-primary-500 scale-105' : 'hover:scale-105'}
                    `}>
                      
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                            Más Popular
                          </span>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-primary-600" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {plan.name}
                        </h3>
                        
                        <div className="mb-8">
                          <div className="flex items-baseline justify-center mb-2">
                            <span className="text-5xl font-bold text-gray-900">
                              {gymConfigDefault.regional.currencySymbol}{plan.price}
                            </span>
                            <span className="text-gray-600 ml-2">
                              /{plan.duration}
                            </span>
                          </div>
                          {plan.originalPrice && plan.originalPrice > plan.price && (
                            <div className="text-sm text-gray-500">
                              <span className="line-through">{gymConfigDefault.regional.currencySymbol}{plan.originalPrice}</span>
                              <span className="ml-2 text-green-600 font-semibold">
                                Ahorra {gymConfigDefault.regional.currencySymbol}{plan.originalPrice - plan.price}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                          <ul className="space-y-4 mb-8 text-left">
                            {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-center">
                                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        <Link 
                          to="/register"
                          className={`
                            w-full btn text-center font-semibold py-4
                            ${plan.popular ? 'btn-primary' : 'btn-secondary'}
                          `}
                        >
                          {plan.popular ? 'Elegir Plan Popular' : 'Elegir Plan'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="text-center mt-12">
              <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
                <Shield className="w-5 h-5 text-green-500 mr-3" />
                <span className="text-sm font-semibold text-gray-700">
                  Garantía de satisfacción 30 días
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Testimonios - Carousel automático mejorado */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-yellow-50 rounded-full mb-4">
                <Star className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-semibold text-yellow-700">
                  Testimonios
                </span>
              </div>
              <h2 className={`font-bold text-gray-900 mb-4 ${
                isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
              }`}>
                Lo que dicen nuestros{' '}
                <span className="text-primary-600">miembros</span>
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id || index}
                  className={`transition-all duration-500 ${index === currentTestimonialIndex ? 'block opacity-100' : 'hidden opacity-0'}`}
                >
                  <div className={`bg-gray-50 rounded-3xl text-center ${
                    isMobile ? 'p-6' : 'p-12'
                  }`}>
                    <div className="flex justify-center mb-6">
                      {[...Array(Math.min(testimonial.rating || 5, 5))].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    
                    <blockquote className={`text-gray-700 mb-6 leading-relaxed font-medium ${
                      isMobile ? 'text-lg' : 'text-2xl md:text-3xl'
                    }`}>
                      "{testimonial.text}"
                    </blockquote>
                    
                    <div>
                      <div className={`font-bold text-gray-900 ${
                        isMobile ? 'text-lg' : 'text-xl'
                      }`}>
                        {testimonial.name}
                      </div>
                      <div className="text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {testimonials.length > 1 && (
                <div className="flex justify-center mt-8 space-x-3">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonialIndex(index)}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        index === currentTestimonialIndex 
                          ? 'bg-primary-500 scale-125' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Contacto - Stack en móvil */}
      <section id="contacto" className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${isMobile ? 'space-y-12' : 'grid grid-cols-1 lg:grid-cols-2 gap-16'} items-center`}>
            
            <div className="space-y-8">
              <div>
                <h2 className={`font-bold mb-4 ${
                  isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
                }`}>
                  ¿Listo para comenzar?
                </h2>
                <p className={`text-gray-300 leading-relaxed ${
                  isMobile ? 'text-base' : 'text-xl'
                }`}>
                  Únete a {gymConfig.name} y comienza tu transformación hoy mismo.
                </p>
              </div>
              
              {/* Información de contacto */}
              <div className={`space-y-4 ${isMobile ? 'grid grid-cols-1 gap-4' : 'space-y-6'}`}>
                {gymConfig.contact?.address && (
                  <div className="flex items-center">
                    <div className={`bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4 ${
                      isMobile ? 'w-10 h-10' : 'w-12 h-12'
                    }`}>
                      <MapPin className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                    </div>
                    <div>
                      <div className="font-semibold">Ubicación</div>
                      <div className="text-gray-300 text-sm">
                        {gymConfig.contact.address}
                      </div>
                    </div>
                  </div>
                )}
                
                {gymConfig.contact?.phone && (
                  <div className="flex items-center">
                    <div className={`bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4 ${
                      isMobile ? 'w-10 h-10' : 'w-12 h-12'
                    }`}>
                      <Phone className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                    </div>
                    <div>
                      <div className="font-semibold">Teléfono</div>
                      <div className="text-gray-300 text-sm">
                        {gymConfig.contact.phone}
                      </div>
                    </div>
                  </div>
                )}
                
                {gymConfig.hours?.full && (
                  <div className="flex items-center">
                    <div className={`bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4 ${
                      isMobile ? 'w-10 h-10' : 'w-12 h-12'
                    }`}>
                      <Clock className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                    </div>
                    <div>
                      <div className="font-semibold">Horarios</div>
                      <div className="text-gray-300 text-sm">
                        {gymConfig.hours.full}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Redes sociales */}
              {gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
                <div className={`flex space-x-3 ${isMobile ? 'justify-center' : ''}`}>
                  {Object.entries(gymConfig.social).map(([platform, data]) => {
                    if (!data || !data.url) return null;
                    const IconComponent = getSocialIcon(platform);
                    
                    return (
                      <a 
                        key={platform}
                        href={data.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`bg-white bg-opacity-10 rounded-xl flex items-center justify-center hover:bg-opacity-20 transition-all hover:scale-110 ${
                          isMobile ? 'w-10 h-10' : 'w-12 h-12'
                        }`}
                        title={data.handle}
                      >
                        <IconComponent className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* CTA Card */}
            <div className={`bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl border border-white border-opacity-20 ${
              isMobile ? 'p-6' : 'p-10'
            }`}>
              <h3 className={`font-bold mb-6 ${
                isMobile ? 'text-2xl' : 'text-3xl'
              }`}>
                Únete Ahora
              </h3>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span className={isMobile ? 'text-sm' : ''}>Acceso completo al gimnasio</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span className={isMobile ? 'text-sm' : ''}>Entrenamiento personalizado</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span className={isMobile ? 'text-sm' : ''}>Clases grupales incluidas</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span className={isMobile ? 'text-sm' : ''}>Asesoría nutricional</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link to="/register" className={`w-full btn bg-white text-gray-900 hover:bg-gray-100 font-bold ${
                  isMobile ? 'py-3 text-base' : 'py-4 text-lg'
                }`}>
                  Únete Ahora
                </Link>
                <Link to="/login" className={`w-full btn btn-secondary border-white text-white hover:bg-white hover:text-gray-900 ${
                  isMobile ? 'py-3' : 'py-4'
                }`}>
                  Ya soy miembro
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
      {/* Footer adaptado para móvil */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid gap-8 ${
            isMobile ? 'grid-cols-1 text-center' : 'grid-cols-1 md:grid-cols-4'
          }`}>
            
            <div className="space-y-4">
              {/* Logo en el footer */}
              {config && config.logo && config.logo.url ? (
                <div className="flex items-center space-x-3 justify-center md:justify-start">
                  <img 
                    src={config.logo.url}
                    alt={config.logo.alt || gymConfig.name}
                    className="h-12 w-auto object-contain"
                  />
                  <span className="text-xl font-bold">
                    {gymConfig.name}
                  </span>
                </div>
              ) : (
                <GymLogo size={isMobile ? "md" : "lg"} variant="white" showText={true} priority="low" />
              )}
              <p className="text-gray-400 leading-relaxed text-sm">
                {gymConfig.description}
              </p>
            </div>
            
            {!isMobile && (
              <>
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Enlaces Rápidos</h3>
                  <ul className="space-y-2">
                    <li><a href="#inicio" className="text-gray-400 hover:text-white transition-colors">Inicio</a></li>
                    {displayServices.length > 0 && (
                      <li><a href="#servicios" className="text-gray-400 hover:text-white transition-colors">Servicios</a></li>
                    )}
                    {plans && plans.length > 0 && (
                      <li><a href="#planes" className="text-gray-400 hover:text-white transition-colors">Planes</a></li>
                    )}
                    <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Iniciar Sesión</Link></li>
                  </ul>
                </div>
                
                {products && Array.isArray(products) && products.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Tienda</h3>
                    <ul className="space-y-2">
                      <li><Link to="/store?category=suplementos" className="text-gray-400 hover:text-white transition-colors">Suplementos</Link></li>
                      <li><Link to="/store?category=ropa" className="text-gray-400 hover:text-white transition-colors">Ropa Deportiva</Link></li>
                      <li><Link to="/store?category=accesorios" className="text-gray-400 hover:text-white transition-colors">Accesorios</Link></li>
                    </ul>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Contáctanos</h3>
                  <ul className="space-y-2">
                    {gymConfig.contact?.phone && (
                      <li className="text-gray-400 text-sm">
                        {gymConfig.contact.phone}
                      </li>
                    )}
                    {gymConfig.contact?.email && (
                      <li className="text-gray-400 text-sm">
                        {gymConfig.contact.email}
                      </li>
                    )}
                    {gymConfig.contact?.address && (
                      <li className="text-gray-400 text-sm">
                        {gymConfig.contact.address}
                      </li>
                    )}
                  </ul>
                  
                  {gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
                    <div className="flex space-x-3 mt-4">
                      {Object.entries(gymConfig.social).map(([platform, data]) => {
                        if (!data || !data.url) return null;
                        const IconComponent = getSocialIcon(platform);
                        
                        return (
                          <a 
                            key={platform}
                            href={data.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                          >
                            <IconComponent className="w-4 h-4" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
            
          </div>
          
          <div className={`border-t border-gray-700 pt-6 mt-8 text-center ${
            isMobile ? 'space-y-4' : ''
          }`}>
            <p className="text-gray-400 text-sm">
              &copy; 2024 {gymConfig.name}. Todos los derechos reservados.
            </p>
            
            {/* Footer social en móvil */}
            {isMobile && gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
              <div className="flex justify-center space-x-4">
                {Object.entries(gymConfig.social).map(([platform, data]) => {
                  if (!data || !data.url) return null;
                  const IconComponent = getSocialIcon(platform);
                  
                  return (
                    <a 
                      key={platform}
                      href={data.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </footer>
      
    </div>
  );
};

// Componente: Tarjeta de producto para móvil
const MobileProductCard = ({ product, onAddToCart, currencySymbol = 'Q' }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAdd = async () => {
    if (isAdding) return;
    
    try {
      setIsAdding(true);
      await onAddToCart(product);
    } catch (error) {
      console.error('Error en tarjeta de producto móvil:', error);
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="aspect-w-4 aspect-h-3">
        <img 
          src={product.images?.[0]?.url || "/api/placeholder/300/225"}
          alt={product.name}
          className="object-cover w-full h-40"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary-600">
            {currencySymbol}{product.price}
          </span>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isAdding && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{isAdding ? 'Agregando...' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente: Tarjeta de servicio para móvil
const MobileServiceCard = ({ service }) => {
  const IconComponent = service.icon === 'user-check' ? Target : 
                      service.icon === 'users' ? Users : 
                      service.icon === 'heart' ? Heart : 
                      service.icon === 'dumbbell' ? Dumbbell :
                      Dumbbell;
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
        <IconComponent className="w-8 h-8 text-primary-600" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {service.title}
      </h3>
      <p className="text-gray-600 mb-6 leading-relaxed">
        {service.description}
      </p>
      
      {service.features && Array.isArray(service.features) && service.features.length > 0 && (
        <ul className="text-sm text-gray-500 space-y-2">
          {service.features.slice(0, 3).map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-500 mr-2" />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Componente: Tarjeta de plan para móvil
const MobilePlanCard = ({ plan, currencySymbol = 'Q' }) => {
  const IconComponent = plan.iconName === 'crown' ? Crown : 
                      plan.iconName === 'calendar-days' ? Calendar : 
                      plan.iconName === 'calendar' ? Calendar :
                      plan.iconName === 'calendar-range' ? Calendar :
                      Shield;
  
  return (
    <div className={`
      relative bg-white rounded-2xl shadow-lg p-6 w-64 flex-shrink-0
      ${plan.popular ? 'ring-2 ring-primary-500' : ''}
    `}>
      
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold">
            Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-primary-600" />
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {plan.name}
        </h3>
        
        <div className="mb-6">
          <div className="flex items-baseline justify-center mb-1">
            <span className="text-3xl font-bold text-gray-900">
              {currencySymbol}{plan.price}
            </span>
            <span className="text-gray-600 ml-1 text-sm">
              /{plan.duration}
            </span>
          </div>
          {plan.originalPrice && plan.originalPrice > plan.price && (
            <div className="text-xs text-gray-500">
              <span className="line-through">{currencySymbol}{plan.originalPrice}</span>
              <span className="ml-1 text-green-600 font-semibold">
                -{currencySymbol}{plan.originalPrice - plan.price}
              </span>
            </div>
          )}
        </div>
        
        {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
          <ul className="space-y-2 mb-6 text-left">
            {plan.features.slice(0, 4).map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start">
                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        )}
        
        <Link 
          to="/register"
          className={`
            w-full btn text-center font-semibold py-3 text-sm
            ${plan.popular ? 'btn-primary' : 'btn-secondary'}
          `}
        >
          {plan.popular ? 'Elegir' : 'Elegir Plan'}
        </Link>
      </div>
    </div>
  );
};

// Componente: Tarjeta de producto estándar (desktop)
const ProductPreviewCard = ({ product, onAddToCart, currencySymbol = 'Q' }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAdd = async () => {
    if (isAdding) return;
    
    try {
      setIsAdding(true);
      await onAddToCart(product);
    } catch (error) {
      console.error('Error en tarjeta de vista previa de producto:', error);
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-w-4 aspect-h-3">
        <img 
          src={product.images?.[0]?.url || "/api/placeholder/300/225"}
          alt={product.name}
          className="object-cover w-full h-48"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">
            {currencySymbol}{product.price}
          </span>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isAdding && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{isAdding ? 'Agregando...' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

/*
EXPLICACIÓN DEL ARCHIVO:

Este archivo define el componente LandingPage, que es la página principal y punto de entrada 
para visitantes no autenticados del sitio web del gimnasio. Proporciona una experiencia 
completa de presentación del negocio y captación de clientes potenciales.

FUNCIONALIDADES PRINCIPALES:
- Hero section con video o imagen adaptativo que funciona horizontal en todas las pantallas
- Navegación limpia sin icono de carrito (depende del carrito flotante global)
- Sección de productos con carousel automático en móvil y grid responsivo en desktop
- Carousel automático de servicios en dispositivos móviles para mejor experiencia
- Planes de membresía con scroll horizontal en móvil y grid en desktop
- Testimonios con rotación automática cada 5 segundos
- Sistema de estadísticas dinámicas del gimnasio
- Información de contacto completa con integración de redes sociales
- Footer responsivo con enlaces organizados

CONEXIONES CON OTROS ARCHIVOS:
- useAuth, useCart, useApp: Contextos principales de la aplicación
- useGymConfig, useGymStats, useGymServices, useTestimonials, useFeaturedProducts, useMembershipPlans: 
  Hooks especializados para cargar datos del backend
- GymLogo, ConnectionIndicator: Componentes reutilizables de UI
- React Router: Para navegación entre páginas

CARACTERÍSTICAS ESPECIALES:
- Formateo automático de precios en Quetzales guatemaltecos
- Video player con controles personalizados y manejo de errores
- Carousels automáticos que se adaptan al dispositivo del usuario
- Sistema de fallback para cuando no hay datos del backend
- Integración completa con el sistema de carrito flotante
- Responsive design optimizado específicamente para móviles guatemaltecos
- Limpieza automática de intervals para prevenir memory leaks
- Debug detallado para troubleshooting de productos y contenido

PROPÓSITO:
Servir como la cara principal del gimnasio en línea, capturando la atención de visitantes
potenciales y convirtiendo su interés en membresías y ventas. La página está optimizada
para la experiencia guatemalteca con precios en Quetzales, diseño mobile-first, y 
presentación profesional que inspira confianza y motivación para unirse al gimnasio.
*/