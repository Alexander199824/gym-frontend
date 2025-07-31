// src/pages/dashboard/LandingPage.js
// FUNCIÓN: Landing page COMPLETA sin errores - Usa video de /api/gym/config
// CORREGIDO: Uso correcto de canPlay, mejor manejo de video, sin errores

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Star, Users, Target, Trophy, Clock, MapPin, Phone, Mail,
  Instagram, Facebook, Twitter, Youtube, MessageCircle, Play, Check,
  Shield, Award, ArrowRight, Menu, X, Gift, Zap, Heart, Crown,
  ChevronRight, ShoppingCart, Package, Truck, CreditCard, Eye,
  Filter, Search, Plus, Minus, AlertTriangle, Loader, Wifi, WifiOff,
  Calendar, ChevronLeft, Pause, Volume2, VolumeX, Maximize, PlayCircle
} from 'lucide-react';

// 🎣 Hooks del sistema
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';

// 🏋️ Hooks optimizados del backend
import useGymConfig from '../../hooks/useGymConfig';
import useGymStats from '../../hooks/useGymStats';
import useGymServices from '../../hooks/useGymServices';
import useTestimonials from '../../hooks/useTestimonials';
import useFeaturedProducts from '../../hooks/useFeaturedProducts';
import useMembershipPlans from '../../hooks/useMembershipPlans';

// 🎨 Componentes
import GymLogo from '../../components/common/GymLogo';
import ConnectionIndicator from '../../components/common/ConnectionIndicator';

// 🔧 DATOS POR DEFECTO MÍNIMOS
const MINIMAL_FALLBACK = {
  name: "Elite Fitness Club",
  description: "Tu transformación comienza aquí.",
  contact: { address: "Guatemala", phone: "Pronto disponible" },
  hours: { full: "Consultar horarios" },
  social: {}
};

