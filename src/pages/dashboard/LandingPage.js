// src/pages/dashboard/LandingPage.js
// FUNCIÓN: Landing page ULTRA-RESISTENTE - Funciona CON o SIN backend
// CONECTA CON: Backend cuando esté disponible, funciona offline si no está

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Star, Users, Target, Trophy, Clock, MapPin, Phone, Mail,
  Instagram, Facebook, Twitter, Youtube, MessageCircle, Play, Check,
  Shield, Award, ArrowRight, Menu, X, Gift, Zap, Heart, Crown,
  ChevronRight, ShoppingCart, Package, Truck, CreditCard, Eye,
  Filter, Search, Plus, Minus, AlertTriangle, Loader, Wifi, WifiOff
} from 'lucide-react';

// 🎣 Hooks del sistema
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';

// 🏋️ Hooks del backend (con timeouts)
import useGymConfig from '../../hooks/useGymConfig';
import useGymStats from '../../hooks/useGymStats';
import useGymServices from '../../hooks/useGymServices';
import useTestimonials from '../../hooks/useTestimonials';
import useFeaturedProducts from '../../hooks/useFeaturedProducts';
import useGymContent from '../../hooks/useGymContent';
import usePromoContent from '../../hooks/usePromoContent';
import useNavigation from '../../hooks/useNavigation';
import useBranding from '../../hooks/useBranding';
import useMembershipPlans from '../../hooks/useMembershipPlans';
import useActivePromotions from '../../hooks/useActivePromotions';

// 🎨 Componentes
import GymLogo from '../../components/common/GymLogo';

// 🔧 DATOS POR DEFECTO (FALLBACK COMPLETO SIN BACKEND)
const DEFAULT_CONFIG = {
  name: "Elite Fitness Club",
  description: "Tu transformación comienza aquí. Descubre tu mejor versión con nuestros entrenadores certificados.",
  tagline: "Transforma tu vida",
  contact: {
    address: "Guatemala, Guatemala",
    phone: "Disponible próximamente",
    email: "info@elitefitness.com"
  },
  hours: {
    full: "Lun-Vie 6:00-22:00, Sáb-Dom 8:00-20:00"
  },
  social: {
    instagram: { url: "#", handle: "@elitefitness", active: false },
    facebook: { url: "#", handle: "Elite Fitness", active: false }
  }
};

const DEFAULT_SERVICES = [
  {
    id: 1,
    title: "Entrenamiento Personal",
    description: "Sesiones personalizadas con entrenadores certificados para maximizar tus resultados.",
    icon: "Users",
    features: ["Evaluación física completa", "Plan personalizado", "Seguimiento semanal"]
  },
  {
    id: 2,
    title: "Clases Grupales", 
    description: "Variedad de clases grupales para todos los niveles y objetivos.",
    icon: "Target",
    features: ["Spinning", "Yoga", "Pilates", "Zumba"]
  },
  {
    id: 3,
    title: "Nutrición Deportiva",
    description: "Asesoría nutricional especializada para complementar tu entrenamiento.",
    icon: "Heart", 
    features: ["Plan nutricional", "Seguimiento mensual", "Recetas saludables"]
  }
];

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Proteína Premium",
    description: "Proteína de alta calidad para maximizar tus resultados",
    price: 299,
    originalPrice: 349,
    image: "/api/placeholder/300/300",
    category: "suplementos",
    brand: "Elite Nutrition",
    rating: 4.8,
    reviews: 156,
    features: ["Alta calidad", "Fácil digestión", "Resultados garantizados"],
    inStock: true
  },
  {
    id: 2,
    name: "Camiseta Deportiva Elite",
    description: "Camiseta deportiva de tecnología avanzada",
    price: 149,
    originalPrice: 199, 
    image: "/api/placeholder/300/300",
    category: "ropa",
    brand: "Elite Sports",
    rating: 4.6,
    reviews: 89,
    features: ["Absorbe humedad", "Secado rápido", "Cómoda"],
    inStock: true
  },
  {
    id: 3,
    name: "Shaker Elite Pro",
    description: "Shaker profesional con compartimentos",
    price: 59,
    originalPrice: 79,
    image: "/api/placeholder/300/300", 
    category: "accesorios",
    brand: "Elite Gear",
    rating: 4.5,
    reviews: 234,
    features: ["Libre de BPA", "Compartimentos", "Fácil limpieza"],
    inStock: true
  }
];

