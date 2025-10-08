// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/LandingPage.js
// COMPONENTE PRINCIPAL - ORQUESTADOR DE LANDING PAGE
// ✅ ACTUALIZADO CON useActiveGymServices

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Gift, Dumbbell } from 'lucide-react';

// Hooks del sistema
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';

// Hooks optimizados del backend
import useGymConfig from '../../hooks/useGymConfig';
import useGymStats from '../../hooks/useGymStats';
import useActiveGymServices from '../../hooks/useActiveGymServices'; // 🆕 HOOK NUEVO
import useTestimonials from '../../hooks/useTestimonials';
import useFeaturedProducts from '../../hooks/useFeaturedProducts';
import useMembershipPlans from '../../hooks/useMembershipPlans';

// Componentes comunes
import GymLogo from '../../components/common/GymLogo';
import ConnectionIndicator from '../../components/common/ConnectionIndicator';

// Sub-componentes de Landing (nuevos)
import LandingHero from './landing/LandingHero';
import LandingStore from './landing/LandingStore';
import LandingServices from './landing/LandingServices';
import LandingPlans from './landing/LandingPlans';
import LandingTestimonials from './landing/LandingTestimonials';
import LandingContact from './landing/LandingContact';
import LandingFooter from './landing/LandingFooter';

// Utilidades
import { MINIMAL_FALLBACK } from './landing/landingUtils';
import gymConfigDefault from '../../config/gymConfig';

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

  // Referencias para carousels
  const testimonialIntervalRef = useRef(null);
  const serviceIntervalRef = useRef(null);
  const productIntervalRef = useRef(null);

  // Hooks del backend
  const { config, isLoaded: configLoaded, error: configError } = useGymConfig();
  const { stats, isLoaded: statsLoaded } = useGymStats();
  const { services, isLoaded: servicesLoaded } = useActiveGymServices(); // 🆕 HOOK NUEVO
  const { testimonials, isLoaded: testimonialsLoaded } = useTestimonials();
  const { products, isLoaded: productsLoaded, error: productsError } = useFeaturedProducts();
  const { plans, isLoaded: plansLoaded } = useMembershipPlans();

  // Redirigir si está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carousel de testimonios
  useEffect(() => {
    if (testimonialIntervalRef.current) {
      clearInterval(testimonialIntervalRef.current);
    }

    if (testimonialsLoaded && testimonials && Array.isArray(testimonials) && testimonials.length > 1) {
      testimonialIntervalRef.current = setInterval(() => {
        setCurrentTestimonialIndex((prev) => 
          prev >= testimonials.length - 1 ? 0 : prev + 1
        );
      }, 5000);
    }

    return () => {
      if (testimonialIntervalRef.current) {
        clearInterval(testimonialIntervalRef.current);
      }
    };
  }, [testimonialsLoaded, testimonials]);

  // Carousel de servicios (móvil)
  useEffect(() => {
    if (serviceIntervalRef.current) {
      clearInterval(serviceIntervalRef.current);
    }

    if (isMobile && servicesLoaded && services && Array.isArray(services) && services.length > 1) {
      serviceIntervalRef.current = setInterval(() => {
        setCurrentServiceIndex((prev) => 
          prev >= services.length - 1 ? 0 : prev + 1
        );
      }, 4000);
    }

    return () => {
      if (serviceIntervalRef.current) {
        clearInterval(serviceIntervalRef.current);
      }
    };
  }, [isMobile, servicesLoaded, services]);

  // Carousel de productos (móvil)
  useEffect(() => {
    if (productIntervalRef.current) {
      clearInterval(productIntervalRef.current);
    }

    if (isMobile && productsLoaded && products && Array.isArray(products) && products.length > 1) {
      productIntervalRef.current = setInterval(() => {
        setCurrentProductIndex((prev) => 
          prev >= products.length - 1 ? 0 : prev + 1
        );
      }, 4500);
    }

    return () => {
      if (productIntervalRef.current) {
        clearInterval(productIntervalRef.current);
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

  // Datos procesados
  const gymConfig = config || MINIMAL_FALLBACK;

  const videoData = useMemo(() => {
    if (!config) return null;

    const videoUrl = config.hero?.videoUrl || config.videoUrl || '';
    const imageUrl = config.hero?.imageUrl || config.imageUrl || '';

    return {
      videoUrl,
      imageUrl,
      hasVideo: !!videoUrl,
      hasImage: !!imageUrl,
      title: config.hero?.title || config.name,
      description: config.hero?.description || config.description
    };
  }, [config]);

  // 🆕 SIMPLIFICADO: Los servicios ya vienen activos del hook
  const displayServices = useMemo(() => {
    if (!servicesLoaded || !services || !Array.isArray(services)) {
      return [];
    }
    // ✅ Ya no necesitamos filtrar, el hook solo trae activos
    return services;
  }, [servicesLoaded, services]);

  const hasProducts = useMemo(() => {
    return products && Array.isArray(products) && products.length > 0;
  }, [products]);

  // Manejar agregar al carrito
  const handleAddToCart = async (product, options = {}) => {
    try {
      if (!product || !product.id) {
        showError('Producto inválido');
        return;
      }

      console.log('Agregando producto al carrito:', product.name);
      await addItem(product, options);
      showSuccess(`${product.name} agregado al carrito`);
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      showError('Error al agregar al carrito');
    }
  };

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

      {/* Navbar */}
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
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
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
                <GymLogo 
                  size={isMobile ? "sm" : "md"} 
                  variant="professional" 
                  showText={!isMobile} 
                  priority="high" 
                />
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
              {hasProducts && (
                <a href="#tienda" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                  Tienda
                </a>
              )}
              <a href="#contacto" className="font-medium text-gray-600 hover:text-primary-600 transition-colors">
                Contacto
              </a>
            </div>

            {/* Botones de acción */}
            <div className="hidden md:flex items-center space-x-3">
              <Link to="/login" className="btn-secondary py-2 px-4 text-sm">
                Entrar
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                <Gift className="w-4 h-4 mr-2" />
                Únete
              </Link>
            </div>

            {/* Menú móvil */}
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

        {/* Menú desplegable móvil */}
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
              {hasProducts && (
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

      {/* Hero + Estadísticas dinámicas */}
      <LandingHero
        gymConfig={gymConfig}
        videoData={videoData}
        stats={stats}
        statsLoaded={statsLoaded}
        isMobile={isMobile}
        hasProducts={hasProducts}
      />

      {/* Tienda */}
      {hasProducts && (
        <LandingStore
          products={products}
          isMobile={isMobile}
          currencySymbol={gymConfigDefault.regional.currencySymbol}
          freeShippingThreshold={gymConfigDefault.shipping.freeShippingThreshold}
          onAddToCart={handleAddToCart}
          currentProductIndex={currentProductIndex}
          setCurrentProductIndex={setCurrentProductIndex}
        />
      )}

      {/* Servicios */}
      {displayServices.length > 0 && (
        <LandingServices
          services={displayServices}
          isMobile={isMobile}
          currentServiceIndex={currentServiceIndex}
          setCurrentServiceIndex={setCurrentServiceIndex}
        />
      )}

      {/* Planes */}
      {plans && plans.length > 0 && (
        <LandingPlans
          plans={plans}
          isMobile={isMobile}
          currencySymbol={gymConfigDefault.regional.currencySymbol}
        />
      )}

      {/* Testimonios */}
      {testimonials && testimonials.length > 0 && (
        <LandingTestimonials
          testimonials={testimonials}
          currentIndex={currentTestimonialIndex}
          isMobile={isMobile}
        />
      )}

      {/* Contacto */}
      <LandingContact
        gymConfig={gymConfig}
        isMobile={isMobile}
      />

      {/* Footer */}
      <LandingFooter
        gymConfig={gymConfig}
        config={config}
        services={displayServices}
        plans={plans}
        products={products}
        isMobile={isMobile}
      />

    </div>
  );
};

export default LandingPage;

/*
EXPLICACIÓN DE LOS CAMBIOS - VERSIÓN CON HOOK NUEVO

✅ CAMBIOS REALIZADOS:
1. Importado useActiveGymServices en lugar de useGymServices
2. Simplificado displayServices (ya no necesita filtrar, el hook lo hace)
3. Mantiene TODAS las funcionalidades existentes
4. Mantiene todos los carousels
5. Mantiene todo el manejo de estado
6. Mantiene toda la lógica de navegación

🎯 VENTAJAS DEL HOOK NUEVO:
- Más eficiente (solo trae servicios activos del backend)
- Menos datos transferidos
- Código más limpio
- Mejor rendimiento

📦 FUNCIONALIDADES MANTENIDAS:
- Hero con video/imagen adaptativo
- Navegación responsive con menú móvil
- Carousel de productos automático
- Carousel de servicios en móvil
- Carousel de testimonios
- Sistema de estadísticas dinámicas
- Integración con carrito
- Footer completo
- Información de contacto
- Todos los efectos y hooks existentes

🔧 LO QUE NO CAMBIÓ:
- Estructura del componente
- Props a subcomponentes
- Lógica de carruseles
- Manejo de estado local
- Estilos y clases CSS
- Navegación y menús
- Integración con otros hooks

Este componente ahora usa el hook optimizado pero mantiene
TODA la funcionalidad original sin perder nada.
*/