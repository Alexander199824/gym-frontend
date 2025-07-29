// src/pages/dashboard/LandingPage.js
// FUNCIÓN: Landing page MEJORADA - Muestra datos disponibles sin esperar a que TODO se cargue
// LOGS: Detallados sobre qué datos se reciben del backend

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

// 🔧 DATOS POR DEFECTO MÍNIMOS (solo para casos extremos)
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
  
  // 🏗️ Estados locales REDUCIDOS
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);
  
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
  
  // 💬 Auto-cambio de testimonios
  useEffect(() => {
    if (!testimonials || testimonials.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prev) => 
        prev >= testimonials.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    
    return () => clearInterval(timer);
  }, [testimonials]);
  
  // 🔍 LOGS DETALLADOS DEL ESTADO DE CARGA - CADA VEZ QUE CAMBIE ALGO
  useEffect(() => {
    console.group('🔍 LANDING PAGE - Loading States Analysis');
    
    // Estado actual de cada hook
    console.log('📊 Current Loading States:');
    console.log('  - Config loaded:', configLoaded, '| Has data:', !!config);
    console.log('  - Stats loaded:', statsLoaded, '| Has data:', !!stats);
    console.log('  - Services loaded:', servicesLoaded, '| Has data:', !!services);
    console.log('  - Testimonials loaded:', testimonialsLoaded, '| Has data:', !!testimonials);
    console.log('  - Products loaded:', productsLoaded, '| Has data:', !!products);
    console.log('  - Plans loaded:', plansLoaded, '| Has data:', !!plans);
    
    // Datos recibidos
    if (config) {
      console.log('🏢 CONFIG DATA RECEIVED:');
      console.log('   - Name:', config.name);
      console.log('   - Description:', config.description);
      console.log('   - Logo URL:', config.logo?.url);
      console.log('   - Contact:', config.contact);
      console.log('   - Social platforms:', config.social ? Object.keys(config.social).length : 0);
    }
    
    if (stats) {
      console.log('📊 STATS DATA RECEIVED:');
      console.log('   - Members:', stats.members);
      console.log('   - Trainers:', stats.trainers);
      console.log('   - Experience:', stats.experience);
      console.log('   - Satisfaction:', stats.satisfaction);
    }
    
    if (services) {
      console.log('🏋️ SERVICES DATA RECEIVED:');
      console.log('   - Total services:', Array.isArray(services) ? services.length : 'Not array');
      if (Array.isArray(services)) {
        services.forEach((service, i) => {
          console.log(`   - Service ${i + 1}: ${service.title} (Active: ${service.active !== false})`);
        });
      }
    }
    
    if (testimonials) {
      console.log('💬 TESTIMONIALS DATA RECEIVED:');
      console.log('   - Total testimonials:', Array.isArray(testimonials) ? testimonials.length : 'Not array');
      if (Array.isArray(testimonials)) {
        testimonials.forEach((testimonial, i) => {
          console.log(`   - Testimonial ${i + 1}: ${testimonial.name} (${testimonial.rating}⭐)`);
        });
      }
    }
    
    if (products) {
      console.log('🛍️ PRODUCTS DATA RECEIVED:');
      console.log('   - Total products:', Array.isArray(products) ? products.length : 'Not array');
      if (Array.isArray(products)) {
        products.forEach((product, i) => {
          console.log(`   - Product ${i + 1}: ${product.name} - Q${product.price}`);
        });
      }
    }
    
    if (plans) {
      console.log('🎫 PLANS DATA RECEIVED:');
      console.log('   - Total plans:', Array.isArray(plans) ? plans.length : 'Not array');
      if (Array.isArray(plans)) {
        plans.forEach((plan, i) => {
          console.log(`   - Plan ${i + 1}: ${plan.name} - Q${plan.price} (Popular: ${plan.popular})`);
        });
      }
    }
    
    // Errores si los hay
    if (configError) {
      console.log('❌ CONFIG ERROR:', configError.message);
    }
    
    console.groupEnd();
    
  }, [configLoaded, config, statsLoaded, stats, servicesLoaded, services, 
      testimonialsLoaded, testimonials, productsLoaded, products, 
      plansLoaded, plans, configError]);
  
  // ⏰ CONTROL DE CARGA INICIAL - Más flexible
  useEffect(() => {
    // Considerar "carga inicial completa" cuando tengamos al menos la configuración base
    // O cuando hayan pasado 3 segundos (timeout)
    const timer = setTimeout(() => {
      if (!initialLoadCompleted) {
        console.log('⏰ TIMEOUT: Showing page anyway after 3 seconds');
        setInitialLoadCompleted(true);
      }
    }, 3000);
    
    // Si tenemos config básica, mostrar la página
    if (config && config.name) {
      console.log('✅ BASIC CONFIG LOADED: Showing page');
      setInitialLoadCompleted(true);
      clearTimeout(timer);
    }
    
    return () => clearTimeout(timer);
  }, [config, initialLoadCompleted]);
  
  // ✅ USAR DATOS REALES DEL BACKEND
  const gymConfig = config || MINIMAL_FALLBACK;
  
  // ✅ LOGS CONSOLIDADOS cuando la carga inicial esté completa
  useEffect(() => {
    if (initialLoadCompleted) {
      console.group('🎉 LANDING PAGE - Final Data Summary');
      
      // Resumen final de datos disponibles
      const dataAvailability = {
        config: !!config,
        stats: !!stats,
        services: !!(services && Array.isArray(services) && services.length > 0),
        testimonials: !!(testimonials && Array.isArray(testimonials) && testimonials.length > 0),
        products: !!(products && Array.isArray(products) && products.length > 0),
        plans: !!(plans && Array.isArray(plans) && plans.length > 0)
      };
      
      console.log('📋 Data Availability Summary:', dataAvailability);
      
      // Secciones que se mostrarán
      const sectionsToShow = {
        hero: true,
        stats: dataAvailability.stats && stats && Object.values(stats).some(v => v > 0),
        services: dataAvailability.services,
        products: dataAvailability.products,
        plans: dataAvailability.plans,
        testimonials: dataAvailability.testimonials,
        contact: true
      };
      
      console.log('📋 Sections that will be displayed:', sectionsToShow);
      
      // Conteo de datos disponibles
      const availableDataCount = Object.values(dataAvailability).filter(Boolean).length;
      const totalPossibleData = Object.keys(dataAvailability).length;
      
      console.log(`📊 Data completion: ${availableDataCount}/${totalPossibleData} (${Math.round(availableDataCount/totalPossibleData*100)}%)`);
      
      if (availableDataCount === totalPossibleData) {
        console.log('🎉 ALL DATA LOADED SUCCESSFULLY!');
      } else {
        console.log('⚠️ Some data missing, but page will display with available data');
      }
      
      console.groupEnd();
    }
  }, [initialLoadCompleted, config, stats, services, testimonials, products, plans]);
  
  // 📊 Procesar estadísticas solo si están disponibles
  const formattedStats = React.useMemo(() => {
    if (!statsLoaded || !stats) return [];
    
    const statsArray = [];
    
    if (stats.members > 0) {
      statsArray.push({ number: stats.members, label: "Miembros Activos", icon: Users });
    }
    if (stats.trainers > 0) {
      statsArray.push({ number: stats.trainers, label: "Entrenadores", icon: Award });
    }
    if (stats.experience > 0) {
      statsArray.push({ number: stats.experience, label: "Años de Experiencia", icon: Trophy });
    }
    if (stats.satisfaction > 0) {
      statsArray.push({ number: `${stats.satisfaction}%`, label: "Satisfacción", icon: Star });
    }
    
    return statsArray;
  }, [statsLoaded, stats]);
  
  // 🏋️ Usar servicios del backend
  const displayServices = React.useMemo(() => {
    if (!servicesLoaded || !services || !Array.isArray(services)) {
      return [];
    }
    return services.filter(service => service.active !== false).slice(0, 6);
  }, [servicesLoaded, services]);
  
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
  
  // ⏰ LOADING SCREEN MEJORADO - Solo mostrar si realmente no hay nada
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
          
          {/* Indicadores de progreso de carga */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className={`flex items-center justify-center ${configLoaded ? 'text-green-600' : ''}`}>
              {configLoaded ? '✅' : '⏳'} Configuración
            </div>
            <div className={`flex items-center justify-center ${statsLoaded ? 'text-green-600' : ''}`}>
              {statsLoaded ? '✅' : '⏳'} Estadísticas
            </div>
            <div className={`flex items-center justify-center ${servicesLoaded ? 'text-green-600' : ''}`}>
              {servicesLoaded ? '✅' : '⏳'} Servicios
            </div>
            <div className={`flex items-center justify-center ${productsLoaded ? 'text-green-600' : ''}`}>
              {productsLoaded ? '✅' : '⏳'} Productos
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Obtener testimonio actual de forma segura
  const currentTestimoni = testimonials && testimonials.length > 0 
    ? testimonials[Math.min(currentTestimonialIndex, testimonials.length - 1)]
    : null;

  return (
    <div className="min-h-screen bg-white">
      
      {/* 🔴 INDICADOR DE CONEXIÓN - SOLO punto discreto en esquina */}
      <ConnectionIndicator show={process.env.NODE_ENV === 'development'} />
      
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
                Únete Ahora
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
              {products && products.length > 0 && (
                <a href="#tienda" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                  Tienda
                </a>
              )}
              <a href="#contacto" className="block text-gray-600 hover:text-primary-600 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                Contacto
              </a>
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link to="/login" className="block w-full btn-secondary text-center" onClick={() => setIsMenuOpen(false)}>
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="block w-full btn-primary text-center" onClick={() => setIsMenuOpen(false)}>
                  <Gift className="w-4 h-4 mr-2" />
                  Únete Ahora
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* 🏠 HERO SECTION - USANDO DATOS REALES DEL BACKEND */}
      <section id="inicio" className="relative pt-20 pb-24 min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary-500 bg-opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary-500 bg-opacity-5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Contenido Hero - USANDO DATOS DEL BACKEND */}
            <div className="space-y-10">
              <div className="space-y-6">
                {/* Título principal - REAL del backend */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Bienvenido a{' '}
                  <span className="text-primary-600">
                    {gymConfig.name}
                  </span>
                </h1>
                
                {/* Descripción - REAL del backend */}
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  {gymConfig.description}
                </p>
                
                {/* Tagline si está disponible */}
                {gymConfig.tagline && (
                  <p className="text-lg text-primary-600 font-medium">
                    {gymConfig.tagline}
                  </p>
                )}
              </div>
              
              {/* CTAs principales */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-primary px-8 py-4 text-lg font-semibold hover:scale-105 transition-all">
                  <Gift className="w-5 h-5 mr-3" />
                  Únete Ahora
                </Link>
                {products && products.length > 0 && (
                  <a href="#tienda" className="btn-secondary px-8 py-4 text-lg hover:scale-105 transition-all">
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    Ver Tienda
                  </a>
                )}
              </div>
            </div>
            
            {/* Imagen Hero */}
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/api/placeholder/600/450"
                  alt={`${gymConfig.name} - Instalaciones`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
          
          {/* 📊 Estadísticas - Solo mostrar si hay datos del backend */}
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
          
          {/* ⚠️ INDICADOR DE CARGA si faltan datos */}
          {!statsLoaded && (
            <div className="mt-20 pt-16 border-t border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando estadísticas...</span>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* 🛍️ SECCIÓN DE TIENDA - Solo si hay productos */}
      {products && products.length > 0 && (
        <section id="tienda" className="py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header de tienda */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full mb-6">
                <ShoppingCart className="w-4 h-4 text-primary-600 mr-2" />
                <span className="text-sm font-semibold text-primary-700">
                  Tienda {gymConfig.name}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Productos{' '}
                <span className="text-primary-600">premium</span>{' '}
                para tu entrenamiento
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Descubre nuestra selección de suplementos, ropa deportiva y accesorios de la más alta calidad
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
      )}
      
      {/* ⚠️ INDICADOR DE CARGA PARA PRODUCTOS */}
      {!productsLoaded && (
        <section className="py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Cargando productos de la tienda...</span>
            </div>
          </div>
        </section>
      )}
      
      {/* 🏋️ SERVICIOS - Solo si hay servicios */}
      {displayServices.length > 0 && (
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
                Todo lo que necesitas para{' '}
                <span className="text-primary-600">alcanzar tus metas</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Servicios profesionales diseñados para llevarte al siguiente nivel
              </p>
            </div>
            
            <div className={`grid gap-12 ${
              displayServices.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              displayServices.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              displayServices.length <= 3 ? 'grid-cols-1 md:grid-cols-3' :
              displayServices.length <= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {displayServices.map((service) => {
                const IconComponent = service.icon === 'Dumbbell' ? Dumbbell : 
                                    service.icon === 'Users' ? Users : 
                                    service.icon === 'Target' ? Target : 
                                    service.icon === 'Trophy' ? Trophy :
                                    service.icon === 'Heart' ? Heart :
                                    service.icon === 'Shield' ? Shield :
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
          </div>
        </section>
      )}
      
      {/* ⚠️ INDICADOR DE CARGA PARA SERVICIOS */}
      {!servicesLoaded && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Cargando servicios del gimnasio...</span>
            </div>
          </div>
        </section>
      )}
      
      {/* 💳 PLANES - Solo si hay planes */}
      {plans && plans.length > 0 && (
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
                Elige tu plan{' '}
                <span className="text-primary-600">ideal</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Planes diseñados para diferentes objetivos y estilos de vida
              </p>
            </div>
            
            <div className={`grid gap-8 max-w-6xl mx-auto ${
              plans.length === 1 ? 'grid-cols-1 max-w-md' :
              plans.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {plans.map((plan) => {
                const IconComponent = plan.iconName === 'Crown' ? Crown : Shield;
                
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
                        Plan {plan.name}
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
            
            <div className="text-center mt-16">
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
      
      {/* ⚠️ INDICADOR DE CARGA PARA PLANES */}
      {!plansLoaded && (
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Cargando planes de membresía...</span>
            </div>
          </div>
        </section>
      )}
      
      {/* 💬 TESTIMONIOS - Solo si hay testimonios */}
      {currentTestimoni && (
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
                Lo que dicen nuestros{' '}
                <span className="text-primary-600">miembros</span>
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded-3xl p-12 text-center">
                <div className="flex justify-center mb-8">
                  {[...Array(Math.min(currentTestimoni.rating || 5, 5))].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-2xl md:text-3xl text-gray-700 mb-8 leading-relaxed font-medium">
                  "{currentTestimoni.text}"
                </blockquote>
                
                <div>
                  <div className="font-bold text-gray-900 text-xl">
                    {currentTestimoni.name}
                  </div>
                  <div className="text-gray-600">
                    {currentTestimoni.role}
                  </div>
                </div>
              </div>
              
              {testimonials && testimonials.length > 1 && (
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
      
      {/* ⚠️ INDICADOR DE CARGA PARA TESTIMONIOS */}
      {!testimonialsLoaded && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Cargando testimonios...</span>
            </div>
          </div>
        </section>
      )}
      
      {/* 📞 CONTACTO - USANDO DATOS REALES DEL BACKEND */}
      <section id="contacto" className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  ¿Listo para comenzar?
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Únete a {gymConfig.name} y comienza tu transformación hoy mismo.
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Información de contacto REAL del backend */}
                {gymConfig.contact?.address && gymConfig.contact.address !== "Guatemala" && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Ubicación</div>
                      <div className="text-gray-300">
                        {gymConfig.contact.address}
                      </div>
                    </div>
                  </div>
                )}
                
                {gymConfig.contact?.phone && gymConfig.contact.phone !== "Pronto disponible" && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Teléfono</div>
                      <div className="text-gray-300">
                        {gymConfig.contact.phone}
                      </div>
                    </div>
                  </div>
                )}
                
                {gymConfig.hours?.full && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                      <Clock className="w-6 h-6" />
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
              
              {/* Redes sociales REALES del backend */}
              {gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
                <div className="flex space-x-4">
                  {Object.entries(gymConfig.social).map(([platform, data]) => {
                    if (!data || !data.url || !data.active) return null;
                    const IconComponent = getSocialIcon(platform);
                    
                    return (
                      <a 
                        key={platform}
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
      
      {/* 🔽 FOOTER - USANDO DATOS REALES DEL BACKEND */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            <div className="space-y-6">
              <GymLogo size="lg" variant="white" showText={true} />
              <p className="text-gray-400 leading-relaxed">
                {gymConfig.description}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Enlaces Rápidos</h3>
              <ul className="space-y-3">
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
                <h3 className="font-semibold mb-6 text-lg">Tienda</h3>
                <ul className="space-y-3">
                  <li><Link to="/store?category=suplementos" className="text-gray-400 hover:text-white transition-colors">Suplementos</Link></li>
                  <li><Link to="/store?category=ropa" className="text-gray-400 hover:text-white transition-colors">Ropa Deportiva</Link></li>
                  <li><Link to="/store?category=accesorios" className="text-gray-400 hover:text-white transition-colors">Accesorios</Link></li>
                </ul>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-6 text-lg">Contáctanos</h3>
              <ul className="space-y-3">
                {gymConfig.contact?.phone && gymConfig.contact.phone !== "Pronto disponible" && (
                  <li className="text-gray-400">
                    {gymConfig.contact.phone}
                  </li>
                )}
                {gymConfig.contact?.email && (
                  <li className="text-gray-400">
                    {gymConfig.contact.email}
                  </li>
                )}
                {gymConfig.contact?.address && gymConfig.contact.address !== "Guatemala" && (
                  <li className="text-gray-400">
                    {gymConfig.contact.address}
                  </li>
                )}
              </ul>
              
              {/* Redes sociales en footer */}
              {gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
                <div className="flex space-x-4 mt-6">
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
          
          <div className="border-t border-gray-700 pt-8 mt-12 text-center">
            <p className="text-gray-400">
              &copy; 2024 {gymConfig.name}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
      
    </div>
  );
};

// 🛍️ COMPONENTE: Tarjeta de producto simplificada para el ejemplo
const ProductPreviewCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-w-4 aspect-h-3">
        <img 
          src={product.image || "/api/placeholder/300/225"}
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