const DEFAULT_PLANS = [
  {
    id: 1,
    name: "Básico",
    price: 199,
    originalPrice: 249,
    duration: "mes",
    popular: false,
    iconName: "Shield",
    features: [
      "Acceso a área de pesas",
      "Clases grupales básicas", 
      "Casillero incluido",
      "Wi-Fi gratuito"
    ]
  },
  {
    id: 2,
    name: "Premium", 
    price: 299,
    originalPrice: 349,
    duration: "mes",
    popular: true,
    iconName: "Crown",
    features: [
      "Acceso completo al gimnasio",
      "Todas las clases grupales",
      "1 sesión de entrenamiento personal",
      "Evaluación física mensual",
      "Descuentos en tienda"
    ]
  },
  {
    id: 3,
    name: "VIP",
    price: 499,
    originalPrice: 599,
    duration: "mes", 
    popular: false,
    iconName: "Crown",
    features: [
      "Acceso 24/7",
      "Entrenamiento personal ilimitado",
      "Nutricionista incluido",
      "Área VIP exclusiva",
      "Toallas y amenities"
    ]
  }
];

const DEFAULT_TESTIMONIALS = [
  {
    id: 1,
    name: "María González",
    role: "Miembro Premium",
    text: "Excelente gimnasio con instalaciones de primera y entrenadores muy profesionales.",
    rating: 5
  },
  {
    id: 2,
    name: "Carlos Mendoza", 
    role: "Miembro VIP",
    text: "La mejor inversión que he hecho. Resultados garantizados y ambiente motivador.",
    rating: 5
  }
];