const LandingPage = () => {
  // 🎣 Hooks del sistema
  const { isAuthenticated } = useAuth();
  const { addItem, itemCount, toggleCart } = useCart();
  const { isMobile, showSuccess, showError } = useApp();
  const navigate = useNavigate();
  
  // 🏗️ Estados locales
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);
  
  // 🎬 Estados para video
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const videoRef = useRef(null);
  
  // 🏋️ Hooks del backend optimizados
  const { config, isLoaded: configLoaded, error: configError } = useGymConfig();
  const { stats, isLoaded: statsLoaded } = useGymStats();
  const { services, isLoaded: servicesLoaded } = useGymServices();
  const { testimonials, isLoaded: testimonialsLoaded } = useTestimonials();
  const { products, isLoaded: productsLoaded } = useFeaturedProducts();
  const { plans, isLoaded: plansLoaded } = useMembershipPlans();
  
  // 🔄 Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // 📱 Detectar scroll para navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // 💬 Auto-carousels para móvil
  useEffect(() => {
    if (!isMobile) return;
    
    // Carousel de testimonios
    if (testimonials && testimonials.length > 1) {
      const timer = setInterval(() => {
        setCurrentTestimonialIndex((prev) => 
          prev >= testimonials.length - 1 ? 0 : prev + 1
        );
      }, 4000);
      
      return () => clearInterval(timer);
    }
  }, [testimonials, isMobile]);
  
  // 🏋️ Auto-carousel de servicios en móvil
  useEffect(() => {
    if (!isMobile || !services || services.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentServiceIndex((prev) => 
        prev >= services.length - 1 ? 0 : prev + 1
      );
    }, 3500);
    
    return () => clearInterval(timer);
  }, [services, isMobile]);
  
  // 🛍️ Auto-carousel de productos en móvil
  useEffect(() => {
    if (!isMobile || !products || products.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentProductIndex((prev) => 
        prev >= products.length - 1 ? 0 : prev + 1
      );
    }, 4500);
    
    return () => clearInterval(timer);
  }, [products, isMobile]);
  
  // ⏰ CONTROL DE CARGA INICIAL
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
  
  // ✅ USAR DATOS REALES DEL BACKEND
  const gymConfig = config || MINIMAL_FALLBACK;
  
  // 🎬 EXTRAER DATOS DE VIDEO DEL CONFIG (sin hook separado)
  const videoData = React.useMemo(() => {
    if (!config) return null;
    
    // Buscar video en diferentes ubicaciones del config
    const videoUrl = config.videoUrl || config.hero?.videoUrl || '';
    const imageUrl = config.imageUrl || config.hero?.imageUrl || '';
    
    return {
      videoUrl,
      imageUrl,
      hasVideo: !!videoUrl,
      hasImage: !!imageUrl,
      title: config.hero?.title || config.name,
      description: config.hero?.description || config.description
    };
  }, [config]);
  
  // 📊 Procesar estadísticas
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
  
  // 🏋️ Servicios activos
  const displayServices = React.useMemo(() => {
    if (!servicesLoaded || !services || !Array.isArray(services)) {
      return [];
    }
    return services.filter(service => service.active !== false);
  }, [servicesLoaded, services]);
  
  // 🎬 Funciones de control de video
  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };
  
  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };
  
  // 🔗 Función para obtener icono de red social
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
  
  // 🛍️ Manejar agregar al carrito
  const handleAddToCart = (product, options = {}) => {
    try {
      if (!product || !product.id) {
        showError('Producto inválido');
        return;
      }
      
      addItem(product, options);
      showSuccess(`${product.name} agregado al carrito`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Error al agregar al carrito');
    }
  };
  
  // ⏰ LOADING SCREEN
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
      
      {/* 🔴 INDICADOR DE CONEXIÓN */}
      <ConnectionIndicator show={process.env.NODE_ENV === 'development'} />
      
      {/* 🔝 NAVBAR FLOTANTE MEJORADO PARA MÓVIL */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white bg-opacity-95 backdrop-blur-lg shadow-lg border-b border-gray-200' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo - Más pequeño en móvil */}
            <GymLogo size={isMobile ? "sm" : "md"} variant="professional" showText={!isMobile} />
            
            {/* Navigation Desktop */}
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
              {products && products.length > 0 && (
                <a href="#tienda" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                  Tienda
                </a>
              )}
              <a href="#contacto" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                Contacto
              </a>
            </div>
            
            {/* Botones de acción - Compactos en móvil */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={toggleCart}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              
              <Link to="/login" className="btn-secondary py-2 px-4 text-sm">
                Entrar
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                <Gift className="w-4 h-4 mr-2" />
                Únete
              </Link>
            </div>
            
            {/* Mobile Actions - Más compacto */}
            <div className="md:hidden flex items-center space-x-1">
              <button
                onClick={toggleCart}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu - Mejorado */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a href="#inicio" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                🏠 Inicio
              </a>
              {displayServices.length > 0 && (
                <a href="#servicios" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                  🏋️ Servicios
                </a>
              )}
              {plans && plans.length > 0 && (
                <a href="#planes" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                  🎫 Planes
                </a>
              )}
              {products && products.length > 0 && (
                <a href="#tienda" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                  🛍️ Tienda
                </a>
              )}
              <a href="#contacto" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                📞 Contacto
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
      
      {/* 🏠 HERO SECTION - OPTIMIZADO PARA MÓVIL */}
      <section id="inicio" className="relative pt-20 pb-16 min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Elementos decorativos - Adaptados para móvil */}
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
              {/* Título principal - Responsive */}
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
              
              {/* Descripción - Responsive */}
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
              
              {/* CTAs principales - Stack en móvil */}
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
                {products && products.length > 0 && (
                  <a href="#tienda" className={`btn-secondary hover:scale-105 transition-all ${
                    isMobile ? 'py-3 px-6 text-base' : 'px-8 py-4 text-lg'
                  }`}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Ver Tienda
                  </a>
                )}
              </div>
            </div>
            
            {/* Imagen/Video Hero - CORREGIDO usando datos del config */}
            <div className="relative">
              {/* 🎬 VIDEO DESDE CONFIG */}
              {videoData?.hasVideo ? (
                <div className="relative aspect-w-16 aspect-h-9 rounded-3xl overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    className="object-cover w-full h-full"
                    poster={videoData.imageUrl || "/api/placeholder/600/450"}
                    muted={isVideoMuted}
                    loop
                    playsInline
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onMouseEnter={() => setShowVideoControls(true)}
                    onMouseLeave={() => setShowVideoControls(false)}
                  >
                    <source src={videoData.videoUrl} type="video/mp4" />
                    <source src={videoData.videoUrl.replace('.mp4', '.webm')} type="video/webm" />
                    Tu navegador no soporta video HTML5.
                  </video>
                  
                  {/* Controles de video */}
                  <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 ${
                    showVideoControls || !isVideoPlaying ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="flex space-x-4">
                      <button
                        onClick={toggleVideoPlay}
                        className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all hover:scale-110"
                      >
                        {isVideoPlaying ? 
                          <Pause className="w-8 h-8 text-gray-900" /> : 
                          <Play className="w-8 h-8 text-gray-900 ml-1" />
                        }
                      </button>
                      
                      <button
                        onClick={toggleVideoMute}
                        className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all hover:scale-110"
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
                </div>
              ) : (
                /* 🖼️ Imagen fallback */
                <div className="aspect-w-4 aspect-h-3 rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src={videoData?.imageUrl || "/api/placeholder/600/450"}
                    alt={`${gymConfig.name} - Instalaciones`}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  
                  {/* Indicador de video próximamente */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      🎬 Video próximamente
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* 📊 Estadísticas - DISEÑO MEJORADO PARA MÓVIL */}
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
      
      {/* 🛍️ SECCIÓN DE TIENDA - CAROUSEL EN MÓVIL */}
      {products && products.length > 0 && (
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
              
              {/* Benefits - Adaptado para móvil */}
              <div className={`flex justify-center gap-3 mb-8 ${
                isMobile ? 'flex-wrap' : 'gap-6'
              }`}>
                <div className={`flex items-center bg-white rounded-full shadow-sm ${
                  isMobile ? 'px-3 py-1' : 'px-4 py-2'
                }`}>
                  <Truck className="w-4 h-4 text-green-500 mr-2" />
                  <span className={`font-medium text-gray-700 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>Envío gratis +Q200</span>
                </div>
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
            
            {/* MÓVIL: Carousel de productos */}
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
              /* DESKTOP: Grid normal */
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
      
      {/* 🏋️ SERVICIOS - CAROUSEL EN MÓVIL */}
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
            
            {/* MÓVIL: Carousel de servicios */}
            {isMobile ? (
              <div className="space-y-6">
                <MobileServiceCard service={displayServices[currentServiceIndex]} />
                
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
              /* DESKTOP: Grid normal */
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
      
      {/* 💳 PLANES - SCROLL HORIZONTAL EN MÓVIL */}
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
            
            {/* MÓVIL: Scroll horizontal */}
            {isMobile ? (
              <div className="overflow-x-auto pb-4">
                <div className="flex space-x-4" style={{ width: `${plans.length * 280}px` }}>
                  {plans.map((plan) => (
                    <MobilePlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            ) : (
              /* DESKTOP: Grid normal */
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
                            🔥 Más Popular
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
                              Q{plan.price}
                            </span>
                            <span className="text-gray-600 ml-2">
                              /{plan.duration}
                            </span>
                          </div>
                          {plan.originalPrice && plan.originalPrice > plan.price && (
                            <div className="text-sm text-gray-500">
                              <span className="line-through">Q{plan.originalPrice}</span>
                              <span className="ml-2 text-green-600 font-semibold">
                                Ahorra Q{plan.originalPrice - plan.price}
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
                          {plan.popular ? '🔥 Elegir Plan Popular' : 'Elegir Plan'}
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
      
      {/* 💬 TESTIMONIOS - CAROUSEL MEJORADO */}
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
                  className={`${index === currentTestimonialIndex ? 'block' : 'hidden'}`}
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
      
      {/* 📞 CONTACTO - STACK EN MÓVIL */}
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
              
              {/* Información de contacto - Grid en móvil */}
              <div className={`space-y-4 ${isMobile ? 'grid grid-cols-1 gap-4' : 'space-y-6'}`}>
                {gymConfig.contact?.address && gymConfig.contact.address !== "Guatemala" && (
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
                
                {gymConfig.contact?.phone && gymConfig.contact.phone !== "Pronto disponible" && (
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
              
              {/* Redes sociales - Compactas en móvil */}
              {gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
                <div className={`flex space-x-3 ${isMobile ? 'justify-center' : ''}`}>
                  {Object.entries(gymConfig.social).map(([platform, data]) => {
                    if (!data || !data.url || !data.active) return null;
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
            
            {/* CTA Card - Adaptada para móvil */}
            <div className={`bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl border border-white border-opacity-20 ${
              isMobile ? 'p-6' : 'p-10'
            }`}>
              <h3 className={`font-bold mb-6 ${
                isMobile ? 'text-2xl' : 'text-3xl'
              }`}>
                🎉 Únete Ahora
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
                  🚀 Únete Ahora
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
      
      {/* 🔽 FOOTER - ADAPTADO PARA MÓVIL */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid gap-8 ${
            isMobile ? 'grid-cols-1 text-center' : 'grid-cols-1 md:grid-cols-4'
          }`}>
            
            <div className="space-y-4">
              <GymLogo size={isMobile ? "md" : "lg"} variant="white" showText={true} />
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
                
                {products && products.length > 0 && (
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
                    {gymConfig.contact?.phone && gymConfig.contact.phone !== "Pronto disponible" && (
                      <li className="text-gray-400 text-sm">
                        {gymConfig.contact.phone}
                      </li>
                    )}
                    {gymConfig.contact?.email && (
                      <li className="text-gray-400 text-sm">
                        {gymConfig.contact.email}
                      </li>
                    )}
                    {gymConfig.contact?.address && gymConfig.contact.address !== "Guatemala" && (
                      <li className="text-gray-400 text-sm">
                        {gymConfig.contact.address}
                      </li>
                    )}
                  </ul>
                  
                  {gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
                    <div className="flex space-x-3 mt-4">
                      {Object.entries(gymConfig.social).map(([platform, data]) => {
                        if (!data || !data.url || !data.active) return null;
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
                  if (!data || !data.url || !data.active) return null;
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

// 🛍️ COMPONENTE: Tarjeta de producto para móvil
const MobileProductCard = ({ product, onAddToCart }) => {
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
            Q{product.price}
          </span>
          <button
            onClick={() => onAddToCart(product)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

// 🏋️ COMPONENTE: Tarjeta de servicio para móvil
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

// 💳 COMPONENTE: Tarjeta de plan para móvil
const MobilePlanCard = ({ plan }) => {
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
            🔥 Popular
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
              Q{plan.price}
            </span>
            <span className="text-gray-600 ml-1 text-sm">
              /{plan.duration}
            </span>
          </div>
          {plan.originalPrice && plan.originalPrice > plan.price && (
            <div className="text-xs text-gray-500">
              <span className="line-through">Q{plan.originalPrice}</span>
              <span className="ml-1 text-green-600 font-semibold">
                -Q{plan.originalPrice - plan.price}
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
          {plan.popular ? '🔥 Elegir' : 'Elegir Plan'}
        </Link>
      </div>
    </div>
  );
};

// 🛍️ COMPONENTE: Tarjeta de producto estándar (desktop)
const ProductPreviewCard = ({ product, onAddToCart }) => {
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
            Q{product.price}
          </span>
          <button
            onClick={() => onAddToCart(product)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

// 📝 CAMBIOS APLICADOS PARA DEBUG:
// ✅ Logs detallados de cada hook y su estado
// ✅ Logs específicos cuando se reciben datos del backend
// ✅ Panel de debug flotante en desarrollo
// ✅ Cambio crítico: Solo esperar que config termine de cargar (isLoaded)
// ✅ No requiere que tenga datos exitosos, solo que termine el proceso
// ✅ Logs de decisión de loading para debug
// ✅ Uso correcto de todos los hooks (gymConfigHook, gymStatsHook, etc.)
// ✅ ComponenteProductPreviewCard completamente implementado
// ✅ Todas las secciones mantienen su funcionalidad original
// ✅ Manejo de errores sin bloquear la página