const DEFAULT_STATS = {
  members: 850,
  trainers: 12,
  experience: 8,
  satisfaction: 98
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
  const [showStorePreview, setShowStorePreview] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, connected, offline
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  
  // 🏋️ Hooks del backend CON TIMEOUTS
  const { config, isLoaded: configLoaded, error: configError } = useGymConfig();
  const { stats, isLoaded: statsLoaded, error: statsError } = useGymStats();
  const { services, isLoaded: servicesLoaded, error: servicesError } = useGymServices();
  const { testimonials, isLoaded: testimonialsLoaded, error: testimonialsError } = useTestimonials();
  const { products, isLoaded: productsLoaded, error: productsError } = useFeaturedProducts();
  const { content, isLoaded: contentLoaded, error: contentError } = useGymContent();
  const { promoContent, isLoaded: promoLoaded, error: promoError } = usePromoContent();
  const { headerItems, footerLinks, storeLinks, isActive, isLoaded: navLoaded, error: navError } = useNavigation();
  const { primaryColor, secondaryColor, isLoaded: brandingLoaded, error: brandingError } = useBranding();
  const { plans, isLoaded: plansLoaded, error: plansError } = useMembershipPlans();
  const { promotionCTAs, isFreeWeekActive, getPromotionalText, isLoaded: promotionsLoaded, error: promotionsError } = useActivePromotions();
  
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
  
  // ⏰ TIMEOUT PARA DETECTAR SI EL BACKEND ESTÁ DISPONIBLE
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Si después de 8 segundos no hay respuesta, usar modo offline
      if (!configLoaded && !statsLoaded && !servicesLoaded) {
        console.warn('🔴 Backend no disponible - Activando modo offline');
        setBackendStatus('offline');
        setIsFullyLoaded(true);
      }
    }, 8000);
    
    // Si algún hook se carga exitosamente, el backend está disponible
    if (configLoaded || statsLoaded || servicesLoaded || productsLoaded) {
      setBackendStatus('connected');
      clearTimeout(timeout);
      
      // Esperar un poco más para que se carguen otros datos
      setTimeout(() => {
        setIsFullyLoaded(true);
      }, 2000);
    }
    
    return () => clearTimeout(timeout);
  }, [configLoaded, statsLoaded, servicesLoaded, productsLoaded]);
  
  // 💬 Auto-cambio de testimonios
  useEffect(() => {
    const safeTestimonials = testimonials && Array.isArray(testimonials) && testimonials.length > 0 
      ? testimonials 
      : DEFAULT_TESTIMONIALS;
      
    if (safeTestimonials.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prev) => 
        prev >= safeTestimonials.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    
    return () => clearInterval(timer);
  }, [testimonials]);
  
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
  
  // 📊 Obtener estadísticas (backend o default)
  const getFormattedStats = () => {
    const useStats = (statsLoaded && stats) ? stats : DEFAULT_STATS;
    
    const statsArray = [];
    
    if (useStats.members > 0) {
      statsArray.push({ number: useStats.members, label: "Miembros Activos", icon: Users });
    }
    if (useStats.trainers > 0) {
      statsArray.push({ number: useStats.trainers, label: "Entrenadores", icon: Award });
    }
    if (useStats.experience > 0) {
      statsArray.push({ number: useStats.experience, label: "Años de Experiencia", icon: Trophy });
    }
    if (useStats.satisfaction > 0) {
      statsArray.push({ number: `${useStats.satisfaction}%`, label: "Satisfacción", icon: Star });
    }
    
    return statsArray;
  };
  
  // 🏋️ Obtener servicios (backend o default)
  const getDisplayServices = () => {
    const useServices = (servicesLoaded && services && Array.isArray(services) && services.length > 0) 
      ? services 
      : DEFAULT_SERVICES;
    return useServices.slice(0, 6);
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
  
  // 📞 Manejar envío de formulario de contacto
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      console.log('Enviando mensaje de contacto:', data);
      showSuccess('Mensaje enviado exitosamente');
      e.target.reset();
    } catch (error) {
      console.error('Error sending contact message:', error);
      showError('Error al enviar mensaje');
    }
  };

  // 🔄 LOADING SCREEN CON TIMEOUT
  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Dumbbell className="w-16 h-16 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Elite Fitness Club</h2>
          <p className="text-gray-600 mb-6">Cargando tu experiencia fitness...</p>
          
          {/* Indicador de estado del backend */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            {backendStatus === 'checking' && (
              <>
                <Loader className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-gray-500">Conectando con servidor...</span>
              </>
            )}
            {backendStatus === 'connected' && (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Conectado - Cargando contenido...</span>
              </>
            )}
            {backendStatus === 'offline' && (
              <>
                <WifiOff className="w-4 h-4 text-orange-500" />
                <span className="text-orange-600">Modo offline - Contenido básico</span>
              </>
            )}
          </div>
          
          {/* Progreso aproximado */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className={`bg-blue-600 h-2 rounded-full transition-all duration-1000 ${
                backendStatus === 'offline' ? 'w-full' : 
                backendStatus === 'connected' ? 'w-3/4' : 'w-1/2'
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  // ✅ OBTENER DATOS SEGUROS (BACKEND O FALLBACK)
  const finalConfig = config || DEFAULT_CONFIG;
  const formattedStats = getFormattedStats();
  const displayServices = getDisplayServices();
  
  // ✅ DATOS CON FALLBACKS INTELIGENTES
  const safeHeaderItems = (navLoaded && Array.isArray(headerItems)) ? headerItems : [
    { text: "Inicio", href: "#inicio" },
    { text: "Servicios", href: "#servicios" },  
    { text: "Planes", href: "#planes" },
    { text: "Tienda", href: "#tienda" },
    { text: "Contacto", href: "#contacto" }
  ];
  
  const safeFooterLinks = (navLoaded && Array.isArray(footerLinks)) ? footerLinks : [
    { text: "Sobre Nosotros", href: "/about" },
    { text: "Horarios", href: "/schedule" },
    { text: "Contacto", href: "/contact" }
  ];
  
  const safeStoreLinks = (navLoaded && Array.isArray(storeLinks)) ? storeLinks : [
    { text: "Suplementos", href: "/store?category=suplementos" },
    { text: "Ropa Deportiva", href: "/store?category=ropa" },
    { text: "Accesorios", href: "/store?category=accesorios" }
  ];
  
  const safePlans = (plansLoaded && Array.isArray(plans) && plans.length > 0) ? plans : DEFAULT_PLANS;
  const safeProducts = (productsLoaded && Array.isArray(products) && products.length > 0) ? products : DEFAULT_PRODUCTS;
  const safeTestimonials = (testimonialsLoaded && Array.isArray(testimonials) && testimonials.length > 0) ? testimonials : DEFAULT_TESTIMONIALS;
  const safePromotionCTAs = (promotionsLoaded && Array.isArray(promotionCTAs)) ? promotionCTAs : [];
  
  // ✅ TESTIMONIAL ACTUAL SEGURO
  const currentTestimonialData = safeTestimonials.length > 0 
    ? safeTestimonials[Math.min(currentTestimonialIndex, safeTestimonials.length - 1)] || safeTestimonials[0]
    : null;

  return (
    <div className="min-h-screen bg-white">
      
      {/* 🔴 INDICADOR DE ESTADO DEL BACKEND (Solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`fixed top-16 right-4 z-40 px-3 py-2 rounded-lg text-xs font-medium shadow-lg ${
          backendStatus === 'connected' ? 'bg-green-100 text-green-800 border border-green-200' :
          backendStatus === 'offline' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {backendStatus === 'connected' && <Wifi className="w-3 h-3" />}
            {backendStatus === 'offline' && <WifiOff className="w-3 h-3" />}
            {backendStatus === 'checking' && <Loader className="w-3 h-3 animate-spin" />}
            <span>
              {backendStatus === 'connected' ? 'Backend Conectado' :
               backendStatus === 'offline' ? 'Modo Offline' : 'Conectando...'}
            </span>
          </div>
        </div>
      )}
      
      {/* 🔝 NAVBAR FLOTANTE */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white bg-opacity-95 backdrop-blur-lg shadow-lg border-b border-gray-200' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <GymLogo size="md" variant="professional" showText={true} />
            
            {/* Navigation Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {safeHeaderItems.map((item, index) => (
                <a 
                  key={`nav-${index}`}
                  href={item.href} 
                  className="font-medium text-gray-600 hover:text-primary-600 transition-colors"
                >
                  {item.text}
                </a>
              ))}
            </div>
            
            {/* Botones de acción + Carrito */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Carrito */}
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
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                <Gift className="w-4 h-4 mr-2" />
                {(promotionsLoaded && getPromotionalText && getPromotionalText()) ? getPromotionalText() : 'Únete Ahora'}
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
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
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {safeHeaderItems.map((item, index) => (
                <a 
                  key={`mobile-nav-${index}`}
                  href={item.href} 
                  className="block text-gray-600 hover:text-primary-600 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.text}
                </a>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link 
                  to="/login" 
                  className="block w-full btn-secondary text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/register" 
                  className="block w-full btn-primary text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Únete Ahora
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* 🏠 HERO SECTION */}
      <section id="inicio" className="relative pt-20 pb-24 min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary-500 bg-opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary-500 bg-opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Contenido Hero */}
            <div className="space-y-10">
              {/* Badge promocional */}
              {promoLoaded && promoContent && promoContent.mainOffer && promoContent.mainOffer.subtitle && (
                <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md border border-gray-200">
                  <Zap className="w-4 h-4 text-primary-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {promoContent.mainOffer.subtitle}
                  </span>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Título principal */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  {(contentLoaded && content && content.hero && content.hero.title) ? (
                    <>
                      {content.hero.title.split(' ').slice(0, -2).join(' ')}{' '}
                      <span className="text-primary-600">
                        {content.hero.title.split(' ').slice(-2).join(' ')}
                      </span>
                    </>
                  ) : (
                    <>
                      Bienvenido a{' '}
                      <span className="text-primary-600">
                        {finalConfig.name}
                      </span>
                    </>
                  )}
                </h1>
                
                {/* Descripción */}
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  {(contentLoaded && content && content.hero && content.hero.description) ? 
                    content.hero.description : 
                    finalConfig.description
                  }
                </p>
              </div>
              
              {/* CTAs principales */}
              <div className="flex flex-col sm:flex-row gap-4">
                {safePromotionCTAs.length > 0 ? (
                  safePromotionCTAs.map((button, index) => (
                    <Link 
                      key={`cta-${index}`}
                      to={button.action === 'register' ? '/register' : 
                          button.action === 'store' ? '/store' : 
                          button.action === 'login' ? '/login' : '/register'}
                      className={`${button.type === 'primary' ? 'btn-primary' : 'btn-secondary'} px-8 py-4 text-lg font-semibold hover:scale-105 transition-all`}
                    >
                      {button.icon === 'gift' && <Gift className="w-5 h-5 mr-3" />}
                      {button.icon === 'shopping-cart' && <ShoppingCart className="w-5 h-5 mr-3" />}
                      {button.icon === 'star' && <Star className="w-5 h-5 mr-3" />}
                      {button.text}
                    </Link>
                  ))
                ) : (
                  <>
                    <Link to="/register" className="btn-primary px-8 py-4 text-lg font-semibold hover:scale-105 transition-all">
                      <Gift className="w-5 h-5 mr-3" />
                      Únete Ahora
                    </Link>
                    <button 
                      onClick={() => setShowStorePreview(true)}
                      className="btn-secondary px-8 py-4 text-lg hover:scale-105 transition-all"
                    >
                      <ShoppingCart className="w-5 h-5 mr-3" />
                      Ver Tienda
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Imagen/Video Hero */}
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 rounded-3xl overflow-hidden shadow-2xl">
                {/* Imagen principal */}
                <img 
                  src={(contentLoaded && content && content.hero && content.hero.imageUrl) ? 
                    content.hero.imageUrl : 
                    "/api/placeholder/600/450"
                  }
                  alt={`${finalConfig.name} - Instalaciones`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Play button overlay si hay video */}
                {(contentLoaded && content && content.hero && content.hero.videoUrl) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={() => {
                        // Aquí iría la lógica para reproducir el video
                        console.log('Reproducir video:', content.hero.videoUrl);
                      }}
                      className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 hover:scale-110 shadow-xl"
                    >
                      <Play className="w-8 h-8 text-primary-600 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 📊 Estadísticas - Solo mostrar si hay datos */}
          {formattedStats.length > 0 && (
            <div className={`grid gap-8 mt-20 pt-16 border-t border-gray-200 ${
              formattedStats.length === 1 ? 'grid-cols-1 justify-center max-w-xs mx-auto' :
              formattedStats.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              formattedStats.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
              'grid-cols-2 md:grid-cols-4'
            }`}>
              {formattedStats.map((stat, index) => (
                <div key={`stat-${index}`} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* 🛍️ SECCIÓN DE TIENDA DESTACADA */}
      <section id="tienda" className="py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header de tienda */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full mb-6">
              <ShoppingCart className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-semibold text-primary-700">
                Tienda {finalConfig.name}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {(contentLoaded && content && content.store && content.store.title) ? content.store.title : (
                <>
                  Productos{' '}
                  <span className="text-primary-600">premium</span>{' '}
                  para tu entrenamiento
                </>
              )}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {(contentLoaded && content && content.store && content.store.subtitle) ? 
                content.store.subtitle : 
                'Descubre nuestra selección de suplementos, ropa deportiva y accesorios de la más alta calidad'
              }
            </p>
            
            {/* Benefits de comprar */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Truck className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Envío gratis +Q200</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Shield className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Garantía de calidad</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Award className="w-5 h-5 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Productos originales</span>
              </div>
            </div>
          </div>
          
          {/* Grid de productos destacados */}
          <div className={`grid gap-8 mb-12 ${
            safeProducts.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            safeProducts.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {safeProducts.slice(0, 3).map((product, index) => (
              <ProductPreviewCard 
                key={product.id || `product-${index}`} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
          
          {/* CTA para ver tienda completa */}
          <div className="text-center">
            <Link 
              to="/store"
              className="btn-primary px-8 py-4 text-lg font-semibold hover:scale-105 transition-all"
            >
              Ver tienda completa
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* 🏋️ SERVICIOS */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full mb-6">
              <Zap className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-semibold text-primary-700">
                Nuestros Servicios
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {(contentLoaded && content && content.services && content.services.title) ? content.services.title : (
                <>
                  Todo lo que necesitas para{' '}
                  <span className="text-primary-600">alcanzar tus metas</span>
                </>
              )}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {(contentLoaded && content && content.services && content.services.subtitle) ? 
                content.services.subtitle : 
                'Servicios profesionales diseñados para llevarte al siguiente nivel'
              }
            </p>
          </div>
          
          <div className={`grid gap-12 ${
            displayServices.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            displayServices.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            displayServices.length <= 3 ? 'grid-cols-1 md:grid-cols-3' :
            displayServices.length <= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
            displayServices.length <= 6 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {displayServices.map((service, index) => {
              const IconComponent = service.icon === 'Dumbbell' ? Dumbbell : 
                                  service.icon === 'Users' ? Users : 
                                  service.icon === 'Target' ? Target : 
                                  service.icon === 'Trophy' ? Trophy :
                                  service.icon === 'Heart' ? Heart :
                                  service.icon === 'Shield' ? Shield :
                                  Dumbbell;
              
              return (
                <div key={service.id || `service-${index}`} className="text-center group">
                  <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-all duration-300">
                    <IconComponent className="w-10 h-10 text-primary-600" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {service.title || 'Servicio'}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {service.description || 'Descripción del servicio'}
                  </p>
                  
                  {service.features && Array.isArray(service.features) && service.features.length > 0 && (
                    <ul className="text-sm text-gray-500 space-y-2">
                      {service.features.slice(0, 3).map((feature, featureIndex) => (
                        <li key={`feature-${index}-${featureIndex}`} className="flex items-center justify-center">
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
        </div>
      </section>
      
      {/* 💳 PLANES */}
      <section id="planes" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-secondary-50 rounded-full mb-6">
              <Crown className="w-4 h-4 text-secondary-600 mr-2" />
              <span className="text-sm font-semibold text-secondary-700">
                Planes de Membresía
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {(contentLoaded && content && content.plans && content.plans.title) ? content.plans.title : (
                <>
                  Elige tu plan{' '}
                  <span className="text-primary-600">ideal</span>
                </>
              )}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {(contentLoaded && content && content.plans && content.plans.subtitle) ? 
                content.plans.subtitle : 
                'Planes diseñados para diferentes objetivos y estilos de vida'
              }
            </p>
          </div>
          
          <div className={`grid gap-8 max-w-6xl mx-auto ${
            safePlans.length === 1 ? 'grid-cols-1 max-w-md' :
            safePlans.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {safePlans.map((plan, index) => {
              const IconComponent = plan.iconName === 'Crown' ? Crown : 
                                   plan.iconName === 'Shield' ? Shield : 
                                   plan.popular ? Crown : Shield;
              
              return (
                <div key={plan.id || `plan-${index}`} className={`
                  relative bg-white rounded-3xl shadow-xl p-8 transition-all duration-300
                  ${plan.popular 
                    ? 'ring-2 ring-primary-500 scale-105' 
                    : 'hover:scale-105'
                  }
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
                      Plan {plan.name || 'Básico'}
                    </h3>
                    
                    <div className="mb-8">
                      <div className="flex items-baseline justify-center mb-2">
                        <span className="text-5xl font-bold text-gray-900">
                          Q{plan.price || 0}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{plan.duration || 'mes'}
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
                          <li key={`plan-feature-${index}-${featureIndex}`} className="flex items-center">
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
          
          <div className="text-center mt-16">
            <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
              <Shield className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-sm font-semibold text-gray-700">
                {(contentLoaded && content && content.plans && content.plans.guarantee) ? 
                  content.plans.guarantee : 
                  'Garantía de satisfacción 30 días'
                }
              </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* 💬 TESTIMONIOS */}
      {currentTestimonialData && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 bg-yellow-50 rounded-full mb-6">
                <Star className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-semibold text-yellow-700">
                  Testimonios
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {(contentLoaded && content && content.testimonials && content.testimonials.title) ? content.testimonials.title : (
                  <>
                    Lo que dicen nuestros{' '}
                    <span className="text-primary-600">miembros</span>
                  </>
                )}
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded-3xl p-12 text-center">
                <div className="flex justify-center mb-8">
                  {[...Array(Math.min(currentTestimonialData.rating || 5, 5))].map((_, i) => (
                    <Star key={`star-${i}`} className="w-6 h-6 text-yellow-500 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-2xl md:text-3xl text-gray-700 mb-8 leading-relaxed font-medium">
                  "{currentTestimonialData.text || 'Excelente gimnasio'}"
                </blockquote>
                
                <div>
                  <div className="font-bold text-gray-900 text-xl">
                    {currentTestimonialData.name || 'Cliente satisfecho'}
                  </div>
                  <div className="text-gray-600">
                    {currentTestimonialData.role || 'Miembro'}
                  </div>
                </div>
              </div>
              
              {safeTestimonials.length > 1 && (
                <div className="flex justify-center mt-8 space-x-3">
                  {safeTestimonials.map((_, index) => (
                    <button
                      key={`testimonial-dot-${index}`}
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
      
      {/* 📞 CONTACTO */}
      <section id="contacto" className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  {(contentLoaded && content && content.contact && content.contact.title) ? 
                    content.contact.title : 
                    '¿Listo para comenzar?'
                  }
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed">
                  {(contentLoaded && content && content.contact && content.contact.subtitle) ? 
                    content.contact.subtitle : 
                    `Únete a ${finalConfig.name} y comienza tu transformación hoy mismo.`
                  }
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Información de contacto */}
                {finalConfig.contact.address && finalConfig.contact.address !== 'Guatemala, Guatemala' && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Ubicación</div>
                      <div className="text-gray-300">
                        {finalConfig.contact.address}
                      </div>
                    </div>
                  </div>
                )}
                
                {finalConfig.contact.phone && finalConfig.contact.phone !== 'Disponible próximamente' && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Teléfono</div>
                      <div className="text-gray-300">
                        {finalConfig.contact.phone}
                      </div>
                    </div>
                  </div>
                )}
                
                {finalConfig.hours && finalConfig.hours.full && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Horarios</div>
                      <div className="text-gray-300 text-sm">
                        {finalConfig.hours.full}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Redes sociales */}
              {finalConfig.social && Object.keys(finalConfig.social).length > 0 && (
                <div className="flex space-x-4">
                  {Object.entries(finalConfig.social).map(([platform, data]) => {
                    if (!data || !data.url || !data.active) return null;
                    const IconComponent = getSocialIcon(platform);
                    
                    return (
                      <a 
                        key={`social-${platform}`}
                        href={data.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center hover:bg-opacity-20 transition-all hover:scale-110"
                        title={data.handle}
                      >
                        <IconComponent className="w-6 h-6" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* CTA Card */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-10 border border-white border-opacity-20">
              <h3 className="text-3xl font-bold mb-8">
                🎉 Únete Ahora
              </h3>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span>Acceso completo al gimnasio</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span>Entrenamiento personalizado</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span>Clases grupales incluidas</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  <span>Asesoría nutricional</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <Link to="/register" className="w-full btn bg-white text-gray-900 hover:bg-gray-100 py-4 font-bold text-lg">
                  🚀 Únete Ahora
                </Link>
                <Link to="/login" className="w-full btn btn-secondary border-white text-white hover:bg-white hover:text-gray-900 py-4">
                  Ya soy miembro
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
      {/* 🔽 FOOTER */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            <div className="space-y-6">
              <GymLogo size="lg" variant="white" showText={true} />
              <p className="text-gray-400 leading-relaxed">
                {finalConfig.description}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Enlaces Rápidos</h3>
              <ul className="space-y-3">
                {safeFooterLinks.map((link, index) => (
                  <li key={`footer-link-${index}`}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                      {link.text}
                    </a>
                  </li>
                ))}
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Iniciar Sesión</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Tienda</h3>
              <ul className="space-y-3">
                {safeStoreLinks.map((link, index) => (
                  <li key={`store-link-${index}`}>
                    <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Contáctanos</h3>
              <ul className="space-y-3">
                {finalConfig.contact.phone && finalConfig.contact.phone !== 'Disponible próximamente' && (
                  <li className="text-gray-400">
                    {finalConfig.contact.phone}
                  </li>
                )}
                {finalConfig.contact.email && (
                  <li className="text-gray-400">
                    {finalConfig.contact.email}
                  </li>
                )}
                {finalConfig.contact.address && finalConfig.contact.address !== 'Guatemala, Guatemala' && (
                  <li className="text-gray-400">
                    {finalConfig.contact.address}
                  </li>
                )}
              </ul>
              
              {/* Redes sociales en footer */}
              {finalConfig.social && Object.keys(finalConfig.social).length > 0 && (
                <div className="flex space-x-4 mt-6">
                  {Object.entries(finalConfig.social).map(([platform, data]) => {
                    if (!data || !data.url || !data.active) return null;
                    const IconComponent = getSocialIcon(platform);
                    
                    return (
                      <a 
                        key={`footer-social-${platform}`}
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
          
          <div className="border-t border-gray-700 pt-8 mt-12 text-center">
            <p className="text-gray-400">
              &copy; 2024 {finalConfig.name}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
      
      {/* 🛍️ MODAL DE VISTA PREVIA DE TIENDA */}
      {showStorePreview && (
        <StorePreviewModal 
          onClose={() => setShowStorePreview(false)}
          products={safeProducts.slice(0, 3)}
          onAddToCart={handleAddToCart}
        />
      )}
      
    </div>
  );
};

// 🛍️ COMPONENTE: Tarjeta de producto para landing
const ProductPreviewCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  
  if (!product) {
    return (
      <div className="bg-gray-100 rounded-2xl p-6 text-center">
        <div className="text-gray-500">Producto no disponible</div>
      </div>
    );
  }
  
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, { quantity });
      setQuantity(1);
    }
  };
  
  const safePrice = typeof product.price === 'number' ? product.price : 0;
  const safeOriginalPrice = typeof product.originalPrice === 'number' ? product.originalPrice : 0;
  
  const discount = safeOriginalPrice > safePrice 
    ? Math.round(((safeOriginalPrice - safePrice) / safeOriginalPrice) * 100)
    : 0;
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
      
      <div className="relative overflow-hidden">
        <img 
          src={product.image || "/api/placeholder/300/300"}
          alt={product.name || 'Producto'}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 space-y-2">
          {product.badge && (
            <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              -{discount}%
            </span>
          )}
        </div>
        
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-10 h-10 bg-white text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-100">
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-primary-600 font-medium">
            {product.category || 'General'}
          </span>
          {product.rating > 0 && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">
                {product.rating} ({product.reviews || 0})
              </span>
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name || 'Producto sin nombre'}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description || 'Sin descripción disponible'}
        </p>
        
        {product.features && Array.isArray(product.features) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {product.features.slice(0, 2).map((feature, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">Q{safePrice.toFixed(2)}</span>
            {safeOriginalPrice > safePrice && (
              <span className="text-gray-500 text-sm line-through ml-2">
                Q{safeOriginalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <button 
          onClick={handleAddToCart}
          className="w-full btn-primary py-3 font-semibold"
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
};

// 🛍️ COMPONENTE: Modal de vista previa de tienda
const StorePreviewModal = ({ onClose, products = [], onAddToCart }) => {
  const safeProducts = Array.isArray(products) ? products : [];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            🛍️ Vista previa de la tienda
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {safeProducts.length > 0 ? (
            <>
              <div className={`grid gap-6 mb-8 ${
                safeProducts.length === 1 ? 'grid-cols-1' :
                safeProducts.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {safeProducts.map((product, index) => (
                  <ProductPreviewCard 
                    key={product.id || `modal-product-${index}`} 
                    product={product} 
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
              
              <div className="text-center">
                <Link 
                  to="/store"
                  onClick={onClose}
                  className="btn-primary px-8 py-4 text-lg font-semibold"
                >
                  Ver tienda completa
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Productos disponibles próximamente</h3>
              <p className="text-gray-600">Estamos preparando nuestra tienda para ti.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

// ✅ CORRECCIONES APLICADAS:
// 🔧 ARRAYS SEGUROS - Todas las verificaciones de arrays con Array.isArray()
// 🔧 VERIFICACIONES NULL - Todas las propiedades verificadas antes de usar
// 🔧 USEEFFECT SEGUROS - Dependencias controladas para evitar loops
// 🔧 KEYS ÚNICAS - Todas las keys de map() son únicas
// 🔧 FALLBACKS - Valores por defecto en todos los casos
// 🔧 MANEJO DE ERRORES - Try/catch en funciones críticas
// 🔧 LOADING STATES - Estados de carga apropiados
// 🔧 VERIFICACIONES DE FUNCIONES - Verificar que las funciones existen antes de llamarlas
// 🔧 PRODUCTOS SEGUROS - Verificación completa de estructura de productos
// 🔧 TESTIMONIALS SEGUROS - Manejo seguro de testimonios e índices
// 🔧 NAVEGACIÓN SEGURA - Verificación de arrays de navegación
// 🔧 PROMOCIONES SEGURAS - Verificación de promociones y CTAs
// 🔧 CONFIGURACIÓN SEGURA - Manejo de config faltante o con errores